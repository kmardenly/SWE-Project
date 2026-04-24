import { supabase } from '@/lib/supabaseClient';

/** Human-readable PostgREST / Postgres error for alerts and logging. */
export function formatSupabaseError(error) {
  if (!error) return 'Unknown error';
  const msg = error.message || String(error);
  const code = error.code ? ` [${error.code}]` : '';
  const details = error.details ? `\n${error.details}` : '';
  const hint = error.hint ? `\n${error.hint}` : '';
  return `${msg}${code}${details}${hint}`.trim();
}

function normalizeSubGoalsFromDb(value) {
  if (value == null) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  if (typeof value === 'object') {
    const maybe = value.sub_goals ?? value.subGoals;
    if (Array.isArray(maybe)) return maybe;
  }
  return [];
}

function dateOnlyToTimestamptz(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T12:00:00.000Z`;
  return s;
}

function mapRowToGoal(row) {
  return {
    id: row.goal_id,
    title: row.title,
    deadline: row.deadline || 'no deadline',
    subGoals: normalizeSubGoalsFromDb(row.sub_goals),
    completed: Boolean(row.completed),
    completedAt: row.completed_at ? String(row.completed_at).slice(0, 10) : null,
    archived: Boolean(row.archived),
    archivedAt: row.archived_at ? String(row.archived_at).slice(0, 10) : null,
  };
}

function mapGoalPatchToRow(patch) {
  const row = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.deadline !== undefined) row.deadline = patch.deadline;
  if (patch.subGoals !== undefined) row.sub_goals = patch.subGoals;
  if (patch.completed !== undefined) row.completed = patch.completed;
  if (patch.completedAt !== undefined) row.completed_at = dateOnlyToTimestamptz(patch.completedAt);
  if (patch.archived !== undefined) row.archived = patch.archived;
  if (patch.archivedAt !== undefined) row.archived_at = dateOnlyToTimestamptz(patch.archivedAt);
  row.updated_at = new Date().toISOString();
  return row;
}

export async function fetchUserGoals(userId) {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from('user_goals')
    .select('goal_id, title, deadline, sub_goals, completed, completed_at, archived, archived_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapRowToGoal);
}

export async function createUserGoal(userId, goal) {
  if (!supabase || !userId) throw new Error('Missing Supabase client or user id');
  const payload = {
    user_id: userId,
    title: goal.title,
    deadline: goal.deadline || 'no deadline',
    sub_goals: goal.subGoals || [],
    completed: Boolean(goal.completed),
    completed_at: dateOnlyToTimestamptz(goal.completedAt ?? null),
    archived: Boolean(goal.archived),
    archived_at: dateOnlyToTimestamptz(goal.archivedAt ?? null),
  };
  const { data, error } = await supabase
    .from('user_goals')
    .insert(payload)
    .select('goal_id, title, deadline, sub_goals, completed, completed_at, archived, archived_at')
    .single();
  if (error) throw error;
  return mapRowToGoal(data);
}

export async function updateUserGoal(userId, goalId, patch) {
  if (!supabase || !userId || !goalId) throw new Error('Missing goal update data');
  const { data, error } = await supabase
    .from('user_goals')
    .update(mapGoalPatchToRow(patch))
    .eq('user_id', userId)
    .eq('goal_id', goalId)
    .select('goal_id, title, deadline, sub_goals, completed, completed_at, archived, archived_at')
    .single();
  if (error) throw error;
  return mapRowToGoal(data);
}

export async function deleteUserGoal(userId, goalId) {
  if (!supabase || !userId || !goalId) throw new Error('Missing goal delete data');
  const { error } = await supabase.from('user_goals').delete().eq('user_id', userId).eq('goal_id', goalId);
  if (error) throw error;
  return true;
}

export async function updateUserLevel(userId, level) {
  if (!supabase || !userId || typeof level !== 'number') return;
  const { error } = await supabase.from('users').update({ level }).eq('user_id', userId);
  if (error) throw error;
}
