begin;
create table public.popups (
  id text primary key check (id ~ '^[A-Za-z0-9_-]{8,100}$'),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  config jsonb not null check (jsonb_typeof(config) = 'object' and octet_length(config::text) < 1000000),
  revision integer not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.popups enable row level security;
create policy own_popups on public.popups for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
grant select, insert, update, delete on public.popups to authenticated;
revoke all on public.popups from anon;
create table public.popup_publications (
  id text primary key references public.popups(id) on delete cascade,
  config jsonb not null,
  published_at timestamptz not null default now()
);
alter table public.popup_publications enable row level security;
create policy own_publications on public.popup_publications for select to authenticated
  using (exists(select 1 from public.popups p where p.id = popup_publications.id and p.owner_id = (select auth.uid())));
grant select on public.popup_publications to authenticated;
revoke all on public.popup_publications from anon;
revoke insert, update, delete on public.popup_publications from authenticated;

-- Optimistic concurrency: stale browser tabs cannot silently overwrite newer edits.
create function public.save_popup(p_id text, p_config jsonb, p_revision integer)
returns integer language plpgsql security invoker set search_path = '' as $$
declare next_revision integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_config->>'id' is distinct from p_id then raise exception 'Invalid popup ID'; end if;
  if p_revision = 0 then
    insert into public.popups(id, owner_id, config) values(p_id, auth.uid(), p_config) returning revision into next_revision;
  else
    update public.popups set config = p_config, revision = revision + 1, updated_at = now()
    where id = p_id and owner_id = auth.uid() and revision = p_revision returning revision into next_revision;
    if next_revision is null then raise exception 'CONFLICT: Popup changed or access denied'; end if;
  end if;
  return next_revision;
end $$;

create function public.publish_popup(p_id text, p_revision integer)
returns timestamptz language plpgsql security definer set search_path = '' as $$
declare cfg jsonb; stamp timestamptz := now();
begin
  select config into cfg from public.popups where id = p_id and owner_id = auth.uid() and revision = p_revision for update;
  if cfg is null then raise exception 'CONFLICT: Save the latest draft before publishing'; end if;
  insert into public.popup_publications(id, config, published_at) values(p_id, cfg, stamp)
  on conflict(id) do update set config = excluded.config, published_at = excluded.published_at;
  return stamp;
end $$;

create function public.unpublish_popup(p_id text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists(select 1 from public.popups where id = p_id and owner_id = auth.uid()) then raise exception 'Access denied'; end if;
  delete from public.popup_publications where id = p_id;
end $$;

-- Public API exposes a single published snapshot, never drafts or account details.
create function public.get_published_popup(p_id text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select config from public.popup_publications where id = p_id;
$$;
revoke all on function public.save_popup(text,jsonb,integer), public.publish_popup(text,integer), public.unpublish_popup(text), public.get_published_popup(text) from public;
grant execute on function public.save_popup(text,jsonb,integer), public.publish_popup(text,integer), public.unpublish_popup(text) to authenticated;
grant execute on function public.get_published_popup(text) to anon, authenticated;

-- Assets are intended for public website display. Only the owner can upload.
-- Immutable filenames preserve the images referenced by previous publications.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values('popup-images','popup-images',true,5242880,array['image/png','image/jpeg','image/webp','image/gif'])
on conflict(id) do nothing;
create policy upload_own_images on storage.objects for insert to authenticated
with check(bucket_id = 'popup-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy read_own_images on storage.objects for select to authenticated
using(bucket_id = 'popup-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
commit;
