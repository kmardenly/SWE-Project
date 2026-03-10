create table "reactions" (
    "reaction_id" uuid not null default gen_random_uuid(), --unique identifier for each reaction
    "user_id" uuid not null, --references the user who made the reaction
    "target_type" varchar(50) not null, --type of the target entity (e.g., 'post', 'comment')
    "target_id" uuid not null, --references the target entity (e.g., post_id, comment_id)
    "reaction_type" varchar(50) not null, --type of reaction (e.g., 'like', 'love', 'haha')
    "created_at" timestamp with time zone not null default now(), --timestamp for when the reaction was created
    primary key ("reaction_id"), --set reaction_id as the primary key
    foreign key ("user_id") references "users" ("user_id") on delete cascade -- when a user is deleted, their reactions will also be deleted
);
