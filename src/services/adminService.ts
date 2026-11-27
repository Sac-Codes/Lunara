import type { Database, Json } from '../types/database';
import type { AdminUserPrototype, CheckInEntry, JournalEntry, MoodId, UserRole } from '../types/lunara';
import {
  fail,
  mapSupabaseError,
  ok,
  isValidDateKey,
  requireAuthenticatedClient,
  type ServiceResult,
} from './serviceHelpers';

export interface AdminUserRecords {
  checkIns: AdminCheckInEntry[];
  journals: JournalEntry[];
  profile: Database['public']['Tables']['profiles']['Row'] | null;
  role: UserRole | null;
  preferences: Database['public']['Tables']['user_preferences']['Row'] | null;
}

export interface AdminUserDirectoryPage {
  users: AdminUserPrototype[];
  total: number;
}

export interface AdminCheckInEntry extends CheckInEntry {
  createdAt: string;
}

export type AdminExportCategory =
  | 'profile'
  | 'checkIns'
  | 'metrics'
  | 'likesDislikes'
  | 'journals'
  | 'activitySummary'
  | 'calendarSummary';

export interface AdminPreparedExport {
  profile: {
    id: string;
    displayName: string;
    role: UserRole;
    createdAt: string;
    preferredCheckInTime: string;
  } | null;
  preferences: Database['public']['Tables']['user_preferences']['Row'] | null;
  checkIns: Array<{
    date: string;
    mood: MoodId | null;
    notes: string | null;
    activities: string[] | null;
    customActivities: string[] | null;
    proudOf: string | null;
    needs: string[] | null;
    tomorrowIntention: string | null;
    customValues: Record<string, string | number> | null;
    happiness: number | null;
    energy: number | null;
    stress: number | null;
    likes: string[] | null;
    dislikes: string[] | null;
  }>;
  journals: JournalEntry[];
  activitySummary: { totalCheckIns: number; totalJournals: number } | null;
  calendarDates: { checkInDates: string[]; journalDates: string[] } | null;
}

const USER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_DIRECTORY_USERS = 500;

function mapCheckInRow(
  row: Database['public']['Tables']['check_ins']['Row']
): AdminCheckInEntry {
  return {
    id: row.id,
    date: row.check_in_date,
    createdAt: row.created_at,
    mood: row.mood,
    happiness: row.happiness,
    energy: row.energy,
    stress: row.stress,
    likes: row.likes,
    dislikes: row.dislikes,
    notes: row.notes,
    customValues: row.custom_values,
    activities: row.activities,
    customActivities: row.custom_activities,
    proudOf: row.proud_of,
    needs: row.needs,
    tomorrowIntention: row.tomorrow_intention,
    updatedAt: row.updated_at,
  };
}

function mapJournalRow(row: Database['public']['Tables']['journal_entries']['Row']): JournalEntry {
  return {
    id: row.id,
    date: row.entry_date,
    title: row.title,
    content: row.content,
    tags: row.tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type JsonObject = { [key: string]: Json | undefined };

function isJsonObject(value: Json | undefined): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isString(value: Json | undefined): value is string {
  return typeof value === 'string';
}

function isBoolean(value: Json | undefined): value is boolean {
  return typeof value === 'boolean';
}

function isNumber(value: Json | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isStringArray(value: Json | undefined): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isNullableString(value: Json | undefined): value is string | null {
  return value === null || typeof value === 'string';
}

function isNullableNumber(value: Json | undefined): value is number | null {
  return value === null || isNumber(value);
}

function isMoodId(value: Json | undefined): value is MoodId {
  return ['great', 'good', 'okay', 'low', 'difficult', 'unsure'].includes(String(value));
}

function isUserRole(value: Json | undefined): value is UserRole {
  return value === 'user' || value === 'admin';
}

function isCustomValues(value: Json | undefined): value is Record<string, string | number> {
  return isJsonObject(value) &&
    Object.values(value).every((item) => typeof item === 'string' || isNumber(item));
}

function isCheckInRow(
  value: Json
): value is Database['public']['Tables']['check_ins']['Row'] {
  if (!isJsonObject(value)) return false;
  return isString(value.id) &&
    isString(value.user_id) &&
    isString(value.check_in_date) &&
    (value.mood === null || isMoodId(value.mood)) &&
    isNullableNumber(value.happiness) &&
    isNullableNumber(value.energy) &&
    isNullableNumber(value.stress) &&
    isStringArray(value.likes) &&
    isStringArray(value.dislikes) &&
    isStringArray(value.activities) &&
    isStringArray(value.custom_activities) &&
    isString(value.proud_of) &&
    isStringArray(value.needs) &&
    isString(value.tomorrow_intention) &&
    isString(value.notes) &&
    isCustomValues(value.custom_values) &&
    isString(value.created_at) &&
    isString(value.updated_at);
}

function isJournalRow(
  value: Json
): value is Database['public']['Tables']['journal_entries']['Row'] {
  if (!isJsonObject(value)) return false;
  return isString(value.id) &&
    isString(value.user_id) &&
    isString(value.entry_date) &&
    isString(value.title) &&
    isString(value.content) &&
    isStringArray(value.tags) &&
    isBoolean(value.is_favorite) &&
    isString(value.created_at) &&
    isString(value.updated_at);
}

function isProfileRow(
  value: Json
): value is Database['public']['Tables']['profiles']['Row'] {
  if (!isJsonObject(value)) return false;
  return isString(value.id) &&
    isString(value.display_name) &&
    isNullableString(value.avatar_url) &&
    ['morning', 'evening', 'anytime'].includes(String(value.preferred_check_in_time)) &&
    isBoolean(value.daily_reminder_enabled) &&
    isString(value.reminder_time) &&
    isBoolean(value.show_greeting_prompts) &&
    isString(value.created_at) &&
    isString(value.updated_at);
}

function isPreferencesRow(
  value: Json
): value is Database['public']['Tables']['user_preferences']['Row'] {
  if (!isJsonObject(value)) return false;
  return isString(value.user_id) &&
    ['light', 'dark', 'system'].includes(String(value.theme_mode)) &&
    isStringArray(value.favorite_affirmation_ids) &&
    isBoolean(value.notify_affirmations) &&
    isBoolean(value.notify_daily_wisdom) &&
    isBoolean(value.notify_gentle_reminders) &&
    isBoolean(value.notify_admin_messages) &&
    isBoolean(value.notify_announcements) &&
    isString(value.created_at) &&
    isString(value.updated_at);
}

function parseUserRecords(value: Json): ServiceResult<AdminUserRecords> {
  if (!isJsonObject(value)) {
    return fail('DATABASE_ERROR', 'The secure user-record response was invalid.');
  }
  const checkIns = value.checkIns;
  const journals = value.journals;
  const profile = value.profile;
  const role = value.role;
  const preferences = value.preferences;
  if (
    !Array.isArray(checkIns) ||
    !checkIns.every(isCheckInRow) ||
    !Array.isArray(journals) ||
    !journals.every(isJournalRow) ||
    !(profile === null || (profile !== undefined && isProfileRow(profile))) ||
    !isUserRole(role) ||
    !(preferences === null || (preferences !== undefined && isPreferencesRow(preferences)))
  ) {
    return fail('DATABASE_ERROR', 'The secure user-record response did not match the expected schema.');
  }
  return ok({
    checkIns: checkIns.map(mapCheckInRow),
    journals: journals.map(mapJournalRow),
    profile,
    role,
    preferences,
  });
}

function isPreparedCheckIn(value: Json): value is AdminPreparedExport['checkIns'][number] {
  if (!isJsonObject(value)) return false;
  return isString(value.date) &&
    (value.mood === undefined || value.mood === null || isMoodId(value.mood)) &&
    (value.notes === undefined || isNullableString(value.notes)) &&
    (value.activities === undefined || value.activities === null || isStringArray(value.activities)) &&
    (value.customActivities === undefined || value.customActivities === null || isStringArray(value.customActivities)) &&
    (value.proudOf === undefined || isNullableString(value.proudOf)) &&
    (value.needs === undefined || value.needs === null || isStringArray(value.needs)) &&
    (value.tomorrowIntention === undefined || isNullableString(value.tomorrowIntention)) &&
    (value.customValues === undefined || value.customValues === null || isCustomValues(value.customValues)) &&
    (value.happiness === undefined || isNullableNumber(value.happiness)) &&
    (value.energy === undefined || isNullableNumber(value.energy)) &&
    (value.stress === undefined || isNullableNumber(value.stress)) &&
    (value.likes === undefined || value.likes === null || isStringArray(value.likes)) &&
    (value.dislikes === undefined || value.dislikes === null || isStringArray(value.dislikes));
}

function isPreparedProfile(
  value: Json
): value is NonNullable<AdminPreparedExport['profile']> {
  if (!isJsonObject(value)) return false;
  return isString(value.id) &&
    isString(value.displayName) &&
    isUserRole(value.role) &&
    isString(value.createdAt) &&
    isString(value.preferredCheckInTime);
}

function parseJournalEntry(value: Json): JournalEntry | null {
  if (!isJsonObject(value)) return null;
  if (
    !isString(value.id) ||
    !isString(value.date) ||
    !isString(value.title) ||
    !isString(value.content) ||
    !isStringArray(value.tags) ||
    !isString(value.createdAt) ||
    !isString(value.updatedAt)
  ) {
    return null;
  }
  return {
    id: value.id,
    date: value.date,
    title: value.title,
    content: value.content,
    tags: value.tags,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function parsePreparedExport(value: Json): ServiceResult<AdminPreparedExport> {
  if (!isJsonObject(value)) {
    return fail('DATABASE_ERROR', 'The secure export response was invalid.');
  }

  const profile = value.profile;
  const preferences = value.preferences;
  const checkIns = value.checkIns;
  const journals = value.journals;
  const summary = value.activitySummary;
  const calendar = value.calendarDates;
  const parsedJournals = Array.isArray(journals) ? journals.map(parseJournalEntry) : null;
  let activitySummary: AdminPreparedExport['activitySummary'];
  if (summary === null) {
    activitySummary = null;
  } else if (
    isJsonObject(summary) &&
    isNumber(summary.totalCheckIns) &&
    isNumber(summary.totalJournals)
  ) {
    activitySummary = {
      totalCheckIns: summary.totalCheckIns,
      totalJournals: summary.totalJournals,
    };
  } else {
    return fail('DATABASE_ERROR', 'The secure export summary did not match the expected schema.');
  }

  let calendarDates: AdminPreparedExport['calendarDates'];
  if (calendar === null) {
    calendarDates = null;
  } else if (
    isJsonObject(calendar) &&
    isStringArray(calendar.checkInDates) &&
    isStringArray(calendar.journalDates)
  ) {
    calendarDates = {
      checkInDates: calendar.checkInDates,
      journalDates: calendar.journalDates,
    };
  } else {
    return fail('DATABASE_ERROR', 'The secure export calendar did not match the expected schema.');
  }

  if (
    !(profile === null || (profile !== undefined && isPreparedProfile(profile))) ||
    !(preferences === null || (preferences !== undefined && isPreferencesRow(preferences))) ||
    !Array.isArray(checkIns) ||
    !checkIns.every(isPreparedCheckIn) ||
    !parsedJournals ||
    parsedJournals.some((entry) => entry === null)
  ) {
    return fail('DATABASE_ERROR', 'The secure export response did not match the expected schema.');
  }

  return ok({
    profile,
    preferences,
    checkIns,
    journals: parsedJournals.filter((entry): entry is JournalEntry => entry !== null),
    activitySummary,
    calendarDates,
  });
}

function mapAuditedOperationError<T>(
  error: { code?: string; message: string; details?: string | null },
  operation: 'view' | 'export'
): ServiceResult<T> {
  if (error.code === 'P0001') {
    return fail(
      'DATABASE_ERROR',
      operation === 'view'
        ? 'Request blocked because required audit logging failed. No user records were returned.'
        : 'Export blocked because required audit logging failed. No download was produced.',
      error.message
    );
  }
  if (error.code === 'P0002') {
    return fail('NOT_FOUND', 'The selected account was not found or has no role record.');
  }
  if (error.code === '42501' || error.code === 'PGRST116') {
    return mapSupabaseError(error);
  }
  return fail(
    'DATABASE_ERROR',
    operation === 'view'
      ? 'The audited records request did not complete. No user records were returned.'
      : 'The audited export request did not complete. No download was produced.',
    error.message
  );
}

async function requireAdmin() {
  const auth = await requireAuthenticatedClient();
  if (!auth.ok) return auth;
  const { data: isAdmin, error } = await auth.data.client.rpc('is_admin');
  if (error) return mapSupabaseError(error);
  if (isAdmin !== true) return fail('FORBIDDEN', 'Only verified administrators can access the user directory.');
  return ok(auth.data);
}

export const adminService = {
  async getUserDirectoryEntry(targetUserId: string): Promise<ServiceResult<AdminUserPrototype>> {
    if (!USER_ID_PATTERN.test(targetUserId)) {
      return fail('VALIDATION_ERROR', 'A valid target user ID is required.');
    }
    const auth = await requireAdmin();
    if (!auth.ok) return auth;
    const { client } = auth.data;
    const [profileResult, roleResult] = await Promise.all([
      client
        .from('profiles')
        .select('id, display_name, preferred_check_in_time, created_at')
        .eq('id', targetUserId)
        .maybeSingle(),
      client.from('user_roles').select('user_id, role').eq('user_id', targetUserId).maybeSingle(),
    ]);
    if (profileResult.error) return mapSupabaseError(profileResult.error);
    if (roleResult.error) return mapSupabaseError(roleResult.error);
    if (!profileResult.data) return fail('NOT_FOUND', 'User profile was not found.');
    if (!roleResult.data) return fail('DATABASE_ERROR', 'The selected account has no verified role record.');
    return ok({
      id: profileResult.data.id,
      name: profileResult.data.display_name || 'Lunara member',
      email: null,
      role: roleResult.data.role === 'admin' ? 'Admin' : 'Member',
      status: 'unavailable',
      joinedDate: profileResult.data.created_at.slice(0, 10),
      lastActive: null,
      preferredWindow: profileResult.data.preferred_check_in_time,
    });
  },

  async getUserRecords(
    targetUserId: string
  ): Promise<ServiceResult<AdminUserRecords>> {
    if (!USER_ID_PATTERN.test(targetUserId)) {
      return fail('VALIDATION_ERROR', 'A valid target user ID is required.');
    }

    const auth = await requireAdmin();
    if (!auth.ok) return auth;

    const { client } = auth.data;
    try {
      const { data, error } = await client.rpc('admin_get_user_records_audited', {
        p_target_user_id: targetUserId,
      });
      if (error) return mapAuditedOperationError(error, 'view');
      return parseUserRecords(data);
    } catch (error) {
      return fail(
        'DATABASE_ERROR',
        'The audited records request did not complete. No user records were returned.',
        error instanceof Error ? error.message : undefined
      );
    }
  },

  async prepareUserExport(input: {
    targetUserId: string;
    format: 'json' | 'csv' | 'html';
    categories: AdminExportCategory[];
    startDate: string | null;
    endDate: string | null;
    confirmJournals: boolean;
  }): Promise<ServiceResult<AdminPreparedExport>> {
    if (!USER_ID_PATTERN.test(input.targetUserId)) {
      return fail('VALIDATION_ERROR', 'A valid target user ID is required.');
    }
    if (
      input.categories.length === 0 ||
      input.categories.some((category) => ![
        'profile', 'checkIns', 'metrics', 'likesDislikes', 'journals',
        'activitySummary', 'calendarSummary',
      ].includes(category)) ||
      new Set(input.categories).size !== input.categories.length
    ) {
      return fail('VALIDATION_ERROR', 'Select one or more valid export categories.');
    }
    if (
      (input.startDate !== null && !isValidDateKey(input.startDate)) ||
      (input.endDate !== null && !isValidDateKey(input.endDate)) ||
      (input.startDate !== null && input.endDate !== null && input.startDate > input.endDate)
    ) {
      return fail('VALIDATION_ERROR', 'The export date range is invalid.');
    }
    if (input.categories.includes('journals') && !input.confirmJournals) {
      return fail('VALIDATION_ERROR', 'Confirm journal inclusion before preparing this export.');
    }

    const auth = await requireAdmin();
    if (!auth.ok) return auth;

    try {
      const { data, error } = await auth.data.client.rpc('admin_prepare_user_export_audited', {
        p_target_user_id: input.targetUserId,
        p_format: input.format,
        p_categories: input.categories,
        p_start_date: input.startDate,
        p_end_date: input.endDate,
        p_confirm_journals: input.confirmJournals,
      });
      if (error) return mapAuditedOperationError(error, 'export');
      return parsePreparedExport(data);
    } catch (error) {
      return fail(
        'DATABASE_ERROR',
        'The audited export request did not complete. No download was produced.',
        error instanceof Error ? error.message : undefined
      );
    }
  },

  async listUsers(): Promise<ServiceResult<AdminUserDirectoryPage>> {
    const auth = await requireAdmin();
    if (!auth.ok) return auth;

    const { client } = auth.data;
    const { data: profiles, error: profilesError, count } = await client
      .from('profiles')
      .select('id, display_name, preferred_check_in_time, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(0, MAX_DIRECTORY_USERS - 1);
    if (profilesError) return mapSupabaseError(profilesError);

    const profileRows = profiles ?? [];
    const rolesResult = profileRows.length
      ? await client.from('user_roles').select('user_id, role').in('user_id', profileRows.map((row) => row.id))
      : { data: [], error: null };
    if (rolesResult.error) return mapSupabaseError(rolesResult.error);

    const roles = new Map((rolesResult.data ?? []).map((row) => [row.user_id, row.role]));
    if (profileRows.some((profile) => !roles.has(profile.id))) {
      return fail('DATABASE_ERROR', 'Some accounts are missing verified role records; the directory cannot display their access accurately.');
    }
    const users = profileRows.map((profile) => ({
      id: profile.id,
      name: profile.display_name || 'Lunara member',
      email: null,
      role: roles.get(profile.id) === 'admin' ? 'Admin' as const : 'Member' as const,
      status: 'unavailable' as const,
      joinedDate: profile.created_at.slice(0, 10),
      lastActive: null,
      preferredWindow: profile.preferred_check_in_time,
    }));
    return ok({ users, total: count ?? users.length });
  },
};
