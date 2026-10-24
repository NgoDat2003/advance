"""Chuyển PDF bài giảng Khóa 3 + Khóa 4 sang Markdown + ảnh (cùng định dạng với `Tài Liệu/advanced_backend`).

Mỗi `X.pdf` sinh ra `X.md` cùng thư mục và ảnh trong `assets/<Slug>/`.

Chạy (cần PyMuPDF trong venv local):
    python -m venv .venv && .venv/Scripts/python -m pip install pymupdf
    .venv/Scripts/python convert_pdf_to_md.py           # convert toàn bộ
    .venv/Scripts/python convert_pdf_to_md.py --check   # kiểm tra kết quả
"""
import re
import shutil
import sys
from collections import Counter
from pathlib import Path

import pymupdf

DOCS_DIR = Path(__file__).parent / "Tài Liệu"
COURSE_GLOBS = ["Khóa 3*", "Khóa 4*"]

BULLET_LEVEL = {"●": 0, "•": 0, "○": 1, "◦": 1, "■": 2, "▪": 2}  # ký hiệu bullet → cấp thụt lề
HEADING_RATIO = 1.15     # chữ to hơn 1.15 × cỡ chữ thân bài → heading (sách: subsection 14.3pt / body 12pt)
MARGIN_RATIO = 0.08      # vùng 8% trên/dưới trang là nơi có header/footer
MIN_IMAGE_PT = 40        # ảnh hiển thị cả 2 chiều nhỏ hơn 40pt (icon) → bỏ qua
VECTOR_PAGE_DRAWINGS = 20  # trang vẽ sơ đồ bằng shape → chụp thêm ảnh toàn trang
NEW_ITEM_RE = re.compile(r"^(?:(?:[A-H]|\d{1,2})[.)]\s|→)")  # "A. ...", "1. ...", "→ ..." luôn bắt đầu dòng mới
DOMAIN_RE = re.compile(r"^[\w-]+(\.[\w-]+)*\.(com|vn|io|net|org)$")  # footer kiểu 'roninhub.com'
# Code viết bằng font thường (Arial): dòng thụt ≥ 2 space, dòng chỉ có ngoặc, hoặc kết thúc bằng { } ;
CODEISH_RE = re.compile(r"^\s{2,}\S|^\s*[{}\[\]][,;]?\s*$|[{]\s*$|\S.*[(=].*;\s*$")
ZERO_WIDTH_RE = re.compile("[​‌‍﻿]")
TOC_LEADER_RE = re.compile(r"(?:\s*\.){4,}\s*(?=\d+\s*$)")  # "Preface . . . . . 1" (mục lục)


def slugify(stem):
    """'01. System Design- In-Depth Understanding' → '01_System_Design_In_Depth_Understanding'."""
    return "_".join(re.findall(r"[0-9A-Za-z]+", stem))


def read_rows(page):
    """Gom các line cùng hàng (marker ● và chữ là 2 span riêng nhưng cùng y) thành 1 row."""
    rows = []
    for b_idx, block in enumerate(page.get_text("dict")["blocks"]):
        if block["type"] != 0:
            continue
        for line in block["lines"]:
            spans = [s for s in line["spans"] if ZERO_WIDTH_RE.sub("", s["text"]).strip()]
            if not spans:
                continue
            raw = ZERO_WIDTH_RE.sub("", "".join(s["text"] for s in line["spans"]))
            x0, y0, _, y1 = line["bbox"]
            size = max(s["size"] for s in spans)
            mono = all(s["flags"] & 8 or re.search("mono|courier|consol|anonymous", s["font"], re.I) for s in spans)
            # Độ rộng 1 ký tự của font monospace → dựng lại thụt lề code từ toạ độ x.
            cw = spans[0]["bbox"][2] - spans[0]["bbox"][0]
            cw = cw / len(spans[0]["text"]) if mono and spans[0]["text"] else 0
            prev = rows[-1] if rows else None
            if prev and prev["block"] == b_idx and abs(prev["y0"] - y0) < 2:
                if prev["gutter"] and mono:
                    # Số dòng ở lề trái của code listing → bỏ, giữ dòng code thật.
                    prev.update(raw=raw, gutter=False, x_text=x0, cw=cw)
                    continue
                prev["raw"] += " " + raw if prev["raw"].strip() not in BULLET_LEVEL else raw
                prev["size"] = max(prev["size"], size)
                prev["y1"] = max(prev["y1"], y1)
                continue
            rows.append({"block": b_idx, "raw": raw, "x0": x0, "y0": y0, "y1": y1, "size": size, "mono": mono,
                         "gutter": mono and raw.strip().isdigit(), "x_text": x0, "cw": cw})
    return rows


def in_margin(row, height):
    """Row bắt đầu trong 8% trên cùng hoặc kết thúc trong 8% dưới cùng của trang."""
    return row["y0"] < height * MARGIN_RATIO or row["y1"] > height * (1 - MARGIN_RATIO)


def norm_noise(text):
    return re.sub(r"\d+", "#", text.strip().lower())


def find_noise(doc, body_size):
    """Header/footer ở mép trang (chữ ≤ cỡ thân bài): số trang, domain ('roninhub.com') lặp ≥ 2 trang,
    chữ nhỏ hơn thân bài (running header của sách) lặp ≥ 3 trang, hoặc bất kỳ text nào lặp ≥ 30% số trang."""
    seen, smaller = Counter(), set()
    for page in doc:
        h = page.rect.height
        rows = [r for r in read_rows(page) if r["size"] <= body_size + 0.5 and in_margin(r, h)]
        seen.update({norm_noise(r["raw"]) for r in rows})
        smaller.update(norm_noise(r["raw"]) for r in rows if r["size"] < body_size - 0.5)
    return {t for t, n in seen.items()
            if re.fullmatch(r"[#\s]+", t) or n >= max(3, 0.3 * doc.page_count)
            or (n >= 2 and DOMAIN_RE.match(t)) or (n >= 3 and t in smaller)}


def template_images(doc):
    """Ảnh nền/template vẽ lặp trên ≥ 30% số trang (và ≥ 3 trang) → không phải nội dung bài giảng."""
    seen = Counter(x[0] for page in doc for x in {i[0:1] for i in page.get_images(full=True)})
    return {x for x, n in seen.items() if n >= max(3, 0.3 * doc.page_count)}


def body_font_size(doc):
    """Cỡ chữ thân bài = cỡ chữ chiếm nhiều ký tự nhất trong toàn tài liệu."""
    sizes = Counter()
    for page in doc:
        for block in page.get_text("dict")["blocks"]:
            for line in block.get("lines", []):
                for s in line["spans"]:
                    sizes[round(s["size"], 1)] += len(s["text"].strip())
    return sizes.most_common(1)[0][0] if sizes else 12


def page_items(page, body_size, noise):
    """Chuyển các row của 1 trang thành danh sách item: heading / bullet / text / code."""
    h = page.rect.height
    rows = read_rows(page)
    # Dòng monospace chỉ thành code khi cả block là code hoặc có dòng code kề bên
    # (tránh 1 từ inline-code bị ngắt dòng giữa câu biến thành code block).
    for i, row in enumerate(rows):
        block_rows = [r for r in rows if r["block"] == row["block"]]
        near = (i > 0 and rows[i - 1]["mono"]) or (i + 1 < len(rows) and rows[i + 1]["mono"])
        row["code"] = row["mono"] and (all(r["mono"] for r in block_rows) or near)
    code_x = min((r["x_text"] for r in rows if r["code"] and not r["gutter"]), default=float("inf"))

    items = []
    for row in rows:
        text = row["raw"].strip()
        if in_margin(row, h) and norm_noise(text) in noise:
            continue
        kind, level = "text", 0
        if text[:1] in BULLET_LEVEL:
            kind, level, text = "bullet", BULLET_LEVEL[text[0]], text[1:].strip()
        elif row["code"]:
            # Số đứng riêng ở cột lề trái = số dòng của dòng code trống; nằm trong cột code thì là code thật.
            gutter = row["gutter"] and row["x0"] < code_x - 1
            kind, text = "code", "" if gutter else text
        elif row["size"] < body_size * HEADING_RATIO and (
                CODEISH_RE.search(row["raw"]) or (items and items[-1]["kind"] == "code" and items[-1]["block"] == row["block"]
                                                  and row["y0"] - items[-1]["y0"] <= 1.5 * row["size"])):
            # Code viết bằng font thường (hoặc phần bị ngắt dòng của nó) → giữ nguyên thụt lề bằng space.
            kind, text = "code", row["raw"].rstrip()
        elif row["size"] >= body_size * HEADING_RATIO:
            kind = "heading"
        if not text and kind != "code":
            continue
        toc_entry = kind != "code" and TOC_LEADER_RE.search(text)
        if toc_entry:
            text = TOC_LEADER_RE.sub(" … ", text)

        prev = items[-1] if items else None
        mergeable = kind in ("text", "heading") and not toc_entry and not (prev and prev.get("toc"))
        # Dòng chỉ có inline-code (font mono nhỏ hơn) vẫn được nối vào câu đang viết dở.
        same_size = abs(prev["size"] - row["size"]) < 0.6 or row["mono"] if prev else False
        if prev and mergeable and prev["block"] == row["block"] and same_size:
            same_kind = prev["kind"] == kind or (kind == "text" and prev["kind"] == "bullet")
            # Dòng bị ngắt (soft wrap): 2 dòng sát nhau, hoặc dòng trước kết thúc bằng khoảng trắng
            # (Google Slides/Docs) mà không cách 1 dòng trống (> 1.5 × cỡ chữ = sang đoạn mới).
            step, size = row["y0"] - prev["y0"], max(row["size"], prev["size"])
            wrapped = step <= 1.25 * size or (prev["raw"].endswith(" ") and step <= 1.5 * size)
            if same_kind and (kind == "heading" or (wrapped and not NEW_ITEM_RE.match(text))):
                joiner = "" if prev["text"].endswith("-") else " "
                prev["text"] += joiner + text
                prev["raw"], prev["y0"] = row["raw"], row["y0"]
                continue
        items.append({"kind": kind, "level": level, "text": text, "raw": row["raw"],
                      "block": row["block"], "size": row["size"], "y0": row["y0"], "x": row["x_text"], "cw": row["cw"], "toc": bool(toc_entry)})
    return items


def md_escape(text):
    """Chữ thường (ngoài code): '<topic>' không bị hiểu là thẻ HTML, '>' đầu dòng không thành quote."""
    text = text.replace("<", "&lt;")
    return "\\" + text if text.startswith(">") else text


def render_items(items):
    out, code, prev_kind = [], [], None
    for it in items + [None]:
        if it and it["kind"] == "code":
            code.append(it)
            continue
        if code:
            # Thụt lề = khoảng cách x so với dòng code sát lề nhất ÷ độ rộng 1 ký tự.
            base = min((c["x"] for c in code if c["text"] and c["cw"]), default=0)
            out.append("```")
            for c in code:
                indent = round((c["x"] - base) / c["cw"]) if c["text"] and c["cw"] else 0
                out.append(" " * indent + c["text"])
            out.append("```")
            code, prev_kind = [], "code"
        if it is None:
            break
        # Dòng trống tách đoạn văn / kết thúc list, để Markdown không gộp đoạn sau vào bullet cuối.
        if it["kind"] == "text" and prev_kind in ("text", "bullet"):
            out.append("")
        text = md_escape(it["text"])
        if it["kind"] == "heading":
            out.append("### " + text)
        elif it["kind"] == "bullet":
            out.append("  " * it["level"] + "- " + text)
        else:
            out.append(text)
        prev_kind = it["kind"]
    return out


def save_image(doc, page, xref, bbox, base):
    """Lưu ảnh gốc theo xref (JPEG giữ nguyên, còn lại PNG); lỗi thì render vùng ảnh từ trang."""
    try:
        info = doc.extract_image(xref)
        if info["ext"] in ("jpeg", "jpg") and not info.get("smask"):
            path = base.with_suffix(".jpg")
            path.write_bytes(info["image"])
            return path
        pix = pymupdf.Pixmap(doc, xref)
        if pix.colorspace and pix.colorspace.n > 3:
            pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
        if info.get("smask"):
            pix = pymupdf.Pixmap(pix, pymupdf.Pixmap(doc, info["smask"]))
        path = base.with_suffix(".png")
        pix.save(path)
        return path
    except Exception:
        path = base.with_suffix(".png")
        page.get_pixmap(clip=bbox, dpi=150).save(path)
        return path


def convert(pdf_path):
    stem = pdf_path.stem
    slug = slugify(stem)
    assets = pdf_path.parent / "assets" / slug
    md_path = pdf_path.with_suffix(".md")
    if assets.exists():
        shutil.rmtree(assets)  # chạy lại thì ghi đè sạch

    if pdf_path.stat().st_size == 0:
        md_path.write_text(f"# {stem}\n\n> *(Tài liệu rỗng - file PDF gốc có dung lượng 0 byte)*\n", encoding="utf-8")
        return 0, 0

    doc = pymupdf.open(pdf_path)
    body = body_font_size(doc)
    noise = find_noise(doc, body)
    skip_xrefs = template_images(doc)
    width = max(2, len(str(doc.page_count)))
    unit = "slide" if doc[0].rect.width > doc[0].rect.height else "trang"
    saved = {}  # xref → đường dẫn ảnh đã lưu (ảnh dùng lại ở nhiều trang chỉ lưu 1 lần)
    lines = [f"# {stem}", "",
             f"> **Tổng số trang:** {doc.page_count} {unit} | **Thư mục ảnh/sơ đồ:** `assets/{slug}/`", "", "---", ""]

    for pn, page in enumerate(doc, start=1):
        items = page_items(page, body, noise)
        heading = next((i["text"] for i in items if i["kind"] == "heading"), None)

        images = []
        placements = sorted(page.get_image_info(xrefs=True), key=lambda i: (i["bbox"][1], i["bbox"][0]))
        for info in placements:
            rect = pymupdf.Rect(info["bbox"]) & page.rect
            if rect.is_empty or max(rect.width, rect.height) < MIN_IMAGE_PT:
                continue
            xref = info["xref"]
            if xref in skip_xrefs:
                continue
            if xref and xref in saved:
                images.append(saved[xref])
                continue
            assets.mkdir(parents=True, exist_ok=True)
            base = assets / f"page_{pn:0{width}d}_img_{len(images) + 1:02d}"
            path = save_image(doc, page, xref, rect, base) if xref else None
            if path is None:
                path = base.with_suffix(".png")
                page.get_pixmap(clip=rect, dpi=150).save(path)
            if xref:
                saved[xref] = path
            images.append(path)

        if len(page.get_drawings()) >= VECTOR_PAGE_DRAWINGS:
            assets.mkdir(parents=True, exist_ok=True)
            full = assets / f"page_{pn:0{width}d}_full.png"
            page.get_pixmap(dpi=150).save(full)
            images.append(full)

        if heading is None:
            heading = " ".join(i["text"] for i in items[:3])
        title = re.sub(r"\s+", " ", heading or ("(Trang ảnh)" if images else "(Trang trống)")).strip()
        if len(title) > 100:
            title = title[:100].rstrip() + "…"

        lines += [f"## Trang {pn}: {md_escape(title)}", ""]
        body_lines = render_items(items)
        if body_lines:
            lines += body_lines + [""]
        for path in images:
            rel = path.relative_to(pdf_path.parent).as_posix()
            alt = "Ảnh chụp toàn trang" if path.stem.endswith("_full") else "Ảnh/Sơ đồ"
            lines += [f"![{alt} - Trang {pn}]({rel})", ""]
        lines += ["---", ""]

    md_path.write_text("\n".join(lines), encoding="utf-8")
    return doc.page_count, len(list(assets.glob("*"))) if assets.exists() else 0


def pdf_files():
    for pattern in COURSE_GLOBS:
        for course in sorted(DOCS_DIR.glob(pattern)):
            yield from sorted(course.glob("*.pdf"))


def check():
    """Kiểm tra: đủ file .md, số '## Trang' = số trang PDF, link ảnh tồn tại, không ảnh mồ côi, không còn footer."""
    problems = []
    for pdf in pdf_files():
        md = pdf.with_suffix(".md")
        if not md.exists():
            problems.append(f"thiếu {md.name}")
            continue
        text = md.read_text(encoding="utf-8")
        pages = pymupdf.open(pdf).page_count if pdf.stat().st_size else 0
        if text.count("\n## Trang ") != pages:
            problems.append(f"{md.name}: {text.count(chr(10) + '## Trang ')} section != {pages} trang")
        links = set(re.findall(r"\]\((assets/[^)]+)\)", text))
        missing = [l for l in links if not (pdf.parent / l).exists()]
        if missing:
            problems.append(f"{md.name}: {len(missing)} link ảnh hỏng")
        assets = pdf.parent / "assets" / slugify(pdf.stem)
        on_disk = {p.relative_to(pdf.parent).as_posix() for p in assets.glob("*")} if assets.exists() else set()
        if on_disk - links:
            problems.append(f"{md.name}: {len(on_disk - links)} ảnh mồ côi")
        if "roninhub.com" in text.lower():
            problems.append(f"{md.name}: còn footer roninhub.com")
        print(f"{'OK ' if not any(p.startswith(md.name) for p in problems) else 'ERR'} {pages:4d} trang {len(links):4d} ảnh  {md.name}")
    for p in problems:
        print("  ✗", p)
    return not problems


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    if "--check" in sys.argv:
        sys.exit(0 if check() else 1)
    for pdf in pdf_files():
        pages, imgs = convert(pdf)
        print(f"{pages:4d} trang {imgs:4d} ảnh  {pdf.parent.name[:8]}/{pdf.name}")
