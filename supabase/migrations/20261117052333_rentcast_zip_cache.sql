BEGIN;
CREATE TABLE public.rentcast_monthly_zip_cache (
 period text NOT NULL CHECK(period ~ '^[0-9]{4}-[0-9]{2}$'),
 zip_code text NOT NULL CHECK(zip_code IN ('30327','30328','30338','30342','30346','30350')),
 attempted_at timestamptz NOT NULL DEFAULT now(),
 cache jsonb,
 PRIMARY KEY(period,zip_code)
);
ALTER TABLE public.rentcast_monthly_zip_cache ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rentcast_monthly_zip_cache FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.rentcast_monthly_zip_cache TO service_role;

CREATE FUNCTION public.claim_rentcast_zip_request(p_period text,p_zip_code text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE claimed text;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN
  RAISE EXCEPTION 'Maintenance access required' USING ERRCODE='42501';
 END IF;
 INSERT INTO public.rentcast_monthly_zip_cache(period,zip_code)
 VALUES(p_period,p_zip_code) ON CONFLICT DO NOTHING RETURNING zip_code INTO claimed;
 RETURN claimed IS NOT NULL;
END $$;
REVOKE ALL ON FUNCTION public.claim_rentcast_zip_request(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_rentcast_zip_request(text,text) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
