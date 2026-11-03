-- Review-only additive migration. Never backfills or initializes existing runs.
-- Deployment prerequisite: verify playthrough status CHECKs accept completed/ended.
begin;
create function public.mark_fresh_employment_run() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.employment_state is null and new.status = 'active' and new.current_day = 1
     and new.current_job_id is null and new.current_scenario_id is null
     and new.session_id is null and new.cac_support_enabledabled is null then
    update public.playthroughs set employment_state = jsonb_build_object(
      'engine','employment-v1','schemaVersion',1,'revision',0,'stage','uninitialized','receipts','{}'::jsonb)
    where playthrough_id = new.playthrough_id;
  end if;
  return new;
end $$;
revoke all on function public.mark_fresh_employment_run() from public, anon, authenticated;
-- AFTER INSERT keeps the existing invoker RPC and initial INSERT policy unchanged.
create trigger mark_fresh_employment_run after insert on public.playthroughs
for each row execute function public.mark_fresh_employment_run();

create function public.submit_employment_action(p_run_id uuid, p_request_id uuid,
  p_revision integer, p_action jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
 r public.playthroughs%rowtype; prev public.playthroughs%rowtype;
 s jsonb; receipt jsonb; st text; a text; choice text;
 j public.jobs%rowtype; persona public.personas%rowtype;
 support boolean; hired boolean; cost numeric; delta numeric := 0;
 day integer; event jsonb; revision integer; next_stage text;
begin
 if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) is not true then
   raise exception 'Participant authentication required';
 end if;
 select * into r from public.playthroughs where playthrough_id=p_run_id for update;
 if not found or r.owner_user_id is distinct from auth.uid() then raise exception 'Run unavailable'; end if;
 s := r.employment_state;
 if s is null or jsonb_typeof(s) <> 'object' or s->>'engine' is distinct from 'employment-v1' or s->>'schemaVersion' is distinct from '1'
    or jsonb_typeof(s->'receipts') is distinct from 'object'
    or jsonb_typeof(s->'revision') is distinct from 'number'
    or (s->>'revision') !~ '^[0-9]+$' then raise exception 'Unsupported employment state; run unchanged'; end if;
 if p_request_id is null or p_revision is null or p_action is null or jsonb_typeof(p_action)<>'object' then raise exception 'Invalid request'; end if;
 if exists(select 1 from jsonb_object_keys(s) k where k not in ('engine','schemaVersion','revision','stage','receipts','prepared','hasEnglishSkills','hasComputerSkills','clothing','targetId','initialTargetId','hiredDay','weeklyIncome','assistanceUsed','history','creditedDays','reason')) then raise exception 'Unfamiliar employment document'; end if;
 if exists(select 1 from jsonb_each(s->'receipts') e where jsonb_typeof(e.value->'action') is distinct from 'object' or jsonb_typeof(e.value->'expectedRevision') is distinct from 'number') then raise exception 'Invalid receipts'; end if;
 receipt := s->'receipts'->p_request_id::text;
 if receipt is not null then
   if receipt->'action' is distinct from p_action or (receipt->>'expectedRevision')::integer <> p_revision then raise exception 'Request identity reused'; end if;
   return jsonb_build_object('run',to_jsonb(r),'receipt',receipt);
 end if;
 if not (s ?& array['engine','schemaVersion','revision','stage','receipts']) then raise exception 'Incomplete document'; end if;
 revision := (s->>'revision')::integer;
 if revision <> p_revision then raise exception 'Stale revision'; end if;
 if r.status is distinct from 'active' or r.session_id is not null then raise exception 'Run is not active individual gameplay'; end if;
 st:=s->>'stage'; a:=p_action->>'type'; day:=r.current_day;
 if a is null or a not in ('initialize','prepare','apply','interview','continue','end') then raise exception 'Invalid action'; end if;
 if exists(select 1 from jsonb_object_keys(p_action) k where k not in ('type',case a when 'initialize' then 'replayOf' when 'apply' then 'jobId' when 'interview' then 'choice' else 'type' end)) then raise exception 'Unexpected action fields'; end if;
 if a='initialize' then
   if st is distinct from 'uninitialized' or revision<>0 or day<>1 or r.current_balance is null
      or r.current_job_id is not null or r.current_scenario_id is not null
      or r.cac_support_enabledabled is not null then raise exception 'Not a fresh run'; end if;
   select * into persona from public.personas where persona_id=r.persona_id and version_id=r.version_id;
   if not found or persona.has_english_skills is null or persona.has_computer_skills is null then raise exception 'Skills unavailable'; end if;
   if not exists(select 1 from public.content_versions where version_id=r.version_id and status='published' and published_at is not null) then raise exception 'Edition unavailable'; end if;
   if (select count(*) from public.jobs where version_id=r.version_id and is_active and is_approved and needs_english_skills=false and needs_computer_skills=false)<2 then raise exception 'Insufficient eligible catalog'; end if;
   support:=false;
   if p_action->>'replayOf' is not null then
     if (p_action->>'replayOf')::uuid=p_run_id then raise exception 'Invalid replay'; end if;
     select * into prev from public.playthroughs where playthrough_id=(p_action->>'replayOf')::uuid;
     if not found or prev.owner_user_id is distinct from auth.uid() or prev.status is distinct from 'completed'
        or prev.cac_support_enabledabled is distinct from false
        or prev.employment_state->>'engine' is distinct from 'employment-v1'
        or prev.employment_state->>'schemaVersion' is distinct from '1'
        or prev.employment_state->>'stage' is distinct from 'complete' or prev.current_day<>30 then raise exception 'Replay not eligible'; end if;
     support:=true;
   end if;
   r.cac_support_enabledabled:=support;
   s:=s || jsonb_build_object('stage','board','prepared',false,'hasEnglishSkills',persona.has_english_skills,
     'hasComputerSkills',persona.has_computer_skills,'clothing','none','targetId',null,'initialTargetId',null,
     'hiredDay',null,'weeklyIncome','0.00','assistanceUsed',false,'history','[]'::jsonb,'creditedDays','[]'::jsonb,'reason',null);
 else
   if not (s ?& array['prepared','hasEnglishSkills','hasComputerSkills','assistanceUsed','clothing','history','creditedDays','targetId','initialTargetId','hiredDay','weeklyIncome','reason']) or st is null or st not in ('board','preparation-result','application-result','day','interview','interview-result','reapply','reapply-result','income')
      or day is null or day not between 1 and 30
      or jsonb_typeof(s->'history') is distinct from 'array' or jsonb_typeof(s->'creditedDays') is distinct from 'array'
      or jsonb_typeof(s->'prepared') is distinct from 'boolean' or jsonb_typeof(s->'hasEnglishSkills') is distinct from 'boolean'
      or jsonb_typeof(s->'hasComputerSkills') is distinct from 'boolean' or jsonb_typeof(s->'assistanceUsed') is distinct from 'boolean'
      or jsonb_typeof(s->'clothing') is distinct from 'string' or s->>'clothing' not in ('none','purchased','cac') or r.cac_support_enabledabled is null
      or exists(select 1 from jsonb_array_elements(s->'history') e where jsonb_typeof(e->'text') is distinct from 'string' or jsonb_typeof(e->'day') is distinct from 'number' or jsonb_typeof(e->'change') is distinct from 'string')
      or jsonb_typeof(s->'weeklyIncome') is distinct from 'string' or (s->>'weeklyIncome') !~ '^[0-9]+([.][0-9]{1,2})?$'
      or (s->>'hiredDay' is not null and (s->>'hiredDay') not in ('2','3'))
      or exists(select 1 from jsonb_array_elements(s->'creditedDays') x where jsonb_typeof(x)<>'number' or x::text !~ '^[0-9]+$')
      or r.current_balance is null then raise exception 'Invalid employment structure'; end if;
   if a='prepare' then
     if st<>'board' or not r.cac_support_enabledabled or (s->>'prepared')::boolean then raise exception 'Preparation unavailable'; end if;
     s:=s || '{"prepared":true,"hasEnglishSkills":true,"hasComputerSkills":true,"assistanceUsed":true,"stage":"preparation-result"}';
     event:=jsonb_build_object('text','Completed simulated CAC preparation');
   elsif a='apply' then
     if st not in ('board','reapply') then raise exception 'Application unavailable'; end if;
     select * into j from public.jobs where job_id=(p_action->>'jobId')::uuid and version_id=r.version_id and is_active and is_approved;
     if not found or j.needs_english_skills is null or j.needs_computer_skills is null
        or (j.needs_english_skills and not (s->>'hasEnglishSkills')::boolean)
        or (j.needs_computer_skills and not (s->>'hasComputerSkills')::boolean)
        or (st='reapply' and j.job_id::text=s->>'initialTargetId') then raise exception 'Job unavailable'; end if;
     if st='board' and not exists(select 1 from public.jobs x where x.version_id=r.version_id and x.job_id<>j.job_id and x.is_active and x.is_approved
        and x.needs_english_skills is not null and x.needs_computer_skills is not null
        and (not x.needs_english_skills or (s->>'hasEnglishSkills')::boolean)
        and (not x.needs_computer_skills or (s->>'hasComputerSkills')::boolean)) then raise exception 'No fallback available'; end if;
     s:=s || jsonb_build_object('targetId',j.job_id,'initialTargetId',coalesce(s->>'initialTargetId',j.job_id::text),'stage',case st when 'board' then 'application-result' else 'reapply-result' end);
     event:=jsonb_build_object('text','Applied for '||j.title,'jobId',j.job_id);
   elsif a='interview' then
     choice:=p_action->>'choice';
     if st<>'interview' or day not in (2,3) or choice is null or choice not in ('purchase','current','cac','owned')
       or (s->>'clothing'<>'none' and choice<>'owned') or (s->>'clothing'='none' and choice='owned')
       or (choice='cac' and not r.cac_support_enabledabled) then raise exception 'Clothing unavailable'; end if;
     select * into j from public.jobs where job_id=(s->>'targetId')::uuid and version_id=r.version_id;
     if not found or j.weekly_gross_income is null or j.weekly_gross_income<0 then raise exception 'Target unavailable'; end if;
     cost:=case choice when 'purchase' then 60.00 else 0 end;
     if cost>r.current_balance then
       s:=s || '{"stage":"ended","reason":"You could not afford the selected professional clothing. No purchase was charged."}'; r.status:='ended';
     else
       delta:=-cost;
       s:=s || jsonb_build_object('clothing',case choice when 'purchase' then 'purchased' when 'cac' then 'cac' else s->>'clothing' end,
          'assistanceUsed',(s->>'assistanceUsed')::boolean or choice='cac');
       hired:=day=3 or ((s->>'prepared')::boolean and s->>'clothing'<>'none');
       s:=s || jsonb_build_object('stage','interview-result','hiredDay',case when hired then day else null end,
          'weeklyIncome',case when hired then j.weekly_gross_income::text else '0.00' end);
       if hired then r.current_job_id:=j.job_id; end if;
       event:=jsonb_build_object('text',case when hired then 'Hired as '||j.title else 'First interview did not lead to an offer' end,'choice',choice,'hired',hired);
     end if;
   elsif a='end' then
     s:=s || '{"stage":"ended","reason":"You ended the walkthrough."}'; r.status:='ended';
   elsif a='continue' then
     next_stage:=case st when 'preparation-result' then 'board' when 'application-result' then 'day'
       when 'interview-result' then case when s->>'hiredDay' is null then 'reapply' else 'day' end
       when 'reapply-result' then 'day' when 'income' then 'day' when 'day' then 'day' else null end;
     if next_stage is null then raise exception 'Cannot continue'; end if;
     if st='day' then
       if day=30 then next_stage:='complete';r.status:='completed';
       else
         day:=day+1;
         if s->>'hiredDay' is not null and day>(s->>'hiredDay')::integer and (day-(s->>'hiredDay')::integer)%7=0 then
           if s->'creditedDays' @> jsonb_build_array(day) then raise exception 'Wage already credited'; end if;
           delta:=(s->>'weeklyIncome')::numeric;
           s:=jsonb_set(s,'{creditedDays}',s->'creditedDays'||jsonb_build_array(day));next_stage:='income';
           event:=jsonb_build_object('text','Weekly pay received','jobId',r.current_job_id);
         elsif day=2 or (day=3 and s->>'hiredDay' is null) then next_stage:='interview'; end if;
       end if;
     end if;
     s:=s || jsonb_build_object('stage',next_stage);
   end if;
 end if;
 r.current_balance:=r.current_balance+delta;r.current_day:=day;
 if event is not null then
   s:=jsonb_set(s,'{history}',s->'history'||jsonb_build_array(event||jsonb_build_object('day',case when st in ('board','preparation-result') then 0 else day end,'change',delta::text)));
 end if;
 receipt:=jsonb_build_object('action',p_action,'expectedRevision',p_revision,'revision',revision+1,'day',day,'change',delta::text,'stage',s->>'stage');
 s:=s || jsonb_build_object('revision',revision+1,'receipts',(s->'receipts')||jsonb_build_object(p_request_id::text,receipt));
 update public.playthroughs set employment_state=s,current_balance=r.current_balance,current_day=r.current_day,
   current_job_id=r.current_job_id,cac_support_enabledabled=r.cac_support_enabledabled,status=r.status
 where playthrough_id=p_run_id returning * into r;
 return jsonb_build_object('run',to_jsonb(r),'receipt',receipt);
end $$;
revoke all on function public.submit_employment_action(uuid,uuid,integer,jsonb) from public,anon;
grant execute on function public.submit_employment_action(uuid,uuid,integer,jsonb) to authenticated;
commit;
