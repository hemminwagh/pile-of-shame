-- ============================================================
-- PILE OF SHAME V9 — SUPABASE SETUP
-- Ejecutar UNA VEZ en Supabase > SQL Editor > New query > Run
-- ============================================================

begin;

create extension if not exists pgcrypto;

-- ---------- PROFILES ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null,
  display_name text not null default 'Coleccionista',
  bio text not null default '',
  favorite_faction text not null default 'none',
  avatar_url text not null default '',
  banner_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_handle_format check (handle ~ '^[a-z0-9_]{3,24}$')
);

create unique index if not exists profiles_handle_lower_uidx
  on public.profiles (lower(handle));

-- Crea automáticamente el perfil al registrar una cuenta.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_handle text;
  new_name text;
begin
  new_handle := lower(coalesce(new.raw_user_meta_data ->> 'handle', ''));
  new_handle := regexp_replace(new_handle, '[^a-z0-9_]', '', 'g');

  if char_length(new_handle) < 3 then
    new_handle := 'user_' || substr(new.id::text, 1, 8);
  end if;

  new_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '');
  if new_name is null then
    new_name := new_handle;
  end if;

  insert into public.profiles (id, handle, display_name)
  values (new.id, new_handle, new_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

-- ---------- FOLLOWS ----------
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_not_self check (follower_id <> following_id)
);

create index if not exists follows_following_idx on public.follows(following_id);

create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.follows f1
    where f1.follower_id = a and f1.following_id = b
  )
  and exists (
    select 1 from public.follows f2
    where f2.follower_id = b and f2.following_id = a
  );
$$;

-- ---------- POSTS ----------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  visibility text not null default 'public'
    check (visibility in ('public','friends','private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_user_idx on public.posts(user_id);
create index if not exists posts_created_idx on public.posts(created_at desc);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists comments_post_idx on public.comments(post_id);

-- ---------- COLLECTION ----------
create table if not exists public.collection_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('mini','material')),
  name text not null,
  faction text not null default '',
  category text not null default '',
  brand text not null default '',
  status text not null default '',
  quantity integer not null default 1 check (quantity > 0),
  cost numeric(12,2) not null default 0 check (cost >= 0),
  purchase_date date,
  notes text not null default '',
  visibility text not null default 'public'
    check (visibility in ('public','friends','private')),
  created_at timestamptz not null default now()
);

create index if not exists collection_user_idx on public.collection_items(user_id);

-- ---------- PROJECTS ----------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  status text not null default 'active',
  visibility text not null default 'public'
    check (visibility in ('public','friends','private')),
  created_at timestamptz not null default now()
);

-- ---------- WISHLIST ----------
create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  category text not null default '',
  price numeric(12,2) not null default 0 check (price >= 0),
  notes text not null default '',
  visibility text not null default 'public'
    check (visibility in ('public','friends','private')),
  created_at timestamptz not null default now()
);

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.follows enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.comments enable row level security;
alter table public.collection_items enable row level security;
alter table public.projects enable row level security;
alter table public.wishlist_items enable row level security;

-- Profiles: son públicos (la app es social); solo el dueño edita.
drop policy if exists "profiles public read" on public.profiles;
create policy "profiles public read"
on public.profiles for select
to anon, authenticated
using (true);

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Follows
drop policy if exists "follows read" on public.follows;
create policy "follows read"
on public.follows for select
to authenticated
using (true);

drop policy if exists "follows create self" on public.follows;
create policy "follows create self"
on public.follows for insert
to authenticated
with check (auth.uid() = follower_id);

drop policy if exists "follows delete self" on public.follows;
create policy "follows delete self"
on public.follows for delete
to authenticated
using (auth.uid() = follower_id);

-- Posts
drop policy if exists "posts visible" on public.posts;
create policy "posts visible"
on public.posts for select
to authenticated
using (
  user_id = auth.uid()
  or visibility = 'public'
  or (visibility = 'friends' and public.are_friends(auth.uid(), user_id))
);

drop policy if exists "posts create self" on public.posts;
create policy "posts create self"
on public.posts for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "posts update self" on public.posts;
create policy "posts update self"
on public.posts for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "posts delete self" on public.posts;
create policy "posts delete self"
on public.posts for delete
to authenticated
using (auth.uid() = user_id);

-- Likes: la PK (post_id,user_id) garantiza 1 like por persona.
drop policy if exists "likes visible post read" on public.post_likes;
create policy "likes visible post read"
on public.post_likes for select
to authenticated
using (
  exists (select 1 from public.posts p where p.id = post_id)
);

drop policy if exists "likes create self" on public.post_likes;
create policy "likes create self"
on public.post_likes for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (select 1 from public.posts p where p.id = post_id)
);

drop policy if exists "likes delete self" on public.post_likes;
create policy "likes delete self"
on public.post_likes for delete
to authenticated
using (auth.uid() = user_id);

-- Comments
drop policy if exists "comments visible post read" on public.comments;
create policy "comments visible post read"
on public.comments for select
to authenticated
using (
  exists (select 1 from public.posts p where p.id = post_id)
);

drop policy if exists "comments create self" on public.comments;
create policy "comments create self"
on public.comments for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (select 1 from public.posts p where p.id = post_id)
);

drop policy if exists "comments delete self" on public.comments;
create policy "comments delete self"
on public.comments for delete
to authenticated
using (auth.uid() = user_id);

-- Colección
drop policy if exists "collection visible" on public.collection_items;
create policy "collection visible"
on public.collection_items for select
to authenticated
using (
  user_id = auth.uid()
  or visibility = 'public'
  or (visibility = 'friends' and public.are_friends(auth.uid(), user_id))
);

drop policy if exists "collection create self" on public.collection_items;
create policy "collection create self"
on public.collection_items for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "collection update self" on public.collection_items;
create policy "collection update self"
on public.collection_items for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "collection delete self" on public.collection_items;
create policy "collection delete self"
on public.collection_items for delete
to authenticated
using (auth.uid() = user_id);

-- Projects
drop policy if exists "projects visible" on public.projects;
create policy "projects visible"
on public.projects for select
to authenticated
using (
  user_id = auth.uid()
  or visibility = 'public'
  or (visibility = 'friends' and public.are_friends(auth.uid(), user_id))
);

drop policy if exists "projects write self" on public.projects;
create policy "projects write self"
on public.projects for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Wishlist
drop policy if exists "wishlist visible" on public.wishlist_items;
create policy "wishlist visible"
on public.wishlist_items for select
to authenticated
using (
  user_id = auth.uid()
  or visibility = 'public'
  or (visibility = 'friends' and public.are_friends(auth.uid(), user_id))
);

drop policy if exists "wishlist write self" on public.wishlist_items;
create policy "wishlist write self"
on public.wishlist_items for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);



-- ---------- API GRANTS EXPLÍCITOS ----------
-- Supabase suele gestionar estos permisos por defecto, pero los dejamos
-- explícitos para que PostgREST pueda acceder a las tablas según RLS.

grant usage on schema public to anon, authenticated;

grant select on public.profiles to anon, authenticated;
grant update on public.profiles to authenticated;

grant select, insert, delete on public.follows to authenticated;

grant select, insert, update, delete on public.posts to authenticated;
grant select, insert, delete on public.post_likes to authenticated;
grant select, insert, delete on public.comments to authenticated;

grant select, insert, update, delete on public.collection_items to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.wishlist_items to authenticated;

-- ---------- PUBLIC PROFILE MEDIA ----------
insert into storage.buckets (id, name, public)
values ('profile-media', 'profile-media', true)
on conflict (id) do update set public = true;

drop policy if exists "profile media public read" on storage.objects;
create policy "profile media public read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'profile-media');

drop policy if exists "profile media insert own folder" on storage.objects;
create policy "profile media insert own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-media'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "profile media update own folder" on storage.objects;
create policy "profile media update own folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-media'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'profile-media'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "profile media delete own folder" on storage.objects;
create policy "profile media delete own folder"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profile-media'
  and split_part(name, '/', 1) = auth.uid()::text
);

commit;
