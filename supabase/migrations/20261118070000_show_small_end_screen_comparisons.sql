BEGIN;

-- End-screen comparisons can show any nonempty cohort. Keep the existing
-- ownership, edition, household, assistance, and response filters.
DO $migration$
DECLARE
  definition text;
  cutoff text := 't.responses >= 5';
BEGIN
  SELECT pg_get_functiondef('public.get_individual_result_comparisons(uuid)'::regprocedure)
    INTO definition;
  IF (length(definition) - length(replace(definition, cutoff, ''))) <> 2 * length(cutoff) THEN
    RAISE EXCEPTION 'End-screen comparison cutoff has drifted';
  END IF;
  EXECUTE replace(definition, cutoff, 't.responses > 0');
END;
$migration$;

COMMIT;
