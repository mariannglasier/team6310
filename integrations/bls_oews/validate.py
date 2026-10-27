"""Validation applied to every wage before it can reach Supabase."""

from __future__ import annotations

from decimal import Decimal

from . import config
from .sources import SourceResult, WageObservation


def validate_observation(obs: WageObservation, release_year: int, current_year: int) -> list[str]:
    """Return a list of problems; an empty list means the wage may be written."""
    problems: list[str] = []
    if obs.soc_code not in config.OCCUPATIONS:
        problems.append(f"{obs.soc_code} is not a recognized CAC occupation")
    if obs.area_code != config.AREA_CODE:
        problems.append(f"area {obs.area_code} is not the Atlanta metro area {config.AREA_CODE}")
    if obs.year != release_year:
        problems.append(f"observation year {obs.year} differs from release year {release_year}")
    if not (2000 <= obs.year <= current_year):
        problems.append(f"year {obs.year} is outside the plausible range")
    if obs.median_hourly_wage is None:
        problems.append(obs.reason or "no median hourly wage")
        return problems
    wage = obs.median_hourly_wage
    if not config.MIN_PLAUSIBLE_HOURLY <= wage <= config.MAX_PLAUSIBLE_HOURLY:
        problems.append(f"median hourly wage {wage} is outside the plausible range")
    if wage != wage.quantize(Decimal("0.01")):
        problems.append(f"median hourly wage {wage} is not a whole number of cents")
    return problems


def validate_result(result: SourceResult, current_year: int) -> tuple[dict[str, WageObservation], list[str]]:
    """Split a source result into valid observations and per-occupation error messages."""
    errors: list[str] = []
    valid: dict[str, WageObservation] = {}
    if result.year is None:
        return valid, ["The wage source did not identify a release year"]
    missing = [s for s in config.OCCUPATIONS if s not in result.observations]
    for soc in missing:
        errors.append(f"{soc} ({config.OCCUPATIONS[soc]}): not returned by the source")
    for soc, obs in result.observations.items():
        problems = validate_observation(obs, result.year, current_year)
        if problems:
            errors.append(f"{soc} ({config.OCCUPATIONS.get(soc, '?')}): " + "; ".join(problems))
        else:
            valid[soc] = obs
    return valid, errors
