BEGIN;
CREATE FUNCTION public.claim_rentcast_monthly_request(p_period text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE claimed text;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN
  RAISE EXCEPTION 'Maintenance access required' USING ERRCODE='42501';
 END IF;
 UPDATE public.game_data_refresh_runs
 SET rentcast_attempted_at=now()
 WHERE period=p_period AND status='running' AND rentcast_attempted_at IS NULL
 RETURNING period INTO claimed;
 RETURN claimed IS NOT NULL;
END $$;
REVOKE ALL ON FUNCTION public.claim_rentcast_monthly_request(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_rentcast_monthly_request(text) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
