
create table "users" (
  "user_id" uuid not null references auth.users(id) on delete cascade,  
  "bio" text,
  "created_at" timestamp with time zone not null default now(), --sets time with consideration for timezones
  "updated_at" timestamp with time zone not null default now(),
  "first_name" text,
  "last_name" text,
  "email" text,
  "avatar_url" text,
  "display_name" varchar(50), --limit display name to 50 characters
  "level" integer default 1,
  primary key ("user_id")
);

create table "follows" (
    "follower_id" uuid not null, --references the user who is following
    "followed_id" uuid not null, --references the user being followed
    "created_at" timestamp with time zone not null default now(),
    primary key ("follower_id", "followed_id"), --composite primary key to prevent duplicate follows
    foreign key ("follower_id") references "users" ("user_id") on delete cascade, --when a user is deleted, their follows will also be deleted
    foreign key ("followed_id") references "users" ("user_id") on delete cascade --when a user is deleted, their followers will also be deleted
);


