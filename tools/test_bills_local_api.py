#!/usr/bin/env python3
"""Exercise the fixed local Supabase API with the synthetic bills fixture only."""
from decimal import Decimal
import uuid
from verify_employment_local import auth, request

VERSION = '63100000-0000-4000-8000-000000000800'
SELECT = ('playthrough_id,persona_id,version_id,owner_user_id,current_scenario_id,'
          'current_balance,current_day,cac_support_enabledabled,status,started_at,'
          'session_id,current_job_id,employment_state')


def main():
    personas = request('/rest/v1/personas?select=persona_id,name,general_starting_balance&version_id=eq.' + VERSION)
    assert len(personas) == 2
    jobs = request('/rest/v1/jobs?select=job_id&version_id=eq.' + VERSION
                   + '&is_active=eq.true&is_approved=eq.true&needs_english_skills=eq.false&needs_computer_skills=eq.false')
    assert len(jobs) >= 2
    # Empty schedules are initialized atomically without any stored marker.
    empty_personas = request('/rest/v1/personas?select=persona_id&name=eq.%5BLOCAL%20TEST%5D%20Alex')
    assert len(empty_personas) == 1
    empty_token, _ = auth()
    empty_id = request('/rest/v1/rpc/start_individual_playthrough', {'p_persona_id': empty_personas[0]['persona_id']}, empty_token)
    empty = request('/rest/v1/rpc/get_bill_snapshot', {'p_run_id': empty_id}, empty_token)
    assert empty['bills'] == [] and Decimal(str(empty['outstanding_total'])) == 0
    # The AFTER INSERT initializer rejects non-anonymous creation; no run survives.
    registered, _ = auth(True)
    before = request('/rest/v1/playthroughs?select=playthrough_id', token=registered)
    failure = request('/rest/v1/rpc/start_individual_playthrough', {'p_persona_id': personas[0]['persona_id']}, registered, allowed=(400,))
    assert 'Fresh anonymous individual playthrough required' in failure['message']
    assert request('/rest/v1/playthroughs?select=playthrough_id', token=registered) == before == []
    print('PASS: actual Auth/REST empty schedule and initializer rejection rolls back creation')
    for persona in personas:
        token, owner = auth()
        run_id = request('/rest/v1/rpc/start_individual_playthrough', {'p_persona_id': persona['persona_id']}, token)
        # Reproduce the exact frontend GET that previously failed with HTTP 400.
        loaded = request('/rest/v1/playthroughs?select=' + SELECT + '&playthrough_id=eq.' + run_id, token=token)
        assert len(loaded) == 1 and loaded[0]['owner_user_id'] == owner

        def snapshot():
            return request('/rest/v1/rpc/get_bill_snapshot', {'p_run_id': run_id}, token)

        def action(kind, **fields):
            saved = snapshot()
            return request('/rest/v1/rpc/submit_employment_action', {
                'p_run_id': run_id, 'p_request_id': str(uuid.uuid4()),
                'p_revision': saved['run']['employment_state']['revision'], 'p_action': {'type': kind, **fields},
            }, token)

        def bill_action(kind, bill, reject=False):
            before = snapshot()
            result = request('/rest/v1/rpc/' + kind + '_bill', {
                'p_run_id': run_id, 'p_occurrence_id': bill['playthrough_expense_id'],
            }, token, allowed=(400,) if reject else (200,))
            if reject:
                assert snapshot() == before, 'Rejected payment must leave saved state unchanged'
                assert before['run']['status'] == 'active'
            return result

        original = snapshot()
        assert len(original['bills']) == 8
        assert [b['due_day'] for b in original['bills'] if b['name_snapshot'] == 'Local rent'] == [2, 9, 16, 23, 30]
        low_funds = 'Low funds' in persona['name']
        rejected = 0
        for _ in range(150):
            saved = snapshot()
            run = saved['run']
            stage = run['employment_state']['stage']
            day = run['current_day']
            if stage == 'complete':
                break
            if stage == 'uninitialized':
                action('initialize')
            elif stage == 'board':
                action('apply', jobId=jobs[0]['job_id'])
            elif stage == 'reapply':
                action('apply', jobId=jobs[1]['job_id'])
            elif stage == 'interview':
                action('interview', choice='current')
            elif stage == 'day':
                if day == 10:
                    for bill in saved['bills']:
                        if bill['ignored_at'] and not bill['paid_at']:
                            bill_action('pay', bill)
                for bill in snapshot()['bills']:
                    if bill['due_day'] != day or bill['paid_at'] or bill['ignored_at']:
                        continue
                    if day == 30:
                        bill_action('ignore', bill)
                    elif Decimal(str(snapshot()['run']['current_balance'])) < Decimal(str(bill['amount_due'])):
                        bill_action('pay', bill, reject=True)
                        rejected += 1
                        first = bill_action('ignore', bill)
                        repeated = bill_action('ignore', bill)
                        assert first['bill']['ignored_at'] == repeated['bill']['ignored_at']
                    else:
                        first = bill_action('pay', bill)
                        repeated = bill_action('pay', bill)
                        assert first['bill']['paid_at'] == repeated['bill']['paid_at']
                        assert first['run']['current_balance'] == repeated['run']['current_balance']
                current = snapshot()['run']
                if current['current_scenario_id']:
                    choices = request('/rest/v1/choices?select=choice_id&balance_change=eq.0&scenario_id=eq.'
                                      + current['current_scenario_id'], token=token)
                    assert len(choices) == 1
                    request('/rest/v1/rpc/submit_scenario_decision', {
                        'p_run_id': run_id, 'p_scenario_id': current['current_scenario_id'], 'p_choice_id': choices[0]['choice_id'],
                    }, token)
                action('continue')
            else:
                assert stage in ('preparation-result', 'application-result', 'interview-result', 'reapply-result', 'income')
                action('continue')
        else:
            raise AssertionError('Local run did not reach completion')
        final = snapshot()
        assert final['run']['status'] == 'completed' and final['run']['current_day'] == 30
        assert Decimal(str(final['outstanding_total'])) == Decimal('71')
        assert Decimal(str(final['overdue_total'])) == Decimal('71')
        assert final['run']['employment_state']['creditedDays'] == [10, 17, 24]
        balance = Decimal(str(final['run']['current_balance']))
        paid = Decimal(str(final['paid_total']))
        income = sum(max(Decimal(str(e['change'])), 0) for e in final['run']['employment_state']['history'])
        assert balance - income + paid == Decimal(str(persona['general_starting_balance']))
        assert (rejected > 0) == low_funds
        print(f"PASS: {persona['name']} — exact frontend GET, new schedule, Days 2/3 bills, payment retries, "
              f"{rejected} rejected payments, later settlement, scenario progression, refresh snapshot and Day 30 debt")
    print('PASS: fixed local Supabase Auth/REST workflow; no hosted endpoints used.')


if __name__ == '__main__':
    main()
