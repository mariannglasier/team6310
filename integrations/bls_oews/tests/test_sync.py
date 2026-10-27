from __future__ import annotations

from decimal import Decimal

import pytest

from integrations.bls_oews import config
from integrations.bls_oews.bls_oews_sync import (
    Options,
    ProtectedContentError,
    assert_writable,
    render_markdown,
    resolve_target,
    run,
)
from integrations.bls_oews.supabase_client import ConfigError, SupabaseClient, missing_credentials

from .conftest import FAKE_WAGES, NOW, FakeStore, api_body, make_post

CAC_FIELDS = ("description", "hours_per_week", "simulation_requirements", "title", "is_approved", "is_active", "reviewed_at")


def _snapshot(store, fields=CAC_FIELDS):
    return {(j["version_id"], j["soc_code"]): {f: j[f] for f in fields} for j in store.jobs}


def go(store, post=None, **kw):
    return run(Options(**kw), {}, client=store, now=NOW, post=post or make_post(2026))


def test_updates_draft_wages_and_only_allowlisted_fields(store):
    before = _snapshot(store)
    report = go(store)
    assert report.exit_code == 0 and len(report.changes) == 8
    assert _snapshot(store) == before  # CAC-authored fields and approval flags untouched
    job = next(j for j in store.jobs if j["soc_code"] == "35-3023")
    assert job["median_hourly_wage"] == Decimal("10.10") and job["wage_year"] == 2026
    assert job["wage_source_url"].startswith("https://data.bls.gov/timeseries/OEUM")
    assert job["last_synced_at"] == NOW.isoformat()
    assert job["weekly_gross_income"] == Decimal("303.00")  # 10.10 x 30 (emulated column)
    assert len(store.jobs) == 8 and len(store.versions) == 1  # no duplicates, no new versions


def test_second_run_is_idempotent(store):
    go(store)
    store.writes.clear()
    jobs_before = [dict(j) for j in store.jobs]
    report = go(store)
    assert store.writes == [] and store.jobs == jobs_before
    assert report.changes == [] and report.exit_code == 0


def test_dry_run_never_writes(store):
    report = go(store, dry_run=True)
    assert store.writes == [] and all(j["median_hourly_wage"] is None for j in store.jobs)
    assert len(report.changes) == 8 and "would update" in render_markdown(report)


def test_missing_occupation_left_unchanged_and_reported(store):
    go(store)
    post = make_post(2026, overrides={"41-2011": {2026: "-"}}, wages={**FAKE_WAGES, "35-3023": "11.00"})
    report = go(store, post=post)
    cashier = next(j for j in store.jobs if j["soc_code"] == "41-2011")
    assert cashier["median_hourly_wage"] == Decimal("11.11")  # prior value kept
    assert report.exit_code == 1 and any("41-2011" in e for e in report.errors)
    fast_food = next(j for j in store.jobs if j["soc_code"] == "35-3023")
    assert fast_food["median_hourly_wage"] == Decimal("11.00")  # other rows still updated


def test_no_valid_data_never_substitutes_values(store):
    values = {soc: {2026: "*"} for soc in FAKE_WAGES}
    report = go(store, post=lambda u, p: api_body(values))
    assert all(j["median_hourly_wage"] is None for j in store.jobs)
    assert report.exit_code == 1 and store.writes == []


def test_approved_rows_keep_flags_but_warn(store):
    for job in store.jobs:
        job["is_approved"] = True
        job["reviewed_at"] = "2026-10-20T00:00:00+00:00"
    report = go(store)
    assert all(j["is_approved"] and j["reviewed_at"] for j in store.jobs)
    assert any("re-review" in w for w in report.warnings)


def test_published_version_is_never_modified_and_changes_go_to_new_draft():
    store = FakeStore(status="published")
    source_before = [dict(j) for j in store.jobs if j["version_id"] == "v1"]
    report = go(store)
    assert [j for j in store.jobs if j["version_id"] == "v1"] == source_before
    assert not any(w[0] == "update" for w in store.writes)
    new_jobs = [j for j in store.jobs if j["version_id"] == "v2"]
    assert len(new_jobs) == 8 and report.created_version_number == 2
    assert all(not j["is_approved"] and not j["is_active"] and j["reviewed_at"] is None for j in new_jobs)
    assert all(j["description"].startswith("CAC description") for j in new_jobs)
    assert store.versions[-1]["status"] == "draft" and store.versions[-1]["published_at"] is None


def test_published_source_reuses_existing_draft_instead_of_creating_another():
    store = FakeStore(status="published")
    go(store)
    store.writes.clear()
    report = go(store)
    assert store.writes == [] and len(store.versions) == 2 and report.changes == []


def test_published_source_with_no_changes_does_not_create_draft():
    store = FakeStore(status="published")
    for job in store.jobs:
        job["median_hourly_wage"] = Decimal(FAKE_WAGES[job["soc_code"]])
        job["wage_year"] = 2026
    go(store)
    assert len(store.versions) == 1 and store.writes == []


def test_failed_clone_is_rolled_back():
    store = FakeStore(status="published")
    store.fail_insert = True
    with pytest.raises(RuntimeError):
        go(store)
    assert [v["version_id"] for v in store.versions] == ["v1"]


def test_dry_run_on_published_reports_planned_draft_without_writing():
    store = FakeStore(status="published")
    report = go(store, dry_run=True)
    assert store.writes == [] and report.created_version_number == 2


def test_stale_release_does_not_overwrite_newer_stored_wages(store):
    for job in store.jobs:
        job["median_hourly_wage"], job["wage_year"] = Decimal("20.00"), 2027
    report = go(store, post=make_post(2026))
    assert store.writes == [] and report.exit_code == 1


def test_missing_job_row_is_not_inserted(store):
    store.jobs = [j for j in store.jobs if j["soc_code"] != "43-9061"]
    report = go(store)
    assert len(store.jobs) == 7 and any("43-9061" in e for e in report.errors)


def test_assert_writable_rejects_published_and_archived():
    for status in ("published", "archived"):
        with pytest.raises(ProtectedContentError):
            assert_writable({"version_number": 1, "status": status, "published_at": None})
    with pytest.raises(ProtectedContentError):
        assert_writable({"version_number": 1, "status": "draft", "published_at": "2026-01-01"})


def test_resolve_target_prefers_newer_draft_over_published_source():
    versions = [
        {"version_id": "a", "version_number": 1, "status": "published", "published_at": "x"},
        {"version_id": "b", "version_number": 2, "status": "draft", "published_at": None},
    ]
    assert resolve_target(versions, "a")[1]["version_id"] == "b"
    assert resolve_target(versions, None)[1]["version_id"] == "b"


def test_missing_credentials_error_is_understandable():
    with pytest.raises(ConfigError) as exc:
        run(Options(), {}, now=NOW, post=make_post(2026))
    message = str(exc.value)
    assert "SUPABASE_URL" in message and "SUPABASE_SERVICE_ROLE_KEY" in message
    assert missing_credentials({"SUPABASE_URL": "https://x.supabase.co"}) == ["SUPABASE_SERVICE_ROLE_KEY"]


def test_missing_credentials_fail_before_any_network_call():
    def post(url, payload):
        raise AssertionError("BLS must not be contacted when credentials are missing")

    with pytest.raises(ConfigError):
        run(Options(), {}, now=NOW, post=post)


def test_dry_run_without_credentials_still_validates_and_reports():
    report = run(Options(dry_run=True), {}, now=NOW, post=make_post(2026))
    assert report.exit_code == 0 and len(report.rows) == 8
    assert any("skipped" in n for n in report.notes)


def test_client_rejects_insecure_url():
    with pytest.raises(ConfigError, match="https"):
        SupabaseClient.from_env({"SUPABASE_URL": "http://example.com", "SUPABASE_SERVICE_ROLE_KEY": "k"})


def test_client_refuses_to_write_non_allowlisted_fields():
    from integrations.bls_oews.supabase_client import DatabaseError

    client = SupabaseClient("https://x.supabase.co", "k")
    with pytest.raises(DatabaseError, match="non-allowlisted"):
        client.update_job("j", "v", {"is_approved": True})
    assert set(config.WRITABLE_JOB_FIELDS) == {"median_hourly_wage", "wage_year", "wage_source_url", "last_synced_at"}
