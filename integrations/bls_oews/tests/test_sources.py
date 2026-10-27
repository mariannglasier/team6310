from __future__ import annotations

from decimal import Decimal

import pytest

from integrations.bls_oews import config
from integrations.bls_oews.sources import (
    SourceError,
    fetch_from_api,
    fetch_from_file,
    infer_year,
    parse_decimal,
    series_id,
)
from integrations.bls_oews.validate import validate_result

from .conftest import FAKE_WAGES, api_body, make_post


def test_series_id_uses_atlanta_area_and_hourly_median_suffix():
    assert series_id("12060", "35-3023", "08") == "OEUM001206000000035302308"
    assert series_id("12060", "31-1120", "08") == "OEUM001206000000031112008"


@pytest.mark.parametrize("raw", ["*", "**", "#", "-", "", None, "abc", "NaN"])
def test_suppressed_or_malformed_values_are_none(raw):
    assert parse_decimal(raw) is None


def test_parse_decimal_handles_formatting():
    assert parse_decimal("$1,234.50") == Decimal("1234.50")


def test_api_recognizes_all_expected_socs_and_latest_year():
    result = fetch_from_api(current_year=2026, post=make_post(year=2025))
    assert set(result.observations) == set(config.OCCUPATIONS)
    assert result.year == 2025
    assert result.observations["35-3023"].median_hourly_wage == Decimal("10.10")
    valid, errors = validate_result(result, 2026)
    assert len(valid) == 8 and errors == []


def test_api_detects_newer_release_instead_of_hardcoding_year():
    values = {soc: {2025: "9.00", 2026: w} for soc, w in FAKE_WAGES.items()}
    result = fetch_from_api(current_year=2027, post=lambda u, p: api_body(values))
    assert result.year == 2026
    assert result.observations["41-2011"].median_hourly_wage == Decimal("11.11")


def test_api_never_falls_back_to_older_year_for_missing_occupation():
    values = {soc: {2026: w} for soc, w in FAKE_WAGES.items()}
    values["41-2011"] = {2025: "14.00"}  # older figure must not be substituted
    result = fetch_from_api(current_year=2026, post=lambda u, p: api_body(values))
    obs = result.observations["41-2011"]
    assert obs.median_hourly_wage is None
    valid, errors = validate_result(result, 2026)
    assert "41-2011" not in valid and any("41-2011" in e for e in errors)


def test_api_suppressed_value_is_missing():
    values = {soc: {2025: w} for soc, w in FAKE_WAGES.items()}
    values["53-7065"] = {2025: "-"}
    result = fetch_from_api(current_year=2026, post=lambda u, p: api_body(values))
    assert result.observations["53-7065"].median_hourly_wage is None


def test_api_rejects_hourly_annual_mismatch():
    values = {soc: {2025: w} for soc, w in FAKE_WAGES.items()}
    annual = {soc: {2025: 20000} for soc in FAKE_WAGES}  # inconsistent with hourly x 2080
    result = fetch_from_api(current_year=2026, post=lambda u, p: api_body(values, annual))
    assert all(o.median_hourly_wage is None for o in result.observations.values())


def test_api_failure_status_raises_without_leaking_key():
    def post(url, payload):
        return {"status": "REQUEST_NOT_PROCESSED", "message": ["daily threshold reached"]}

    with pytest.raises(SourceError) as exc:
        fetch_from_api(current_year=2026, api_key="SECRET-KEY", post=post)
    assert "SECRET-KEY" not in str(exc.value)


def test_api_key_switches_to_v2_endpoint():
    seen = {}

    def post(url, payload):
        seen["url"], seen["payload"] = url, payload
        return make_post(2025)(url, payload)

    fetch_from_api(current_year=2026, api_key="k", post=post)
    assert "/v2/" in seen["url"] and seen["payload"]["registrationkey"] == "k"


HEADER = "AREA,AREA_TITLE,AREA_TYPE,NAICS,I_GROUP,OWN_CODE,OCC_CODE,OCC_TITLE,O_GROUP,H_MEAN,H_MEDIAN,A_MEDIAN"


def _csv(tmp_path, rows, name="MSA_M2025_dl.csv"):
    path = tmp_path / name
    path.write_text(HEADER + "\n" + "\n".join(rows) + "\n", encoding="utf-8")
    return path


def _rows(median="13.36"):
    atl = '12060,"Atlanta-Sandy Springs-Roswell, GA",4,000000,cross-industry,1235'
    out = [f"{atl},{soc},T,detailed,99.99,{median if soc == '35-3023' else '15.00'},31200" for soc in config.OCCUPATIONS]
    # Decoys: other metro area, industry-specific row, and a different mean column.
    out.append('12420,"Austin-Round Rock, TX",4,000000,cross-industry,1235,35-3023,T,detailed,1.11,1.11,2000')
    out.append('12060,"Atlanta-Sandy Springs-Roswell, GA",4,722500,4-digit,1235,35-3023,T,detailed,2.22,2.22,4000')
    return out


def test_file_selects_atlanta_cross_industry_median_not_mean(tmp_path):
    result = fetch_from_file(_csv(tmp_path, _rows()))
    assert result.year == 2025
    assert result.observations["35-3023"].median_hourly_wage == Decimal("13.36")  # not H_MEAN 99.99
    assert set(result.observations) == set(config.OCCUPATIONS)
    valid, errors = validate_result(result, 2026)
    assert errors == [] and len(valid) == 8


@pytest.mark.parametrize("marker", ["*", "**", "#", ""])
def test_file_suppressed_median_is_missing(tmp_path, marker):
    result = fetch_from_file(_csv(tmp_path, _rows(median=marker)))
    assert result.observations["35-3023"].median_hourly_wage is None
    valid, errors = validate_result(result, 2026)
    assert "35-3023" not in valid and len(errors) == 1


def test_file_missing_occupation_row_is_reported_not_invented(tmp_path):
    rows = [r for r in _rows() if ",43-9061," not in r]
    result = fetch_from_file(_csv(tmp_path, rows))
    assert result.observations["43-9061"].median_hourly_wage is None


def test_file_without_atlanta_rows_fails(tmp_path):
    rows = ['12420,"Austin-Round Rock, TX",4,000000,cross-industry,1235,35-3023,T,detailed,1,1,1']
    with pytest.raises(SourceError, match="12060"):
        fetch_from_file(_csv(tmp_path, rows))


def test_file_area_code_with_wrong_title_is_rejected(tmp_path):
    rows = ['12060,"Boise, ID",4,000000,cross-industry,1235,35-3023,T,detailed,1,1,1']
    with pytest.raises(SourceError, match="Atlanta"):
        fetch_from_file(_csv(tmp_path, rows))


def test_file_requires_year(tmp_path):
    with pytest.raises(SourceError, match="--year"):
        fetch_from_file(_csv(tmp_path, _rows(), name="data.csv"))
    assert fetch_from_file(_csv(tmp_path, _rows(), name="data.csv"), year=2025).year == 2025


def test_infer_year_from_official_filename(tmp_path):
    assert infer_year(tmp_path / "MSA_M2025_dl.xlsx") == 2025


def test_xlsx_with_leading_description_sheet(tmp_path):
    from openpyxl import Workbook

    atl = ["12060", "Atlanta-Sandy Springs-Roswell, GA", "4", "000000", "cross-industry", "1235"]
    wb = Workbook()
    wb.active.title = "Field Descriptions"
    wb.active.append(["Field", "Description"])
    ws = wb.create_sheet("MSA_M2025_dl")
    ws.append(HEADER.split(","))
    for soc in config.OCCUPATIONS:
        median = 13.36 if soc == "35-3023" else 15.0
        ws.append([*atl, soc, "T", "detailed", 99.99, median, 31200])
    ws.append(["12420", "Austin-Round Rock, TX", "4", "000000", "cross-industry", "1235",
               "35-3023", "T", "detailed", 1.11, 1.11, 2000])
    path = tmp_path / "MSA_M2025_dl.xlsx"
    wb.save(path)
    result = fetch_from_file(path)
    assert result.observations["35-3023"].median_hourly_wage == Decimal("13.36")
    assert result.observations["41-2011"].median_hourly_wage == Decimal("15.0")
