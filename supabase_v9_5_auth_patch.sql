-- ============================================================
-- PILE OF SHAME V9.5 — AUTH SIN EMAIL / TELÉFONO
-- Ejecutar UNA VEZ en Supabase > SQL Editor.
-- Después, en Authentication, activa "Allow anonymous sign-ins".
-- ============================================================

begin;

create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists recovery_hash text not null default '';

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_handle text;
  new_name text;
  new_recovery_hash text;
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

  new_recovery_hash := coalesce(new.raw_user_meta_data ->> 'recovery_hash', '');

  insert into public.profiles (
    id,
    handle,
    display_name,
    recovery_hash
  )
  values (
    new.id,
    new_handle,
    new_name,
    new_recovery_hash
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

-- Recupera una cuenta antigua moviendo su contenido a la nueva sesión anónima.
-- El secreto nunca se guarda en claro: solo se compara su SHA-256.
create or replace function public.recover_account(
  p_handle text,
  p_secret text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_new_id uuid := auth.uid();
  v_old public.profiles%rowtype;
  v_normalized_handle text;
  v_hash text;
  v_temp_handle text;
begin
  if v_new_id is null then
    raise exception 'Authentication required';
  end if;

  v_normalized_handle := lower(regexp_replace(coalesce(p_handle, ''), '[^a-z0-9_]', '', 'g'));

  select *
  into v_old
  from public.profiles
  where lower(handle) = v_normalized_handle
  limit 1;

  if not found then
    return false;
  end if;

  if v_old.id = v_new_id then
    return true;
  end if;

  v_hash := encode(digest(coalesce(p_secret, ''), 'sha256'), 'hex');

  if v_old.recovery_hash = '' or v_old.recovery_hash <> v_hash then
    return false;
  end if;

  -- Libera el @usuario mientras movemos la propiedad.
  v_temp_handle := 'recovered_' || substr(v_old.id::text, 1, 8);
  update public.profiles
  set handle = v_temp_handle
  where id = v_old.id;

  -- Mueve todo el contenido social y personal.
  update public.posts set user_id = v_new_id where user_id = v_old.id;
  update public.collection_items set user_id = v_new_id where user_id = v_old.id;
  update public.projects set user_id = v_new_id where user_id = v_old.id;
  update public.wishlist_items set user_id = v_new_id where user_id = v_old.id;
  update public.comments set user_id = v_new_id where user_id = v_old.id;
  update public.post_likes set user_id = v_new_id where user_id = v_old.id;

  update public.follows set follower_id = v_new_id where follower_id = v_old.id;
  update public.follows set following_id = v_new_id where following_id = v_old.id;

  -- Convierte el perfil temporal de recuperación en el perfil original.
  update public.profiles
  set
    handle = v_normalized_handle,
    display_name = v_old.display_name,
    bio = v_old.bio,
    favorite_faction = v_old.favorite_faction,
    avatar_url = v_old.avatar_url,
    banner_url = v_old.banner_url,
    recovery_hash = v_old.recovery_hash,
    updated_at = now()
  where id = v_new_id;

  delete from public.profiles where id = v_old.id;

  return true;
end;
$$;

revoke all on function public.recover_account(text, text) from public;
grant execute on function public.recover_account(text, text) to authenticated;

commit;
