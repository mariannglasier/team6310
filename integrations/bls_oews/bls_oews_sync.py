"""Synchronize BLS OEWS Atlanta median hourly wages into draft public.jobs rows.

Run from the repository root:

    python -m integrations.bls_oews.bls_oews_sync --dry-run

Safety rules enforced here (and covered by tests):
  * only median_hourly_wage, wage_year, wage_source_url and last_synced_at are written;
  * only draft content versions are written; published versions are cloned into a new
    draft (jobs only) and never modified;
  * is_approved / is_active / reviewed_at and every CAC-authored field are untouched;
  * rows are matched by (version_id, soc_code) and never inserted into an existing version;
  * an occupation without a valid Atlanta median wage is logged and left unchanged;
  * unchanged values are not rewritten, so repeated runs make no changes.
"""

from __future__ import annotations

import argparse
import os
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any, Callable, Mapping

from . import config
from .sources import SourceError, SourceResult, _default_post, fetch_from_api, fetch_from_file
from .supabase_client import (
    ConfigError,
    DatabaseError,
    JobsStore,
    SupabaseClient,
    missing_credentials,
)
from .validate import validate_result

EXIT_OK, EXIT_DATA_ERRORS, EXIT_CONFIG, EXIT_RUNTIME = 0, 1, 2, 3


class ProtectedContentError(RuntimeError):
    """An attempt was made to write to published or otherwise non-draft content."""


@dataclass
class Options:
    dry_run: bool = False
    file: Path | None = None
    year: int | None = None
    version_id: str | None = None
    source_url: str = config.DEFAULT_FILE_SOURCE_URL
    summary_file: Path | None = None


@dataclass
class RowResult:
    soc_code: str
    title: str
    stored_wage: Decimal | None
    new_wage: Decimal | None
    status: str  # update | unchanged | skipped | missing_job | proposed
    note: str = ""


@dataclass
class Report:
    dry_run: bool
    source: str = ""
    release_year: int | None = None
    target_version: str = ""
    cloned_from: str = ""
    created_version_number: int | None = None
    rows: list[RowResult] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)

    @property
    def changes(self) -> list[RowResult]:
        return [r for r in self.rows if r.status == "update"]

    @property
    def exit_code(self) -> int:
        return EXIT_DATA_ERRORS if self.errors else EXIT_OK


def _to_decimal(value: Any) -> Decimal | None:
    return None if value is None else Decimal(str(value))


def assert_writable(version: Mapping[str, Any]) -> None:
    if version.get("status") != "draft" or version.get("published_at"):
        raise ProtectedContentError(
            f"Content version {version.get('version_number')} is {version.get('status')!r}; "
            "published content is immutable and will not be modified"
        )


def resolve_target(
    versions: list[dict[str, Any]], requested_id: str | None
) -> tuple[dict[str, Any], dict[str, Any] | None]:
    """Return (source_version, writable_draft_or_None).

    If the requested/latest version is a draft it is the target. Otherwise a newer
    existing draft is reused; if none exists the caller must stage a new draft.
    """
    if not versions:
        raise DatabaseError("No content versions exist")
    ordered = sorted(versions, key=lambda v: v["version_number"], reverse=True)
    if requested_id:
        matches = [v for v in ordered if v["version_id"] == requested_id]
        if not matches:
            raise DatabaseError(f"Content version {requested_id} was not found")
        source = matches[0]
    else:
        source = ordered[0]
    if source["status"] == "draft" and not source.get("published_at"):
        return source, source
    newer_drafts = [
        v for v in ordered
        if v["version_number"] > source["version_number"] and v["status"] == "draft"
    ]
    return source, (newer_drafts[0] if newer_drafts else None)


def run(
    opts: Options,
    env: Mapping[str, str],
    *,
    client: JobsStore | None = None,
    now: datetime | None = None,
    post: Callable[[str, dict[str, Any]], dict[str, Any]] = _default_post,
) -> Report:
    now = now or datetime.now(timezone.utc)
    report = Report(dry_run=opts.dry_run)

    # Credentials first: a live run must fail visibly before doing any work.
    if client is None:
        if missing_credentials(env):
            if not opts.dry_run:
                SupabaseClient.from_env(env)  # raises ConfigError with a clear message
        else:
            client = SupabaseClient.from_env(env)

    if opts.file:
        result: SourceResult = fetch_from_file(opts.file, year=opts.year, source_url=opts.source_url)
    else:
        result = fetch_from_api(
            api_key=(env.get("BLS_API_KEY") or "").strip() or None,
            current_year=now.year,
            post=post,
        )
    report.source = result.description
    report.release_year = result.year

    valid, errors = validate_result(result, now.year)
    report.errors.extend(errors)
    for obs in result.observations.values():
        if obs.warning:
            report.warnings.append(f"{obs.soc_code}: {obs.warning}")

    if client is None:
        report.notes.append(
            "Database comparison skipped: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set (dry-run only)."
        )
        for soc, title in config.OCCUPATIONS.items():
            obs = valid.get(soc)
            report.rows.append(
                RowResult(soc, title, None, obs.median_hourly_wage if obs else None,
                          "proposed" if obs else "skipped", obs.source_url if obs else "")
            )
        return report

    versions = client.list_versions()
    source, draft = resolve_target(versions, opts.version_id)
    base_rows = client.list_jobs((draft or source)["version_id"])
    by_soc = {r["soc_code"]: r for r in base_rows}
    report.target_version = str((draft or source)["version_number"])
    iso_now = now.isoformat()

    pending: dict[str, dict[str, Any]] = {}
    for soc, title in config.OCCUPATIONS.items():
        row = by_soc.get(soc)
        if row is None:
            report.errors.append(f"{soc} ({title}): no job row in version {report.target_version}; not inserting")
            report.rows.append(RowResult(soc, title, None, None, "missing_job"))
            continue
        stored = _to_decimal(row.get("median_hourly_wage"))
        obs = valid.get(soc)
        if obs is None:
            report.rows.append(RowResult(soc, title, stored, None, "skipped", "invalid or missing; left unchanged"))
            continue
        stored_year = row.get("wage_year")
        if stored_year is not None and result.year is not None and result.year < stored_year:
            report.errors.append(
                f"{soc} ({title}): release {result.year} is older than stored wage_year {stored_year}; left unchanged"
            )
            report.rows.append(RowResult(soc, title, stored, obs.median_hourly_wage, "skipped", "stale release"))
            continue
        if stored == obs.median_hourly_wage and stored_year == result.year:
            report.rows.append(RowResult(soc, title, stored, obs.median_hourly_wage, "unchanged"))
            continue
        pending[soc] = {
            "median_hourly_wage": str(obs.median_hourly_wage),
            "wage_year": result.year,
            "wage_source_url": obs.source_url,
            "last_synced_at": iso_now,
        }
        note = "approved row changed; CAC re-review required" if row.get("is_approved") else ""
        if note:
            report.warnings.append(f"{soc} ({title}): {note}")
        report.rows.append(RowResult(soc, title, stored, obs.median_hourly_wage, "update", note))

    if not pending:
        report.notes.append("No wage changes; nothing to write.")
        return report

    if draft is None:
        next_number = max(v["version_number"] for v in versions) + 1
        report.cloned_from = str(source["version_number"])
        report.created_version_number = next_number
        report.notes.append(
            f"Version {source['version_number']} is {source['status']}; changes will be staged in new draft "
            f"version {next_number} (jobs only)."
        )
    if opts.dry_run:
        report.notes.append("Dry run: Supabase was not modified.")
        return report

    if draft is not None:
        assert_writable(draft)
        for soc, fields in pending.items():
            client.update_job(by_soc[soc]["job_id"], draft["version_id"], fields)
        return report

    _stage_new_draft(client, source, base_rows, pending, report)
    return report


def _stage_new_draft(
    client: JobsStore,
    source: Mapping[str, Any],
    source_rows: list[dict[str, Any]],
    pending: Mapping[str, dict[str, Any]],
    report: Report,
) -> None:
    summary = (
        f"Staged BLS OEWS {report.release_year} wage refresh from version {source['version_number']}; "
        "jobs only. Requires CAC review and approval before any publication."
    )
    new_version = client.create_draft_version(source, report.created_version_number or 0, summary)
    assert_writable(new_version)
    copies: list[dict[str, Any]] = []
    for row in source_rows:
        copy = {k: v for k, v in row.items() if k not in {"job_id", "created_at", "weekly_gross_income"}}
        copy["version_id"] = new_version["version_id"]
        copy["is_approved"] = False  # new wages require fresh CAC review
        copy["is_active"] = False
        copy["reviewed_at"] = None
        copy["last_synced_at"] = None
        copy.update(pending.get(row["soc_code"], {}))
        copies.append(copy)
    try:
        client.insert_jobs(copies)
    except Exception:
        client.delete_version(new_version["version_id"])  # roll back the empty draft
        raise
    report.target_version = str(new_version["version_number"])


# ------------------------------------------------------------------- Rendering


def render_markdown(report: Report) -> str:
    mode = "DRY RUN" if report.dry_run else "LIVE"
    lines = [
        f"## BLS OEWS wage sync ({mode})",
        f"- Source: {report.source or 'n/a'}",
        f"- Release year: {report.release_year or 'n/a'}",
        f"- Target content version: {report.target_version or 'n/a'}",
    ]
    if report.created_version_number:
        lines.append(f"- New draft version: {report.created_version_number} (from {report.cloned_from})")
    lines += ["", "| SOC | Job | Stored | BLS median | Result |", "|---|---|---|---|---|"]
    for r in report.rows:
        label = {"update": "would update" if report.dry_run else "updated"}.get(r.status, r.status)
        result_text = f"{label} {r.note}".strip()
        lines.append(
            f"| {r.soc_code} | {r.title} | {r.stored_wage if r.stored_wage is not None else '-'} | "
            f"{r.new_wage if r.new_wage is not None else '-'} | {result_text} |"
        )
    for title, items in (("Errors", report.errors), ("Warnings", report.warnings), ("Notes", report.notes)):
        if items:
            lines += ["", f"### {title}", *[f"- {i}" for i in items]]
    return "\n".join(lines) + "\n"


# ------------------------------------------------------------------------ CLI


def parse_args(argv: list[str] | None = None) -> Options:
    p = argparse.ArgumentParser(description="Sync BLS OEWS Atlanta median hourly wages into draft CAC jobs.")
    p.add_argument("--dry-run", action="store_true", help="show proposed updates without modifying Supabase")
    p.add_argument("--file", type=Path, help="official OEWS metro .xlsx/.csv to use instead of the BLS API")
    p.add_argument("--year", type=int, help="OEWS reference year (required if not in the file name)")
    p.add_argument("--version-id", help="target content version (default: latest)")
    p.add_argument("--source-url", default=config.DEFAULT_FILE_SOURCE_URL, help="provenance URL when using --file")
    p.add_argument("--summary-file", type=Path, help="write a markdown summary (e.g. $GITHUB_STEP_SUMMARY)")
    a = p.parse_args(argv)
    return Options(a.dry_run, a.file, a.year, a.version_id, a.source_url, a.summary_file)


def main(argv: list[str] | None = None) -> int:
    opts = parse_args(argv)
    try:
        report = run(opts, os.environ)
    except ConfigError as exc:
        print(f"CONFIGURATION ERROR: {exc}", file=sys.stderr)
        return EXIT_CONFIG
    except (SourceError, DatabaseError, ProtectedContentError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return EXIT_RUNTIME
    text = render_markdown(report)
    print(text)
    if opts.summary_file:
        with opts.summary_file.open("a", encoding="utf-8") as handle:
            handle.write(text)
    return report.exit_code


if __name__ == "__main__":
    sys.exit(main())
