-- Disposable synthetic test content. Explicit zero wages/effects isolate publication
-- from known positive-income group failures. Never updates designer content.
CREATE OR REPLACE FUNCTION pg_temp.publication_source() RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE v uuid:=gen_random_uuid(); p uuid:=gen_random_uuid(); j uuid; s uuid; i integer; role text;
BEGIN
 INSERT INTO public.content_versions(version_id,version_number,status,created_at,change_summary) VALUES(v,1,'draft',now(),'Disposable publication fixture');
 FOR i IN 1..2 LOOP
  INSERT INTO public.jobs(version_id,soc_code,title,description,area_code,area_name,geography_level,wage_year,median_hourly_wage,hours_per_week,wage_source_url,reviewed_at,is_active,is_approved,needs_english_skills,needs_computer_skills)
  VALUES(v,'11-100'||i,'Fixture job '||i,'Test only','12060','Atlanta','MSA',2026,0,40,'https://www.bls.gov/oes/','2026-01-01T00:00:00Z',true,true,false,false);
 END LOOP;
 INSERT INTO public.personas(persona_id,version_id,name,description,general_starting_balance,weekly_income,has_english_skills,has_computer_skills)
 VALUES(p,v,'Publication household','Synthetic household',100,0,false,false);
 FOR i IN 1..31 LOOP
  s:=gen_random_uuid();
  INSERT INTO public.scenarios(scenario_id,version_id,title,description,category_id,persona_intent,schedule_type,default_day)
  VALUES(s,v,CASE WHEN i=31 THEN 'Configured tax' ELSE 'Ordinary '||lpad(i::text,2,'0') END,'Synthetic situation '||i,(SELECT category_id FROM public.categories ORDER BY category_id LIMIT 1),p,CASE WHEN i=31 THEN 'scheduled' ELSE 'non_scheduled' END,CASE WHEN i=31 THEN 18 ELSE NULL END);
  INSERT INTO public.scenario_library_metadata(scenario_id,version_id,library_key,engine) VALUES(s,v,CASE WHEN i=31 THEN 'D005' ELSE 'D'||(100+i)::text END,'ordinary');
  INSERT INTO public.choices(scenario_id,version_id,choice_text,response_text,balance_change,next_scenario_id,requires_cac,upfront_cost) VALUES(s,v,'Continue '||i,'Recorded response '||i,0,NULL,false,0);
  FOREACH role IN ARRAY ARRAY['general','cac'] LOOP
   INSERT INTO public.scenario_fact_copy(scenario_id,version_id,fact_role,semantic_key,display_text,source_url,reporting_period,verified,evidence)
    VALUES(s,v,role,role||':fixture:'||i,'Synthetic fact '||i,'https://example.invalid/source','2026',false,jsonb_build_object('retained',i));
  END LOOP;
 END LOOP;
 UPDATE public.content_versions SET status='published',published_at=clock_timestamp() WHERE version_id=v;
 RETURN v;
END $$;
