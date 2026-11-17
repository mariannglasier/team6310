\set ON_ERROR_STOP on
BEGIN;
SELECT set_config('request.jwt.claim.sub',(SELECT user_id::text FROM public.cac_staff WHERE active LIMIT 1),true);
SELECT set_config('request.jwt.claim.role','authenticated',true);
DO $$ DECLARE req uuid:=gen_random_uuid(); v uuid; cat uuid; r jsonb; id uuid; c uuid; payload jsonb; rev integer; BEGIN
 SELECT version_id INTO v FROM public.content_versions WHERE status='published' ORDER BY version_number DESC LIMIT 1;
 v:=public.cms_create_draft(v,'Atomic choice test',gen_random_uuid());
 SELECT category_id INTO cat FROM public.categories LIMIT 1;
 payload:='[{"choice_id":null,"choice_text":"A","response_text":"Result","balance_change":"-5.25","upfront_cost":"10","requires_cac":true,"next_scenario_id":null},{"choice_id":null,"choice_text":"B","response_text":"Other","balance_change":"0","upfront_cost":"0","requires_cac":false,"next_scenario_id":null}]';
 r:=public.cms_save_scenario_bundle(v,0,req,NULL,'Scheduled test','Description',cat,NULL,'scheduled',10,payload);
 ASSERT r=public.cms_save_scenario_bundle(v,0,req,NULL,'Scheduled test','Description',cat,NULL,'scheduled',10,payload);
 id:=(r->>'scenario_id')::uuid;
 ASSERT (SELECT default_day=10 FROM public.scenarios WHERE scenario_id=id);
 SELECT choice_id INTO c FROM public.choices WHERE scenario_id=id AND choice_text='A';
 ASSERT c IS NOT NULL;
 payload:=(SELECT jsonb_agg(to_jsonb(ch) ORDER BY choice_text DESC) FROM public.choices ch WHERE scenario_id=id);
 r:=public.cms_save_scenario_bundle(v,1,gen_random_uuid(),id,'Updated','Description',cat,NULL,'non_scheduled',NULL,payload);
 ASSERT (SELECT choice_id=c FROM public.choices WHERE scenario_id=id AND choice_text='A');
 BEGIN PERFORM public.cms_save_scenario_bundle(v,0,gen_random_uuid(),id,'Stale','Description',cat,NULL,'scheduled',10,payload); RAISE EXCEPTION 'Stale accepted'; EXCEPTION WHEN serialization_failure THEN NULL; END;
 ASSERT (SELECT position=1 FROM cms_private.choice_order WHERE choice_id=c);
 BEGIN
 PERFORM public.cms_save_scenario_bundle(v,2,gen_random_uuid(),id,'Must rollback','Description',cat,NULL,'scheduled',31,payload);
 RAISE EXCEPTION 'Invalid day accepted'; EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM='Invalid schedule'; END;
 payload:=jsonb_set(payload,'{0,upfront_cost}','"-1"');
 BEGIN
 PERFORM public.cms_save_scenario_bundle(v,2,gen_random_uuid(),id,'Must rollback','Description',cat,NULL,'scheduled',9,payload);
 RAISE EXCEPTION 'Invalid money accepted'; EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM='Invalid choice money'; END;
 ASSERT (SELECT title='Updated' FROM public.scenarios WHERE scenario_id=id);
 ASSERT (SELECT revision=2 FROM cms_private.workspaces WHERE version_id=v);
 r:=public.cms_save_scenario_bundle(v,2,gen_random_uuid(),id,'Updated','Description',cat,NULL,'non_scheduled',NULL,'[]');
 ASSERT NOT EXISTS(SELECT 1 FROM public.choices WHERE scenario_id=id);
 RAISE NOTICE 'Atomic choice create/edit/order/delete/rollback passed';
END $$;
ROLLBACK;
