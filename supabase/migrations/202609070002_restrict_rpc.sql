begin;
-- Hosted Supabase may grant EXECUTE directly to anon through default privileges.
-- Revoking PUBLIC alone does not remove those direct grants.
revoke all on function public.save_popup(text,jsonb,integer), public.publish_popup(text,integer), public.unpublish_popup(text) from anon;
create index if not exists popups_owner_updated_idx on public.popups(owner_id, updated_at desc);
commit;
