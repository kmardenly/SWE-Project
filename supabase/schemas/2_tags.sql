create table "tags" (
    "tag_id" uuid not null default gen_random_uuid(), --unique identifier for each tag
    "name" text not null, --name of the tag
    "slug" text not null unique, --slug for the tag, must be unique
    primary key ("tag_id") --set tag_id as the primary key
);