"""Minimal server-side Supabase (PostgREST) client for the BLS importer.

The service-role key is read from the environment only, is never logged, and must
never be placed in browser-accessible (VITE_*) configuration.
"""

from __future__ import annotations

from typing import Any, Mapping, Protocol

import requests

from . import config


class ConfigError(RuntimeError):
    """Required configuration (credentials) is missing or malformed."""


class DatabaseError(RuntimeError):
    """A Supabase request failed."""


class JobsStore(Protocol):
    def list_versions(self) -> list[dict[str, Any]]: ...
    def list_jobs(self, version_id: str) -> list[dict[str, Any]]: ...
    def update_job(self, job_id: str, version_id: str, fields: Mapping[str, Any]) -> None: ...
    def create_draft_version(self, source: Mapping[str, Any], number: int, summary: str) -> dict[str, Any]: ...
    def insert_jobs(self, rows: list[dict[str, Any]]) -> None: ...
    def delete_version(self, version_id: str) -> None: ...


REQUIRED_ENV = ("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")


def missing_credentials(env: Mapping[str, str]) -> list[str]:
    return [name for name in REQUIRED_ENV if not env.get(name, "").strip()]


class SupabaseClient:
    def __init__(self, url: str, service_role_key: str, session: requests.Session | None = None):
        self._base = url.rstrip("/") + "/rest/v1"
        self._session = session or requests.Session()
        self._headers = {
            "apikey": service_role_key,
            "Authorization": f"Bearer {service_role_key}",
            "Content-Type": "application/json",
        }

    @classmethod
    def from_env(cls, env: Mapping[str, str]) -> "SupabaseClient":
        missing = missing_credentials(env)
        if missing:
            raise ConfigError(
                "Missing required environment variable(s): "
                + ", ".join(missing)
                + ". Set them in your shell or as GitHub Actions secrets; "
                "see README 'BLS wage synchronization'."
            )
        url = env["SUPABASE_URL"].strip()
        if not url.startswith(("https://", "http://localhost", "http://127.0.0.1")):
            raise ConfigError("SUPABASE_URL must be an https:// project URL")
        return cls(url, env["SUPABASE_SERVICE_ROLE_KEY"].strip())

    def _request(self, method: str, path: str, *, params=None, json=None, prefer: str | None = None):
        headers = dict(self._headers)
        if prefer:
            headers["Prefer"] = prefer
        try:
            response = self._session.request(
                method, f"{self._base}/{path}", params=params, json=json, headers=headers, timeout=30
            )
        except requests.RequestException as exc:
            raise DatabaseError(f"Supabase request failed: {type(exc).__name__}") from exc
        if response.status_code >= 400:
            # Response bodies from PostgREST contain no credentials.
            raise DatabaseError(f"Supabase {method} {path} -> HTTP {response.status_code}: {response.text[:300]}")
        return response.json() if response.content else None

    def list_versions(self) -> list[dict[str, Any]]:
        return self._request(
            "GET", "content_versions",
            params={"select": "version_id,version_number,status,published_at,created_by", "order": "version_number.desc"},
        )

    def list_jobs(self, version_id: str) -> list[dict[str, Any]]:
        return self._request("GET", "jobs", params={"version_id": f"eq.{version_id}", "select": "*"})

    def update_job(self, job_id: str, version_id: str, fields: Mapping[str, Any]) -> None:
        unexpected = set(fields) - set(config.WRITABLE_JOB_FIELDS)
        if unexpected:
            raise DatabaseError(f"Refusing to write non-allowlisted job fields: {sorted(unexpected)}")
        rows = self._request(
            "PATCH", "jobs",
            params={"job_id": f"eq.{job_id}", "version_id": f"eq.{version_id}"},
            json=dict(fields), prefer="return=representation",
        )
        if not rows or len(rows) != 1:
            raise DatabaseError(f"Expected to update exactly one job row for {job_id}")

    def create_draft_version(self, source: Mapping[str, Any], number: int, summary: str) -> dict[str, Any]:
        rows = self._request(
            "POST", "content_versions",
            json={
                "version_number": number,
                "status": "draft",
                "created_by": source.get("created_by"),
                "change_summary": summary,
            },
            prefer="return=representation",
        )
        return rows[0]

    def insert_jobs(self, rows: list[dict[str, Any]]) -> None:
        self._request("POST", "jobs", json=rows, prefer="return=minimal")

    def delete_version(self, version_id: str) -> None:
        # Only used to roll back a draft this run just created.
        self._request("DELETE", "content_versions", params={"version_id": f"eq.{version_id}", "status": "eq.draft"})
