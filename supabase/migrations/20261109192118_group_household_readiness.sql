begin;

alter table public.group_participants
  add column persona_id uuid references public.personas(persona_id) on delete restrict,
  add column is_ready boolean not null default false;

create index group_participants_persona_idx
  on public.group_participants(persona_id) where persona_id is not null;

alter function group_private.read_session_state(uuid)
  rename to read_session_state_base;

create function group_private.read_session_state(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  base jsonb;
  s public.group_sessions;
  u uuid := auth.uid();
  member_id uuid;
  caller_is_host boolean;
  own_persona uuid;
  own_ready boolean;
  own_household text;
begin
  base := group_private.read_session_state_base(p_session_id);
  if base ? 'error' then return base; end if;

  select * into s from public.group_sessions where session_id = p_session_id;
  caller_is_host := s.host_user_id = u;
  select gp.participant_id, gp.persona_id, gp.is_ready, p.name
    into member_id, own_persona, own_ready, own_household
  from public.group_participants gp
  left join public.personas p on p.persona_id = gp.persona_id
  where gp.session_id = p_session_id and gp.user_id = u;

  return base || jsonb_build_object(
    'householdId', own_persona,
    'householdName', own_household,
    'ready', coalesce(own_ready, false),
    'readyCount', (select count(*)::integer from public.group_participants
      where session_id = p_session_id and is_ready),
    'participants', case when caller_is_host then (
      select coalesce(jsonb_agg(jsonb_build_object(
        'participantId', x.participant_id,
        'alias', 'Participant ' || lpad(x.position::text, 2, '0'),
        'householdId', x.persona_id,
        'householdName', x.household_name,
        'ready', x.is_ready
      ) order by x.position), '[]'::jsonb)
      from (
        select gp.participant_id, gp.persona_id, gp.is_ready, p.name household_name,
          row_number() over (order by gp.joined_at, gp.participant_id) position
        from public.group_participants gp
        left join public.personas p on p.persona_id = gp.persona_id
        where gp.session_id = p_session_id
      ) x
    ) else null end
  );
end
$$;

create or replace function public.get_group_session_state(p_session_id uuid)
returns jsonb language sql security invoker set search_path = ''
as $$ select group_private.read_session_state(p_session_id) $$;

create function group_private.update_participant_setup(
  p_session_id uuid,
  p_persona_id uuid,
  p_ready boolean
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare s public.group_sessions; member_id uuid;
begin
  if auth.uid() is null
     or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false then
    raise exception 'Anonymous session required' using errcode = '42501';
  end if;
  select * into s from public.group_sessions where session_id = p_session_id for update;
  select participant_id into member_id from public.group_participants
    where session_id = p_session_id and user_id = auth.uid();
  if member_id is null then raise exception 'Setup denied' using errcode = '42501'; end if;
  if s.status <> 'open' or s.round_state <> 'lobby' then
    return jsonb_build_object('error', 'Household settings are locked after the session starts.');
  end if;
  if p_persona_id is not null and not exists (
    select 1 from public.personas where persona_id = p_persona_id
      and version_id = s.version_id
  ) then return jsonb_build_object('error', 'Choose an available household.'); end if;
  if p_ready and p_persona_id is null then
    return jsonb_build_object('error', 'Choose a household before marking ready.');
  end if;
  update public.group_participants set persona_id = p_persona_id, is_ready = p_ready
  where session_id = p_session_id and participant_id = member_id;
  return group_private.read_session_state(p_session_id);
end
$$;

create function public.update_group_participant_setup(
  p_session_id uuid,
  p_persona_id uuid,
  p_ready boolean
) returns jsonb language sql security invoker set search_path = ''
as $$ select group_private.update_participant_setup(p_session_id, p_persona_id, p_ready) $$;

create function group_private.require_ready_to_start()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if old.round_state = 'lobby' and new.round_state = 'voting' and (
    not exists (select 1 from public.group_participants where session_id = new.session_id)
    or exists (select 1 from public.group_participants
      where session_id = new.session_id and (not is_ready or persona_id is null))
  ) then
    raise exception 'All joined participants must choose a household and be ready before starting.'
      using errcode = '23514';
  end if;
  return new;
end
$$;
create trigger group_sessions_require_ready
before update of round_state on public.group_sessions
for each row execute function group_private.require_ready_to_start();

revoke all on function group_private.read_session_state(uuid),
  group_private.update_participant_setup(uuid, uuid, boolean),
  public.update_group_participant_setup(uuid, uuid, boolean)
from public, anon, authenticated, service_role;
grant execute on function group_private.read_session_state(uuid),
  group_private.update_participant_setup(uuid, uuid, boolean),
  public.update_group_participant_setup(uuid, uuid, boolean)
to authenticated;

commit;
