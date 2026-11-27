# Lunara Phase 2E.4 — Audit Integrity Remediation

Review date: 2026-11-27

## Status

The Phase 2E audit findings have been addressed in the local implementation and proposed migrations. Neither migration `20261127000005_admin_audit_and_affirmations.sql` nor `20261127000006_admin_audit_integrity_and_wisdom_visibility.sql` has been applied to Supabase. Live RLS/function behavior remains unverified.

## Remediations

- Removed the self-reporting `append_admin_audit_log` RPC. Selected-user record retrieval and export preparation now use separate fixed-purpose database functions which verify `auth.uid()` and `public.is_admin()`, validate the target account, insert a fixed audit action, and only then return the requested data.
- The view function returns no private records if audit insertion fails. The export function validates format/categories/date range and journal confirmation, records only format/categories, and returns only data required for the selected export categories after audit succeeds.
- Forward migration `20261127000006_admin_audit_integrity_and_wisdom_visibility.sql` removes direct Admin cross-user SELECT policies for check-ins, journals, and preferences. Owner-level policies remain; cross-user private records are returned through the audited functions.
- The same forward migration changes the authenticated Wisdom SELECT policy to published rows or verified Admins. Admin CRUD policies remain unchanged.

## Remaining limitations

- A browser download cannot be proven to have completed or been saved. The export audit event represents successful server-side authorization, audit insertion, data preparation, and response to the authenticated Admin client; the app does not initiate a download unless that operation succeeds.
- Privileged database owners/service roles can bypass application RLS and append-only client restrictions.
- These protections require manually applying migrations 000005 and 000006 in order. No live database verification has been performed.

## Validation

Local validation is reported in the implementation task. It does not establish live Supabase policy/function behavior.
