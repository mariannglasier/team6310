-- Recorded from the live project's migration history (data seed). It creates a NEW draft
-- version with a random version_id, so a rebuilt database would not reuse the live
-- Content Version 1 id; the eight jobs were added to the live version separately as data.
WITH new_version AS (
 INSERT INTO public.content_versions(version_number,status,created_at,change_summary)
 VALUES (1,'draft',now(),'Initial four CAC simulation personas; all begin unemployed with zero weekly income.')
 RETURNING version_id
)
INSERT INTO public.personas (name,description,general_starting_balance,weekly_income,starting_job_id,version_id)
SELECT p.name,p.description,p.starting_balance,0::numeric,NULL::uuid,v.version_id
FROM new_version v
CROSS JOIN (VALUES
('Alex', 'Alex — Finding His Footing. Age 23; single, no dependents. Alex lives in a shared apartment and has not completed high school. He is looking for employment and has limited money to fall back on. What you will need to consider: rent, transportation, groceries, everyday expenses, job-search costs, and how qualifications can affect opportunities. Starts unemployed.',350::numeric),
('Jordan', 'Jordan — Providing for Two. Age 34; single father raising his five-year-old daughter Maya. Jordan is seeking employment while supporting a two-person household. What you will need to consider: childcare during job searches and future work shifts, food, housing, healthcare, transportation, and Maya’s needs. Starts unemployed.',850::numeric),
('Patricia', 'Patricia — Maintaining Stability. Age 58; lives alone. Patricia has years of work experience but is currently unemployed and needs to stretch her available funds while finding work. What you will need to consider: housing, groceries, utilities, transportation, healthcare, savings, and the costs of searching for employment. Starts unemployed.',1200::numeric),
('Sofia', 'Sofia — Starting Over Professionally. Age 38; lives with her spouse and speaks English as a second language. Sofia has a degree and professional experience earned abroad but is currently unemployed while seeking work that recognizes her skills. What you will need to consider: shared household expenses, transportation, groceries, credential evaluation, training and job-search costs. Any spouse income is not included in her starting income and will need separate modeling. Starts unemployed.',600::numeric)
) AS p(name,description,starting_balance);
