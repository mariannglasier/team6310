# Employment walkthrough

The bulletin board fills the content width without a status sidebar. Postings list
only skills that are required, and unavailable jobs say “Qualifications not met.”
Wage provenance stays in the content records; it is not shown on each posting.

The local flow is Household ? Review ? Confirm ? /simulation/play. Jobs, wages,
and skills come from Supabase. Progress and financial history stay in this browser
tab; the preview does not write protected playthrough or response rows. Refresh
replays a pinned initial snapshot and action log without duplicating pay or charges.

## Approved skill model ? November 2, 2026

Only English and computer skills affect job eligibility. Prior experience,
education credentials, job tiers, and other qualifications are not considered.

| Table | New boolean columns |
| --- | --- |
| jobs | needs_english_skills, needs_computer_skills |
| personas (households) | has_english_skills, has_computer_skills |

A household qualifies when it has every skill the job requires. Missing values
are unknown, not false: an unconfigured job is unavailable, and a household needs
both starting flags configured before play. The catalog must always contain at
least two approved active jobs requiring neither skill.

After a failed Day 2 interview, offer every other job the household currently
qualifies for, excluding the original target. There is no lower-requirement job
flag, wage-rank restriction, or fallback subset. Reapplication remains on Day 2;
the Day 3 follow-up succeeds with any available clothing choice.

Choosing CAC preparation gives the current run English and computer skills;
it never changes the household's starting definition in the database. The scripted
first-interview preparation/clothing outcomes otherwise remain as specified in
scenarios.md. CAC availability alone does not complete preparation. Professional
clothes cost a fixed $60 and can be reused without a second charge.

## Database setup

Run supabase/migrations/20261102000000_add_job_and_household_skills.sql in the
Supabase SQL Editor as an administrator. This adds only the four columns: it does
not create editions, duplicate rows, modify wages, or assume skill values.

Then review and run supabase/seeds/configure_skills.sql, which contains the
explicitly approved household starting flags and prototype job requirements. It updates only the new skill
columns in the existing Version 1. The seven mapped jobs use the approved
prototype skill tiers; Customer Service now needs only English and computer skills,
with no experience restriction. Home Health requires English only, as explicitly
approved by the team. Three no-skill jobs remain available.

The existing guard prevents even initializing new flags on published jobs. The
configuration script holds exclusive locks and temporarily suspends that guard
inside one administrator transaction, then restores it before commit. Assertions
roll back changes if any other job value, household value, edition, or row changes.
There are no permanent trigger, grant, policy, or publication changes.

The earlier edition-copy and publication scripts have been removed. Do not use
copies of those older scripts from the conversation. No live SQL changes have
been performed by this implementation. Household starting flags were explicitly supplied by the team; they are not
inferred from names or narrative. Alex and Jordan have English only, Patricia
has neither skill, and Sofia has computer skills only.

## Preview behavior and limits

The first walkthrough has no CAC support. Completing Day 30 offers an explicit
CAC replay through fresh household selection, preserving the prior local log.
The new skill-based snapshot uses a separate browser-storage format; older preview
logs are left intact and are not replayed under different eligibility rules.

Job postings and scenario choices are native button cards: clicking or keyboard
activation submits immediately. The bulletin board has a CAC red border, with
a prominent hover border/shadow only on eligible job cards. Clothing purchases
are charged only when their card is activated; unaffordable purchases end the walkthrough without a deduction.
Income begins seven days after hiring: Day 2 hires pay on 9/16/23/30; Day 3 hires
pay on 10/17/24. Income notices appear before daily scenarios. No income tax is
deducted. Other scenarios and approved facts remain labeled placeholders through
Day 30, with no invented bills or financial effects.

Protected backend decisions, ownership checks, production financial persistence,
and full scenario-library publication remain future integration work. The local
preview snapshot must never be submitted as authoritative financial state.
