# Lunara Phase 2E Finalization — Security Review

Review date: 2026-11-27

## Scope and limitations

Reviewed `supabase/migrations/20261127000005_admin_audit_and_affirmations.sql` and the related Admin, affirmation, audit, Wisdom, provider, and export implementations. The migration was not applied, no SQL was executed, and live Supabase policies and behavior were not independently verified.

## Findings

### 1. Medium — Sensitive reads and exports are not blocked when auditing fails

**Evidence**

- `src/services/adminService.ts:153-196` fetches selected-user records before attempting `user_records_viewed`. If the audit RPC fails, the service returns the records with an `auditWarning`.
- `src/pages/admin/AdminUserDetailPage.tsx:334-337` displays the warning but continues to show the records.
- `src/pages/admin/AdminExportPage.tsx:429-454` starts the browser download before awaiting `user_data_exported`; a failed audit is reported after the export completes.

**Impact:** A selected-user view or export can succeed without its expected audit event. The UI surfaces the failure, but the operation is fail-open.

### 2. Medium — Admin audit RPC accepts self-reported view/export events

**Evidence:** `supabase/migrations/20261127000005_admin_audit_and_affirmations.sql:145-210` exposes `append_admin_audit_log(p_action, p_target_user_id, p_metadata)` to authenticated callers. It verifies `auth.uid()` and `public.is_admin()`, allowlists actions and metadata, and derives the actor from `auth.uid()`. It does not independently verify that a read or export actually occurred.

**Impact:** A verified Admin can invoke the RPC directly and create a permitted event for any existing target user, even if the corresponding view/export did not happen. A normal non-admin user cannot use it to create an Admin event. Actor ID and actor role are not caller-controlled.

### 3. Low — Existing Wisdom policy exposes draft rows to authenticated users

**Evidence:** `supabase/migrations/20261127000004_shared_wisdom_library.sql:68-72` defines the authenticated read policy with `USING (true)`. The UI filters to published entries, but the database policy allows authenticated clients to query draft/inactive rows directly.

**Impact:** This matters only if unpublished Wisdom entries are intended to be confidential. This policy predates migration 05 and migration 05 does not alter it.

## Migration security summary

- `affirmations` has authenticated `SELECT`, `INSERT`, `UPDATE`, and `DELETE` grants, with RLS allowing reads of published rows or any row for `public.is_admin()`, and restricting all writes to Admins.
- `audit_logs` has authenticated `SELECT` only, with an Admin-only read policy. Authenticated users have no direct insert, update, or delete privilege or policy.
- `append_admin_audit_log` is `SECURITY DEFINER`, has `search_path = public, pg_temp`, verifies the Admin role, derives actor identity from `auth.uid()`, and constrains action/metadata.
- Shared-content audit triggers also use `SECURITY DEFINER` with a fixed search path and require a verified Admin. A trigger audit-insert failure aborts its associated content mutation.
- Affirmation seed rows use `ON CONFLICT (id) DO NOTHING`: rerunning the seed does not overwrite existing rows, but a manually replayed seed statement can reinsert an ID that was previously deleted. Normal migration-ledger execution should not replay an applied migration.
- Migration 05 depends on the earlier `is_admin()`, `set_updated_at()`, and `wisdom_content` objects. Apply it only after the prerequisites, including migration 04.

## Verdict

**NOT SAFE TO APPLY YET** if Admin views/exports are required to be audited reliably. Resolve or formally accept the fail-open behavior and the self-reported event limitation first. Also confirm whether authenticated users are intentionally allowed to read draft Wisdom rows.

No critical or high-severity issue was identified in the reviewed changes. This is a source review only, not a live database security verification.

## Validation status

Previously reported in the implementation session: `npm run lint`, `npm run build`, and `git diff --check` passed. The build had existing Vite `__dirname` and large-chunk warnings. These commands were not rerun for this review.
