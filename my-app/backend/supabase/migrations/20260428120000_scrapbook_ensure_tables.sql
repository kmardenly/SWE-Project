-- Repair: create scrapbook tables if they are missing (e.g. migration version was recorded but DDL did not run).
-- Safe to run when tables already exist (IF NOT EXISTS).

create table if not exists public.scrapbook_projects (
  scrapbook_project_id uuid not null default gen_random_uuid(),
  owner_id uuid not null references public.users (user_id) on delete cascade,
  name text not null,
  completed boolean not null default false,
  cover_url text,
  last_edited_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (scrapbook_project_id)
);

create table if not exists public.scrapbook_folders (
  scrapbook_folder_id uuid not null default gen_random_uuid(),
  scrapbook_project_id uuid not null references public.scrapbook_projects (scrapbook_project_id) on delete cascade,
  name text not null,
  last_edited_at timestamptz not null default now(),
  sort_order integer not null default 0,
  primary key (scrapbook_folder_id)
);

create table if not exists public.scrapbook_folder_files (
  scrapbook_folder_file_id uuid not null default gen_random_uuid(),
  scrapbook_folder_id uuid not null references public.scrapbook_folders (scrapbook_folder_id) on delete cascade,
  file_url text not null,
  sort_order integer not null default 0,
  primary key (scrapbook_folder_file_id)
);

create table if not exists public.scrapbook_canvas_elements (
  canvas_element_id uuid not null default gen_random_uuid(),
  scrapbook_project_id uuid not null references public.scrapbook_projects (scrapbook_project_id) on delete cascade,
  element_type text not null,
  content text not null,
  x double precision not null,
  y double precision not null,
  width double precision not null,
  height double precision not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (canvas_element_id),
  constraint scrapbook_canvas_elements_type_chk check (element_type in ('text', 'photo'))
);

create table if not exists public.scrapbook_inspiration_images (
  inspiration_id uuid not null default gen_random_uuid(),
  owner_id uuid not null references public.users (user_id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (inspiration_id)
);

create table if not exists public.scrapbook_list_items (
  list_item_id uuid not null default gen_random_uuid(),
  owner_id uuid not null references public.users (user_id) on delete cascade,
  item_text text not null,
  is_checked boolean not null default false,
  is_bulleted boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (list_item_id)
);

create index if not exists idx_scrapbook_projects_owner on public.scrapbook_projects (owner_id);
create index if not exists idx_scrapbook_folders_project on public.scrapbook_folders (scrapbook_project_id);
create index if not exists idx_scrapbook_folder_files_folder on public.scrapbook_folder_files (scrapbook_folder_id);
create index if not exists idx_scrapbook_canvas_project on public.scrapbook_canvas_elements (scrapbook_project_id);
create index if not exists idx_scrapbook_inspirations_owner on public.scrapbook_inspiration_images (owner_id);
create index if not exists idx_scrapbook_list_items_owner on public.scrapbook_list_items (owner_id);

comment on table public.scrapbook_projects is
  'Personal project cards from the My Projects screen; UI field mapping: name, completed, cover->cover_url, lastEditedAt->last_edited_at.';
comment on table public.scrapbook_canvas_elements is
  'Free-form canvas items per project; UI: type->element_type, content, x, y, width, height; array order->sort_order.';
comment on table public.scrapbook_folders is
  'Folders nested under a scrapbook project; UI: folders[].';
comment on table public.scrapbook_folder_files is
  'Image URIs inside a folder; UI: folder.files[].';
comment on table public.scrapbook_inspiration_images is
  'Inspirations tab; per-user, not tied to a single project; UI: inspirationImages[].uri.';
comment on table public.scrapbook_list_items is
  'Lists tab; per-user; UI: text, checked, bulleted, display order->sort_order.';

alter table public.scrapbook_projects enable row level security;
alter table public.scrapbook_folders enable row level security;
alter table public.scrapbook_folder_files enable row level security;
alter table public.scrapbook_canvas_elements enable row level security;
alter table public.scrapbook_inspiration_images enable row level security;
alter table public.scrapbook_list_items enable row level security;

drop policy if exists "Scrapbook projects: select own" on public.scrapbook_projects;
create policy "Scrapbook projects: select own"
  on public.scrapbook_projects for select to authenticated
  using (owner_id = auth.uid());

drop policy if exists "Scrapbook projects: insert own" on public.scrapbook_projects;
create policy "Scrapbook projects: insert own"
  on public.scrapbook_projects for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "Scrapbook projects: update own" on public.scrapbook_projects;
create policy "Scrapbook projects: update own"
  on public.scrapbook_projects for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "Scrapbook projects: delete own" on public.scrapbook_projects;
create policy "Scrapbook projects: delete own"
  on public.scrapbook_projects for delete to authenticated
  using (owner_id = auth.uid());

drop policy if exists "Scrapbook folders: select own" on public.scrapbook_folders;
create policy "Scrapbook folders: select own"
  on public.scrapbook_folders for select to authenticated
  using (
    exists (
      select 1 from public.scrapbook_projects p
      where p.scrapbook_project_id = scrapbook_folders.scrapbook_project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Scrapbook folders: insert own" on public.scrapbook_folders;
create policy "Scrapbook folders: insert own"
  on public.scrapbook_folders for insert to authenticated
  with check (
    exists (
      select 1 from public.scrapbook_projects p
      where p.scrapbook_project_id = scrapbook_folders.scrapbook_project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Scrapbook folders: update own" on public.scrapbook_folders;
create policy "Scrapbook folders: update own"
  on public.scrapbook_folders for update to authenticated
  using (
    exists (
      select 1 from public.scrapbook_projects p
      where p.scrapbook_project_id = scrapbook_folders.scrapbook_project_id
        and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.scrapbook_projects p
      where p.scrapbook_project_id = scrapbook_folders.scrapbook_project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Scrapbook folders: delete own" on public.scrapbook_folders;
create policy "Scrapbook folders: delete own"
  on public.scrapbook_folders for delete to authenticated
  using (
    exists (
      select 1 from public.scrapbook_projects p
      where p.scrapbook_project_id = scrapbook_folders.scrapbook_project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Scrapbook folder files: select own" on public.scrapbook_folder_files;
create policy "Scrapbook folder files: select own"
  on public.scrapbook_folder_files for select to authenticated
  using (
    exists (
      select 1
      from public.scrapbook_folders f
      join public.scrapbook_projects p on p.scrapbook_project_id = f.scrapbook_project_id
      where f.scrapbook_folder_id = scrapbook_folder_files.scrapbook_folder_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Scrapbook folder files: insert own" on public.scrapbook_folder_files;
create policy "Scrapbook folder files: insert own"
  on public.scrapbook_folder_files for insert to authenticated
  with check (
    exists (
      select 1
      from public.scrapbook_folders f
      join public.scrapbook_projects p on p.scrapbook_project_id = f.scrapbook_project_id
      where f.scrapbook_folder_id = scrapbook_folder_files.scrapbook_folder_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Scrapbook folder files: update own" on public.scrapbook_folder_files;
create policy "Scrapbook folder files: update own"
  on public.scrapbook_folder_files for update to authenticated
  using (
    exists (
      select 1
      from public.scrapbook_folders f
      join public.scrapbook_projects p on p.scrapbook_project_id = f.scrapbook_project_id
      where f.scrapbook_folder_id = scrapbook_folder_files.scrapbook_folder_id
        and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.scrapbook_folders f
      join public.scrapbook_projects p on p.scrapbook_project_id = f.scrapbook_project_id
      where f.scrapbook_folder_id = scrapbook_folder_files.scrapbook_folder_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Scrapbook folder files: delete own" on public.scrapbook_folder_files;
create policy "Scrapbook folder files: delete own"
  on public.scrapbook_folder_files for delete to authenticated
  using (
    exists (
      select 1
      from public.scrapbook_folders f
      join public.scrapbook_projects p on p.scrapbook_project_id = f.scrapbook_project_id
      where f.scrapbook_folder_id = scrapbook_folder_files.scrapbook_folder_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Scrapbook canvas: select own" on public.scrapbook_canvas_elements;
create policy "Scrapbook canvas: select own"
  on public.scrapbook_canvas_elements for select to authenticated
  using (
    exists (
      select 1 from public.scrapbook_projects p
      where p.scrapbook_project_id = scrapbook_canvas_elements.scrapbook_project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Scrapbook canvas: insert own" on public.scrapbook_canvas_elements;
create policy "Scrapbook canvas: insert own"
  on public.scrapbook_canvas_elements for insert to authenticated
  with check (
    exists (
      select 1 from public.scrapbook_projects p
      where p.scrapbook_project_id = scrapbook_canvas_elements.scrapbook_project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Scrapbook canvas: update own" on public.scrapbook_canvas_elements;
create policy "Scrapbook canvas: update own"
  on public.scrapbook_canvas_elements for update to authenticated
  using (
    exists (
      select 1 from public.scrapbook_projects p
      where p.scrapbook_project_id = scrapbook_canvas_elements.scrapbook_project_id
        and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.scrapbook_projects p
      where p.scrapbook_project_id = scrapbook_canvas_elements.scrapbook_project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Scrapbook canvas: delete own" on public.scrapbook_canvas_elements;
create policy "Scrapbook canvas: delete own"
  on public.scrapbook_canvas_elements for delete to authenticated
  using (
    exists (
      select 1 from public.scrapbook_projects p
      where p.scrapbook_project_id = scrapbook_canvas_elements.scrapbook_project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Scrapbook inspirations: select own" on public.scrapbook_inspiration_images;
create policy "Scrapbook inspirations: select own"
  on public.scrapbook_inspiration_images for select to authenticated
  using (owner_id = auth.uid());

drop policy if exists "Scrapbook inspirations: insert own" on public.scrapbook_inspiration_images;
create policy "Scrapbook inspirations: insert own"
  on public.scrapbook_inspiration_images for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "Scrapbook inspirations: update own" on public.scrapbook_inspiration_images;
create policy "Scrapbook inspirations: update own"
  on public.scrapbook_inspiration_images for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "Scrapbook inspirations: delete own" on public.scrapbook_inspiration_images;
create policy "Scrapbook inspirations: delete own"
  on public.scrapbook_inspiration_images for delete to authenticated
  using (owner_id = auth.uid());

drop policy if exists "Scrapbook list items: select own" on public.scrapbook_list_items;
create policy "Scrapbook list items: select own"
  on public.scrapbook_list_items for select to authenticated
  using (owner_id = auth.uid());

drop policy if exists "Scrapbook list items: insert own" on public.scrapbook_list_items;
create policy "Scrapbook list items: insert own"
  on public.scrapbook_list_items for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "Scrapbook list items: update own" on public.scrapbook_list_items;
create policy "Scrapbook list items: update own"
  on public.scrapbook_list_items for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "Scrapbook list items: delete own" on public.scrapbook_list_items;
create policy "Scrapbook list items: delete own"
  on public.scrapbook_list_items for delete to authenticated
  using (owner_id = auth.uid());

grant select, insert, update, delete on table public.scrapbook_projects to authenticated;
grant select, insert, update, delete on table public.scrapbook_folders to authenticated;
grant select, insert, update, delete on table public.scrapbook_folder_files to authenticated;
grant select, insert, update, delete on table public.scrapbook_canvas_elements to authenticated;
grant select, insert, update, delete on table public.scrapbook_inspiration_images to authenticated;
grant select, insert, update, delete on table public.scrapbook_list_items to authenticated;

grant select, insert, update, delete on table public.scrapbook_projects to service_role;
grant select, insert, update, delete on table public.scrapbook_folders to service_role;
grant select, insert, update, delete on table public.scrapbook_folder_files to service_role;
grant select, insert, update, delete on table public.scrapbook_canvas_elements to service_role;
grant select, insert, update, delete on table public.scrapbook_inspiration_images to service_role;
grant select, insert, update, delete on table public.scrapbook_list_items to service_role;
