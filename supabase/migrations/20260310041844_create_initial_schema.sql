
  create table "public"."bookmarks" (
    "bookmark_id" uuid not null default gen_random_uuid(),
    "post_id" uuid not null,
    "user_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."follows" (
    "follower_id" uuid not null,
    "followed_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."group_channels" (
    "channel_id" uuid not null default gen_random_uuid(),
    "group_id" uuid not null,
    "name" text not null,
    "description" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."group_members" (
    "group_id" uuid not null,
    "user_id" uuid not null,
    "role" character varying(20) not null default 'member'::character varying,
    "joined_at" timestamp with time zone not null default now()
      );



  create table "public"."group_messages" (
    "message_id" uuid not null default gen_random_uuid(),
    "channel_id" uuid not null,
    "user_id" uuid not null,
    "content" text not null,
    "parent_id" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."groups" (
    "group_id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "owner_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."notifications" (
    "notification_id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "actor_id" uuid,
    "type" character varying(50) not null,
    "target_type" character varying(50),
    "target_id" uuid,
    "message_content" text not null,
    "is_read" boolean not null default false,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."post_comments" (
    "comment_id" uuid not null default gen_random_uuid(),
    "post_id" uuid not null,
    "user_id" uuid not null,
    "parent_id" uuid,
    "content" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."post_data" (
    "post_id" uuid not null,
    "like_count" integer not null default 0,
    "comment_count" integer not null default 0,
    "share_count" integer not null default 0,
    "view_count" integer not null default 0
      );



  create table "public"."post_likes" (
    "like_id" uuid not null default gen_random_uuid(),
    "post_id" uuid not null,
    "user_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."post_media" (
    "post_id" uuid not null,
    "post_media_id" uuid not null default gen_random_uuid(),
    "media_url" text not null,
    "media_type" character varying(50) not null,
    "width" integer,
    "height" integer,
    "order" integer not null default 0
      );



  create table "public"."post_shares" (
    "share_id" uuid not null default gen_random_uuid(),
    "post_id" uuid not null,
    "user_id" uuid not null,
    "share_type" character varying(20) not null default 'share'::character varying,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."post_tags" (
    "post_id" uuid not null,
    "tag_id" uuid not null
      );



  create table "public"."post_views" (
    "view_id" uuid not null default gen_random_uuid(),
    "post_id" uuid not null,
    "user_id" uuid,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."posts" (
    "post_id" uuid not null default gen_random_uuid(),
    "creator_id" uuid not null,
    "content" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "deleted_at" timestamp with time zone
      );



  create table "public"."project_members" (
    "project_id" uuid not null,
    "user_id" uuid not null,
    "role" character varying(20) not null default 'member'::character varying,
    "joined_at" timestamp with time zone not null default now()
      );



  create table "public"."project_tags" (
    "project_id" uuid not null,
    "tag_id" uuid not null
      );



  create table "public"."projects" (
    "project_id" uuid not null default gen_random_uuid(),
    "owner_id" uuid not null,
    "title" text not null,
    "description" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."reactions" (
    "reaction_id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "target_type" character varying(50) not null,
    "target_id" uuid not null,
    "reaction_type" character varying(50) not null,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."tags" (
    "tag_id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "slug" text not null
      );



  create table "public"."users" (
    "user_id" uuid not null,
    "bio" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "first_name" text,
    "last_name" text,
    "email" text,
    "avatar_url" text,
    "display_name" character varying(50),
    "level" integer default 1
      );


CREATE UNIQUE INDEX bookmarks_pkey ON public.bookmarks USING btree (bookmark_id);

CREATE UNIQUE INDEX follows_pkey ON public.follows USING btree (follower_id, followed_id);

CREATE UNIQUE INDEX group_channels_pkey ON public.group_channels USING btree (channel_id);

CREATE UNIQUE INDEX group_members_pkey ON public.group_members USING btree (group_id, user_id);

CREATE UNIQUE INDEX group_messages_pkey ON public.group_messages USING btree (message_id);

CREATE UNIQUE INDEX groups_pkey ON public.groups USING btree (group_id);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (notification_id);

CREATE UNIQUE INDEX post_comments_pkey ON public.post_comments USING btree (comment_id);

CREATE UNIQUE INDEX post_data_pkey ON public.post_data USING btree (post_id);

CREATE UNIQUE INDEX post_likes_pkey ON public.post_likes USING btree (like_id);

CREATE UNIQUE INDEX post_media_pkey ON public.post_media USING btree (post_id, post_media_id);

CREATE UNIQUE INDEX post_shares_pkey ON public.post_shares USING btree (share_id);

CREATE UNIQUE INDEX post_tags_pkey ON public.post_tags USING btree (post_id, tag_id);

CREATE UNIQUE INDEX post_views_pkey ON public.post_views USING btree (view_id);

CREATE UNIQUE INDEX posts_pkey ON public.posts USING btree (post_id);

CREATE UNIQUE INDEX project_members_pkey ON public.project_members USING btree (project_id, user_id);

CREATE UNIQUE INDEX project_tags_pkey ON public.project_tags USING btree (project_id, tag_id);

CREATE UNIQUE INDEX projects_pkey ON public.projects USING btree (project_id);

CREATE UNIQUE INDEX reactions_pkey ON public.reactions USING btree (reaction_id);

CREATE UNIQUE INDEX tags_pkey ON public.tags USING btree (tag_id);

CREATE UNIQUE INDEX tags_slug_key ON public.tags USING btree (slug);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (user_id);

alter table "public"."bookmarks" add constraint "bookmarks_pkey" PRIMARY KEY using index "bookmarks_pkey";

alter table "public"."follows" add constraint "follows_pkey" PRIMARY KEY using index "follows_pkey";

alter table "public"."group_channels" add constraint "group_channels_pkey" PRIMARY KEY using index "group_channels_pkey";

alter table "public"."group_members" add constraint "group_members_pkey" PRIMARY KEY using index "group_members_pkey";

alter table "public"."group_messages" add constraint "group_messages_pkey" PRIMARY KEY using index "group_messages_pkey";

alter table "public"."groups" add constraint "groups_pkey" PRIMARY KEY using index "groups_pkey";

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."post_comments" add constraint "post_comments_pkey" PRIMARY KEY using index "post_comments_pkey";

alter table "public"."post_data" add constraint "post_data_pkey" PRIMARY KEY using index "post_data_pkey";

alter table "public"."post_likes" add constraint "post_likes_pkey" PRIMARY KEY using index "post_likes_pkey";

alter table "public"."post_media" add constraint "post_media_pkey" PRIMARY KEY using index "post_media_pkey";

alter table "public"."post_shares" add constraint "post_shares_pkey" PRIMARY KEY using index "post_shares_pkey";

alter table "public"."post_tags" add constraint "post_tags_pkey" PRIMARY KEY using index "post_tags_pkey";

alter table "public"."post_views" add constraint "post_views_pkey" PRIMARY KEY using index "post_views_pkey";

alter table "public"."posts" add constraint "posts_pkey" PRIMARY KEY using index "posts_pkey";

alter table "public"."project_members" add constraint "project_members_pkey" PRIMARY KEY using index "project_members_pkey";

alter table "public"."project_tags" add constraint "project_tags_pkey" PRIMARY KEY using index "project_tags_pkey";

alter table "public"."projects" add constraint "projects_pkey" PRIMARY KEY using index "projects_pkey";

alter table "public"."reactions" add constraint "reactions_pkey" PRIMARY KEY using index "reactions_pkey";

alter table "public"."tags" add constraint "tags_pkey" PRIMARY KEY using index "tags_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."bookmarks" add constraint "bookmarks_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.posts(post_id) ON DELETE CASCADE not valid;

alter table "public"."bookmarks" validate constraint "bookmarks_post_id_fkey";

alter table "public"."bookmarks" add constraint "bookmarks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE not valid;

alter table "public"."bookmarks" validate constraint "bookmarks_user_id_fkey";

alter table "public"."follows" add constraint "follows_followed_id_fkey" FOREIGN KEY (followed_id) REFERENCES public.users(user_id) ON DELETE CASCADE not valid;

alter table "public"."follows" validate constraint "follows_followed_id_fkey";

alter table "public"."follows" add constraint "follows_follower_id_fkey" FOREIGN KEY (follower_id) REFERENCES public.users(user_id) ON DELETE CASCADE not valid;

alter table "public"."follows" validate constraint "follows_follower_id_fkey";

alter table "public"."group_channels" add constraint "group_channels_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public.groups(group_id) ON DELETE CASCADE not valid;

alter table "public"."group_channels" validate constraint "group_channels_group_id_fkey";

alter table "public"."group_members" add constraint "group_members_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public.groups(group_id) ON DELETE CASCADE not valid;

alter table "public"."group_members" validate constraint "group_members_group_id_fkey";

alter table "public"."group_members" add constraint "group_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE not valid;

alter table "public"."group_members" validate constraint "group_members_user_id_fkey";

alter table "public"."group_messages" add constraint "group_messages_channel_id_fkey" FOREIGN KEY (channel_id) REFERENCES public.group_channels(channel_id) ON DELETE CASCADE not valid;

alter table "public"."group_messages" validate constraint "group_messages_channel_id_fkey";

alter table "public"."group_messages" add constraint "group_messages_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE not valid;

alter table "public"."group_messages" validate constraint "group_messages_user_id_fkey";

alter table "public"."notifications" add constraint "notifications_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES public.users(user_id) ON DELETE SET NULL not valid;

alter table "public"."notifications" validate constraint "notifications_actor_id_fkey";

alter table "public"."notifications" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_user_id_fkey";

alter table "public"."post_comments" add constraint "post_comments_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.posts(post_id) ON DELETE CASCADE not valid;

alter table "public"."post_comments" validate constraint "post_comments_post_id_fkey";

alter table "public"."post_comments" add constraint "post_comments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE not valid;

alter table "public"."post_comments" validate constraint "post_comments_user_id_fkey";

alter table "public"."post_data" add constraint "post_data_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.posts(post_id) ON DELETE CASCADE not valid;

alter table "public"."post_data" validate constraint "post_data_post_id_fkey";

alter table "public"."post_likes" add constraint "post_likes_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.posts(post_id) ON DELETE CASCADE not valid;

alter table "public"."post_likes" validate constraint "post_likes_post_id_fkey";

alter table "public"."post_likes" add constraint "post_likes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE not valid;

alter table "public"."post_likes" validate constraint "post_likes_user_id_fkey";

alter table "public"."post_media" add constraint "post_media_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.posts(post_id) ON DELETE CASCADE not valid;

alter table "public"."post_media" validate constraint "post_media_post_id_fkey";

alter table "public"."post_shares" add constraint "post_shares_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.posts(post_id) ON DELETE CASCADE not valid;

alter table "public"."post_shares" validate constraint "post_shares_post_id_fkey";

alter table "public"."post_shares" add constraint "post_shares_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE not valid;

alter table "public"."post_shares" validate constraint "post_shares_user_id_fkey";

alter table "public"."post_tags" add constraint "post_tags_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.posts(post_id) ON DELETE CASCADE not valid;

alter table "public"."post_tags" validate constraint "post_tags_post_id_fkey";

alter table "public"."post_tags" add constraint "post_tags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES public.tags(tag_id) ON DELETE CASCADE not valid;

alter table "public"."post_tags" validate constraint "post_tags_tag_id_fkey";

alter table "public"."post_views" add constraint "post_views_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.posts(post_id) ON DELETE CASCADE not valid;

alter table "public"."post_views" validate constraint "post_views_post_id_fkey";

alter table "public"."post_views" add constraint "post_views_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE not valid;

alter table "public"."post_views" validate constraint "post_views_user_id_fkey";

alter table "public"."posts" add constraint "posts_creator_id_fkey" FOREIGN KEY (creator_id) REFERENCES public.users(user_id) ON DELETE CASCADE not valid;

alter table "public"."posts" validate constraint "posts_creator_id_fkey";

alter table "public"."project_members" add constraint "project_members_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE not valid;

alter table "public"."project_members" validate constraint "project_members_project_id_fkey";

alter table "public"."project_members" add constraint "project_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE not valid;

alter table "public"."project_members" validate constraint "project_members_user_id_fkey";

alter table "public"."project_tags" add constraint "project_tags_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE not valid;

alter table "public"."project_tags" validate constraint "project_tags_project_id_fkey";

alter table "public"."project_tags" add constraint "project_tags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES public.tags(tag_id) ON DELETE CASCADE not valid;

alter table "public"."project_tags" validate constraint "project_tags_tag_id_fkey";

alter table "public"."projects" add constraint "projects_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.users(user_id) ON DELETE CASCADE not valid;

alter table "public"."projects" validate constraint "projects_owner_id_fkey";

alter table "public"."reactions" add constraint "reactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE not valid;

alter table "public"."reactions" validate constraint "reactions_user_id_fkey";

alter table "public"."tags" add constraint "tags_slug_key" UNIQUE using index "tags_slug_key";

alter table "public"."users" add constraint "users_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."users" validate constraint "users_user_id_fkey";

grant delete on table "public"."bookmarks" to "anon";

grant insert on table "public"."bookmarks" to "anon";

grant references on table "public"."bookmarks" to "anon";

grant select on table "public"."bookmarks" to "anon";

grant trigger on table "public"."bookmarks" to "anon";

grant truncate on table "public"."bookmarks" to "anon";

grant update on table "public"."bookmarks" to "anon";

grant delete on table "public"."bookmarks" to "authenticated";

grant insert on table "public"."bookmarks" to "authenticated";

grant references on table "public"."bookmarks" to "authenticated";

grant select on table "public"."bookmarks" to "authenticated";

grant trigger on table "public"."bookmarks" to "authenticated";

grant truncate on table "public"."bookmarks" to "authenticated";

grant update on table "public"."bookmarks" to "authenticated";

grant delete on table "public"."bookmarks" to "service_role";

grant insert on table "public"."bookmarks" to "service_role";

grant references on table "public"."bookmarks" to "service_role";

grant select on table "public"."bookmarks" to "service_role";

grant trigger on table "public"."bookmarks" to "service_role";

grant truncate on table "public"."bookmarks" to "service_role";

grant update on table "public"."bookmarks" to "service_role";

grant delete on table "public"."follows" to "anon";

grant insert on table "public"."follows" to "anon";

grant references on table "public"."follows" to "anon";

grant select on table "public"."follows" to "anon";

grant trigger on table "public"."follows" to "anon";

grant truncate on table "public"."follows" to "anon";

grant update on table "public"."follows" to "anon";

grant delete on table "public"."follows" to "authenticated";

grant insert on table "public"."follows" to "authenticated";

grant references on table "public"."follows" to "authenticated";

grant select on table "public"."follows" to "authenticated";

grant trigger on table "public"."follows" to "authenticated";

grant truncate on table "public"."follows" to "authenticated";

grant update on table "public"."follows" to "authenticated";

grant delete on table "public"."follows" to "service_role";

grant insert on table "public"."follows" to "service_role";

grant references on table "public"."follows" to "service_role";

grant select on table "public"."follows" to "service_role";

grant trigger on table "public"."follows" to "service_role";

grant truncate on table "public"."follows" to "service_role";

grant update on table "public"."follows" to "service_role";

grant delete on table "public"."group_channels" to "anon";

grant insert on table "public"."group_channels" to "anon";

grant references on table "public"."group_channels" to "anon";

grant select on table "public"."group_channels" to "anon";

grant trigger on table "public"."group_channels" to "anon";

grant truncate on table "public"."group_channels" to "anon";

grant update on table "public"."group_channels" to "anon";

grant delete on table "public"."group_channels" to "authenticated";

grant insert on table "public"."group_channels" to "authenticated";

grant references on table "public"."group_channels" to "authenticated";

grant select on table "public"."group_channels" to "authenticated";

grant trigger on table "public"."group_channels" to "authenticated";

grant truncate on table "public"."group_channels" to "authenticated";

grant update on table "public"."group_channels" to "authenticated";

grant delete on table "public"."group_channels" to "service_role";

grant insert on table "public"."group_channels" to "service_role";

grant references on table "public"."group_channels" to "service_role";

grant select on table "public"."group_channels" to "service_role";

grant trigger on table "public"."group_channels" to "service_role";

grant truncate on table "public"."group_channels" to "service_role";

grant update on table "public"."group_channels" to "service_role";

grant delete on table "public"."group_members" to "anon";

grant insert on table "public"."group_members" to "anon";

grant references on table "public"."group_members" to "anon";

grant select on table "public"."group_members" to "anon";

grant trigger on table "public"."group_members" to "anon";

grant truncate on table "public"."group_members" to "anon";

grant update on table "public"."group_members" to "anon";

grant delete on table "public"."group_members" to "authenticated";

grant insert on table "public"."group_members" to "authenticated";

grant references on table "public"."group_members" to "authenticated";

grant select on table "public"."group_members" to "authenticated";

grant trigger on table "public"."group_members" to "authenticated";

grant truncate on table "public"."group_members" to "authenticated";

grant update on table "public"."group_members" to "authenticated";

grant delete on table "public"."group_members" to "service_role";

grant insert on table "public"."group_members" to "service_role";

grant references on table "public"."group_members" to "service_role";

grant select on table "public"."group_members" to "service_role";

grant trigger on table "public"."group_members" to "service_role";

grant truncate on table "public"."group_members" to "service_role";

grant update on table "public"."group_members" to "service_role";

grant delete on table "public"."group_messages" to "anon";

grant insert on table "public"."group_messages" to "anon";

grant references on table "public"."group_messages" to "anon";

grant select on table "public"."group_messages" to "anon";

grant trigger on table "public"."group_messages" to "anon";

grant truncate on table "public"."group_messages" to "anon";

grant update on table "public"."group_messages" to "anon";

grant delete on table "public"."group_messages" to "authenticated";

grant insert on table "public"."group_messages" to "authenticated";

grant references on table "public"."group_messages" to "authenticated";

grant select on table "public"."group_messages" to "authenticated";

grant trigger on table "public"."group_messages" to "authenticated";

grant truncate on table "public"."group_messages" to "authenticated";

grant update on table "public"."group_messages" to "authenticated";

grant delete on table "public"."group_messages" to "service_role";

grant insert on table "public"."group_messages" to "service_role";

grant references on table "public"."group_messages" to "service_role";

grant select on table "public"."group_messages" to "service_role";

grant trigger on table "public"."group_messages" to "service_role";

grant truncate on table "public"."group_messages" to "service_role";

grant update on table "public"."group_messages" to "service_role";

grant delete on table "public"."groups" to "anon";

grant insert on table "public"."groups" to "anon";

grant references on table "public"."groups" to "anon";

grant select on table "public"."groups" to "anon";

grant trigger on table "public"."groups" to "anon";

grant truncate on table "public"."groups" to "anon";

grant update on table "public"."groups" to "anon";

grant delete on table "public"."groups" to "authenticated";

grant insert on table "public"."groups" to "authenticated";

grant references on table "public"."groups" to "authenticated";

grant select on table "public"."groups" to "authenticated";

grant trigger on table "public"."groups" to "authenticated";

grant truncate on table "public"."groups" to "authenticated";

grant update on table "public"."groups" to "authenticated";

grant delete on table "public"."groups" to "service_role";

grant insert on table "public"."groups" to "service_role";

grant references on table "public"."groups" to "service_role";

grant select on table "public"."groups" to "service_role";

grant trigger on table "public"."groups" to "service_role";

grant truncate on table "public"."groups" to "service_role";

grant update on table "public"."groups" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."post_comments" to "anon";

grant insert on table "public"."post_comments" to "anon";

grant references on table "public"."post_comments" to "anon";

grant select on table "public"."post_comments" to "anon";

grant trigger on table "public"."post_comments" to "anon";

grant truncate on table "public"."post_comments" to "anon";

grant update on table "public"."post_comments" to "anon";

grant delete on table "public"."post_comments" to "authenticated";

grant insert on table "public"."post_comments" to "authenticated";

grant references on table "public"."post_comments" to "authenticated";

grant select on table "public"."post_comments" to "authenticated";

grant trigger on table "public"."post_comments" to "authenticated";

grant truncate on table "public"."post_comments" to "authenticated";

grant update on table "public"."post_comments" to "authenticated";

grant delete on table "public"."post_comments" to "service_role";

grant insert on table "public"."post_comments" to "service_role";

grant references on table "public"."post_comments" to "service_role";

grant select on table "public"."post_comments" to "service_role";

grant trigger on table "public"."post_comments" to "service_role";

grant truncate on table "public"."post_comments" to "service_role";

grant update on table "public"."post_comments" to "service_role";

grant delete on table "public"."post_data" to "anon";

grant insert on table "public"."post_data" to "anon";

grant references on table "public"."post_data" to "anon";

grant select on table "public"."post_data" to "anon";

grant trigger on table "public"."post_data" to "anon";

grant truncate on table "public"."post_data" to "anon";

grant update on table "public"."post_data" to "anon";

grant delete on table "public"."post_data" to "authenticated";

grant insert on table "public"."post_data" to "authenticated";

grant references on table "public"."post_data" to "authenticated";

grant select on table "public"."post_data" to "authenticated";

grant trigger on table "public"."post_data" to "authenticated";

grant truncate on table "public"."post_data" to "authenticated";

grant update on table "public"."post_data" to "authenticated";

grant delete on table "public"."post_data" to "service_role";

grant insert on table "public"."post_data" to "service_role";

grant references on table "public"."post_data" to "service_role";

grant select on table "public"."post_data" to "service_role";

grant trigger on table "public"."post_data" to "service_role";

grant truncate on table "public"."post_data" to "service_role";

grant update on table "public"."post_data" to "service_role";

grant delete on table "public"."post_likes" to "anon";

grant insert on table "public"."post_likes" to "anon";

grant references on table "public"."post_likes" to "anon";

grant select on table "public"."post_likes" to "anon";

grant trigger on table "public"."post_likes" to "anon";

grant truncate on table "public"."post_likes" to "anon";

grant update on table "public"."post_likes" to "anon";

grant delete on table "public"."post_likes" to "authenticated";

grant insert on table "public"."post_likes" to "authenticated";

grant references on table "public"."post_likes" to "authenticated";

grant select on table "public"."post_likes" to "authenticated";

grant trigger on table "public"."post_likes" to "authenticated";

grant truncate on table "public"."post_likes" to "authenticated";

grant update on table "public"."post_likes" to "authenticated";

grant delete on table "public"."post_likes" to "service_role";

grant insert on table "public"."post_likes" to "service_role";

grant references on table "public"."post_likes" to "service_role";

grant select on table "public"."post_likes" to "service_role";

grant trigger on table "public"."post_likes" to "service_role";

grant truncate on table "public"."post_likes" to "service_role";

grant update on table "public"."post_likes" to "service_role";

grant delete on table "public"."post_media" to "anon";

grant insert on table "public"."post_media" to "anon";

grant references on table "public"."post_media" to "anon";

grant select on table "public"."post_media" to "anon";

grant trigger on table "public"."post_media" to "anon";

grant truncate on table "public"."post_media" to "anon";

grant update on table "public"."post_media" to "anon";

grant delete on table "public"."post_media" to "authenticated";

grant insert on table "public"."post_media" to "authenticated";

grant references on table "public"."post_media" to "authenticated";

grant select on table "public"."post_media" to "authenticated";

grant trigger on table "public"."post_media" to "authenticated";

grant truncate on table "public"."post_media" to "authenticated";

grant update on table "public"."post_media" to "authenticated";

grant delete on table "public"."post_media" to "service_role";

grant insert on table "public"."post_media" to "service_role";

grant references on table "public"."post_media" to "service_role";

grant select on table "public"."post_media" to "service_role";

grant trigger on table "public"."post_media" to "service_role";

grant truncate on table "public"."post_media" to "service_role";

grant update on table "public"."post_media" to "service_role";

grant delete on table "public"."post_shares" to "anon";

grant insert on table "public"."post_shares" to "anon";

grant references on table "public"."post_shares" to "anon";

grant select on table "public"."post_shares" to "anon";

grant trigger on table "public"."post_shares" to "anon";

grant truncate on table "public"."post_shares" to "anon";

grant update on table "public"."post_shares" to "anon";

grant delete on table "public"."post_shares" to "authenticated";

grant insert on table "public"."post_shares" to "authenticated";

grant references on table "public"."post_shares" to "authenticated";

grant select on table "public"."post_shares" to "authenticated";

grant trigger on table "public"."post_shares" to "authenticated";

grant truncate on table "public"."post_shares" to "authenticated";

grant update on table "public"."post_shares" to "authenticated";

grant delete on table "public"."post_shares" to "service_role";

grant insert on table "public"."post_shares" to "service_role";

grant references on table "public"."post_shares" to "service_role";

grant select on table "public"."post_shares" to "service_role";

grant trigger on table "public"."post_shares" to "service_role";

grant truncate on table "public"."post_shares" to "service_role";

grant update on table "public"."post_shares" to "service_role";

grant delete on table "public"."post_tags" to "anon";

grant insert on table "public"."post_tags" to "anon";

grant references on table "public"."post_tags" to "anon";

grant select on table "public"."post_tags" to "anon";

grant trigger on table "public"."post_tags" to "anon";

grant truncate on table "public"."post_tags" to "anon";

grant update on table "public"."post_tags" to "anon";

grant delete on table "public"."post_tags" to "authenticated";

grant insert on table "public"."post_tags" to "authenticated";

grant references on table "public"."post_tags" to "authenticated";

grant select on table "public"."post_tags" to "authenticated";

grant trigger on table "public"."post_tags" to "authenticated";

grant truncate on table "public"."post_tags" to "authenticated";

grant update on table "public"."post_tags" to "authenticated";

grant delete on table "public"."post_tags" to "service_role";

grant insert on table "public"."post_tags" to "service_role";

grant references on table "public"."post_tags" to "service_role";

grant select on table "public"."post_tags" to "service_role";

grant trigger on table "public"."post_tags" to "service_role";

grant truncate on table "public"."post_tags" to "service_role";

grant update on table "public"."post_tags" to "service_role";

grant delete on table "public"."post_views" to "anon";

grant insert on table "public"."post_views" to "anon";

grant references on table "public"."post_views" to "anon";

grant select on table "public"."post_views" to "anon";

grant trigger on table "public"."post_views" to "anon";

grant truncate on table "public"."post_views" to "anon";

grant update on table "public"."post_views" to "anon";

grant delete on table "public"."post_views" to "authenticated";

grant insert on table "public"."post_views" to "authenticated";

grant references on table "public"."post_views" to "authenticated";

grant select on table "public"."post_views" to "authenticated";

grant trigger on table "public"."post_views" to "authenticated";

grant truncate on table "public"."post_views" to "authenticated";

grant update on table "public"."post_views" to "authenticated";

grant delete on table "public"."post_views" to "service_role";

grant insert on table "public"."post_views" to "service_role";

grant references on table "public"."post_views" to "service_role";

grant select on table "public"."post_views" to "service_role";

grant trigger on table "public"."post_views" to "service_role";

grant truncate on table "public"."post_views" to "service_role";

grant update on table "public"."post_views" to "service_role";

grant delete on table "public"."posts" to "anon";

grant insert on table "public"."posts" to "anon";

grant references on table "public"."posts" to "anon";

grant select on table "public"."posts" to "anon";

grant trigger on table "public"."posts" to "anon";

grant truncate on table "public"."posts" to "anon";

grant update on table "public"."posts" to "anon";

grant delete on table "public"."posts" to "authenticated";

grant insert on table "public"."posts" to "authenticated";

grant references on table "public"."posts" to "authenticated";

grant select on table "public"."posts" to "authenticated";

grant trigger on table "public"."posts" to "authenticated";

grant truncate on table "public"."posts" to "authenticated";

grant update on table "public"."posts" to "authenticated";

grant delete on table "public"."posts" to "service_role";

grant insert on table "public"."posts" to "service_role";

grant references on table "public"."posts" to "service_role";

grant select on table "public"."posts" to "service_role";

grant trigger on table "public"."posts" to "service_role";

grant truncate on table "public"."posts" to "service_role";

grant update on table "public"."posts" to "service_role";

grant delete on table "public"."project_members" to "anon";

grant insert on table "public"."project_members" to "anon";

grant references on table "public"."project_members" to "anon";

grant select on table "public"."project_members" to "anon";

grant trigger on table "public"."project_members" to "anon";

grant truncate on table "public"."project_members" to "anon";

grant update on table "public"."project_members" to "anon";

grant delete on table "public"."project_members" to "authenticated";

grant insert on table "public"."project_members" to "authenticated";

grant references on table "public"."project_members" to "authenticated";

grant select on table "public"."project_members" to "authenticated";

grant trigger on table "public"."project_members" to "authenticated";

grant truncate on table "public"."project_members" to "authenticated";

grant update on table "public"."project_members" to "authenticated";

grant delete on table "public"."project_members" to "service_role";

grant insert on table "public"."project_members" to "service_role";

grant references on table "public"."project_members" to "service_role";

grant select on table "public"."project_members" to "service_role";

grant trigger on table "public"."project_members" to "service_role";

grant truncate on table "public"."project_members" to "service_role";

grant update on table "public"."project_members" to "service_role";

grant delete on table "public"."project_tags" to "anon";

grant insert on table "public"."project_tags" to "anon";

grant references on table "public"."project_tags" to "anon";

grant select on table "public"."project_tags" to "anon";

grant trigger on table "public"."project_tags" to "anon";

grant truncate on table "public"."project_tags" to "anon";

grant update on table "public"."project_tags" to "anon";

grant delete on table "public"."project_tags" to "authenticated";

grant insert on table "public"."project_tags" to "authenticated";

grant references on table "public"."project_tags" to "authenticated";

grant select on table "public"."project_tags" to "authenticated";

grant trigger on table "public"."project_tags" to "authenticated";

grant truncate on table "public"."project_tags" to "authenticated";

grant update on table "public"."project_tags" to "authenticated";

grant delete on table "public"."project_tags" to "service_role";

grant insert on table "public"."project_tags" to "service_role";

grant references on table "public"."project_tags" to "service_role";

grant select on table "public"."project_tags" to "service_role";

grant trigger on table "public"."project_tags" to "service_role";

grant truncate on table "public"."project_tags" to "service_role";

grant update on table "public"."project_tags" to "service_role";

grant delete on table "public"."projects" to "anon";

grant insert on table "public"."projects" to "anon";

grant references on table "public"."projects" to "anon";

grant select on table "public"."projects" to "anon";

grant trigger on table "public"."projects" to "anon";

grant truncate on table "public"."projects" to "anon";

grant update on table "public"."projects" to "anon";

grant delete on table "public"."projects" to "authenticated";

grant insert on table "public"."projects" to "authenticated";

grant references on table "public"."projects" to "authenticated";

grant select on table "public"."projects" to "authenticated";

grant trigger on table "public"."projects" to "authenticated";

grant truncate on table "public"."projects" to "authenticated";

grant update on table "public"."projects" to "authenticated";

grant delete on table "public"."projects" to "service_role";

grant insert on table "public"."projects" to "service_role";

grant references on table "public"."projects" to "service_role";

grant select on table "public"."projects" to "service_role";

grant trigger on table "public"."projects" to "service_role";

grant truncate on table "public"."projects" to "service_role";

grant update on table "public"."projects" to "service_role";

grant delete on table "public"."reactions" to "anon";

grant insert on table "public"."reactions" to "anon";

grant references on table "public"."reactions" to "anon";

grant select on table "public"."reactions" to "anon";

grant trigger on table "public"."reactions" to "anon";

grant truncate on table "public"."reactions" to "anon";

grant update on table "public"."reactions" to "anon";

grant delete on table "public"."reactions" to "authenticated";

grant insert on table "public"."reactions" to "authenticated";

grant references on table "public"."reactions" to "authenticated";

grant select on table "public"."reactions" to "authenticated";

grant trigger on table "public"."reactions" to "authenticated";

grant truncate on table "public"."reactions" to "authenticated";

grant update on table "public"."reactions" to "authenticated";

grant delete on table "public"."reactions" to "service_role";

grant insert on table "public"."reactions" to "service_role";

grant references on table "public"."reactions" to "service_role";

grant select on table "public"."reactions" to "service_role";

grant trigger on table "public"."reactions" to "service_role";

grant truncate on table "public"."reactions" to "service_role";

grant update on table "public"."reactions" to "service_role";

grant delete on table "public"."tags" to "anon";

grant insert on table "public"."tags" to "anon";

grant references on table "public"."tags" to "anon";

grant select on table "public"."tags" to "anon";

grant trigger on table "public"."tags" to "anon";

grant truncate on table "public"."tags" to "anon";

grant update on table "public"."tags" to "anon";

grant delete on table "public"."tags" to "authenticated";

grant insert on table "public"."tags" to "authenticated";

grant references on table "public"."tags" to "authenticated";

grant select on table "public"."tags" to "authenticated";

grant trigger on table "public"."tags" to "authenticated";

grant truncate on table "public"."tags" to "authenticated";

grant update on table "public"."tags" to "authenticated";

grant delete on table "public"."tags" to "service_role";

grant insert on table "public"."tags" to "service_role";

grant references on table "public"."tags" to "service_role";

grant select on table "public"."tags" to "service_role";

grant trigger on table "public"."tags" to "service_role";

grant truncate on table "public"."tags" to "service_role";

grant update on table "public"."tags" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";


