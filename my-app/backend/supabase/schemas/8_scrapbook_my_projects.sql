-- Personal "My Projects" workspace from the mobile UI (projects.jsx).
-- Separate from public.collaborative `projects` / `project_members` / `project_tags`.

create table "scrapbook_projects" (
  "scrapbook_project_id" uuid not null default gen_random_uuid(),
  "owner_id" uuid not null references "users" ("user_id") on delete cascade,
  "name" text not null,
  "completed" boolean not null default false,
  "cover_url" text,
  "last_edited_at" timestamp with time zone not null default now(),
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),
  primary key ("scrapbook_project_id")
);

create table "scrapbook_folders" (
  "scrapbook_folder_id" uuid not null default gen_random_uuid(),
  "scrapbook_project_id" uuid not null references "scrapbook_projects" ("scrapbook_project_id") on delete cascade,
  "name" text not null,
  "last_edited_at" timestamp with time zone not null default now(),
  "sort_order" integer not null default 0,
  primary key ("scrapbook_folder_id")
);

create table "scrapbook_folder_files" (
  "scrapbook_folder_file_id" uuid not null default gen_random_uuid(),
  "scrapbook_folder_id" uuid not null references "scrapbook_folders" ("scrapbook_folder_id") on delete cascade,
  "file_url" text not null,
  "sort_order" integer not null default 0,
  primary key ("scrapbook_folder_file_id")
);

create table "scrapbook_canvas_elements" (
  "canvas_element_id" uuid not null default gen_random_uuid(),
  "scrapbook_project_id" uuid not null references "scrapbook_projects" ("scrapbook_project_id") on delete cascade,
  "element_type" text not null,
  "content" text not null,
  "x" double precision not null,
  "y" double precision not null,
  "width" double precision not null,
  "height" double precision not null,
  "sort_order" integer not null default 0,
  "created_at" timestamp with time zone not null default now(),
  primary key ("canvas_element_id"),
  constraint "scrapbook_canvas_elements_type_chk" check ("element_type" in ('text', 'photo'))
);

create table "scrapbook_inspiration_images" (
  "inspiration_id" uuid not null default gen_random_uuid(),
  "owner_id" uuid not null references "users" ("user_id") on delete cascade,
  "image_url" text not null,
  "sort_order" integer not null default 0,
  "created_at" timestamp with time zone not null default now(),
  primary key ("inspiration_id")
);

create table "scrapbook_list_items" (
  "list_item_id" uuid not null default gen_random_uuid(),
  "owner_id" uuid not null references "users" ("user_id") on delete cascade,
  "item_text" text not null,
  "is_checked" boolean not null default false,
  "is_bulleted" boolean not null default true,
  "sort_order" integer not null default 0,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),
  primary key ("list_item_id")
);

create index "idx_scrapbook_projects_owner" on "scrapbook_projects" ("owner_id");
create index "idx_scrapbook_folders_project" on "scrapbook_folders" ("scrapbook_project_id");
create index "idx_scrapbook_folder_files_folder" on "scrapbook_folder_files" ("scrapbook_folder_id");
create index "idx_scrapbook_canvas_project" on "scrapbook_canvas_elements" ("scrapbook_project_id");
create index "idx_scrapbook_inspirations_owner" on "scrapbook_inspiration_images" ("owner_id");
create index "idx_scrapbook_list_items_owner" on "scrapbook_list_items" ("owner_id");
