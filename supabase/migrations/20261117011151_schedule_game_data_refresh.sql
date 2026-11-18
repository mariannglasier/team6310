BEGIN;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

DO $secrets$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM vault.secrets WHERE name='game_data_refresh_token') THEN
  PERFORM vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'game_data_refresh_token','Private monthly scenario refresh authentication');
 END IF;
END $secrets$;

CREATE OR REPLACE FUNCTION public.verify_game_data_refresh_token(p_token text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN
  RAISE EXCEPTION 'Maintenance access required' USING ERRCODE='42501';
 END IF;
 IF p_token IS NULL OR length(p_token)<32 OR length(p_token)>1024 THEN RETURN false; END IF;
 RETURN EXISTS(SELECT 1 FROM vault.decrypted_secrets
  WHERE name='game_data_refresh_token'
  AND extensions.digest(decrypted_secret,'sha256')=extensions.digest(p_token,'sha256'));
END $$;
REVOKE ALL ON FUNCTION public.verify_game_data_refresh_token(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.verify_game_data_refresh_token(text) TO service_role;

SELECT cron.schedule(
 'refresh-scenario-prices-monthly','0 6 26 * *',
 $job$
 SELECT net.http_post(
  url := 'https://uucneyuspeqpygiucfvr.supabase.co/functions/v1/refresh-game-data',
  headers := jsonb_build_object('Content-Type','application/json','x-refresh-token',
   (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='game_data_refresh_token')),
  body := '{"dryRun":false}'::jsonb,
  timeout_milliseconds := 180000
 );
 $job$
);
NOTIFY pgrst,'reload schema';
COMMIT;
