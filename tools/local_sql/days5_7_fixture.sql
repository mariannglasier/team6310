-- Local-only copies of the Day 4 fixture, with distinct titles/descriptions/results.
BEGIN;
DO $$
DECLARE d integer; sid uuid; cid uuid; source public.scenarios%rowtype;
        original public.choices%rowtype; expected public.scenarios%rowtype;
        title text; label text;
BEGIN
 SELECT * INTO STRICT source FROM public.scenarios WHERE scenario_id='63100000-0000-4000-8000-000000000004';
 IF source.title<>'[LOCAL TEST] A decision for Day 4' OR source.default_day<>4 OR source.persona_intent<>'cfe33068-d657-482f-b770-ef3918a87e03' THEN RAISE EXCEPTION 'Expected local source fixture missing'; END IF;
 FOR d IN 5..7 LOOP
  sid:=('63100000-0000-4000-8000-'||lpad(d::text,12,'0'))::uuid;
  label:=CASE d WHEN 5 THEN 'An opportunity' WHEN 6 THEN 'An unexpected expense' ELSE 'A household tradeoff' END;
  expected:=source;
  expected.scenario_id:=sid; expected.default_day:=d;
  expected.title:='[LOCAL TEST] Day '||d||' - '||label;
  expected.description:='Day '||d||' local scheduling test: '||label||'. Choose an option to test the saved financial result.';
  INSERT INTO public.scenarios SELECT expected.* ON CONFLICT(scenario_id) DO NOTHING;
  IF NOT EXISTS(SELECT 1 FROM public.scenarios s WHERE s.scenario_id=sid AND to_jsonb(s)=to_jsonb(expected)) THEN RAISE EXCEPTION 'Scenario fixture conflict for day %',d; END IF;
  FOR original IN SELECT * FROM public.choices WHERE scenario_id=source.scenario_id ORDER BY choice_id LOOP
   cid:=('63100000-0000-4000-8000-'||lpad((d*10+right(original.choice_id::text,1)::integer)::text,12,'0'))::uuid;
   original.choice_id:=cid; original.scenario_id:=sid;
   original.response_text:='Day '||d||': '||original.response_text;
   original.next_scenario_id:=NULL;
   INSERT INTO public.choices SELECT original.* ON CONFLICT(choice_id) DO NOTHING;
   IF NOT EXISTS(SELECT 1 FROM public.choices c WHERE c.choice_id=cid AND to_jsonb(c)=to_jsonb(original)) THEN RAISE EXCEPTION 'Choice fixture conflict'; END IF;
  END LOOP;
  IF (SELECT count(*) FROM public.choices WHERE scenario_id=sid)<>3 THEN RAISE EXCEPTION 'Expected three fixture choices'; END IF;
 END LOOP;
END $$;
COMMIT;
