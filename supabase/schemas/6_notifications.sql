create table "notifications" (
    "notification_id" uuid not null default gen_random_uuid(), --unique identifier for each notification
    "user_id" uuid not null, --references the user who receives the notification
    "actor_id" uuid, --references the user who triggered the notification (null for system notifications)
    "type" varchar(50) not null, --type of notification (e.g., 'like', 'comment', 'follow')
    "target_type" varchar(50), --type of the target entity (e.g., 'post', 'comment', 'project')
    "target_id" uuid, --references the target entity (e.g., post_id, comment_id)
    "message_content" text not null, --content of the notification
    "is_read" boolean not null default false, --whether the notification has been read
    "created_at" timestamp with time zone not null default now(), --timestamp for when the notification was created
    primary key ("notification_id"), --set notification_id as the primary key
    foreign key ("user_id") references "users" ("user_id") on delete cascade, --when a user is deleted, their notifications will also be deleted
    foreign key ("actor_id") references "users" ("user_id") on delete set null --when an actor user is deleted, set actor_id to null for their notifications
);