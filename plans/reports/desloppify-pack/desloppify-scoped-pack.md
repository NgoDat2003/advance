This file is a merged representation of a subset of the codebase, containing specifically included files, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of a subset of the repository's contents that is considered the most important context.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Only files matching these patterns are included: README.md, docs/**, desloppify/engine/_scoring/**, pyproject.toml
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
desloppify/engine/_scoring/__init__.py
desloppify/engine/_scoring/detection.py
desloppify/engine/_scoring/policy/__init__.py
desloppify/engine/_scoring/policy/core.py
desloppify/engine/_scoring/results/__init__.py
desloppify/engine/_scoring/results/core.py
desloppify/engine/_scoring/results/health.py
desloppify/engine/_scoring/results/impact.py
desloppify/engine/_scoring/state_coverage.py
desloppify/engine/_scoring/state_integration_subjective.py
desloppify/engine/_scoring/state_integration.py
desloppify/engine/_scoring/subjective/__init__.py
desloppify/engine/_scoring/subjective/core.py
docs/AMP.md
docs/CLAUDE.md
docs/CODEX.md
docs/COPILOT.md
docs/CURSOR.md
docs/DROID.md
docs/GEMINI.md
docs/HERMES.md
docs/OPENCODE.md
docs/QWEN.md
docs/ROVODEV.md
docs/scoring.md
docs/SKILL.md
docs/WINDSURF.md
pyproject.toml
README.md
```

# Files

## File: desloppify/engine/_scoring/__init__.py
````python
"""Scoring internals."""
````

## File: desloppify/engine/_scoring/detection.py
````python
"""Per-detector scoring calculations."""

from __future__ import annotations

from dataclasses import dataclass, field

from desloppify.base.scoring_constants import (
    CONFIDENCE_WEIGHTS,
    HOLISTIC_MULTIPLIER,
)
from desloppify.engine._scoring.policy.core import (
    FAILURE_STATUSES_BY_MODE,
    SCORING_MODES,
    ScoreMode,
    detector_policy,
)
from desloppify.engine._state.issue_semantics import is_scoring_excluded_detector
from desloppify.engine._state.schema import Issue

# Tiered file-count cap thresholds for non-LOC file-based detectors.
# Controls how many issues per file contribute to the weighted failure sum.
_FILE_CAP_HIGH_THRESHOLD = 6     # issues in file for high cap
_FILE_CAP_MID_THRESHOLD = 3      # issues in file for mid cap
_FILE_CAP_HIGH = 2.0             # cap value at high concentration
_FILE_CAP_MID = 1.5              # cap value at mid concentration
_FILE_CAP_LOW = 1.0              # cap value at low concentration (1-2 issues)


def merge_potentials(potentials_by_lang: dict[str, dict[str, int]]) -> dict[str, int]:
    """Sum potentials across languages per detector."""
    merged: dict[str, int] = {}
    for lang_potentials in potentials_by_lang.values():
        for detector, count in lang_potentials.items():
            merged[detector] = merged.get(detector, 0) + count
    return merged


def _iter_scoring_candidates(
    detector: str,
    issues: dict[str, Issue],
    excluded_zones: frozenset[str],
):
    """Yield in-scope issues for a detector (zone-filtered)."""
    for issue in issues.values():
        if issue.get("suppressed"):
            continue
        if issue.get("detector") != detector:
            continue
        if issue.get("zone", "production") in excluded_zones:
            continue
        yield issue


def _issue_weight(issue: Issue, *, use_loc_weight: bool) -> float:
    """Compute the scoring weight for a single issue."""
    if use_loc_weight:
        return issue.get("detail", {}).get("loc_weight", 1.0)
    return CONFIDENCE_WEIGHTS.get(issue.get("confidence", "medium"), 0.7)


def _file_count_cap(issues_in_file: int) -> float:
    """Tiered cap for non-LOC file-based detectors.

    Keeps file-count denominator semantics while preserving concentration signal:
    1-2 issues => _FILE_CAP_LOW, 3-5 => _FILE_CAP_MID, 6+ => _FILE_CAP_HIGH.
    """
    if issues_in_file >= _FILE_CAP_HIGH_THRESHOLD:
        return _FILE_CAP_HIGH
    if issues_in_file >= _FILE_CAP_MID_THRESHOLD:
        return _FILE_CAP_MID
    return _FILE_CAP_LOW


@dataclass
class _ModeAccum:
    """Per-mode accumulator for file-based detector scoring."""

    by_file: dict[str, float] = field(default_factory=dict)
    by_file_count: dict[str, int] = field(default_factory=dict)
    file_cap: dict[str, float] = field(default_factory=dict)
    holistic_sum: float = 0.0
    issue_count: int = 0


def _file_based_failures_by_mode(
    detector: str,
    issues: dict[str, Issue],
    policy,
) -> dict[ScoreMode, tuple[int, float]]:
    """Accumulate weighted failures by score mode for file-based detectors."""
    accum: dict[ScoreMode, _ModeAccum] = {mode: _ModeAccum() for mode in SCORING_MODES}

    for issue in _iter_scoring_candidates(detector, issues, policy.excluded_zones):
        status = issue.get("status", "open")
        holistic = issue.get("file") == "." and issue.get("detail", {}).get(
            "holistic"
        )

        for mode in SCORING_MODES:
            if status not in FAILURE_STATUSES_BY_MODE[mode]:
                continue

            if holistic:
                accum[mode].holistic_sum += (
                    _issue_weight(issue, use_loc_weight=False) * HOLISTIC_MULTIPLIER
                )
                accum[mode].issue_count += 1
                continue

            weight = _issue_weight(issue, use_loc_weight=policy.use_loc_weight)
            file_key = issue.get("file", "")
            a = accum[mode]
            a.by_file[file_key] = a.by_file.get(file_key, 0.0) + weight
            a.by_file_count[file_key] = a.by_file_count.get(file_key, 0) + 1
            if policy.use_loc_weight and file_key not in a.file_cap:
                a.file_cap[file_key] = weight
            a.issue_count += 1

    out: dict[ScoreMode, tuple[int, float]] = {}
    for mode in SCORING_MODES:
        a = accum[mode]
        if policy.use_loc_weight:
            weighted = sum(
                min(weighted_sum, a.file_cap.get(file_key, weighted_sum))
                for file_key, weighted_sum in a.by_file.items()
            )
        else:
            weighted = sum(
                min(weighted_sum, _file_count_cap(a.by_file_count.get(file_key, 0)))
                for file_key, weighted_sum in a.by_file.items()
            )
        out[mode] = (a.issue_count, weighted + a.holistic_sum)
    return out


def detector_stats_by_mode(
    detector: str,
    issues: dict[str, Issue],
    potential: int,
) -> dict[ScoreMode, tuple[float, int, float]]:
    """Compute (pass_rate, issue_count, weighted_failures) for each score mode."""
    if potential <= 0:
        return {mode: (1.0, 0, 0.0) for mode in SCORING_MODES}

    # Some detectors remain queue-visible but are intentionally excluded from
    # detector-side scoring.
    if is_scoring_excluded_detector(detector):
        return {mode: (1.0, 0, 0.0) for mode in SCORING_MODES}

    policy = detector_policy(detector)

    if policy.file_based:
        mode_failures = _file_based_failures_by_mode(detector, issues, policy)
    else:
        issue_count: dict[ScoreMode, int] = {mode: 0 for mode in SCORING_MODES}
        weighted_failures: dict[ScoreMode, float] = {
            mode: 0.0 for mode in SCORING_MODES
        }

        for issue in _iter_scoring_candidates(
            detector, issues, policy.excluded_zones
        ):
            status = issue.get("status", "open")
            weight = _issue_weight(issue, use_loc_weight=False)
            for mode in SCORING_MODES:
                if status not in FAILURE_STATUSES_BY_MODE[mode]:
                    continue
                issue_count[mode] += 1
                weighted_failures[mode] += weight

        mode_failures = {
            mode: (issue_count[mode], weighted_failures[mode]) for mode in SCORING_MODES
        }

    out: dict[ScoreMode, tuple[float, int, float]] = {}
    for mode in SCORING_MODES:
        issues, weighted = mode_failures[mode]
        pass_rate = max(0.0, (potential - weighted) / potential)
        out[mode] = (pass_rate, issues, weighted)
    return out


def detector_pass_rate(
    detector: str,
    issues: dict[str, Issue],
    potential: int,
    *,
    strict: bool = False,
) -> tuple[float, int, float]:
    """Pass rate for one detector.

    Returns (pass_rate, issue_count, weighted_failures).
    Zero potential -> (1.0, 0, 0.0).
    """
    mode: ScoreMode = "strict" if strict else "lenient"
    return detector_stats_by_mode(detector, issues, potential)[mode]


__all__ = [
    "detector_pass_rate",
    "detector_stats_by_mode",
    "merge_potentials",
]
````

## File: desloppify/engine/_scoring/policy/__init__.py
````python
"""Scoring policy internals."""
````

## File: desloppify/engine/_scoring/policy/core.py
````python
"""Scoring policies, detector mappings, and shared constants."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from desloppify.base.enums import Tier
from desloppify.base.registry import DETECTORS
from desloppify.base.scoring_constants import (
    CONFIDENCE_WEIGHTS,
    HOLISTIC_MULTIPLIER,
)
from desloppify.engine._state.issue_semantics import is_scoring_excluded_detector
from desloppify.engine.policy.zones import EXCLUDED_ZONE_VALUES

ScoreMode = Literal["lenient", "strict", "verified_strict"]
SCORING_MODES: tuple[ScoreMode, ...] = ("lenient", "strict", "verified_strict")


@dataclass(frozen=True)
class Dimension:
    name: str
    tier: int
    detectors: list[str]


@dataclass(frozen=True)
class DetectorScoringPolicy:
    detector: str
    dimension: str | None
    tier: int | None
    file_based: bool = False
    use_loc_weight: bool = False
    excluded_zones: frozenset[str] = frozenset(EXCLUDED_ZONE_VALUES)


# Security issues are excluded in non-production zones.
SECURITY_EXCLUDED_ZONES = frozenset({"test", "config", "generated", "vendor"})
_DEFAULT_EXCLUDED_ZONES = frozenset(EXCLUDED_ZONE_VALUES)

# Keep policy details that are independent of tier/dimension wiring.
_FILE_BASED_POLICY_DETECTORS = frozenset(
    {
        "smells",
        "dict_keys",
        "test_coverage",
        "security",
        "concerns",
        "review",
        "nextjs",
        "next_lint",
    }
)
_LOC_WEIGHT_POLICY_DETECTORS = frozenset({"test_coverage"})
_EXCLUDED_ZONE_OVERRIDES: dict[str, frozenset[str]] = {
    "security": SECURITY_EXCLUDED_ZONES,
}

# Legacy test/import surface for code that still expects subjective detectors
# to be grouped in scoring core.
_NON_OBJECTIVE_DETECTORS = frozenset(
    {"review", "concerns", "subjective_review", "subjective_assessment"}
)


def _build_builtin_detector_scoring_policies() -> dict[str, DetectorScoringPolicy]:
    """Build baseline scoring policies from DetectorMeta plus policy overrides."""
    policies: dict[str, DetectorScoringPolicy] = {}
    for detector, meta in DETECTORS.items():
        if is_scoring_excluded_detector(detector):
            dimension: str | None = None
            tier: int | None = None
        else:
            dimension = meta.dimension
            tier = meta.tier

        policies[detector] = DetectorScoringPolicy(
            detector=detector,
            dimension=dimension,
            tier=tier,
            file_based=detector in _FILE_BASED_POLICY_DETECTORS,
            use_loc_weight=detector in _LOC_WEIGHT_POLICY_DETECTORS,
            excluded_zones=_EXCLUDED_ZONE_OVERRIDES.get(
                detector,
                _DEFAULT_EXCLUDED_ZONES,
            ),
        )
    return policies


# Central scoring policy for each detector: tier/dimension come from registry,
# while file-based and zone behavior are preserved via local overrides.
DETECTOR_SCORING_POLICIES: dict[str, DetectorScoringPolicy] = (
    _build_builtin_detector_scoring_policies()
)
_BASE_DETECTOR_SCORING_POLICIES: dict[str, DetectorScoringPolicy] = dict(
    DETECTOR_SCORING_POLICIES
)

# Detectors where potential = file count but issues are per-(file, sub-type).
# Per-file weighted failures are capped at 1.0 to match the file-based denominator.
FILE_BASED_DETECTORS = {
    detector
    for detector, policy in DETECTOR_SCORING_POLICIES.items()
    if policy.file_based
}


def _build_dimensions() -> list[Dimension]:
    """Derive dimensions from DETECTOR_SCORING_POLICIES.

    Each unique (dimension, tier) pair becomes a Dimension, with its detectors
    collected automatically. Order follows first-seen in the policies dict.
    """
    # Collect (dimension_name -> tier) preserving first-seen order,
    # and group detectors by dimension.
    dim_tiers: dict[str, int] = {}
    grouped: dict[str, list[str]] = {}
    for detector, policy in DETECTOR_SCORING_POLICIES.items():
        if policy.dimension is None or policy.tier is None:
            continue
        if policy.dimension not in dim_tiers:
            dim_tiers[policy.dimension] = policy.tier
            grouped[policy.dimension] = []
        grouped[policy.dimension].append(detector)
    return [
        Dimension(name=name, tier=tier, detectors=grouped[name])
        for name, tier in dim_tiers.items()
    ]


DIMENSIONS = _build_dimensions()
DIMENSIONS_BY_NAME = {d.name: d for d in DIMENSIONS}

TIER_WEIGHTS = {
    Tier.AUTO_FIX: 1,
    Tier.QUICK_FIX: 2,
    Tier.JUDGMENT: 3,
    Tier.MAJOR_REFACTOR: 4,
}
# Minimum checks for full dimension weight — below this, weight is dampened
# proportionally. Prevents small-sample dimensions from swinging the overall score.
MIN_SAMPLE = 200
HOLISTIC_POTENTIAL = 10

# Budget: subjective dimensions get this fraction of the overall score.
# Mechanical dimensions get the remainder.
SUBJECTIVE_WEIGHT_FRACTION = 0.75
MECHANICAL_WEIGHT_FRACTION = 1.0 - SUBJECTIVE_WEIGHT_FRACTION

# Per-dimension weighting within the mechanical pool.
# Keep this balanced: no special boost for security/test in the pool itself.
MECHANICAL_DIMENSION_WEIGHTS: dict[str, float] = {
    "file health": 2.0,
    "code quality": 1.0,
    "duplication": 1.0,
    "test health": 1.0,
    "security": 1.0,
}

# Per-dimension weighting within the subjective pool.
# Rationale (kept in sync with review metadata modules):
# - High/mid elegance carry the most weight because architectural decomposition
#   and seam quality drive broad maintainability and change velocity.
# - Low elegance, contracts, and type safety remain high because they prevent
#   correctness drift and interface ambiguity.
# - Design coherence is a medium-high bridge between architecture intent and
#   the detector-led concern stream.
# - Structure navigation and error consistency are meaningful but secondary
#   signals compared to core architecture/correctness dimensions.
# - Naming quality and AI-generated debt are intentionally low-weight nudges:
#   useful for polish/cleanup, but they should not dominate score movement.
SUBJECTIVE_DIMENSION_WEIGHTS: dict[str, float] = {
    "high elegance": 22.0,
    "mid elegance": 22.0,
    "low elegance": 12.0,
    "contracts": 12.0,
    "type safety": 12.0,
    "abstraction fit": 8.0,
    "logic clarity": 6.0,
    # Low-but-meaningful structural signal (about half of the subjective
    # average weight) so it matters without dominating craftsmanship axes.
    "structure nav": 5.0,
    "error consistency": 3.0,
    "naming quality": 2.0,
    "ai generated debt": 1.0,
    "design coherence": 10.0,
}

# Synthetic check count for subjective dimensions in dimension_scores.
SUBJECTIVE_CHECKS = 10

FAILURE_STATUSES_BY_MODE: dict[ScoreMode, frozenset[str]] = {
    "lenient": frozenset({"open", "deferred", "triaged_out"}),
    "strict": frozenset({"open", "wontfix", "auto_resolved", "deferred", "triaged_out"}),
    "verified_strict": frozenset({"open", "wontfix", "fixed", "false_positive", "deferred", "triaged_out"}),
}

# Tolerance for treating a subjective score as "on target" in integrity checks.
# Scores within this band of the target are flagged as potential gaming.
SUBJECTIVE_TARGET_MATCH_TOLERANCE = 0.05


def matches_target_score(
    score: object,
    target: object,
    *,
    tolerance: float = SUBJECTIVE_TARGET_MATCH_TOLERANCE,
) -> bool:
    """Return True when score is within tolerance of target."""
    try:
        score_value = float(score)
        target_value = float(target)
        tolerance_value = max(0.0, float(tolerance))
    except (TypeError, ValueError):
        return False
    return abs(score_value - target_value) <= tolerance_value


def register_scoring_policy(policy: DetectorScoringPolicy) -> None:
    """Register a scoring policy at runtime (used by generic plugins)."""
    DETECTOR_SCORING_POLICIES[policy.detector] = policy
    _rebuild_derived()


def reset_registered_scoring_policies() -> None:
    """Reset runtime-added scoring policies to built-in defaults."""
    DETECTOR_SCORING_POLICIES.clear()
    DETECTOR_SCORING_POLICIES.update(_BASE_DETECTOR_SCORING_POLICIES)
    _rebuild_derived()


def _rebuild_derived() -> None:
    """Rebuild DIMENSIONS, DIMENSIONS_BY_NAME, FILE_BASED_DETECTORS from current state.

    Mutates existing objects in-place so that all references (including imports
    that bound the original objects) see the updates.
    """
    new_dims = _build_dimensions()
    DIMENSIONS.clear()
    DIMENSIONS.extend(new_dims)
    DIMENSIONS_BY_NAME.clear()
    DIMENSIONS_BY_NAME.update({d.name: d for d in DIMENSIONS})
    FILE_BASED_DETECTORS.clear()
    FILE_BASED_DETECTORS.update(
        det for det, pol in DETECTOR_SCORING_POLICIES.items() if pol.file_based
    )


def detector_policy(detector: str) -> DetectorScoringPolicy:
    """Get scoring policy for a detector, with a safe default fallback."""
    return DETECTOR_SCORING_POLICIES.get(
        detector,
        DetectorScoringPolicy(detector=detector, dimension=None, tier=None),
    )


__all__ = [
    "CONFIDENCE_WEIGHTS",
    "DETECTOR_SCORING_POLICIES",
    "DIMENSIONS",
    "DIMENSIONS_BY_NAME",
    "FAILURE_STATUSES_BY_MODE",
    "FILE_BASED_DETECTORS",
    "HOLISTIC_MULTIPLIER",
    "HOLISTIC_POTENTIAL",
    "MECHANICAL_DIMENSION_WEIGHTS",
    "MECHANICAL_WEIGHT_FRACTION",
    "MIN_SAMPLE",
    "SCORING_MODES",
    "SECURITY_EXCLUDED_ZONES",
    "SUBJECTIVE_CHECKS",
    "SUBJECTIVE_DIMENSION_WEIGHTS",
    "SUBJECTIVE_TARGET_MATCH_TOLERANCE",
    "SUBJECTIVE_WEIGHT_FRACTION",
    "TIER_WEIGHTS",
    "DetectorScoringPolicy",
    "Dimension",
    "ScoreMode",
    "detector_policy",
    "matches_target_score",
    "register_scoring_policy",
    "reset_registered_scoring_policies",
]
````

## File: desloppify/engine/_scoring/results/__init__.py
````python
"""Scoring result internals."""
````

## File: desloppify/engine/_scoring/results/core.py
````python
"""Dimension and overall scoring aggregation helpers."""

from __future__ import annotations

from dataclasses import dataclass

from desloppify.engine._scoring.detection import detector_stats_by_mode
from desloppify.engine._scoring.policy.core import (
    DIMENSIONS,
    FAILURE_STATUSES_BY_MODE,
    SCORING_MODES,
    ScoreMode,
)
from desloppify.engine._scoring.results.health import (
    compute_health_breakdown,
    compute_health_score,
)
from desloppify.engine._scoring.results.impact import (
    compute_score_impact,
    get_dimension_for_detector,
)
from desloppify.engine._scoring.subjective.core import (
    append_subjective_dimensions,
)


@dataclass(frozen=True)
class ScoreBundle:
    dimension_scores: dict[str, dict]
    strict_dimension_scores: dict[str, dict]
    verified_strict_dimension_scores: dict[str, dict]
    overall_score: float
    objective_score: float
    strict_score: float
    verified_strict_score: float


def compute_dimension_scores_by_mode(
    issues: dict,
    potentials: dict[str, int],
    *,
    subjective_assessments: dict | None = None,
    allowed_subjective_dimensions: set[str] | None = None,
) -> dict[ScoreMode, dict[str, dict]]:
    """Compute dimension scores for lenient/strict/verified_strict in one pass."""
    results: dict[ScoreMode, dict[str, dict]] = {mode: {} for mode in SCORING_MODES}

    for dim in DIMENSIONS:
        totals = {
            mode: {
                "checks": 0,
                "failing": 0,
                "weighted_failures": 0.0,
                "detectors": {},
            }
            for mode in SCORING_MODES
        }

        for detector in dim.detectors:
            potential = potentials.get(detector, 0)
            if potential <= 0:
                continue

            detector_stats = detector_stats_by_mode(detector, issues, potential)
            for mode in SCORING_MODES:
                pass_rate, failing, weighted = detector_stats[mode]
                totals[mode]["checks"] += potential
                totals[mode]["failing"] += failing
                totals[mode]["weighted_failures"] += weighted
                totals[mode]["detectors"][detector] = {
                    "potential": potential,
                    "pass_rate": pass_rate,
                    "failing": failing,
                    "weighted_failures": weighted,
                }

        for mode in SCORING_MODES:
            total_checks = totals[mode]["checks"]
            if total_checks <= 0:
                continue
            dim_score = (
                max(
                    0.0,
                    (total_checks - totals[mode]["weighted_failures"]) / total_checks,
                )
                * 100
            )
            results[mode][dim.name] = {
                "score": round(dim_score, 1),
                "tier": dim.tier,
                "checks": total_checks,
                "failing": totals[mode]["failing"],
                "detectors": totals[mode]["detectors"],
            }

    for mode in SCORING_MODES:
        append_subjective_dimensions(
            results[mode],
            issues,
            subjective_assessments,
            FAILURE_STATUSES_BY_MODE[mode],
            allowed_dimensions=allowed_subjective_dimensions,
        )
    return results


def compute_dimension_scores(
    issues: dict,
    potentials: dict[str, int],
    *,
    strict: bool = False,
    subjective_assessments: dict | None = None,
    allowed_subjective_dimensions: set[str] | None = None,
) -> dict[str, dict]:
    """Compute per-dimension scores from issues and potentials."""
    mode: ScoreMode = "strict" if strict else "lenient"
    return compute_dimension_scores_by_mode(
        issues,
        potentials,
        subjective_assessments=subjective_assessments,
        allowed_subjective_dimensions=allowed_subjective_dimensions,
    )[mode]


def compute_score_bundle(
    issues: dict,
    potentials: dict[str, int],
    *,
    subjective_assessments: dict | None = None,
    allowed_subjective_dimensions: set[str] | None = None,
) -> ScoreBundle:
    """Compute all score channels from one scoring engine pass."""
    by_mode = compute_dimension_scores_by_mode(
        issues,
        potentials,
        subjective_assessments=subjective_assessments,
        allowed_subjective_dimensions=allowed_subjective_dimensions,
    )

    lenient_scores = by_mode["lenient"]
    strict_scores = by_mode["strict"]
    verified_strict_scores = by_mode["verified_strict"]

    mechanical_lenient_scores = {
        name: data
        for name, data in lenient_scores.items()
        if "subjective_assessment" not in data.get("detectors", {})
    }

    return ScoreBundle(
        dimension_scores=lenient_scores,
        strict_dimension_scores=strict_scores,
        verified_strict_dimension_scores=verified_strict_scores,
        overall_score=compute_health_score(lenient_scores),
        objective_score=compute_health_score(mechanical_lenient_scores),
        strict_score=compute_health_score(strict_scores),
        verified_strict_score=compute_health_score(verified_strict_scores),
    )


__all__ = [
    "ScoreBundle",
    "compute_dimension_scores_by_mode",
    "compute_dimension_scores",
    "compute_health_breakdown",
    "compute_health_score",
    "compute_score_bundle",
    "compute_score_impact",
    "get_dimension_for_detector",
]
````

## File: desloppify/engine/_scoring/results/health.py
````python
"""Health score aggregation helpers."""

from __future__ import annotations

from typing import TypedDict

from desloppify.base.text_utils import is_numeric
from desloppify.engine._scoring.policy.core import (
    MECHANICAL_DIMENSION_WEIGHTS,
    MECHANICAL_WEIGHT_FRACTION,
    MIN_SAMPLE,
    SUBJECTIVE_DIMENSION_WEIGHTS,
    SUBJECTIVE_WEIGHT_FRACTION,
)


class HealthBreakdownEntry(TypedDict):
    """Per-dimension contribution row used in score transparency output."""

    name: str
    pool: str
    score: float
    checks: float
    sample_factor: float
    configured_weight: float
    effective_weight: float
    pool_share: float
    overall_per_point: float
    overall_contribution: float
    overall_drag: float


class HealthBreakdown(TypedDict):
    """Typed shape returned by ``compute_health_breakdown``."""

    overall_score: float
    mechanical_fraction: float
    subjective_fraction: float
    mechanical_avg: float
    subjective_avg: float | None
    entries: list[HealthBreakdownEntry]


def _normalize_dimension_name(name: str) -> str:
    return " ".join(str(name).strip().lower().split())


def _mechanical_dimension_weight(name: str) -> float:
    return float(
        MECHANICAL_DIMENSION_WEIGHTS.get(
            _normalize_dimension_name(name),
            1.0,
        )
    )


def _subjective_dimension_weight(name: str, data: dict) -> float:
    subjective_meta = (
        data.get("detectors", {}).get("subjective_assessment", {})
        if isinstance(data, dict)
        else {}
    )
    configured = (
        subjective_meta.get("configured_weight")
        if isinstance(subjective_meta, dict)
        else None
    )
    if is_numeric(configured):
        return max(0.0, float(configured))

    return float(
        SUBJECTIVE_DIMENSION_WEIGHTS.get(
            _normalize_dimension_name(name),
            1.0,
        )
    )


def _empty_health_breakdown() -> HealthBreakdown:
    return {
        "overall_score": 100.0,
        "mechanical_fraction": 1.0,
        "subjective_fraction": 0.0,
        "mechanical_avg": 100.0,
        "subjective_avg": None,
        "entries": [],
    }


def _subjective_row(name: str, score: float, configured: float) -> dict[str, float | str]:
    return {
        "name": str(name),
        "score": score,
        "configured_weight": configured,
        "effective_weight": configured,
    }


def _mechanical_row(name: str, score: float, data: dict) -> dict[str, float | str]:
    checks = float(data.get("checks", 0) or 0)
    sample_factor = min(1.0, checks / MIN_SAMPLE) if checks > 0 else 0.0
    configured = max(0.0, _mechanical_dimension_weight(name))
    effective = configured * sample_factor
    return {
        "name": str(name),
        "score": score,
        "checks": checks,
        "sample_factor": sample_factor,
        "configured_weight": configured,
        "effective_weight": effective,
    }


def _categorize_dimension_row(
    name: str,
    data: dict,
    *,
    score_key: str,
) -> tuple[str, dict[str, float | str]]:
    score = float(data.get(score_key, data.get("score", 0.0)))
    if "subjective_assessment" in data.get("detectors", {}):
        configured = max(0.0, _subjective_dimension_weight(name, data))
        return "subjective", _subjective_row(name, score, configured)
    return "mechanical", _mechanical_row(name, score, data)


def _pool_average(weighted_sum: float, total_weight: float, *, empty_default: float | None) -> float | None:
    if total_weight <= 0:
        return empty_default
    return weighted_sum / total_weight


def _pool_fractions(
    mechanical_weight: float,
    subjective_weight: float,
    subjective_avg: float | None,
) -> tuple[float, float]:
    if subjective_avg is None:
        return 1.0, 0.0
    if mechanical_weight == 0:
        return 0.0, 1.0
    return MECHANICAL_WEIGHT_FRACTION, SUBJECTIVE_WEIGHT_FRACTION


def _overall_health_score(
    mechanical_avg: float,
    subjective_avg: float | None,
    *,
    mechanical_fraction: float,
    subjective_fraction: float,
) -> float:
    if subjective_avg is None:
        return round(mechanical_avg, 1)
    if mechanical_fraction == 0.0:
        return round(subjective_avg, 1)
    return round(
        mechanical_avg * mechanical_fraction + subjective_avg * subjective_fraction,
        1,
    )


def _breakdown_entry(
    row: dict[str, float | str],
    *,
    pool: str,
    total_weight: float,
    pool_fraction: float,
) -> HealthBreakdownEntry:
    pool_share = float(row["effective_weight"]) / total_weight if total_weight > 0 else 0.0
    per_point = pool_fraction * pool_share
    score = float(row["score"])
    checks = float(row["checks"]) if "checks" in row else 0.0
    sample_factor = float(row["sample_factor"]) if "sample_factor" in row else 1.0
    return {
        "name": str(row["name"]),
        "pool": pool,
        "score": score,
        "checks": checks,
        "sample_factor": sample_factor,
        "configured_weight": float(row["configured_weight"]),
        "effective_weight": float(row["effective_weight"]),
        "pool_share": pool_share,
        "overall_per_point": per_point,
        "overall_contribution": per_point * score,
        "overall_drag": per_point * (100.0 - score),
    }


def _breakdown_entries(
    mechanical_rows: list[dict[str, float | str]],
    subjective_rows: list[dict[str, float | str]],
    *,
    mechanical_weight: float,
    subjective_weight: float,
    mechanical_fraction: float,
    subjective_fraction: float,
) -> list[HealthBreakdownEntry]:
    entries: list[HealthBreakdownEntry] = []
    for row in mechanical_rows:
        entries.append(
            _breakdown_entry(
                row,
                pool="mechanical",
                total_weight=mechanical_weight,
                pool_fraction=mechanical_fraction,
            )
        )
    for row in subjective_rows:
        entries.append(
            _breakdown_entry(
                row,
                pool="subjective",
                total_weight=subjective_weight,
                pool_fraction=subjective_fraction,
            )
        )
    return entries


def compute_health_breakdown(
    dimension_scores: dict,
    *,
    score_key: str = "score",
) -> HealthBreakdown:
    """Return pool averages and weighted contribution breakdown for score transparency."""
    if not dimension_scores:
        return _empty_health_breakdown()

    mech_sum = 0.0
    mech_weight = 0.0
    subj_sum = 0.0
    subj_weight = 0.0
    mechanical_rows: list[dict[str, float | str]] = []
    subjective_rows: list[dict[str, float | str]] = []

    for name, data in dimension_scores.items():
        pool, row = _categorize_dimension_row(name, data, score_key=score_key)
        score = float(row["score"])
        effective = float(row["effective_weight"])
        if pool == "subjective":
            subj_sum += score * effective
            subj_weight += effective
            subjective_rows.append(row)
            continue

        mech_sum += score * effective
        mech_weight += effective
        mechanical_rows.append(row)

    mech_avg = float(_pool_average(mech_sum, mech_weight, empty_default=100.0))
    subj_avg = _pool_average(subj_sum, subj_weight, empty_default=None)
    mechanical_fraction, subjective_fraction = _pool_fractions(
        mech_weight,
        subj_weight,
        subj_avg,
    )
    overall_score = _overall_health_score(
        mech_avg,
        subj_avg,
        mechanical_fraction=mechanical_fraction,
        subjective_fraction=subjective_fraction,
    )
    entries = _breakdown_entries(
        mechanical_rows,
        subjective_rows,
        mechanical_weight=mech_weight,
        subjective_weight=subj_weight,
        mechanical_fraction=mechanical_fraction,
        subjective_fraction=subjective_fraction,
    )

    return {
        "overall_score": overall_score,
        "mechanical_fraction": mechanical_fraction,
        "subjective_fraction": subjective_fraction,
        "mechanical_avg": mech_avg,
        "subjective_avg": subj_avg,
        "entries": entries,
    }


def compute_health_score(
    dimension_scores: dict,
    *,
    score_key: str = "score",
) -> float:
    """Budget-weighted blend of mechanical and subjective dimension scores."""
    return float(
        compute_health_breakdown(dimension_scores, score_key=score_key)[
            "overall_score"
        ]
    )


__all__ = ["compute_health_breakdown", "compute_health_score"]
````

## File: desloppify/engine/_scoring/results/impact.py
````python
"""Detector-to-score impact helpers."""

from __future__ import annotations

from desloppify.engine._scoring.policy.core import (
    DETECTOR_SCORING_POLICIES,
    DIMENSIONS,
    DIMENSIONS_BY_NAME,
    Dimension,
)
from desloppify.engine._scoring.results.health import compute_health_score


def compute_score_impact(
    dimension_scores: dict,
    potentials: dict[str, int],
    detector: str,
    issues_to_fix: int,
) -> float:
    """Estimate score improvement from fixing N issues in a detector."""
    target_dim = None
    for dim in DIMENSIONS:
        if detector in dim.detectors:
            target_dim = dim
            break
    if target_dim is None or target_dim.name not in dimension_scores:
        return 0.0

    potential = potentials.get(detector, 0)
    if potential <= 0:
        return 0.0

    dim_data = dimension_scores[target_dim.name]
    old_score = compute_health_score(dimension_scores)

    det_data = dim_data["detectors"].get(detector)
    if not det_data:
        return 0.0

    old_weighted = det_data["weighted_failures"]
    failing = det_data.get("failing")
    if not isinstance(failing, (int, float)) or failing <= 0:
        failing = det_data.get("count")
    avg_weight = old_weighted / max(1, int(failing) if isinstance(failing, (int, float)) else 1)
    new_weighted = max(0.0, old_weighted - issues_to_fix * avg_weight)

    total_potential = 0
    total_new_weighted_failures = 0.0
    for det in target_dim.detectors:
        det_values = dim_data["detectors"].get(det)
        if not det_values:
            continue
        total_potential += det_values["potential"]
        if det == detector:
            total_new_weighted_failures += new_weighted
        else:
            total_new_weighted_failures += det_values["weighted_failures"]
    if total_potential <= 0:
        return 0.0

    new_dim_score = (
        max(
            0.0,
            (total_potential - total_new_weighted_failures) / total_potential,
        )
        * 100
    )

    simulated = {name: dict(data) for name, data in dimension_scores.items()}
    simulated[target_dim.name] = {**dim_data, "score": round(new_dim_score, 1)}
    new_score = compute_health_score(simulated)
    return round(new_score - old_score, 1)


def get_dimension_for_detector(detector: str) -> Dimension | None:
    """Look up which dimension a detector belongs to."""
    policy = DETECTOR_SCORING_POLICIES.get(detector)
    if not policy or policy.dimension is None:
        return None
    return DIMENSIONS_BY_NAME.get(policy.dimension)


__all__ = ["compute_score_impact", "get_dimension_for_detector"]
````

## File: desloppify/engine/_scoring/state_coverage.py
````python
"""Scan coverage projection helpers for state-integrated scoring."""

from __future__ import annotations

from desloppify.base.coercions import coerce_confidence
from desloppify.engine._state.schema import StateModel
from desloppify.languages.framework import ScanCoverageRecord


def _active_scan_coverage(state: StateModel) -> ScanCoverageRecord:
    scan_coverage = state.get("scan_coverage", {})
    if not isinstance(scan_coverage, dict) or not scan_coverage:
        return {}

    lang_name = state.get("lang")
    if isinstance(lang_name, str) and lang_name:
        payload = scan_coverage.get(lang_name, {})
        return payload if isinstance(payload, dict) else {}

    if len(scan_coverage) == 1:
        only = next(iter(scan_coverage.values()))
        return only if isinstance(only, dict) else {}
    return {}


def _full_score_confidence_payload() -> dict[str, object]:
    """Return a score_confidence dict indicating full (unreduced) coverage."""
    return {
        "status": "full",
        "confidence": 1.0,
        "detectors": [],
        "dimensions": [],
    }


def _collect_reduced_detectors(
    detectors_payload: dict,
) -> dict[str, dict[str, object]]:
    """Filter detectors_payload to those with reduced status or sub-1.0 confidence."""
    reduced: dict[str, dict[str, object]] = {}
    for detector, raw in detectors_payload.items():
        if not isinstance(raw, dict):
            continue
        status = str(raw.get("status", "full")).lower()
        confidence = coerce_confidence(raw.get("confidence"), default=1.0)
        if status != "reduced" and confidence >= 1.0:
            continue
        reduced[str(detector)] = dict(raw)
    return reduced


def _score_confidence_detector_entry(
    detector: str, payload: dict[str, object]
) -> dict[str, object]:
    """Build a single score_confidence detector entry from a reduced-detector payload."""
    return {
        "detector": detector,
        "status": str(payload.get("status", "reduced")),
        "confidence": round(
            coerce_confidence(payload.get("confidence"), default=1.0),
            2,
        ),
        "summary": str(payload.get("summary", "") or ""),
        "impact": str(payload.get("impact", "") or ""),
        "remediation": str(payload.get("remediation", "") or ""),
        "tool": str(payload.get("tool", "") or ""),
        "reason": str(payload.get("reason", "") or ""),
    }


def apply_scan_coverage_to_dimension_scores(
    state: StateModel,
    *,
    dimension_scores: dict[str, dict],
) -> None:
    coverage_payload = _active_scan_coverage(state)
    detectors_payload = coverage_payload.get("detectors", {})
    if not isinstance(detectors_payload, dict):
        state["score_confidence"] = _full_score_confidence_payload()
        return

    reduced_detectors = _collect_reduced_detectors(detectors_payload)

    score_confidence_detectors = [
        _score_confidence_detector_entry(det, payload)
        for det, payload in reduced_detectors.items()
    ]

    reduced_dimensions: list[str] = []
    for dim_name, dim_data in dimension_scores.items():
        if not isinstance(dim_data, dict):
            continue
        detectors = dim_data.get("detectors", {})
        if not isinstance(detectors, dict):
            continue

        impacts: list[dict[str, object]] = []
        for detector_name, detector_meta in detectors.items():
            reduced = reduced_detectors.get(str(detector_name))
            if not isinstance(detector_meta, dict):
                continue
            if reduced is None:
                detector_meta.pop("coverage_status", None)
                detector_meta.pop("coverage_confidence", None)
                detector_meta.pop("coverage_summary", None)
                continue
            confidence = coerce_confidence(reduced.get("confidence"), default=1.0)
            status = str(reduced.get("status", "reduced"))
            summary = str(reduced.get("summary", "") or "")
            detector_meta["coverage_status"] = status
            detector_meta["coverage_confidence"] = round(confidence, 2)
            detector_meta["coverage_summary"] = summary
            impacts.append(
                {
                    "detector": str(detector_name),
                    "status": status,
                    "confidence": round(confidence, 2),
                    "summary": summary,
                }
            )

        if not impacts:
            dim_data.pop("coverage_status", None)
            dim_data.pop("coverage_confidence", None)
            dim_data.pop("coverage_impacts", None)
            continue

        reduced_dimensions.append(str(dim_name))
        dim_data["coverage_status"] = "reduced"
        dim_data["coverage_confidence"] = round(
            min(
                coerce_confidence(item.get("confidence"), default=1.0)
                for item in impacts
            ),
            2,
        )
        dim_data["coverage_impacts"] = impacts

    if not score_confidence_detectors:
        state["score_confidence"] = _full_score_confidence_payload()
        return

    state["score_confidence"] = {
        "status": "reduced",
        "confidence": round(
            min(
                coerce_confidence(item.get("confidence"), default=1.0)
                for item in score_confidence_detectors
            ),
            2,
        ),
        "detectors": score_confidence_detectors,
        "dimensions": sorted(set(reduced_dimensions)),
    }


__all__ = ["apply_scan_coverage_to_dimension_scores"]
````

## File: desloppify/engine/_scoring/state_integration_subjective.py
````python
"""Subjective-integrity helpers used by state-scoring integration."""

from __future__ import annotations

from copy import deepcopy

from desloppify.engine._scoring.policy.core import matches_target_score

_SUBJECTIVE_TARGET_RESET_THRESHOLD = 2


def _coerce_subjective_score(value: dict | float | int | str | None) -> float:
    """Normalize a subjective assessment score payload to a 0-100 float."""
    raw = value.get("score", 0) if isinstance(value, dict) else value
    try:
        score = float(raw)
    except (TypeError, ValueError):
        score = 0.0
    return max(0.0, min(100.0, score))


def _subjective_target_matches(
    subjective_assessments: dict, *, target: float
) -> list[str]:
    """Return dimension keys whose subjective score matches the target band."""
    matches = [
        dimension
        for dimension, payload in subjective_assessments.items()
        if matches_target_score(_coerce_subjective_score(payload), target)
    ]
    return sorted(matches)


def _subjective_integrity_baseline(target: float | None) -> dict[str, object]:
    """Create baseline subjective-integrity metadata for scan/reporting output."""
    return {
        "status": "disabled" if target is None else "pass",
        "target_score": None if target is None else round(float(target), 2),
        "matched_count": 0,
        "matched_dimensions": [],
        "reset_dimensions": [],
    }


def _apply_subjective_integrity_policy(
    subjective_assessments: dict,
    *,
    target: float,
) -> tuple[dict, dict[str, object]]:
    """Subjective integrity check (disabled).

    Previously applied anti-gaming penalties when multiple dimensions
    scored near the target. Disabled because blind-packet subagent
    reviews cannot anchor to the target score, making false positives
    (legitimate score convergence) more likely than actual gaming.
    """
    normalized_target = max(0.0, min(100.0, float(target)))
    meta = _subjective_integrity_baseline(normalized_target)
    meta["status"] = "disabled"
    return subjective_assessments, meta


def _normalize_integrity_target(
    subjective_integrity_target: float | None,
) -> float | None:
    """Normalize and clamp a subjective integrity target to [0, 100]."""
    if isinstance(subjective_integrity_target, int | float):
        return max(0.0, min(100.0, float(subjective_integrity_target)))
    return None


__all__ = [
    "_apply_subjective_integrity_policy",
    "_normalize_integrity_target",
    "_subjective_integrity_baseline",
]
````

## File: desloppify/engine/_scoring/state_integration.py
````python
"""Bridge between state persistence and scoring computation.

This module owns the score-recomputation step that runs before state is written.
The dependency direction is: _scoring/state_integration -> _state (reads state),
_scoring/state_integration -> _scoring (calls scoring functions).
State persistence calls this module, never the reverse.
"""

from __future__ import annotations

from desloppify.base.enums import issue_status_tokens
from desloppify.engine._scoring.detection import merge_potentials
from desloppify.engine._scoring.results.core import (
    compute_health_score,
    compute_score_bundle,
)
from desloppify.engine._scoring.state_integration_subjective import (
    _apply_subjective_integrity_policy,
    _normalize_integrity_target,
    _subjective_integrity_baseline,
)
from desloppify.engine._scoring.state_coverage import (
    apply_scan_coverage_to_dimension_scores as _apply_scan_coverage_to_dimension_scores,
)
from desloppify.engine._state.scope import path_scoped_issues
from desloppify.engine._state.schema import StateModel, ensure_state_defaults

_EMPTY_COUNTERS = tuple(sorted(issue_status_tokens()))


def _resolve_lang_from_state(state: StateModel) -> str | None:
    """Best-effort language detection from state (scan_history > lang_capabilities)."""
    history = state.get("scan_history")
    if isinstance(history, list):
        for entry in reversed(history):
            if isinstance(entry, dict):
                lang = entry.get("lang")
                if isinstance(lang, str) and lang.strip():
                    return lang.strip().lower()
    capabilities = state.get("lang_capabilities")
    if isinstance(capabilities, dict) and len(capabilities) == 1:
        only_lang = next(iter(capabilities.keys()))
        if isinstance(only_lang, str) and only_lang.strip():
            return only_lang.strip().lower()
    return None


def _count_issues(issues: dict) -> tuple[dict[str, int], dict[int, dict[str, int]]]:
    """Tally per-status counters and per-tier breakdowns."""
    counters = dict.fromkeys(_EMPTY_COUNTERS, 0)
    tier_stats: dict[int, dict[str, int]] = {}

    for issue in issues.values():
        if issue.get("suppressed"):
            continue
        status = issue["status"]
        tier = issue.get("tier", 3)
        counters[status] = counters.get(status, 0) + 1
        tier_counter = tier_stats.setdefault(tier, dict.fromkeys(_EMPTY_COUNTERS, 0))
        tier_counter[status] = tier_counter.get(status, 0) + 1

    return counters, tier_stats


def _aggregate_scores(dim_scores: dict) -> dict[str, float]:
    """Derive the four aggregate scores from dimension-level data."""
    mechanical = {
        n: d
        for n, d in dim_scores.items()
        if "subjective_assessment" not in d.get("detectors", {})
    }
    return {
        "overall_score": compute_health_score(dim_scores),
        "strict_score": compute_health_score(dim_scores, score_key="strict"),
        "objective_score": compute_health_score(mechanical),
        "verified_strict_score": compute_health_score(
            mechanical,
            score_key="verified_strict_score",
        ),
    }


def _set_perfect_scores(state: StateModel) -> None:
    """Set all score fields to 100 when there are no active checks."""
    state["dimension_scores"] = {}
    state["overall_score"] = 100.0
    state["objective_score"] = 100.0
    state["strict_score"] = 100.0
    state["verified_strict_score"] = 100.0


def _resolve_allowed_subjective_dimensions(
    state: StateModel,
) -> set[str] | None:
    """Resolve allowed subjective dimensions from the language config."""
    lang_name = _resolve_lang_from_state(state)
    if not lang_name:
        return None
    try:
        from desloppify.intelligence.review.dimensions.data import (
            load_dimensions_for_lang,
        )

        dims, _, _ = load_dimensions_for_lang(lang_name)
        if dims:
            return set(dims)
    except (ImportError, AttributeError) as exc:
        _ = exc
    return None


def _materialize_dimension_scores(
    state: StateModel,
    bundle: object,
) -> None:
    """Write dimension scores from a score bundle into state, carrying forward old dims."""
    lenient_scores = bundle.dimension_scores
    strict_scores = bundle.strict_dimension_scores
    verified_strict_scores = bundle.verified_strict_dimension_scores

    prev_dim_scores = dict(state.get("dimension_scores", {}))

    state["dimension_scores"] = {
        name: dict(
            score=lenient_scores[name]["score"],
            strict=strict_scores[name]["score"],
            verified_strict_score=verified_strict_scores[name]["score"],
            checks=lenient_scores[name]["checks"],
            failing=lenient_scores[name]["failing"],
            tier=lenient_scores[name]["tier"],
            detectors=lenient_scores[name].get("detectors", {}),
        )
        for name in lenient_scores
    }

    for dim_name, prev_data in prev_dim_scores.items():
        if dim_name in state["dimension_scores"]:
            continue
        if not isinstance(prev_data, dict):
            continue
        if "subjective_assessment" in prev_data.get("detectors", {}):
            continue
        carried = {**prev_data, "carried_forward": True}
        carried.setdefault("score", 0.0)
        carried.setdefault("strict", carried.get("score", 0.0))
        carried.setdefault(
            "verified_strict_score",
            carried.get("strict", carried.get("score", 0.0)),
        )
        state["dimension_scores"][dim_name] = carried

    _apply_scan_coverage_to_dimension_scores(
        state,
        dimension_scores=state["dimension_scores"],
    )
    state.update(_aggregate_scores(state["dimension_scores"]))


def _update_objective_health(
    state: StateModel,
    issues: dict,
    *,
    subjective_integrity_target: float | None = None,
) -> None:
    """Compute canonical score tuple from current detector issues/potentials."""
    pots = state.get("potentials", {})
    if not pots:
        return

    merged = merge_potentials(pots)
    if not merged:
        return

    subjective_assessments = state.get("subjective_assessments") or None
    integrity_target = _normalize_integrity_target(subjective_integrity_target)
    integrity_meta = _subjective_integrity_baseline(integrity_target)
    if subjective_assessments and integrity_target is not None:
        subjective_assessments, integrity_meta = _apply_subjective_integrity_policy(
            subjective_assessments,
            target=integrity_target,
        )
    state["subjective_integrity"] = integrity_meta

    has_active_checks = any((count or 0) > 0 for count in merged.values())
    if not has_active_checks and not subjective_assessments:
        _set_perfect_scores(state)
        return

    allowed_subjective = _resolve_allowed_subjective_dimensions(state)

    bundle = compute_score_bundle(
        issues,
        merged,
        subjective_assessments=subjective_assessments,
        allowed_subjective_dimensions=allowed_subjective,
    )
    _materialize_dimension_scores(state, bundle)


def recompute_stats(
    state: StateModel,
    scan_path: str | None = None,
    *,
    subjective_integrity_target: float | None = None,
) -> None:
    """Recompute stats and canonical health scores from issues."""
    ensure_state_defaults(state)
    issues = path_scoped_issues(state.get("work_items") or state.get("issues", {}), scan_path)
    counters, tier_stats = _count_issues(issues)
    state["stats"] = {
        "total": sum(counters.values()),
        **counters,
        "by_tier": {
            str(tier): tier_counts for tier, tier_counts in sorted(tier_stats.items())
        },
    }
    _update_objective_health(
        state,
        issues,
        subjective_integrity_target=subjective_integrity_target,
    )


__all__ = [
    "_count_issues",
    "_update_objective_health",
    "recompute_stats",
]
````

## File: desloppify/engine/_scoring/subjective/__init__.py
````python
"""Subjective scoring internals."""
````

## File: desloppify/engine/_scoring/subjective/core.py
````python
"""Subjective-dimension scoring helpers."""

from __future__ import annotations

from desloppify.base.subjective_dimension_catalog import DISPLAY_NAMES
from desloppify.base.subjective_dimensions import (
    default_dimension_keys,
    dimension_display_name,
    dimension_weight,
)
from desloppify.base.text_utils import is_numeric
from desloppify.engine._scoring.policy.core import SUBJECTIVE_CHECKS
from desloppify.engine._state.issue_semantics import _detail_dict, is_review_work_item


def _display_fallback(dim_name: str) -> str:
    words = dim_name.replace("_", " ")
    return words[0].upper() + words[1:] if words else words


def _normalize_dimension_key(dim_name: object) -> str:
    if not isinstance(dim_name, str):
        return ""
    return "_".join(dim_name.strip().lower().replace("-", "_").split())


def _primary_lang_from_issues(issues: dict) -> str | None:
    counts: dict[str, int] = {}
    for issue in issues.values():
        if not isinstance(issue, dict):
            continue
        raw_lang = issue.get("lang")
        if not isinstance(raw_lang, str) or not raw_lang.strip():
            continue
        key = raw_lang.strip().lower()
        counts[key] = counts.get(key, 0) + 1
    if not counts:
        return None
    return max(counts, key=counts.get)


def _dimension_display_name(dim_name: str, *, lang_name: str | None) -> str:
    return str(dimension_display_name(dim_name, lang_name=lang_name))


def _dimension_weight(dim_name: str, *, lang_name: str | None) -> float:
    return float(dimension_weight(dim_name, lang_name=lang_name))


def _compute_dimension_score(
    assessment: dict | None, has_assessment: bool,
) -> tuple[float, float, float]:
    """Compute (score, pass_rate, assessment_score) for a dimension."""
    assessment_score = (
        max(0.0, min(100.0, float(assessment.get("score", 0))))
        if isinstance(assessment, dict)
        else 0.0
    )
    integrity_penalty = (
        assessment.get("integrity_penalty")
        if isinstance(assessment, dict)
        else None
    )
    reset_pending = bool(
        isinstance(assessment, dict)
        and (
            assessment.get("reset_by") == "scan_reset_subjective"
            or assessment.get("source") == "scan_reset_subjective"
            or assessment.get("placeholder") is True
        )
    )
    if reset_pending:
        score = 0.0
        pass_rate = 0.0
    elif has_assessment:
        score = assessment_score
        pass_rate = score / 100.0
    else:
        score = 0.0
        pass_rate = 0.0
    return score, pass_rate, assessment_score


def _extract_components(assessment: dict) -> tuple[list[str], dict[str, float]]:
    """Extract component names and scores from an assessment dict."""
    components: list[str] = []
    component_scores: dict[str, float] = {}
    raw_components = assessment.get("components")
    if isinstance(raw_components, list):
        components = [
            str(item).strip()
            for item in raw_components
            if isinstance(item, str) and item.strip()
        ]
    raw_component_scores = assessment.get("component_scores")
    if isinstance(raw_component_scores, dict):
        for key, value in raw_component_scores.items():
            if not isinstance(key, str) or not key.strip():
                continue
            if not is_numeric(value):
                continue
            component_scores[key.strip()] = round(
                max(0.0, min(100.0, float(value))),
                1,
            )
    return components, component_scores


def _normalized_allowed_dimensions(
    allowed_dimensions: set[str] | None,
) -> set[str] | None:
    if allowed_dimensions is None:
        return None
    return {_normalize_dimension_key(name) for name in allowed_dimensions}


def _default_dimensions(allowed: set[str] | None) -> list[str]:
    default_dimensions: list[str] = []
    for raw_dim in default_dimension_keys():
        dim = _normalize_dimension_key(raw_dim)
        if not dim:
            continue
        if allowed is not None and dim not in allowed:
            continue
        default_dimensions.append(dim)
    return default_dimensions


def _placeholder_assessment(payload: object) -> bool:
    return isinstance(payload, dict) and (
        payload.get("placeholder") is True
        or payload.get("source") == "scan_reset_subjective"
        or payload.get("reset_by") == "scan_reset_subjective"
    )


def _normalized_assessments(
    assessments: dict | None,
    *,
    allowed: set[str] | None,
) -> dict[str, dict]:
    assessed: dict[str, dict] = {}
    for raw_dim, payload in (assessments or {}).items():
        dim = _normalize_dimension_key(raw_dim)
        if not dim:
            continue
        if _placeholder_assessment(payload) and allowed is not None and dim not in allowed:
            continue
        assessed[dim] = payload
    return assessed


def _all_dimension_keys(
    default_dimensions: list[str],
    assessed: dict[str, dict],
) -> list[str]:
    all_dims = list(default_dimensions)
    for dim_name in assessed:
        if dim_name not in default_dimensions:
            all_dims.append(dim_name)
    return all_dims


def _subjective_issue_count(
    issues: dict,
    *,
    failure_set: frozenset[str],
    dim_name: str,
) -> int:
    return sum(
        1
        for issue in issues.values()
        if is_review_work_item(issue)
        and issue.get("status") in failure_set
        and _normalize_dimension_key(_detail_dict(issue).get("dimension")) == dim_name
    )


def _subjective_dimension_display(
    dim_name: str,
    *,
    lang_name: str | None,
    existing_lower: set[str],
) -> str:
    display = _dimension_display_name(dim_name, lang_name=lang_name)
    if display.lower() in existing_lower:
        return f"{display} (subjective)"
    return display


def _subjective_dimension_entry(
    *,
    dim_name: str,
    lang_name: str | None,
    assessment: dict | None,
    has_assessment: bool,
    issue_count: int,
) -> dict:
    score, pass_rate, assessment_score = _compute_dimension_score(
        assessment,
        has_assessment,
    )
    reset_pending = _placeholder_assessment(assessment)
    components: list[str] = []
    component_scores: dict[str, float] = {}
    if isinstance(assessment, dict):
        components, component_scores = _extract_components(assessment)
    return {
        "score": round(float(score), 1),
        "tier": 4,
        "checks": SUBJECTIVE_CHECKS,
        "failing": issue_count,
        "detectors": {
            "subjective_assessment": {
                "potential": SUBJECTIVE_CHECKS,
                "pass_rate": round(pass_rate, 4),
                "failing": issue_count,
                "weighted_failures": round(SUBJECTIVE_CHECKS * (1 - pass_rate), 4),
                "assessment_score": round(assessment_score, 1),
                "placeholder": reset_pending or not has_assessment,
                "dimension_key": dim_name,
                "configured_weight": round(
                    _dimension_weight(dim_name, lang_name=lang_name),
                    6,
                ),
                "components": components,
                **({"component_scores": component_scores} if component_scores else {}),
            }
        },
    }


def append_subjective_dimensions(
    results: dict,
    issues: dict,
    assessments: dict | None,
    failure_set: frozenset[str],
    allowed_dimensions: set[str] | None = None,
) -> None:
    """Append subjective review dimensions to results dict (mutates results).

    Subjective scoring is evidence-first: open review issues for a dimension
    determine pass-rate, while imported assessment scores are retained as
    metadata for transparency.
    """
    allowed = _normalized_allowed_dimensions(allowed_dimensions)
    default_dimensions = _default_dimensions(allowed)
    assessed = _normalized_assessments(assessments, allowed=allowed)
    existing_lower = {k.lower() for k in results}
    lang_name = _primary_lang_from_issues(issues)
    for dim_name in _all_dimension_keys(default_dimensions, assessed):
        is_default = dim_name in default_dimensions
        assessment = assessed.get(dim_name)
        has_assessment = isinstance(assessment, dict)
        if not is_default and not assessment:
            continue
        display = _subjective_dimension_display(
            dim_name,
            lang_name=lang_name,
            existing_lower=existing_lower,
        )
        issue_count = _subjective_issue_count(
            issues,
            failure_set=failure_set,
            dim_name=dim_name,
        )
        results[display] = _subjective_dimension_entry(
            dim_name=dim_name,
            lang_name=lang_name,
            assessment=assessment,
            has_assessment=has_assessment,
            issue_count=issue_count,
        )


__all__ = [
    "DISPLAY_NAMES",
    "append_subjective_dimensions",
]
````

## File: docs/AMP.md
````markdown
## Amp Overlay

Desloppify is installed as an Amp skill at `.agents/skills/desloppify/`. Amp lazy-loads the full instructions when you invoke desloppify, so the skill body is only added to context on use.

<!-- desloppify-overlay: amp -->
<!-- desloppify-end -->
````

## File: docs/CLAUDE.md
````markdown
## Claude Code Overlay

Use Claude subagents for subjective scoring work. **Do not use `--runner codex`** — use Claude subagents exclusively.

### Review workflow

Run `desloppify review --prepare` first to generate review data, then use Claude subagents:

1. **Prepare**: `desloppify review --prepare` — writes `query.json` and `.desloppify/review_packet_blind.json`.
2. **Launch subagents**: Split the review across N parallel Claude subagents (one message, multiple Task calls). Each agent reviews a subset of dimensions.
3. **Merge & import**: Merge agent outputs, then `desloppify review --import merged.json --manual-override --attest "Claude subagents ran blind reviews against review_packet_blind.json" --scan-after-import`.

#### How to split dimensions across subagents

- Read `dimension_prompts` from `query.json` for dimensions with definitions and seed files.
- Read `.desloppify/review_packet_blind.json` for the blind packet (no score targets, no anchoring data).
- Group dimensions into 3-4 batches by theme (e.g., architecture, code quality, testing, conventions).
- Launch one Task agent per batch with `subagent_type: "general-purpose"`. Each agent gets:
  - The codebase path and list of dimensions to score
  - The blind packet path to read
  - Instruction to score from code evidence only, not from targets
- Each agent writes output to `results/batch-N.raw.txt` (matching the batch index). Merge assessments (average overlapping dimension scores) and concatenate findings.

### Subagent rules

1. Each agent must be context-isolated — do not pass conversation history or score targets.
2. Agents must consume `.desloppify/review_packet_blind.json` (not full `query.json`) to avoid score anchoring.

### Triage workflow

Orchestrate triage with per-stage subagents:
1. `desloppify plan triage --run-stages --runner claude` — prints orchestrator instructions
2. For each stage (observe → reflect → organize → enrich):
   - Get prompt: `desloppify plan triage --stage-prompt <stage>`
   - Launch a subagent with that prompt
   - Verify: `desloppify plan triage` (check dashboard)
   - Confirm: `desloppify plan triage --confirm <stage> --attestation "..."`
3. Complete: `desloppify plan triage --complete --strategy "..." --attestation "..."`

<!-- desloppify-overlay: claude -->
<!-- desloppify-end -->
````

## File: docs/CODEX.md
````markdown
## Codex Overlay

This is the canonical Codex overlay used by the README install command.

1. Prefer first-class batch runs: `desloppify review --run-batches --runner codex --parallel --scan-after-import`.
2. The command writes immutable packet snapshots under `.desloppify/review_packets/holistic_packet_*.json`; use those for reproducible retries.
3. Keep reviewer input scoped to the immutable packet and the source files named in each batch.
4. If a batch fails, retry only that slice with `desloppify review --run-batches --packet <packet.json> --only-batches <idxs>`.
5. Manual override is safety-scoped: you cannot combine it with `--allow-partial`, and provisional manual scores expire on the next `scan` unless replaced by trusted internal or attested-external imports.

### Subagent policy

Do not ask Codex review or triage prompts to spawn their own child agents. The supported Codex path is the first-class batch runner above: it already isolates packet slices, supports parallel subprocess execution, preserves retry artifacts, and keeps execution guardrails outside the model prompt. Revisit this only after Codex exposes a stable non-interactive subagent contract that can cap concurrency, preserve blind-packet isolation, and retry failed child tasks without increasing cost or weakening guardrails.

### Sandbox

Codex batch runs default to `-s workspace-write`. On hosts where that sandbox cannot run, such as WSL1 systems without the needed Linux namespace support, set `DESLOPPIFY_CODEX_SANDBOX=danger-full-access` in an externally sandboxed environment before running review batches. Supported values are `read-only`, `workspace-write`, and `danger-full-access`; invalid values fall back to `workspace-write`.

### Triage workflow

Prefer automated triage: `desloppify plan triage --run-stages --runner codex`

Options: `--only-stages observe,reflect` (subset), `--dry-run` (prompts only), `--stage-timeout-seconds N` (per-stage).

Run artifacts go to `.desloppify/triage_runs/<timestamp>/` — each run gets its own directory with `run.log` (live timestamped events), `run_summary.json`, per-stage `prompts/`, `output/`, and `logs/`. Check `run.log` to diagnose stalls or failures. Re-running resumes from the last confirmed stage.

If automated triage stalls, check `run.log` for the last event, then use `desloppify plan triage --stage-prompt <stage>` to get the full prompt with gate rules.

<!-- desloppify-overlay: codex -->
<!-- desloppify-end -->
````

## File: docs/COPILOT.md
````markdown
## VS Code Copilot Overlay

VS Code Copilot supports native subagents via `.github/agents/` definitions.
Use them for context-isolated subjective reviews.

### Review workflow

Define a reviewer in `.github/agents/desloppify-reviewer.md`:

```yaml
---
name: desloppify-reviewer
tools: ['read', 'search']
---
```

Use the prompt from the "Reviewer agent prompt" section above.

Define an orchestrator in `.github/agents/desloppify-review-orchestrator.md`:

```yaml
---
name: desloppify-review-orchestrator
tools: ['agent', 'read', 'search']
agents: ['desloppify-reviewer']
---
```

Split dimensions across `desloppify-reviewer` calls (Copilot runs them concurrently), merge assessments and findings, then import.

<!-- desloppify-overlay: copilot -->
<!-- desloppify-end -->
````

## File: docs/CURSOR.md
````markdown
## Cursor Overlay

Cursor supports native subagents via `.cursor/agents/` definitions. Use them
for context-isolated subjective reviews.

### Review workflow

Define a reviewer agent in `.cursor/agents/desloppify-reviewer.md`:

```markdown
---
name: desloppify-reviewer
description: Scores subjective codebase quality dimensions for desloppify
tools:
  - read
  - search
---
```

Use the prompt from the "Reviewer agent prompt" section above.

Launch multiple reviewer subagents, each with a subset of dimensions.
Each agent writes its output to `results/batch-N.raw.txt` (matching the batch index).
Merge assessments (average where dimensions overlap) and findings, then import.

<!-- desloppify-overlay: cursor -->
<!-- desloppify-end -->
````

## File: docs/DROID.md
````markdown
## Droid Overlay

Droid skills are installed at `.factory/skills/desloppify/SKILL.md`. Droid
automatically discovers and invokes skills based on the task context,
or you can invoke directly with `/desloppify`.

### Subagents

Droid supports custom droids (subagents) for parallel work. Use the `worker`
droid for delegating independent tasks — it inherits the project's tool
configuration and is ideal for parallel smell detection, file analysis,
or cross-cutting refactoring work.

### Review workflow

1. Run `desloppify review --prepare` to generate `query.json` and
   `.desloppify/review_packet_blind.json`.
2. Split dimensions into 3-4 batches by theme.
3. For each batch, launch a worker subagent:
   ```
   Task("worker", "review batch 1",
     prompt="Score these dimensions: <list>. Read .desloppify/review_packet_blind.json. Score from code evidence only. Write results to review_batch_1.json.")
   ```
4. Merge assessments (average overlapping scores) and concatenate findings.
5. Import: `desloppify review --import merged.json --manual-override --attest "Worker subagents ran blind reviews" --scan-after-import`.

Each worker must consume `.desloppify/review_packet_blind.json` (not full
`query.json`) to avoid score anchoring.

### Triage workflow

1. For each stage (observe → reflect → organize → enrich):
   - Get prompt: `desloppify plan triage --stage-prompt <stage>`
   - Launch worker with that prompt.
   - Confirm: `desloppify plan triage --confirm <stage> --attestation "..."`
2. Complete: `desloppify plan triage --complete --strategy "..." --attestation "..."`

<!-- desloppify-overlay: droid -->
<!-- desloppify-end -->
````

## File: docs/GEMINI.md
````markdown
## Gemini CLI Overlay

Gemini CLI has experimental subagent support, but subagents currently run
sequentially (not in parallel). Review dimensions one at a time.

### Setup

Enable subagents in Gemini CLI settings:
```json
{
  "experimental": {
    "enableAgents": true
  }
}
```

Optionally define a reviewer agent in `.gemini/agents/desloppify-reviewer.md`:

```yaml
---
name: desloppify-reviewer
description: Scores subjective codebase quality dimensions for desloppify
kind: local
tools:
  - read_file
  - search_code
temperature: 0.2
max_turns: 10
---
```

Use the prompt from the "Reviewer agent prompt" section above.

### Review workflow

Invoke the reviewer agent for each group of dimensions sequentially.
Even without parallelism, isolating dimensions across separate agent
invocations prevents score bleed between concerns.

Merge assessments and findings, then import.

When Gemini CLI adds parallel subagent execution, split dimensions across
concurrent agent calls instead.

<!-- desloppify-overlay: gemini -->
<!-- desloppify-end -->
````

## File: docs/HERMES.md
````markdown
## Hermes Agent Overlay

Hermes has built-in parallel subagent support via `delegate_task` (up to 3
concurrent children). Use `delegate_task(tasks=[...])` for subjective review
batches and per-stage triage support; avoid the older worktree-based guidance
here.

### Review workflow

1. Prepare review prompts and the blind packet:
   ```bash
   desloppify review --run-batches --dry-run
   ```
   This generates one prompt file per batch in
   `.desloppify/subagents/runs/<run-id>/prompts/` and prints the run directory.

2. Launch Hermes subagents in batches of 3 with `delegate_task(tasks=[...])`.
   Each subagent should:
   - read its prompt file at
     `.desloppify/subagents/runs/<run-id>/prompts/batch-N.md`
   - read `.desloppify/review_packet_blind.json`
   - inspect the repository from the prompt's dimension
   - write ONLY valid JSON to
     `.desloppify/subagents/runs/<run-id>/results/batch-N.raw.txt`

   Example task payload:
   ```json
   {
     "goal": "Review batch N. Read the prompt at .desloppify/subagents/runs/<run-id>/prompts/batch-N.md, follow it exactly, inspect the repository, and write ONLY valid JSON to .desloppify/subagents/runs/<run-id>/results/batch-N.raw.txt.",
     "context": "Repository root: <cwd>. Blind packet: .desloppify/review_packet_blind.json. The prompt file defines the required output schema. Do not edit repository source files. Only write the review result file.",
     "toolsets": ["terminal", "file"]
   }
   ```

   Repeat for batches 1-3, 4-6, 7-9, etc. Wait for each group of 3 to finish
   before launching the next group.

3. After all prompt files for that run have matching results, import them:
   ```bash
   desloppify review --import-run .desloppify/subagents/runs/<run-id> --scan-after-import
   ```

### Key constraints

- `delegate_task` supports at most 3 concurrent children at a time.
- Subagents do not inherit parent context; the prompt file and blind packet must
  provide everything needed.
- Subagents cannot call `delegate_task`, `clarify`, `memory`, or `send_message`.
- The importer expects `results/batch-N.raw.txt` files, not `.json` filenames.
- The blind packet intentionally omits score history to prevent anchoring bias.

### Triage workflow

Run triage stages sequentially. For each stage:

1. Get the stage prompt or use the command suggested by `desloppify next`.
2. If the stage benefits from parallel review work, use `delegate_task(tasks=[...])`
   in groups of 3; otherwise run the stage directly in the parent session.
3. Record the stage output with `desloppify plan triage --stage <stage> --report "..."`
   or the corresponding `--run-stages --runner ...` command when available.
4. Confirm with `desloppify plan triage --confirm <stage> --attestation "..."`.
5. Finish with `desloppify plan triage --complete --strategy "..." --attestation "..."`.

<!-- desloppify-overlay: hermes -->
<!-- desloppify-end -->
````

## File: docs/OPENCODE.md
````markdown
## OpenCode Overlay

When installed (via `desloppify update-skill opencode`), OpenCode automatically loads this skill for code quality, technical debt, and health score questions.

### Review workflow

Use the native `--runner opencode` for automated batch reviews:

```
desloppify review --run-batches --runner opencode --parallel --scan-after-import
```

This spawns OpenCode subprocesses (`opencode run --format json`) for each batch, extracts results from the NDJSON stream, merges them, and imports as trusted assessments — identical pipeline to the Codex runner but using OpenCode as the execution engine.

#### Warm server mode (optional, recommended for parallel runs)

Start a persistent OpenCode server to avoid MCP cold-start overhead per batch:

```
opencode serve --port 4096 &
export DESLOPPIFY_OPENCODE_ATTACH=http://localhost:4096
desloppify review --run-batches --runner opencode --parallel --scan-after-import
```

When `DESLOPPIFY_OPENCODE_ATTACH` is set, each batch subprocess attaches to the running server via `--attach <url>` instead of spawning a fresh instance.

#### Preparing a review manually

1. **Prepare**: `desloppify review --prepare` — writes `query.json` and `.desloppify/review_packet_blind.json`.
2. **Run batches**: `desloppify review --run-batches --runner opencode --parallel --scan-after-import`

The runner handles batch splitting, prompt generation, parallel execution, retry/stall detection, result extraction, merge, and trusted import automatically.

<!-- desloppify-overlay: opencode -->
<!-- desloppify-end -->
````

## File: docs/QWEN.md
````markdown
## Qwen Code Overlay

Qwen Code loads skills from `.qwen/skills/<name>/SKILL.md` in a project or `~/.qwen/skills/<name>/SKILL.md` globally.

Install the project skill with:

```bash
desloppify update-skill qwen
```

Install the global skill with:

```bash
desloppify setup --interface qwen
```

Use the standard review workflow from the base skill. Automated `--runner qwen` batch reviews are not implemented yet; use the prepared packet/manual import workflow or another supported batch runner.

<!-- desloppify-overlay: qwen -->
<!-- desloppify-end -->
````

## File: docs/ROVODEV.md
````markdown
## Rovo Dev Overlay

Desloppify is installed as a Rovo Dev skill at `.rovodev/skills/desloppify/SKILL.md`. Rovo Dev discovers skills in both the user-level (`~/.rovodev/skills/`) and project-level (`.rovodev/skills/`) directories, and lazy-loads the skill body into context via the built-in `get_skill` tool when desloppify is invoked.

### Subagents

Rovo Dev supports parallel subagents via the `invoke_subagents` tool. The `General Purpose` subagent inherits all of the parent's tools and is ideal for context-isolated subjective review batches and per-stage triage work. Concurrency caps for `invoke_subagents` are set by Rovo Dev itself and may evolve over time — see the manual fallback section below for the current per-call limit.

### Review workflow

#### Native batch runner (recommended)

Use the first-class `--runner rovodev` for automated batch reviews:

```bash
desloppify review --run-batches --runner rovodev --parallel --scan-after-import
# Each batch is its own `acli rovodev run` subprocess, so concurrency is bounded
# by `--max-parallel-batches` (default 3), NOT by Rovo Dev's in-process
# subagent limit. Bump it for faster wall-clock review on large packets:
#   --max-parallel-batches 6
```

This spawns `acli rovodev run` subprocesses (one per batch), recovers the JSON payload from each agent's reply (or from the agent-written output file), merges them, and imports as trusted assessments — same end-to-end shape as the Codex / OpenCode runners (subprocess-per-batch → file-output → merge → trusted import), with the wire-level details adapted to `acli rovodev run`'s prompt-instructed output mode.

Optional environment overrides:

- `DESLOPPIFY_ROVODEV_NO_YOLO=1` opts out of `--yolo` (the default). With `--yolo` enabled the agent can write the per-batch output file in non-interactive mode without permission prompts; turn it off only for interactive review work.
- `DESLOPPIFY_ROVODEV_OUTPUT_SCHEMA='<schema or path>'` is forwarded as `--output-schema`, constraining the agent's reply to a JSON shape.
- `DESLOPPIFY_ROVODEV_EXTRA_ARGS="--config-override '{...}'"` is shell-split and appended verbatim before the prompt (useful for `--config-override`, `--restore`, `--worktree`, etc.).
- `DESLOPPIFY_ROVODEV_EXECUTABLE=acli` overrides the binary name (useful when `acli` is shipped under a different name in CI).

#### Manual subagent path

If you prefer to drive batches from inside an existing Rovo Dev session, use the manual subagent flow:

1. Prepare review prompts and the blind packet:
   ```bash
   desloppify review --run-batches --dry-run
   ```
   This generates one prompt file per batch in
   `.desloppify/subagents/runs/<run-id>/prompts/` and prints the run directory.

2. Note the run id printed by step 1 (e.g. `20260509_122030`). Replace
   `<run-id>` in the paths below with that real value before invoking —
   subagents do not share the parent's context, so passing the
   placeholder verbatim will leave them unable to find the prompt or
   know where to write their output.

3. Launch Rovo Dev subagents in groups (Rovo Dev currently caps
   `invoke_subagents` at 4 per call) using `invoke_subagents`,
   passing one task per batch. Each subagent should:
   - read its prompt file at
     `.desloppify/subagents/runs/<run-id>/prompts/batch-N.md`
   - read `.desloppify/review_packet_blind.json`
   - inspect the repository as instructed by the prompt's dimension list
   - write ONLY valid JSON to
     `.desloppify/subagents/runs/<run-id>/results/batch-N.raw.txt`

   Example invocation (with `<run-id>` already substituted):
   ```
   invoke_subagents(
     subagent_names=["General Purpose", "General Purpose", "General Purpose"],
     task_names=["review-batch-1", "review-batch-2", "review-batch-3"],
     task_descriptions=[
       "Review batch 1. Read .desloppify/subagents/runs/20260509_122030/prompts/batch-1.md, follow it exactly, inspect the repository, and write ONLY valid JSON to .desloppify/subagents/runs/20260509_122030/results/batch-1.raw.txt. Do not edit repository source files.",
       "Review batch 2. ...",
       "Review batch 3. ..."
     ],
   )
   ```

   Repeat the call in groups respecting Rovo Dev's per-call cap (e.g.
   batches 1-4, then 5-8, ...). Wait for each group to finish before
   launching the next.

4. After every prompt for the run has a matching result file, import them
   (using the same real run id):
   ```bash
   desloppify review --import-run .desloppify/subagents/runs/<run-id> --scan-after-import
   ```

### Key constraints

- `invoke_subagents` only applies to the manual fallback path; it does NOT
  cap the native `--runner rovodev` pipeline (each batch is its own
  subprocess, throttled by `--max-parallel-batches`).
- Per-call `invoke_subagents` concurrency is bounded by Rovo Dev itself
  (currently up to 4 subagents per call). Check `/help invoke_subagents`
  if you suspect the limit has changed.
- Subagents do not inherit parent conversation context — the prompt file and
  the blind packet must contain everything they need.
- Subagents must consume `.desloppify/review_packet_blind.json` (not full
  `query.json`) to avoid score anchoring.
- The importer expects `results/batch-N.raw.txt` files, not `.json` filenames.
- The blind packet intentionally omits score history to prevent anchoring bias.

### Triage workflow

#### Native triage runner (recommended)

Use the first-class `--runner rovodev` to drive the full staged triage
pipeline (strategize → observe → reflect → organize → enrich → sense-check
→ commit) via `acli rovodev run` subprocesses:

```bash
desloppify plan triage --run-stages --runner rovodev
```

Useful flags:

- `--only-stages observe,reflect` runs a subset of stages.
- `--dry-run` prints prompts only.
- `--stage-timeout-seconds N` overrides the per-stage timeout.

Each stage's prompt, output, log, and run summary land under
`.desloppify/triage_runs/<timestamp>/`; rerunning resumes from the last
confirmed stage. The `runner` field in `run_summary.json` is set to
`"rovodev"` for provenance.

The same `DESLOPPIFY_ROVODEV_*` environment overrides documented for the
review runner above (`DESLOPPIFY_ROVODEV_NO_YOLO`,
`DESLOPPIFY_ROVODEV_OUTPUT_SCHEMA`, `DESLOPPIFY_ROVODEV_EXTRA_ARGS`,
`DESLOPPIFY_ROVODEV_EXECUTABLE`) apply to triage stages too.

#### Manual stage-prompt path

If you prefer to drive triage from inside an existing Rovo Dev session,
run each stage by hand:

1. Get the stage prompt: `desloppify plan triage --stage-prompt <stage>`
2. If the stage benefits from parallel review work, fan it out with
   `invoke_subagents` (in groups respecting Rovo Dev's per-call cap);
   otherwise run the stage directly in the parent session.
3. Confirm the stage: `desloppify plan triage --confirm <stage> --attestation "..."`
4. Complete: `desloppify plan triage --complete --strategy "..." --attestation "..."`

### Atlassian context

Rovo Dev ships with first-class Atlassian (Jira / Confluence / Bitbucket)
tooling. When triaging or planning desloppify work, you can pull related
Jira issues, design docs, or PR history via the built-in Atlassian MCP
toolset, or load the `full-context-mode` skill via the `/full-context`
slash command for guided organisational research — no extra setup
required.

<!-- desloppify-overlay: rovodev -->
<!-- desloppify-end -->
````

## File: docs/scoring.md
````markdown
# How Scoring Works

Desloppify computes a **health score** from 0 to 100 that measures the overall quality of your codebase. A score of 100 means no known issues; lower scores reflect detected problems weighted by their severity and certainty.

## Two pools: mechanical and subjective

The overall health score blends two independent pools of dimensions:

| Pool | Weight | Source |
|------|--------|--------|
| **Mechanical** | 25% | Automated detectors (code smells, duplication, security, etc.) |
| **Subjective** | 75% | AI code review assessments (architecture, elegance, contracts, etc.) |

If no subjective reviews have been run yet, the score is 100% mechanical. Once subjective dimensions have scores, the 25/75 split applies.

Within each pool, dimensions are averaged using their own configured weights (see below).

## Mechanical dimensions

Mechanical dimensions are scored by automated detectors. Each detector scans your codebase and counts a **potential** (total checks performed) and **failures** (issues found). The dimension score is:

    dimension_score = ((potential - weighted_failures) / potential) * 100

Detectors are grouped into dimensions based on what they measure:

| Dimension | Pool weight | Detectors |
|-----------|-------------|-----------|
| **File health** | 2.0 | structural |
| **Code quality** | 1.0 | unused, logs, exports, smells, orphaned, flat_dirs, naming, single_use, coupling, facade, props, react, nextjs, next_lint, patterns, dict_keys, deprecated, stale_exclude, clippy_warning, cargo_error, rust_import_hygiene, rust_feature_hygiene, rust_api_convention, rust_error_boundary, rust_future_proofing, rust_async_locking, rust_drop_safety, rust_unsafe_api, global_mutable_config, private_imports, layer_violation, responsibility_cohesion |
| **Duplication** | 1.0 | dupes, boilerplate_duplication |
| **Test health** | 1.0 | test_coverage, rustdoc_warning, rust_doctest, rust_thread_safety |
| **Security** | 1.0 | cycles, security |

**Note:** Not every detector listed above will fire in every project. Detectors are language-specific -- Rust detectors only run on Rust codebases, React/Next.js detectors only on TypeScript projects with those frameworks, etc. Only detectors with a non-zero potential (i.e., they found something to check) contribute to a dimension's score.

### Sample dampening

Dimensions with fewer than 200 checks get their weight reduced proportionally. A dimension with 50 checks contributes at 25% of its configured weight. This prevents a dimension with only a handful of checks from having outsized influence.

## Subjective dimensions

Subjective dimensions come from AI code review (`desloppify review`). Each dimension receives a score from 0 to 100 based on the reviewer's assessment.

The subjective dimensions and their weights within the subjective pool:

| Dimension | Weight |
|-----------|--------|
| High elegance | 22.0 |
| Mid elegance | 22.0 |
| Low elegance | 12.0 |
| Contracts | 12.0 |
| Type safety | 12.0 |
| Design coherence | 10.0 |
| Abstraction fit | 8.0 |
| Logic clarity | 6.0 |
| Structure nav | 5.0 |
| Error consistency | 3.0 |
| Naming quality | 2.0 |
| AI generated debt | 1.0 |

Elegance, contracts, and type safety dominate because they reflect architectural quality and correctness. Naming quality and AI-generated debt are low-weight nudges for polish.

## How confidence affects scoring

Each detected issue has a confidence level that determines how heavily it counts as a failure:

| Confidence | Weight |
|------------|--------|
| High | 1.0 |
| Medium | 0.7 |
| Low | 0.3 |

A low-confidence issue pulls the score down only 30% as much as a high-confidence one. This means uncertain detections have a lighter touch on your score.

## Lenient vs. strict scoring

Desloppify tracks two score variants:

- **Lenient (default):** `open`, `deferred`, and `triaged_out` issues count as failures. Issues you mark as `wontfix`, `fixed`, `false_positive`, or `auto_resolved` do not penalize the score.
- **Strict:** `wontfix` and `auto_resolved` issues also count as failures, in addition to everything in lenient. This reveals the "true debt" you have accepted.

The gap between lenient and strict scores shows how much technical debt you are carrying via `wontfix` decisions.

## Zone filtering

Not all files are scored equally. Files are classified into zones, and most non-production zones are excluded from the health score:

- **Production** and **script** zones: scored
- **Test**, **config**, **generated**, and **vendor** zones: excluded from scoring

Issues in your test files, generated code, or vendored dependencies do not drag down your health score.

## File-based detectors

Some detectors (smells, dict_keys, test_coverage, security, concerns, review, nextjs, next_lint) use file-based scoring. Instead of counting individual issues against a raw potential, failures are capped per file so that a single problematic file cannot overwhelm the score. A file with 1-2 issues contributes up to 1.0 failure units, 3-5 issues up to 1.5, and 6+ issues up to 2.0.

## What the score does NOT measure

- The health score does not measure feature completeness, performance, or user experience.
- Scores from different codebases are not directly comparable. A score of 85 on a 500-file project means something different than 85 on a 50-file project.
- The score is a tracking tool for improvement over time, not an absolute quality rating.
````

## File: docs/SKILL.md
````markdown
---
name: desloppify
description: >
  Multi-language codebase health scanner. Use when the user explicitly asks
  to run desloppify, scan for technical debt, get a health score, or create
  a cleanup plan. Do NOT trigger for general code review, renaming, or
  fixing individual bugs.
---

<!-- desloppify-begin -->
<!-- desloppify-skill-version: 7 -->

# Desloppify

## 1. Your Job

Maximise the **strict score** honestly. Your main cycle: **scan → plan → execute → rescan**. Follow the scan output's **INSTRUCTIONS FOR AGENTS** — don't substitute your own analysis.

**Don't be lazy.** Do large refactors and small detailed fixes with equal energy. If it takes touching 20 files, touch 20 files. If it's a one-line change, make it. No task is too big or too small — fix things properly, not minimally.

## 2. The Workflow

Three phases, repeated as a cycle.

### Monorepos and multi-project directories

If the workspace contains multiple programs (e.g., frontend + backend in sibling folders), scan each one separately — do not scan the parent directory:

```bash
desloppify --lang typescript scan --path ./frontend
desloppify --lang python scan --path ./backend
```

Each `--path` target should be a single coherent project. Scanning a parent that contains multiple programs mixes state and path context, producing unreliable results.

### Phase 1: Scan and review — understand the codebase

```bash
desloppify scan --path .       # analyse the codebase
desloppify status              # check scores — are we at target?
```

After scanning, **always run `desloppify next`** — it tells you exactly what to do, in order. Don't interpret the scan output yourself or ask the user what to do. Just run `next` and follow its instructions.

The scan will tell you if subjective dimensions need review. Follow its instructions. To trigger a review manually:
```bash
desloppify review --prepare    # then follow your runner's review workflow
```

### Phase 2: Plan — decide what to work on

After reviews, triage stages and plan creation appear in the execution queue surfaced by `next`. Complete them in order — `next` tells you what each stage expects in the `--report`:
```bash
desloppify next                                        # shows the next execution workflow step
desloppify plan triage --stage observe --report "themes and root causes..."
desloppify plan triage --stage reflect --report "comparison against completed work..."
desloppify plan triage --stage organize --report "summary of priorities..."
desloppify plan triage --complete --strategy "execution plan..."
```

For automated triage: `desloppify plan triage --run-stages --runner codex` (Codex), `--runner claude` (Claude), or `--runner rovodev` (Rovo Dev). Options: `--only-stages`, `--dry-run`, `--stage-timeout-seconds`.

Then shape the queue. **The plan shapes everything `next` gives you** — `next` is the execution queue, not the full backlog. Don't skip this step.

```bash
desloppify plan                          # see the living plan details
desloppify plan queue                    # compact execution queue view
desloppify plan reorder <pat> top        # reorder — what unblocks the most?
desloppify plan cluster create <name>    # group related issues to batch-fix
desloppify plan focus <cluster>          # scope next to one cluster
desloppify plan skip <pat>              # defer — hide from next
```

### Phase 3: Execute — grind the queue to completion

Trust the plan and execute. Don't rescan mid-queue — finish the queue first.

**Branch first.** Create a dedicated branch — never commit health work directly to main:
```bash
git checkout -b desloppify/code-health    # or desloppify/<focus-area>
desloppify config set commit_pr 42        # link a PR for auto-updated descriptions
```

**The loop:**
```bash
# 1. Get the next item from the execution queue
desloppify next

# 2. Fix the issue in code

# 3. Resolve it (next shows the exact command including required attestation)

# 4. When you have a logical batch, commit and record
git add <files> && git commit -m "desloppify: fix 3 deferred_import findings"
desloppify plan commit-log record      # moves findings uncommitted → committed, updates PR

# 5. Push periodically
git push -u origin desloppify/code-health

# 6. Repeat until the queue is empty
```

Score may temporarily drop after fixes — cascade effects are normal, keep going.
If `next` suggests an auto-fixer, run `desloppify autofix <fixer> --dry-run` to preview, then apply.

**When the queue is clear, go back to Phase 1.** New issues will surface, cascades will have resolved, priorities will have shifted. This is the cycle.

## 3. Reference

### Key concepts

- **Tiers**: T1 auto-fix → T2 quick manual → T3 judgment call → T4 major refactor.
- **Auto-clusters**: related findings are auto-grouped in `next`. Drill in with `next --cluster <name>`.
- **Zones**: production/script (scored), test/config/generated/vendor (not scored). Fix with `zone set`.
- **Wontfix cost**: widens the lenient↔strict gap. Challenge past decisions when the gap grows.

### Scoring

Overall score = **25% mechanical** + **75% subjective**.

- **Mechanical (25%)**: auto-detected issues — duplication, dead code, smells, unused imports, security. Fixed by changing code and rescanning.
- **Subjective (75%)**: design quality review — naming, error handling, abstractions, clarity. Starts at **0%** until reviewed. The scan will prompt you when a review is needed.
- **Strict score** is the north star: wontfix items count as open. The gap between overall and strict is your wontfix debt.
- **Score types**: overall (lenient), strict (wontfix counts), objective (mechanical only), verified (confirmed fixes only).

### Reviews

Four paths to get subjective scores:

- **Local runner (Codex)**: `desloppify review --run-batches --runner codex --parallel --scan-after-import` — automated end-to-end.
- **Local runner (Claude)**: `desloppify review --prepare` → launch parallel subagents → `desloppify review --import merged.json` — see skill doc overlay for details.
- **Local runner (Rovo Dev)**: `desloppify review --run-batches --runner rovodev --parallel --scan-after-import` — automated end-to-end via `acli rovodev run` subprocesses.
- **Cloud/external**: `desloppify review --external-start --external-runner claude` → follow session template → `--external-submit`.
- **Manual path**: `desloppify review --prepare` → review per dimension → `desloppify review --import file.json`.

**Batch output vs import filenames:** Individual batch outputs from subagents must be named `batch-N.raw.txt` (plain text/JSON content, `.raw.txt` extension). The `.json` filenames in `--import merged.json` or `--import findings.json` refer to the final merged import file, not individual batch outputs. Do not name batch outputs with a `.json` extension.

**Subagent parallelism limit:** Do not launch every review batch at once. Run subagents in small waves, usually **3-5 concurrent agents**, and wait for a wave to finish before starting the next. If agents return empty, partial, or rate-limit-shaped results, reduce the wave size and retry only failed batches. Launching 20+ subagents at once can exhaust API quota and produce no usable review output.

- Import first, fix after — import creates tracked state entries for correlation.
- Target-matching scores trigger auto-reset to prevent gaming. Use the blind-review workflow described in your agent overlay doc (e.g. `docs/CLAUDE.md`, `docs/HERMES.md`).
- Even moderate scores (60-80) dramatically improve overall health.
- Stale dimensions auto-surface in `next` — just follow the queue.

**Integrity rules:** Score from evidence only — no prior chat context, score history, or target-threshold anchoring. When evidence is mixed, score lower and explain uncertainty. Assess every requested dimension; never drop one.

#### Review output format

Return machine-readable JSON for review imports. For `--external-submit`, include `session` from the generated template:

```json
{
  "session": {
    "id": "<session_id_from_template>",
    "token": "<session_hmac_from_template>"
  },
  "assessments": {
    "<dimension_from_query>": 0
  },
  "findings": [
    {
      "dimension": "<dimension_from_query>",
      "identifier": "short_id",
      "summary": "one-line defect summary",
      "related_files": ["relative/path/to/file.py"],
      "evidence": ["specific code observation"],
      "suggestion": "concrete fix recommendation",
      "confidence": "high|medium|low"
    }
  ]
}
```

`findings` MUST match `query.system_prompt` exactly (including `related_files`, `evidence`, and `suggestion`). Use `"findings": []` when no defects found. Import is fail-closed: invalid findings abort unless `--allow-partial` is passed. Assessment scores are auto-applied from trusted internal or cloud session imports. Legacy `--attested-external` remains supported.

#### Import paths

- Robust session flow (recommended): `desloppify review --external-start --external-runner claude` → use generated prompt/template → run printed `--external-submit` command.
- Durable scored import (legacy): `desloppify review --import findings.json --attested-external --attest "I validated this review was completed without awareness of overall score and is unbiased."`
- Findings-only fallback: `desloppify review --import findings.json`

#### Reviewer agent prompt

Runners that support agent definitions (Cursor, Copilot, Gemini) can create a dedicated reviewer agent. Use this system prompt:

```
You are a code quality reviewer. You will be given a codebase path, a set of
dimensions to score, and what each dimension means. Read the code, score each
dimension 0-100 from evidence only, and return JSON in the required format.
Do not anchor to target thresholds. When evidence is mixed, score lower and
explain uncertainty.
```

See your editor's overlay section below for the agent config format.

### Plan commands

```bash
desloppify plan reorder <cluster> top       # move all cluster members at once
desloppify plan reorder <a> <b> top        # mix clusters + findings in one reorder
desloppify plan reorder <pat> before -t X  # position relative to another item/cluster
desloppify plan cluster reorder a,b top    # reorder multiple clusters as one block
desloppify plan resolve <pat>              # mark complete
desloppify plan reopen <pat>               # reopen
desloppify backlog                          # broader non-execution backlog
```

### Commit tracking

```bash
desloppify plan commit-log                      # see uncommitted + committed status
desloppify plan commit-log record               # record HEAD commit, update PR description
desloppify plan commit-log record --note "why"  # with rationale
desloppify plan commit-log record --only "smells::*"  # record specific findings only
desloppify plan commit-log history              # show commit records
desloppify plan commit-log pr                   # preview PR body markdown
desloppify config set commit_tracking_enabled false  # disable guidance
```

After resolving findings as `fixed`, the tool shows uncommitted work, committed history, and a suggested commit message. After committing externally, run `record` to move findings from uncommitted to committed and auto-update the linked PR description.

### Agent directives

Directives are messages shown to agents at lifecycle phase transitions — use them to switch models, set constraints, or give context-specific instructions.

```bash
desloppify directives                     # show all configured directives
desloppify directives set execute "Switch to claude-sonnet-4-6. Focus on speed."
desloppify directives set triage "Switch to claude-opus-4-6. Read carefully."
desloppify directives set review "Use blind packet. Do not anchor on previous scores."
desloppify directives unset execute       # remove a directive
```

Available phases: `execute`, `review`, `triage`, `workflow`, `scan` (and fine-grained variants like `review_initial`, `triage_postflight`, etc.).

### Quick reference

```bash
desloppify next --count 5                         # top 5 execution items
desloppify next --cluster <name>                  # drill into a cluster
desloppify backlog --count 5                      # top 5 backlog items outside execution
desloppify show <pattern>                         # filter by file/detector/ID
desloppify show --status open                     # all open findings
desloppify plan skip --permanent "<id>" --note "reason" --attest "..." # accept debt
desloppify exclude <path>                         # exclude a directory from scanning
desloppify config show                            # show all config including excludes
desloppify scan --path . --reset-subjective       # reset subjective baseline to 0
```

## 4. Fix Tool Issues Upstream

When desloppify itself appears wrong or inconsistent — a bug, a bad detection, a crash, confusing output — **fix it and open a PR**. If you can't confidently fix it, file an issue instead.

### Fix and PR (preferred)

Clone the tool repo to a temp directory, make the fix there, and verify it works against the project you're scanning before pushing.

```bash
git clone https://github.com/peteromallet/desloppify.git /tmp/desloppify-fix
cd /tmp/desloppify-fix
git checkout -b fix/<short-description>
```

Make your changes, then run the test suite and verify the fix against the original project:

```bash
python -m pytest desloppify/tests/ -q
python -m desloppify scan --path <project-root>   # the project you were scanning
```

Once it looks good, push and open a PR:

```bash
git add <files> && git commit -m "fix: <what and why>"
git push -u origin fix/<short-description>
gh pr create --title "fix: <short description>" --body "$(cat <<'EOF'
## Problem
<what went wrong — include the command and output>

## Fix
<what you changed and why>
EOF
)"
```

Clean up after: `rm -rf /tmp/desloppify-fix`

### File an issue (fallback)

If the fix is unclear or the change needs discussion, open an issue at `https://github.com/peteromallet/desloppify/issues` with a minimal repro: command, path, expected output, actual output.

## Prerequisite

`command -v desloppify >/dev/null 2>&1 && echo "desloppify: installed" || echo "NOT INSTALLED — run: uvx --from git+https://github.com/peteromallet/desloppify.git desloppify"`

If `uvx` is not available: `pip install desloppify[full] && desloppify setup`

<!-- desloppify-end -->
````

## File: docs/WINDSURF.md
````markdown
## Windsurf Overlay

Windsurf does not support spawning subagents from within a Cascade session.
If not using the batch runner, parallel reviews require the user to open
multiple Cascade panes manually.

### Review workflow

1. Run `desloppify review --prepare` to generate `query.json`.
2. Ask the user to open additional Cascade panes for parallel review.
   Suggest splitting dimensions across 2-3 panes (e.g., naming + clarity
   in one, abstraction + error consistency in another).
3. Each pane scores its assigned dimensions independently, reading
   the codebase and `query.json`'s `dimension_prompts` for context.
4. Each pane writes output to `results/batch-N.raw.txt` (matching the batch index).
5. In the primary pane, merge assessments and findings, then import.

If the user prefers a single-pane workflow, review all dimensions sequentially
in one session.

<!-- desloppify-overlay: windsurf -->
<!-- desloppify-end -->
````

## File: pyproject.toml
````toml
[build-system]
requires = ["setuptools>=68.0"]
build-backend = "setuptools.build_meta"

[project]
name = "desloppify"
version = "1.0"
description = "Multi-language codebase health scanner and technical debt tracker"
readme = "README.md"
requires-python = ">=3.11"
license = {text = "OSNL-0.2"}
authors = [
    {name = "Peter O'Malley", email = "pom@banodoco.ai"},
]
keywords = ["code-quality", "technical-debt", "linter", "static-analysis", "refactoring"]
classifiers = [
    "Development Status :: 5 - Production/Stable",
    "Environment :: Console",
    "Intended Audience :: Developers",

    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
    "Programming Language :: Python :: 3.13",
    "Topic :: Software Development :: Quality Assurance",
    "Topic :: Software Development :: Testing",
    "Typing :: Typed",
]
dependencies = []

[project.urls]
Homepage = "https://github.com/peteromallet/desloppify"
Repository = "https://github.com/peteromallet/desloppify"
Issues = "https://github.com/peteromallet/desloppify/issues"

[project.optional-dependencies]
treesitter = [
  "tree-sitter>=0.21",
  "tree-sitter-language-pack>=0.3,<1.8",
]
csharp-xml = ["defusedxml>=0.7.0"]
python-security = ["bandit>=1.7.8"]
scorecard = ["Pillow>=9.0.0"]
plan-yaml = ["PyYAML>=6.0"]
full = [
  "defusedxml>=0.7.0",
  "tree-sitter>=0.21",
  "tree-sitter-language-pack>=0.3,<1.8",
  "bandit>=1.7.8",
  "Pillow>=9.0.0",
  "PyYAML>=6.0",
]

[project.scripts]
desloppify = "desloppify.cli:main"

[tool.setuptools.packages.find]
include = ["desloppify*"]
exclude = ["desloppify.tests", "desloppify.tests.*"]

[tool.setuptools]
include-package-data = false

[tool.setuptools.package-data]
"desloppify.app.output" = ["_viz_template.html"]
"desloppify.data.global" = ["*.md"]
"desloppify.languages._framework" = ["review_data/*.json"]
"desloppify.languages.python" = ["review_data/*.json"]
"desloppify.languages.typescript" = ["review_data/*.json"]
"desloppify.languages.csharp" = ["review_data/*.json"]
"desloppify.languages.cxx" = ["review_data/*.json"]
"desloppify.languages.dart" = ["review_data/*.json"]
"desloppify.languages.gdscript" = ["review_data/*.json"]
"desloppify.languages.go" = ["review_data/*.json"]
"desloppify.languages.rust" = ["review_data/*.json"]

[tool.pytest.ini_options]
pythonpath = ["."]
testpaths = ['desloppify/tests', 'desloppify/languages/python/tests', 'desloppify/languages/typescript/tests', 'desloppify/languages/csharp/tests', 'desloppify/languages/cxx/tests', 'desloppify/languages/dart/tests', 'desloppify/languages/gdscript/tests', 'desloppify/languages/go/tests', 'desloppify/languages/rust/tests', 'desloppify/languages/javascript/tests']
norecursedirs = ["desloppify/tests/fixtures"]

[tool.ruff]
target-version = "py311"
line-length = 88

[tool.ruff.lint]
select = ["E", "F", "I", "B", "UP"]
ignore = ["E501"]

[tool.mypy]
python_version = "3.11"
warn_unused_configs = true
warn_redundant_casts = true
warn_unreachable = true
show_error_codes = true
strict_optional = true
ignore_missing_imports = true
follow_imports = "skip"
pretty = true
files = [
  "desloppify/app/commands/review/cmd.py",
  "desloppify/app/commands/review/prepare.py",
  "desloppify/app/commands/review/batch/core_models.py",
  "desloppify/app/commands/review/batch/core_parse.py",
  "desloppify/app/commands/review/batch/core_normalize.py",
  "desloppify/app/commands/review/batch/core_merge_support.py",
  "desloppify/app/commands/review/batch/orchestrator.py",
  "desloppify/app/commands/review/importing/cmd.py",
  "desloppify/app/commands/review/runtime/__init__.py",
  "desloppify/app/commands/scan/reporting/dimensions.py",
  "desloppify/app/commands/scan/reporting/summary.py",
  "desloppify/app/commands/scan/reporting/presentation.py",
  "desloppify/app/commands/scan/reporting/subjective.py",
  "desloppify/app/commands/scan/workflow.py",
  "desloppify/app/cli_support/parser.py",
  "desloppify/app/cli_support/parser_groups.py",
]
````

## File: README.md
````markdown
# Desloppify - an agent harness to make your codebase 🤌

[![PyPI version](https://img.shields.io/pypi/v/desloppify)](https://pypi.org/project/desloppify/) ![Python 3.11+](https://img.shields.io/badge/python-3.11%2B-blue)

Desloppify gives your AI coding agent the tools to identify, understand, and systematically improve codebase quality. It combines mechanical detection (dead code, duplication, complexity) with subjective LLM review (naming, abstractions, module boundaries), then works through a prioritized fix loop. State persists across scans so it chips away over multiple sessions, and the scoring is designed to resist gaming.

<img src="assets/explained.png" width="100%">

The score gives your agent a north-star, and the tooling helps it plan, execute, and resolve issues until it hits your target — with a lot of tricks to keep it on track. A score above 98 should correlate with a codebase a seasoned engineer would call beautiful.

That score generates a scorecard badge for your GitHub profile or README:

<img src="assets/scorecard.png" width="100%">

Currently supports 29 languages — full plugin depth for TypeScript, Python, C#, C++, Dart, GDScript, Go, and Rust; generic linter + tree-sitter support for Ruby, Java, Kotlin, and 18 more. For C++ projects, `compile_commands.json` is the primary analysis path and `Makefile` repositories fall back to best-effort local include scanning.

## For your agent's consideration...

Paste this prompt into your agent:

```
I want you to improve the quality of this codebase. To do this, install and run desloppify.
Run ALL of the following (requires Python 3.11+):

pip install --upgrade "desloppify[full]"
desloppify update-skill claude    # installs the full workflow guide — pick yours: claude, cursor, codex, copilot, droid, windsurf, gemini, rovodev

Add .desloppify/ to your .gitignore — it contains local state that shouldn't be committed.

Before scanning, check for directories that should be excluded (vendor, build output,
generated code, worktrees, etc.) and exclude obvious ones with `desloppify exclude <path>`.
Share any questionable candidates with me before excluding.

desloppify scan --path .
desloppify next

--path is the directory to scan (use "." for the whole project, or "src/" etc).

Your goal is to get the strict score as high as possible. The scoring resists gaming — the
only way to improve it is to actually make the code better.

THE LOOP: run `next`. It is the execution queue from the living plan, not the whole backlog.
It tells you what to fix now, which file, and the resolve command to run when done.
Fix it, resolve it, run `next` again. Over and over. This is your main job.

Use `desloppify backlog` only when you need to inspect broader open work that is not currently
driving execution.

Don't be lazy. Large refactors and small detailed fixes — do both with equal energy. No task
is too big or too small. Fix things properly, not minimally.

Use `plan` / `plan queue` to reorder priorities or cluster related issues. Rescan periodically.
The scan output includes agent instructions — follow them, don't substitute your own analysis.
```

## Monorepos and multi-project directories

If your workspace contains multiple programs (e.g., a frontend and backend in sibling directories), scan each one separately with `--path`:

```bash
desloppify --lang typescript scan --path ./frontend
desloppify --lang python scan --path ./backend
```

Scanning the parent directory that contains both will mix state and path context across unrelated codebases, producing unreliable results. Each `--path` target should be a single coherent project. Desloppify maintains separate state per language, so you can scan a TypeScript frontend and a Python backend from the same workspace without conflict — just target them individually.

## CI

Desloppify works best in CI as a full-codebase health gate, not as a diff-only linter. Run the CI profile against the same coherent project path you scan locally:

```bash
desloppify scan --path . --profile ci --no-badge
desloppify status --json
```

`--profile ci` skips slow and subjective phases and bypasses the mid-cycle scan queue gate so a CI job can collect a fresh mechanical snapshot. Use `status --json` if you want a script to read the strict/objective scores and enforce your own threshold.

On constrained Java CI runners, the PMD detector defaults to `--threads 0` to avoid worker-thread fanout. Set `DESLOPPIFY_PMD_THREADS` to a PMD thread value such as `2` or `0.5C` if you want more throughput.

Minimal GitHub Actions example:

```yaml
name: desloppify

on:
  pull_request:
  push:
    branches: [main]

jobs:
  health:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install --upgrade "desloppify[full]"
      - run: desloppify scan --path . --profile ci --no-badge
      - run: desloppify status --json
```

For monorepos, run one job or matrix entry per project path instead of scanning the workspace root. True incremental or diff-only scanning is not the supported model yet; compare full-codebase results across runs or enforce a project-level threshold.

## How it works

```
scan ──→ score ──→ review ──→ triage ──→ execute ──→ rescan
  │         │         │          │          │           │
  │     dimensions    │     prioritize    fix it     verify
  │     scored      LLM reviews  & cluster  & resolve  improvements
  │                 subjective   the queue
  │                 quality
  detectors find
  mechanical issues
  (dead code, smells,
  test gaps, etc.)
```

**Scan** runs mechanical detectors across your codebase — dead code, duplication, complexity, test coverage gaps, naming issues, and more. Each issue is scored by dimension (File health, Code quality, Test health, etc.).

**Review** uses an LLM to assess subjective quality dimensions — naming, abstractions, error handling patterns, module boundaries. These score alongside the mechanical dimensions.

**Triage** is where prioritization happens. The agent (or you) observes the findings, reflects on patterns, organizes issues into clusters, and enriches them with implementation detail. This produces an ordered execution queue — only items explicitly queued appear in `next`. Before triage, all mechanical issues are visible in the queue sorted by impact, which can be noisy.

**Execute** is the fix loop: `next` → fix → `resolve` → `next`. Items come from the triaged queue. Autofix handles what it can; the rest needs manual or agent work.

**Rescan** verifies improvements, catches cascading effects, and feeds the next cycle.

State persists in `.desloppify/` so progress carries across sessions. The scoring resists gaming — wontfix items widen the gap between lenient and strict scores, and re-reviewing dimensions can lower scores if the reviewer finds new issues.

## From Vibe Coding to Vibe Engineering

Vibe coding gets things built fast. But the codebases it produces tend to rot in ways that are hard to see and harder to fix — not just the mechanical stuff like dead imports, but the structural kind. Abstractions that made sense at first stop making sense. Naming drifts. Error handling is done three different ways. The codebase works, but working in it gets worse over time.

LLMs are actually good at spotting this now, if you ask them the right questions. That's the core bet here — that an agent with the right framework can hold a codebase to a real standard, the kind that used to require a senior engineer paying close attention over months.

So we're trying to define what "good" looks like as a score that's actually worth optimizing. Not a lint score you game to 100 by suppressing warnings. Something where improving the number means the codebase genuinely got better. That's hard, and we're not done, but the anti-gaming stuff matters to us a lot — it's the difference between a useful signal and a vanity metric.

The hope is that anyone can use this to build something a seasoned engineer would look at and respect. That's the bar we're aiming for.

If you'd like to join a community of vibe engineers who want to build beautiful things, [come hang out](https://discord.gg/aZdzbZrHaY).

<img src="assets/engineering.png" width="100%">

---

Issues, improvements, and PRs are hugely appreciated — [github.com/peteromallet/desloppify](https://github.com/peteromallet/desloppify).

Desloppify is free for any individual — whether working independently or at a company — to use for their own work. It is also free for open source companies to use in any capacity, including commercial. Non-open source companies who wish to commercialize it should refer to the [LICENSE](LICENSE) for transparent pricing details.
````
