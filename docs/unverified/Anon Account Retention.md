# Proposed Policy: Anonymous Account and Playthrough Retention

**Status**: Proposed — implementation deferred until database schema and cleanup mechanisms are established.

## 1. Anonymous Account Retention

Anonymous participant accounts should have a target lifetime of approximately 30 days.

 - Anonymous accounts should be eligible for cleanup once they are older than 30 days.
 - Accounts may be deleted earlier if explicitly terminated or removed under an applicable administrative or retention policy.
 - The eventual cleanup mechanism must account for Supabase Auth's lack of automatic anonymous-user expiration. A scheduled cleanup process will need to be established.
Account age, activity tracking, and the precise expiration criteria must be defined during implementation.

## 2. Playthrough Persistence

A playthrough is considered persistent only after it has been successfully completed.

### Incomplete playthroughs
 - Incomplete playthroughs are temporary and should exist only while their associated anonymous account remains valid.
 - An incomplete playthrough may be deleted earlier if explicitly terminated.
 - When an anonymous account is deleted due to expiration or another applicable cleanup policy, all associated incomplete playthroughs and their dependent temporary data must also be deleted.
 - Abandoned playthroughs must not remain indefinitely after their associated accounts expire.

### Completed playthroughs
 - Completed playthroughs and their associated results are eligible for long-term retention because they may be valuable for workshop analysis and comparison with real-world data.
 - Completion must be explicitly recorded and validated rather than inferred solely from client-submitted state.
 - Completed records must not be deleted merely because the originating anonymous account expires.
Retention of completed records must be governed by a separate policy defining retention duration, access permissions, and any required anonymization or aggregation.

## 3. Cleanup and Data Integrity Requirements

The eventual implementation must:

1. Identify expired anonymous accounts using a defined expiration rule.
2. Delete incomplete playthroughs and their dependent temporary records when their associated accounts are removed.
3. Preserve completed playthrough records according to the completed-data retention policy.
4. Handle account deletion and associated record cleanup consistently, avoiding orphaned records and unintended deletion of completed results.
5. Enforce the intended lifecycle through appropriate database relationships, permissions, and trusted cleanup logic rather than relying exclusively on frontend behavior.

## 4. Outstanding Design Decisions

The following decisions remain open until the database schema and operational requirements are established:

 - Whether the 30-day lifetime is measured from account creation or last activity.
 - Whether completed playthroughs are retained indefinitely or for a defined period.
 - How completed results will remain useful if the originating anonymous account is deleted. (Trust, lmao)
 - How explicitly terminated playthroughs are identified and cleaned up.
 - Which scheduled or administrative process will perform cleanup and how failures will be monitored.
 - Whether additional privacy, data minimization, or institutional retention requirements apply.

Guiding principle: Anonymous accounts and incomplete playthroughs are temporary. Successfully completed playthroughs may outlive their originating accounts and are retained according to a separate data-retention policy.
