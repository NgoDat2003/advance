# Kiểm tra gom bill → SAP, ngày 16–20/10/2026

Nguồn: DBX `DBTG` (SQL Server dwh-db-srv), các DB IPOS_SAP, SAP_CLOUDKITCHEN, GAGIONSOT, SAPBIGBOBA, THUCCOFFEE, TRAHU.
Số liệu chụp lúc ~09:30 ngày 21/10. Dữ liệu vẫn đang chạy (POS còn gửi bill ngày 19–20/10), nên số bill/tiền ngày 19–20 có thể lệch nhẹ so với tin bot.
Chỉ đọc, không ghi hay sửa gì.

Cách đối chiếu: bill gốc lấy từ `SalesData_H` (TotalAmountAfterVat), group lấy từ `SalesDataGrp_H` (SAPStatus `D` = đã tạo AR/GI/JE). Lệch = tổng group − tổng bill.

## Tóm tắt theo nguyên nhân

| # | Vấn đề | Phạm vi | Số tiền | Mức độ |
|---|---|---|---|---|
| 1 | Post trùng sang SAP (2 AR cho cùng 1 cửa hàng/ngày) | 13 cửa hàng-ngày (IPOS 16/10 ×5, IPOS 17/10 ×5, CK 17/10 ×3) | **210.369.972** | Nghiêm trọng |
| 2 | Job gom BIGBOBA đứng | Cả brand 19/10 + 20/10, cộng BB006/BB078 ngày 16/10 | 723.121.100 + 870.762.400 + 11.771.000 | Cao |
| 3 | GAGIONSOT "lệch" do group W cũ bị treo (không phải trùng SAP) | 16 group W (16/10 ×7, 17/10 ×9) | 0 trong SAP | Thấp, cần dọn |
| 4 | Cửa hàng chưa confirm doanh thu nên chưa gom | 19/10: 11 cửa hàng; 20/10: 23 cửa hàng (không tính BB) | xem mục 4 | Theo dõi |
| 5 | Bill lẻ về sau khi đã gom | 3 bill thiếu thật, 11 bill đã có tiền trong SAP, BB006 +39.000 | 245.800 thiếu | Thấp |

Ngày 18/10 sạch ở tất cả brand. THUCCOFFEE sạch cả 5 ngày.

## 1. Post trùng sang SAP

Mỗi cửa hàng-ngày dưới đây có 2 group trạng thái `D`, mỗi group có AR/GI/JE riêng:

- Group cũ tạo 18/10 (01:15–03:16), hiện không còn bill nào trỏ tới.
- Group mới tạo tối 19/10 (20:30–22:32), bill đang trỏ vào group này.

ReceiveDateFromPOS của bill vẫn là 16–17/10, tức bill không bị nhận lại từ POS. Khả năng cao là SAPGroupUID đã bị reset rồi job gom chạy lại lần 2, nhưng group cũ không bị hủy.

**Không truy cập được DB công ty SAP (MC_NEW2 từ chối đăng nhập), nên chưa xác nhận AR cũ đã bị cancel trong SAP B1 hay chưa.** Cần kế toán/SAP kiểm tra.

| Brand | Ngày | Cửa hàng | Số tiền | Group/AR/GI/JE cũ (18/10) | Group/AR/GI/JE mới (19/10) |
|---|---|---|---|---|---|
| IPOS_SAP | 16/10 | MC026 (138430) 479 Điện Biên Phủ | 14.825.827 | 86299 / 206315 / 378753 / 1658413 | 86435 / 206803 / 380087 / 1723499 |
| IPOS_SAP | 16/10 | MC058 (138355) 56A Hoàng Diệu 2 | 16.851.562 | 86276 / 206227 / 378664 / 1658282 | 86431 / 206798 / 380082 / 1723490 |
| IPOS_SAP | 16/10 | MC062 (138410) 73 Lê Văn Việt | 16.911.435 | 86285 / 206263 / 378697 / 1658331 | 86434 / 206802 / 380086 / 1723496 |
| IPOS_SAP | 16/10 | MC088 (138452) 179A Phú Lợi | 17.989.833 | 86284 / 206259 / 378693 / 1658325 | 86433 / 206800 / 380085 / 1723494 |
| IPOS_SAP | 16/10 | MC131 (142326) 37 Tạ Quang Bửu | 10.398.039 | 86269 / 206201 / 378640 / 1658245 | 86430 / 206797 / 380081 / 1723488 |
| IPOS_SAP | 17/10 | MC023 (138432) 5A Thích Quảng Đức | 16.302.996 | 86341 / 206411 / 378844 / 1658560 | 86436 / 206804 / 380088 / 1723501 |
| IPOS_SAP | 17/10 | MC026 (138430) 479 Điện Biên Phủ | 15.541.236 | 86360 / 206461 / 378899 / 1658643 | 86440 / 206809 / 380093 / 1723509 |
| IPOS_SAP | 17/10 | MC047 (138363) 14/1 Nguyễn Văn Quá | 10.026.584 | 86353 / 206428 / 378863 / 1658590 | 86439 / 206808 / 380091 / 1723507 |
| IPOS_SAP | 17/10 | MC109 (138360) 192 Nguyễn Thị Tú | 21.903.339 | 86350 / 206424 / 378858 / 1658583 | 86437 / 206805 / 380089 / 1723503 |
| IPOS_SAP | 17/10 | MC118 (135207) The Garden Mall | 11.062.232 | 86351 / 206425 / 378859 / 1658586 | 86438 / 206806 / 380090 / 1723505 |
| SAP_CLOUDKITCHEN | 17/10 | MC006 (132725) 74 Đồng Đen | 30.737.523 | 200010514 / 205931 / 378366 / 1657795 | 200010560 / 206656 / 379948 / 1723249 |
| SAP_CLOUDKITCHEN | 17/10 | MC011 (132714) 29 Thạch Lam | 21.747.062 | 200010502 / 205916 / 378352 / 1657768 | 200010559 / 206655 / 379947 / 1723247 |
| SAP_CLOUDKITCHEN | 17/10 | MC067 (138450) 9 CMT8, Bình Dương | 6.072.304 | 200010526 / 205943 / 378380 / 1657820 | 200010561 / 206657 / 379949 / 1723251 |

Tổng: IPOS 16/10 = 76.976.696; IPOS 17/10 = 74.836.387; CK 17/10 = 58.556.889; **cộng 210.369.972**.

## 2. BIGBOBA: job gom đứng

- `SAPManagerJobs` của SAPBIGBOBA ghi lần cuối lúc 20/10 02:01. Các brand khác đều chạy sáng 21/10, trong khoảng 01:00–06:30.
- Group cuối cùng được tạo lúc 19/10 21:39 (cho ngày 18/10).
- Ngày 19/10 có 19.694 bill (723.121.100), trong đó 102 cửa hàng đã confirm nhưng chưa có group nào. 4 cửa hàng chưa confirm (559 bill, 21.297.600).
- Ngày 20/10 có 21.717 bill (870.762.400), chưa cửa hàng nào confirm.
- Ngày 16/10, BB006 (126651) 8 Thạch Lam có 229 bill (8.734.200) và BB078 (129803) 54i Hoàng Diệu 2 có 91 bill (3.036.800). Hai cửa hàng này confirm lúc 20/10 16:15, sau lần chạy cuối của job, nên chưa được gom.

Cần làm: kiểm tra và khởi động lại service/job gom của BIGBOBA. Khi job chạy lại, các mục trên sẽ được gom.

## 3. GAGIONSOT: lệch giả do group W treo

- Group `D` (đã sang SAP) của mỗi cửa hàng khớp đúng tổng bill, lệch = 0.
- Phần bot báo lệch đến từ group cũ trạng thái `W`, tạo lúc 18/10 05:00. Các group này bị chặn với lỗi `thành tiền bị lệch` (Line Grp 15.143.295 so với Header Grp 15.143.300, lệch làm tròn 5đ). Chúng không có AR và không còn bill nào trỏ tới.
- 16/10 (7 group): GA017 300010984, GA001 300010991, GA003 300010983, GA002 300010988, GA015 300010989, GA004 300010982, GA014 300010990.
- 17/10 (9 group): GA015 300011002, GA003 300010996, GA017 300010997, GA012 300010992, GA001 300011004, GA007 300011000, GA002 300011001, GA014 300011003, GA006 300010999.

Cần làm: dọn hoặc đánh dấu 16 group W này. Đồng thời sửa logic bot để chỉ tính group `D`, hoặc loại group không còn bill trỏ tới.

## 4. Chưa confirm nên chưa gom (19–20/10, không tính BIGBOBA)

Toàn bộ bill chưa gom ở các cửa hàng này đều có `AutoConfirm`/`ConfirmDate` = NULL. Job gom chỉ lấy bill đã confirm. POS vẫn đang gửi bill của các ngày này (ReceiveDateFromPOS mới nhất là 21/10 08:4x–09:3x).

**19/10**
- IPOS_SAP: MC026 287 bill 16.082.989 · MC109 245 bill 16.959.115 · MC125 87 bill 5.926.542
- SAP_CLOUDKITCHEN: MC013 311 bill 25.595.475 · MC006 362 bill 23.027.491 · MC096 202 bill 16.318.001 · MC043 163 bill 11.447.523 · MC101 187 bill 11.322.687
- GAGIONSOT: GA017 282 bill 15.750.000 · GA013 76 bill 7.376.500
- TRAHU: TH001 73 bill 3.458.700

**20/10**
- IPOS_SAP, 10 cửa hàng, tổng 231.001.961: MC002 411 bill 32.230.121 · MC076 307 bill 28.089.336 · MC027 365 bill 27.291.135 · MC059 296 bill 24.983.615 · MC085 227 bill 22.608.407 · MC026 322 bill 22.347.097 · MC012 260 bill 22.004.128 · MC008 268 bill 21.214.041 · MC122 230 bill 19.543.064 · MC135 174 bill 10.691.017
- SAP_CLOUDKITCHEN, 12 cửa hàng, 4.094 bill, tổng 381.581.458: MC006 492 bill 48.509.596 · MC073 417 bill 45.418.094 · MC028 399 bill 40.457.830 · MC078 398 bill 38.398.027 · MC041 334 bill 33.490.358 · MC063 364 bill 29.944.726 · MC077 346 bill 29.208.770 · MC001 348 bill 26.500.885 · MC010 350 bill 26.356.241 · MC108 221 bill 25.862.167 · (132734) 406 Nguyễn Tri Phương 248 bill 21.189.164 · MC068 (138448) 880 Đường 22/12 177 bill 16.245.600
- GAGIONSOT: GA006 67 bill 4.081.000

## 5. Bill lẻ

- **Thiếu thật trong SAP** (bill về trễ lúc 21/10 05:29–06:09, chưa confirm): CK 19/10 MC011 1 bill 114.000 · CK 19/10 MC053 1 bill 89.800 · IPOS 19/10 MC121 1 bill 42.000. Tổng 245.800, cần gom bổ sung.
- **Tiền đã có trong SAP** (tổng group = tổng bill; đây là bill được cập nhật sau khi đã gom nên chưa gắn group): CK 17/10 MC003 2 bill 158.000 · CK 17/10 MC018 1 bill 32.000 · BB 16/10 BB016 4 bill 130.000 · BB 17/10 BB016 3 bill 109.000 · BB 17/10 BB053 1 bill 61.000.
- **BB006 17/10**: group 9.217.800 so với bill 9.178.800, tức SAP nhiều hơn 39.000. Chưa rõ nguyên nhân.

## Câu hỏi chưa giải quyết

- 13 AR/GI/JE cũ ở mục 1 đã được cancel trong SAP B1 chưa? (không có quyền vào DB công ty SAP)
- Ai/cái gì đã reset SAPGroupUID và chạy lại gom các ngày 16–18/10 vào tối 19/10?
- Vì sao service BIGBOBA ngừng sau 20/10 02:01?
- Nguồn gốc khoản +39.000 của BB006 ngày 17/10.
