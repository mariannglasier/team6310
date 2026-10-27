"""Static configuration: target geography, occupations, and field allowlists."""

from __future__ import annotations

from decimal import Decimal

AREA_CODE = "12060"
AREA_NAME_FRAGMENT = "Atlanta"  # sanity check against AREA_TITLE in downloaded files

# SOC code -> CAC job title. Matching against public.jobs uses soc_code only;
# titles here are for logging and documentation.
OCCUPATIONS: dict[str, str] = {
    "35-3023": "Fast Food Worker",
    "41-2011": "Cashier",
    "41-2031": "Retail Sales Associate",
    "53-7065": "Warehouse Stocker",
    "37-2011": "Janitor / Cleaner",
    "31-1120": "Home Health / Personal Care Aide",
    "43-4051": "Customer Service Representative",
    "43-9061": "General Office Clerk",
}

# BLS OEWS time-series data-type suffixes used by the Public Data API.
DATATYPE_HOURLY_MEDIAN = "08"
DATATYPE_ANNUAL_MEDIAN = "13"

# OEWS annual wages are hourly wages multiplied by 2,080 hours.
ANNUAL_HOURS = Decimal("2080")

# Plausibility bounds (USD per hour) used only to reject malformed values.
MIN_PLAUSIBLE_HOURLY = Decimal("5.00")
MAX_PLAUSIBLE_HOURLY = Decimal("200.00")

# The ONLY columns the importer may write to public.jobs.
WRITABLE_JOB_FIELDS = (
    "median_hourly_wage",
    "wage_year",
    "wage_source_url",
    "last_synced_at",
)

DEFAULT_FILE_SOURCE_URL = "https://www.bls.gov/oes/tables.htm"
API_URL_V1 = "https://api.bls.gov/publicAPI/v1/timeseries/data/"
API_URL_V2 = "https://api.bls.gov/publicAPI/v2/timeseries/data/"
SERIES_URL_TEMPLATE = "https://data.bls.gov/timeseries/{series_id}"
