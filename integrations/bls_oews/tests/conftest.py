from __future__ import annotations

import copy
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Mapping

import pytest

from integrations.bls_oews import config

NOW = datetime(2026, 11, 1, 5, 0, tzinfo=timezone.utc)

HOURS = {
    "35-3023": "30.00", "41-2011": "30.00", "41-2031": "30.00", "53-7065": "35.00",
    "37-2011": "35.00", "31-1120": "35.00", "43-4051": "40.00", "43-9061": "40.00",
}

# Illustrative TEST values only (not BLS data).
FAKE_WAGES = {
    "35-3023": "10.10", "41-2011": "11.11", "41-2031": "12.12", "53-7065": "13.13",
    "37-2011": "14.14", "31-1120": "15.15", "43-4051": "16.16", "43-9061": "17.17",
}


class FakeStore:
    """In-memory stand-in for Supabase that records writes and emulates the schema."""

    def __init__(self, status: str = "draft"):
        self.versions: list[dict[str, Any]] = [
            {
                "version_id": "v1", "version_number": 1, "status": status,
                "published_at": None if status == "draft" else "2026-10-01T00:00:00+00:00",
                "created_by": "author-1",
            }
        ]
        self.jobs: list[dict[str, Any]] = []
        for soc, title in config.OCCUPATIONS.items():
            self.jobs.append(
                {
                    "job_id": str(uuid.uuid4()), "version_id": "v1", "soc_code": soc, "title": title,
                    "description": f"CAC description for {soc}", "area_code": "12060",
                    "hours_per_week": Decimal(HOURS[soc]), "median_hourly_wage": None,
                    "wage_year": None, "weekly_gross_income": None,
                    "simulation_requirements": {"clothing": "professional"},
                    "wage_source_url": config.DEFAULT_FILE_SOURCE_URL, "last_synced_at": None,
                    "is_approved": False, "is_active": False, "reviewed_at": None,
                    "created_at": "2026-10-27T00:00:00+00:00",
                }
            )
        self.writes: list[tuple[str, Any]] = []
        self.fail_insert = False

    # -- JobsStore interface
    def list_versions(self):
        return copy.deepcopy(self.versions)

    def list_jobs(self, version_id: str):
        return copy.deepcopy([j for j in self.jobs if j["version_id"] == version_id])

    def update_job(self, job_id: str, version_id: str, fields: Mapping[str, Any]) -> None:
        assert set(fields) <= set(config.WRITABLE_JOB_FIELDS)
        self.writes.append(("update", dict(fields)))
        for job in self.jobs:
            if job["job_id"] == job_id and job["version_id"] == version_id:
                job.update(fields)
                job["median_hourly_wage"] = Decimal(str(job["median_hourly_wage"]))
                job["weekly_gross_income"] = (job["median_hourly_wage"] * job["hours_per_week"]).quantize(Decimal("0.01"))
                return
        raise AssertionError("update targeted no row")

    def create_draft_version(self, source, number, summary):
        self.writes.append(("create_version", number))
        version = {
            "version_id": f"v{number}", "version_number": number, "status": "draft",
            "published_at": None, "created_by": source.get("created_by"), "change_summary": summary,
        }
        self.versions.append(version)
        return dict(version)

    def insert_jobs(self, rows):
        self.writes.append(("insert_jobs", len(rows)))
        if self.fail_insert:
            raise RuntimeError("insert failed")
        keys = {(r["version_id"], r["soc_code"]) for r in self.jobs}
        for row in rows:
            assert (row["version_id"], row["soc_code"]) not in keys, "duplicate (version_id, soc_code)"
            new = dict(row, job_id=str(uuid.uuid4()))
            new["median_hourly_wage"] = Decimal(str(new["median_hourly_wage"])) if new["median_hourly_wage"] is not None else None
            self.jobs.append(new)

    def delete_version(self, version_id):
        self.writes.append(("delete_version", version_id))
        self.versions = [v for v in self.versions if v["version_id"] != version_id]


@pytest.fixture
def store():
    return FakeStore()


def api_body(year_values: dict[str, dict[str, Any]], annual: dict[str, dict[str, Any]] | None = None):
    """Build a BLS API response. year_values: soc -> {year: value}."""
    from integrations.bls_oews.sources import series_id

    series = []
    for soc, years in year_values.items():
        series.append({
            "seriesID": series_id("12060", soc, "08"),
            "data": [{"year": str(y), "period": "A01", "value": str(v)} for y, v in years.items()],
        })
    for soc, years in (annual or {}).items():
        series.append({
            "seriesID": series_id("12060", soc, "13"),
            "data": [{"year": str(y), "period": "A01", "value": str(v)} for y, v in years.items()],
        })
    return {"status": "REQUEST_SUCCEEDED", "message": [], "Results": {"series": series}}


def make_post(year: int = 2026, wages: dict[str, str] | None = None, overrides: dict[str, Any] | None = None):
    wages = dict(wages or FAKE_WAGES)
    values = {soc: {year: w} for soc, w in wages.items()}
    values.update(overrides or {})
    annual = {soc: {year: int(Decimal(w) * 2080 / 10) * 10} for soc, w in wages.items()}

    def post(url, payload):
        return api_body(values, annual)

    return post
