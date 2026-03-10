create table "projects" (
  "project_id" uuid not null default gen_random_uuid(), --unique identifier for each project
  "owner_id" uuid not null, --references the user who owns the project
  "title" text not null, --title of the project
  "description" text, -- description of the project
  "created_at" timestamp with time zone not null default now(), --timestamp for when the project was created
  "updated_at" timestamp with time zone not null default now(), --timestamp for when the project was last updated
  primary key ("project_id"), --set project_id as the primary key
  foreign key ("owner_id") references "users" ("user_id") on delete cascade --when a user is deleted, their projects will also be deleted
);

create table "project_members" (
    "project_id" uuid not null, --references the project
    "user_id" uuid not null, --references the user who is a member of the project
    "role" varchar(20) not null default 'member', --role of the user
    "joined_at" timestamp with time zone not null default now(), --timestamp for when the user joined the project
    primary key ("project_id", "user_id"), --composite primary key to prevent duplicates
    foreign key ("project_id") references "projects" ("project_id") on delete cascade, --when a project is deleted, its members will also be deleted
    foreign key ("user_id") references "users" ("user_id") on delete cascade --when a user is deleted, their project memberships will also be deleted
);

create table "project_tags" (
    "project_id" uuid not null, --references the project
    "tag_id" uuid not null, --references the tag associated with the project
    primary key ("project_id", "tag_id"), --composite primary key to prevent duplicates
    foreign key ("project_id") references "projects" ("project_id") on delete cascade, --when a project is deleted, its tags will also be deleted
    foreign key ("tag_id") references "tags" ("tag_id") on delete cascade --when a tag is deleted, its associations with projects will also be deleted
);