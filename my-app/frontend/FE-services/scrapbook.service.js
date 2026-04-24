import { supabase } from '@/lib/supabaseClient';

const isUuid = (s) =>
  typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

function mapRowToProject(row, defaultCover) {
  return {
    id: row.scrapbook_project_id,
    name: row.name,
    completed: row.completed,
    lastEditedAt: new Date(row.last_edited_at).getTime(),
    cover: row.cover_url || defaultCover,
    folders: [],
  };
}

function mapElementRow(row) {
  return {
    id: row.canvas_element_id,
    type: row.element_type,
    content: row.content,
    x: row.x,
    y: row.y,
    width: row.width,
    height: row.height,
  };
}

function mapInspoRow(row) {
  return { id: row.inspiration_id, uri: row.image_url };
}

function mapListRow(row) {
  return {
    id: row.list_item_id,
    text: row.item_text,
    checked: row.is_checked,
    bulleted: row.is_bulleted,
  };
}

/**
 * @param {string} userId
 * @param {string} defaultProjectCoverUri
 * @returns {Promise<{
 *   projects: any[],
 *   projectElements: Record<string, any[]>,
 *   inspirationImages: any[],
 *   listItems: any[]
 * }>}
 */
export async function loadScrapbookWorkspace(userId, defaultProjectCoverUri) {
  if (!supabase || !userId) {
    return { projects: [], projectElements: {}, inspirationImages: [], listItems: [] };
  }

  const { data: projectRows, error: projectsError } = await supabase
    .from('scrapbook_projects')
    .select('*')
    .eq('owner_id', userId)
    .order('last_edited_at', { ascending: false });

  if (projectsError) throw projectsError;

  const projects = (projectRows || []).map((r) => mapRowToProject(r, defaultProjectCoverUri));
  const projectIds = projects.map((p) => p.id);
  if (!projectIds.length) {
    const { data: insp, error: inspError } = await supabase
      .from('scrapbook_inspiration_images')
      .select('*')
      .eq('owner_id', userId)
      .order('sort_order', { ascending: true });
    if (inspError) throw inspError;
    const { data: list, error: listError } = await supabase
      .from('scrapbook_list_items')
      .select('*')
      .eq('owner_id', userId)
      .order('sort_order', { ascending: true });
    if (listError) throw listError;
    return {
      projects: [],
      projectElements: {},
      inspirationImages: (insp || []).map(mapInspoRow),
      listItems: (list || []).map(mapListRow),
    };
  }

  const { data: elRows, error: elError } = await supabase
    .from('scrapbook_canvas_elements')
    .select('*')
    .in('scrapbook_project_id', projectIds)
    .order('sort_order', { ascending: true });
  if (elError) throw elError;

  const projectElements = {};
  for (const pid of projectIds) projectElements[pid] = [];
  for (const r of elRows || []) {
    if (!projectElements[r.scrapbook_project_id]) projectElements[r.scrapbook_project_id] = [];
    projectElements[r.scrapbook_project_id].push(mapElementRow(r));
  }

  const { data: insp, error: inspError } = await supabase
    .from('scrapbook_inspiration_images')
    .select('*')
    .eq('owner_id', userId)
    .order('sort_order', { ascending: true });
  if (inspError) throw inspError;

  const { data: list, error: listError } = await supabase
    .from('scrapbook_list_items')
    .select('*')
    .eq('owner_id', userId)
    .order('sort_order', { ascending: true });
  if (listError) throw listError;

  return {
    projects,
    projectElements,
    inspirationImages: (insp || []).map(mapInspoRow),
    listItems: (list || []).map(mapListRow),
  };
}

/**
 * @param {string} userId
 * @param {{ name: string, completed: boolean, cover_url: string | null, defaultProjectCoverUri: string }}
 */
export async function insertScrapbookProject(userId, { name, completed, cover_url, defaultProjectCoverUri }) {
  if (!supabase || !userId) throw new Error('Supabase or user not configured');
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('scrapbook_projects')
    .insert({
      owner_id: userId,
      name,
      completed: !!completed,
      cover_url: cover_url || null,
      last_edited_at: now,
      created_at: now,
      updated_at: now,
    })
    .select('scrapbook_project_id, name, completed, cover_url, last_edited_at')
    .single();
  if (error) throw error;
  return mapRowToProject(
    {
      scrapbook_project_id: data.scrapbook_project_id,
      name: data.name,
      completed: data.completed,
      last_edited_at: data.last_edited_at,
      cover_url: data.cover_url,
    },
    defaultProjectCoverUri
  );
}

export async function updateScrapbookProject(projectId, { name, completed, cover, lastEditedAtMs, defaultProjectCoverUri }) {
  if (!supabase) throw new Error('Supabase not configured');
  const now = new Date().toISOString();
  const payload = {
    updated_at: now,
    last_edited_at: lastEditedAtMs ? new Date(lastEditedAtMs).toISOString() : now,
  };
  if (name != null) payload.name = name;
  if (typeof completed === 'boolean') payload.completed = completed;
  if (cover !== undefined) {
    const defaultUri = defaultProjectCoverUri;
    if (cover === defaultUri) payload.cover_url = null;
    else if (typeof cover === 'string' && cover.length) payload.cover_url = cover;
  }
  const { error } = await supabase.from('scrapbook_projects').update(payload).eq('scrapbook_project_id', projectId);
  if (error) throw error;
}

export async function replaceCanvasElements(projectId, elements) {
  if (!supabase) throw new Error('Supabase not configured');
  const { error: delError } = await supabase
    .from('scrapbook_canvas_elements')
    .delete()
    .eq('scrapbook_project_id', projectId);
  if (delError) throw delError;

  if (!elements.length) return [];

  const now = new Date().toISOString();
  const insertRows = elements.map((el, i) => ({
    scrapbook_project_id: projectId,
    element_type: el.type,
    content: el.content,
    x: el.x,
    y: el.y,
    width: el.width,
    height: el.height,
    sort_order: i,
    created_at: now,
  }));

  const { data, error: insError } = await supabase
    .from('scrapbook_canvas_elements')
    .insert(insertRows)
    .select('*');
  if (insError) throw insError;
  return (data || []).map(mapElementRow);
}

export async function insertInspiration(userId, imageUrl, sortOrder) {
  if (!supabase || !userId) throw new Error('Not configured');
  const { data, error } = await supabase
    .from('scrapbook_inspiration_images')
    .insert({
      owner_id: userId,
      image_url: imageUrl,
      sort_order: sortOrder,
      created_at: new Date().toISOString(),
    })
    .select('inspiration_id, image_url')
    .single();
  if (error) throw error;
  return { id: data.inspiration_id, uri: data.image_url };
}

export async function deleteInspiration(inspirationId) {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('scrapbook_inspiration_images').delete().eq('inspiration_id', inspirationId);
  if (error) throw error;
}

export async function insertListItem(userId, { text, bulleted }, sortOrder) {
  if (!supabase || !userId) throw new Error('Not configured');
  const { data, error } = await supabase
    .from('scrapbook_list_items')
    .insert({
      owner_id: userId,
      item_text: text,
      is_checked: false,
      is_bulleted: bulleted,
      sort_order: sortOrder,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('list_item_id, item_text, is_checked, is_bulleted')
    .single();
  if (error) throw error;
  return mapListRow(data);
}

export async function updateListItem(listItemId, partial) {
  if (!supabase) throw new Error('Supabase not configured');
  const payload = { updated_at: new Date().toISOString() };
  if (partial.text !== undefined) payload.item_text = partial.text;
  if (partial.checked !== undefined) payload.is_checked = partial.checked;
  if (partial.bulleted !== undefined) payload.is_bulleted = partial.bulleted;
  const { error } = await supabase.from('scrapbook_list_items').update(payload).eq('list_item_id', listItemId);
  if (error) throw error;
}

export async function deleteListItem(listItemId) {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('scrapbook_list_items').delete().eq('list_item_id', listItemId);
  if (error) throw error;
}

export { isUuid };
