begin;
create schema if not exists group_private;
revoke all on schema group_private from public, anon;
grant usage on schema group_private to authenticated;
create unique index group_join_code_unique on public.group_sessions(join_code);
create unique index group_one_waiting_host on public.group_sessions(host_user_id) where status='waiting';
-- All creation and enrollment go through validated operations.
revoke insert on public.group_sessions, public.group_participants from anon, authenticated;
create table group_private.join_attempts(user_id uuid primary key references auth.users(id) on delete cascade, window_start timestamptz not null, attempts integer not null);
alter table group_private.join_attempts enable row level security;
revoke all on group_private.join_attempts from public, anon, authenticated;
create function group_private.host_session(p_create boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.group_sessions; v uuid; u uuid:=auth.uid();
begin
 if u is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=false then raise exception 'Anonymous session required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,931));
 select * into s from public.group_sessions where host_user_id=u and status='waiting';
 if s.session_id is null and p_create then
  select version_id into v from public.content_versions where status='published' and published_at is not null order by published_at desc,version_id limit 1;
  if v is null then return jsonb_build_object('error','No published simulation is available. Please contact the facilitator.'); end if;
  loop
   begin
    insert into public.group_sessions(join_code,host_user_id,facilitator_user_id,current_scenario_id,round_deadline,status,created_at,version_id)
    values(upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),u,null,null,null,'waiting',now(),v) returning * into s;
    exit;
   exception when unique_violation then null;
   end;
  end loop;
 end if;
 if s.session_id is null then return null; end if;
 return jsonb_build_object('sessionId',s.session_id,'joinCode',s.join_code,'status',s.status,'createdAt',s.created_at,'versionId',s.version_id);
end $$;
create function public.host_group_session(p_create boolean default false) returns jsonb language sql security invoker set search_path='' as $$select group_private.host_session(p_create)$$;
create function group_private.join_session(p_code text) returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.group_sessions; u uuid:=auth.uid(); n integer;
begin
 if u is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=false then raise exception 'Anonymous session required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,932));
 insert into group_private.join_attempts values(u,now(),1) on conflict(user_id) do update set
 attempts=case when group_private.join_attempts.window_start < now()-interval '1 minute' then 1 else group_private.join_attempts.attempts+1 end,
 window_start=case when group_private.join_attempts.window_start < now()-interval '1 minute' then now() else group_private.join_attempts.window_start end returning attempts into n;
 if n>10 then return jsonb_build_object('error','Too many attempts. Wait one minute and try again.'); end if;
 select * into s from public.group_sessions where join_code=upper(btrim(p_code)) and status='waiting' for update;
 if s.session_id is null then return jsonb_build_object('error','Session unavailable. Check the code with your facilitator and try again.'); end if;
 if s.host_user_id=u then return jsonb_build_object('error','You are hosting this session. Players should join from their own browser.'); end if;
 insert into public.group_participants(session_id,user_id) values(s.session_id,u) on conflict do nothing;
 return jsonb_build_object('sessionId',s.session_id,'joinCode',s.join_code,'status',s.status,'createdAt',s.created_at,'versionId',s.version_id);
end $$;
create function public.join_group_session(p_code text) returns jsonb language sql security invoker set search_path='' as $$select group_private.join_session(p_code)$$;
revoke all on function group_private.host_session(boolean),group_private.join_session(text),public.host_group_session(boolean),public.join_group_session(text) from public,anon,authenticated,service_role;
grant execute on function group_private.host_session(boolean),group_private.join_session(text),public.host_group_session(boolean),public.join_group_session(text) to authenticated;
commit;

