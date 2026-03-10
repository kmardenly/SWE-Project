create table "posts" (
    "post_id" uuid not null default gen_random_uuid(), --unique identifier for each post
    "creator_id" uuid not null, --references the user who created the post
    "content" text not null, --content of the post
    "created_at" timestamp with time zone not null default now(), --timestamp for when the post was created
    "updated_at" timestamp with time zone not null default now(), --timestamp for when the post was last updated
    "deleted_at" timestamp with time zone, --timestamp for when the post was deleted (null if not deleted)
    primary key ("post_id"), --set post_id as the primary key
    foreign key ("creator_id") references "users" ("user_id") on delete cascade
);

create table "post_media" (
    "post_id" uuid not null, --references the post
    "post_media_id" uuid not null default gen_random_uuid(), --unique identifier for each media item
    "media_url" text not null, --URL of the media item
    "media_type" varchar(50) not null, --type of media (e.g., image, video)
    "width" integer, --width of the media item (for images/videos)
    "height" integer, --height of the media item (for images/videos)
    "order" integer not null default 0, --order of the media item in the post
    primary key ("post_id", "post_media_id"), --composite primary key to prevent duplicates
    foreign key ("post_id") references "posts" ("post_id") on delete cascade --when a post is deleted, its media will also be deleted
   );

create table "post_data" (
    "post_id" uuid not null, --references the post
    "like_count" integer not null default 0, --number of likes on the post
    "comment_count" integer not null default 0, --number of comments on the post
    "share_count" integer not null default 0, --number of shares of the post
    "view_count" integer not null default 0, --number of views of the post
    primary key ("post_id"), --set post_id as the primary key
    foreign key ("post_id") references "posts" ("post_id") on delete cascade --when a post is deleted, its data will also be deleted
);

create table "post_likes" (
    "like_id" uuid not null default gen_random_uuid(), --unique identifier for each like
    "post_id" uuid not null, --references the post
    "user_id" uuid not null, --references the user who liked the post
    "created_at" timestamp with time zone not null default now(), --timestamp for when the like was created
    primary key ("like_id"), --set like_id as the primary key
    foreign key ("post_id") references "posts" ("post_id") on delete cascade, --when a post is deleted, its likes will also be deleted
    foreign key ("user_id") references "users" ("user_id") on delete cascade --when a user is deleted, their likes will also be deleted
);

create table "post_comments" (
    "comment_id" uuid not null default gen_random_uuid(), --unique identifier for each comment
    "post_id" uuid not null, --references the post
    "user_id" uuid not null, --references the user who made the comment
    "parent_id" uuid, --references the parent comment for nested comments (null if top-level comment)
    "content" text not null, --content of the comment
    "created_at" timestamp with time zone not null default now(), --timestamp for when the comment was created
    "updated_at" timestamp with time zone not null default now(), --timestamp for when the comment was last updated
    primary key ("comment_id"), --set comment_id as the primary key
    foreign key ("post_id") references "posts" ("post_id") on delete cascade, --when a post is deleted, its comments will also be deleted
    foreign key ("user_id") references "users" ("user_id") on delete cascade --when a user is deleted, their comments will also be deleted
);

create table "post_shares" (
    "share_id" uuid not null default gen_random_uuid(), --unique identifier for each share
    "post_id" uuid not null, --references the post
    "user_id" uuid not null, --references the user who shared the post
    "share_type" varchar(20) not null default 'share', --type of share (e.g., share, repost)
    "created_at" timestamp with time zone not null default now(), --timestamp for when the share was created
    primary key ("share_id"), --set share_id as the primary key
    foreign key ("post_id") references "posts" ("post_id") on delete cascade, --when a post is deleted, its shares will also be deleted
    foreign key ("user_id") references "users" ("user_id") on delete cascade --when a user is deleted, their shares will also be deleted
);

create table "post_views" (
    "view_id" uuid not null default gen_random_uuid(), --unique identifier for each view
    "post_id" uuid not null, --references the post
    "user_id" uuid, --references the user who viewed the post (null if anonymous view)
    "created_at" timestamp with time zone not null default now(), --timestamp for when the view was created
    primary key ("view_id"), --set view_id as the primary key
    foreign key ("post_id") references "posts" ("post_id") on delete cascade, --when a post is deleted, its views will also be deleted
    foreign key ("user_id") references "users" ("user_id") on delete cascade --when a user is deleted, their views will also be deleted
);

create table "post_tags" (
    "post_id" uuid not null, --references the post
    "tag_id" uuid not null, --references the tag
    primary key ("post_id", "tag_id"), --composite primary key to prevent duplicates
    foreign key ("post_id") references "posts" ("post_id") on delete cascade, --when a post is deleted, its tags will also be deleted
    foreign key ("tag_id") references "tags" ("tag_id") on delete cascade --when a tag is deleted, its associations with posts will also be deleted
);

create table "bookmarks" (
    "bookmark_id" uuid not null default gen_random_uuid(), --unique identifier for each bookmark
    "post_id" uuid not null, --references the post
    "user_id" uuid not null, --references the user who bookmarked the post
    "created_at" timestamp with time zone not null default now(), --timestamp for when the bookmark was created
    primary key ("bookmark_id"), --set bookmark_id as the primary key
    foreign key ("post_id") references "posts" ("post_id") on delete cascade, --when a post is deleted, its bookmarks will also be deleted
    foreign key ("user_id") references "users" ("user_id") on delete cascade --when a user is deleted, their bookmarks will also be deleted
);