-- Authenticates the scheduled Explore Data refresh without a second copy of the
-- token.
--
-- The refresh token is generated inside the database and stored only in
-- Supabase Vault under the name `explorer_refresh_token` (created once as a
-- deployment step, not in this file, so no secret value is ever written to Git).
-- The Edge Function sends the token it receives to this function, which
-- compares SHA-256 digests (no length or prefix timing signal) and returns only
-- true or false. The token is never returned to any caller.
--
-- Only the service role can execute it. It reads Vault as the function owner.
--
-- Depends on 20261117150000_explorer_statistics.sql.

create or replace function public.explorer_refresh_token_valid(p_token text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_expected text;
begin
  if p_token is null or p_token = '' then
    return false;
  end if;

  select s.decrypted_secret into v_expected
  from vault.decrypted_secrets s
  where s.name = 'explorer_refresh_token';

  if v_expected is null or length(v_expected) < 32 then
    return false;
  end if;

  return extensions.digest(p_token, 'sha256') = extensions.digest(v_expected, 'sha256');
end
$$;

revoke all on function public.explorer_refresh_token_valid(text)
  from public, anon, authenticated;
grant execute on function public.explorer_refresh_token_valid(text) to service_role;
