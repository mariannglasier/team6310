-- Synthetic local content only. Apply with tools/load_day4_fixture.py.
BEGIN;
DO $$
BEGIN
  IF current_database() <> 'postgres' OR current_user <> 'postgres' THEN
    RAISE EXCEPTION 'Unexpected database identity';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.personas p JOIN public.content_versions v USING(version_id)
    WHERE p.persona_id='cfe33068-d657-482f-b770-ef3918a87e03'
      AND p.name='[LOCAL TEST] Alex' AND v.version_id='3c463a7f-7036-4e0c-9c1b-1f5db7c502f3'
      AND v.status='published' AND v.published_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Expected local test persona/published edition missing';
  END IF;
END $$;
INSERT INTO public.categories(category_id,name,description,created_at)
VALUES ('63100000-0000-4000-8000-000000000001','[LOCAL TEST] Day 4','Synthetic scenario retrieval fixture',NULL)
ON CONFLICT (category_id) DO NOTHING;
INSERT INTO public.scenarios(scenario_id,title,description,default_day,version_id,category_id,persona_intent,schedule_type)
VALUES ('63100000-0000-4000-8000-000000000004','[LOCAL TEST] A decision for Day 4',
 'Choose how your household responds to this local test situation.',4,
 '3c463a7f-7036-4e0c-9c1b-1f5db7c502f3','63100000-0000-4000-8000-000000000001',
 'cfe33068-d657-482f-b770-ef3918a87e03','scheduled')
ON CONFLICT (scenario_id) DO NOTHING;
INSERT INTO public.choices(choice_id,scenario_id,choice_text,balance_change,response_text,next_scenario_id,version_id)
VALUES
 ('63100000-0000-4000-8000-000000000041','63100000-0000-4000-8000-000000000004','Gain $25.00',25.00,'Your household received $25.00.',NULL,'3c463a7f-7036-4e0c-9c1b-1f5db7c502f3'),
 ('63100000-0000-4000-8000-000000000042','63100000-0000-4000-8000-000000000004','Spend $15.00',-15.00,'Your household paid $15.00.',NULL,'3c463a7f-7036-4e0c-9c1b-1f5db7c502f3'),
 ('63100000-0000-4000-8000-000000000043','63100000-0000-4000-8000-000000000004','No financial change',0.00,'Your balance is unchanged.',NULL,'3c463a7f-7036-4e0c-9c1b-1f5db7c502f3')
ON CONFLICT (choice_id) DO NOTHING;
-- Reject ID collisions rather than overwriting content.
DO $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.categories WHERE category_id='63100000-0000-4000-8000-000000000001' AND name='[LOCAL TEST] Day 4' AND description='Synthetic scenario retrieval fixture' AND created_at IS NULL)
 OR NOT EXISTS (SELECT 1 FROM public.scenarios WHERE scenario_id='63100000-0000-4000-8000-000000000004'
 AND title='[LOCAL TEST] A decision for Day 4' AND description='Choose how your household responds to this local test situation.'
 AND default_day=4 AND schedule_type='scheduled' AND version_id='3c463a7f-7036-4e0c-9c1b-1f5db7c502f3'
 AND category_id='63100000-0000-4000-8000-000000000001' AND persona_intent='cfe33068-d657-482f-b770-ef3918a87e03')
 OR (SELECT count(*) FROM public.choices WHERE scenario_id='63100000-0000-4000-8000-000000000004') <> 3
 OR (SELECT count(*) FROM public.choices c JOIN (VALUES
 ('63100000-0000-4000-8000-000000000041'::uuid,'Gain $25.00',25.00,'Your household received $25.00.'),
 ('63100000-0000-4000-8000-000000000042'::uuid,'Spend $15.00',-15.00,'Your household paid $15.00.'),
 ('63100000-0000-4000-8000-000000000043'::uuid,'No financial change',0.00,'Your balance is unchanged.')
 ) e(id,label,amount,response) ON c.choice_id=e.id WHERE c.scenario_id='63100000-0000-4000-8000-000000000004'
 AND c.choice_text=e.label AND c.balance_change=e.amount AND c.response_text=e.response AND c.next_scenario_id IS NULL
 AND c.version_id='3c463a7f-7036-4e0c-9c1b-1f5db7c502f3') <> 3 THEN
 RAISE EXCEPTION 'Fixture ID/content conflict; nothing committed';
 END IF;
END $$;
COMMIT;
