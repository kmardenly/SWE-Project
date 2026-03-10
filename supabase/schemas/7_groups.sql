create table "groups" (
    "group_id" uuid not null default gen_random_uuid(), --unique identifier for each group
    "name" text not null, --name of the group
    "description" text, --description of the group
    "owner_id" uuid not null, --references the user who owns the group
    "created_at" timestamp with time zone not null default now(), --timestamp for when the group was created
    "updated_at" timestamp with time zone not null default now(), --timestamp for when the group was last updated
    primary key ("group_id") --set group_id as the primary key
);

create table "group_members" (
    "group_id" uuid not null, --references the group
    "user_id" uuid not null, --references the user who is a member of the group
    "role" varchar(20) not null default 'member', --role of the user in the group (e.g., member, admin)
    "joined_at" timestamp with time zone not null default now(), --timestamp for when the user joined the group
    primary key ("group_id", "user_id"), --composite primary key to prevent duplicates
    foreign key ("group_id") references "groups" ("group_id") on delete cascade, --when a group is deleted, its members will also be deleted
    foreign key ("user_id") references "users" ("user_id") on delete cascade --when a user is deleted, their group memberships will also be deleted
);

create table "group_channels" (
    "channel_id" uuid not null default gen_random_uuid(), --unique identifier for each channel
    "group_id" uuid not null, --references the group
    "name" text not null, --name of the channel
    "description" text, --description of the channel
    "created_at" timestamp with time zone not null default now(), --timestamp for when the channel was created
    "updated_at" timestamp with time zone not null default now(), --timestamp for when the channel was last updated
    primary key ("channel_id"), --set channel_id as the primary key
    foreign key ("group_id") references "groups" ("group_id") on delete cascade --when a group is deleted, its channels will also be deleted
);

create table "group_messages" (
    "message_id" uuid not null default gen_random_uuid(), --unique identifier for each message
    "channel_id" uuid not null, --references the channel
    "user_id" uuid not null, --references the user who sent the message
    "content" text not null, --content of the message
    "parent_id" uuid, --references the parent message for threaded conversations (null if top-level message)
    "created_at" timestamp with time zone not null default now(), --timestamp for when the message was created
    "updated_at" timestamp with time zone not null default now(), --timestamp for when the message was last updated
    primary key ("message_id"), --set message_id as the primary key
    foreign key ("channel_id") references "group_channels" ("channel_id") on delete cascade, --when a channel is deleted, its messages will also be deleted
    foreign key ("user_id") references "users" ("user_id") on delete cascade --when a user is deleted, their messages will also be deleted, may change dpending on logic
);
