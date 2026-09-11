begin;

create table public.voucher_claims (
  id uuid primary key default gen_random_uuid(),
  popup_id text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  visitor_key text not null check (visitor_key ~ '^[A-Za-z0-9_-]{16,100}$'),
  voucher_id text not null,
  voucher_name text not null,
  voucher_code text not null default '',
  status text not null default 'pending' check (status in ('pending', 'confirmed')),
  ghl_contact_id text,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unique (popup_id, visitor_key)
);

alter table public.voucher_claims enable row level security;
create policy own_voucher_claims on public.voucher_claims for select to authenticated
  using (owner_id = (select auth.uid()));
grant select on public.voucher_claims to authenticated;
revoke all on public.voucher_claims from anon;
revoke insert, update, delete on public.voucher_claims from authenticated;
create index voucher_claims_owner_created_idx on public.voucher_claims(owner_id, created_at desc);

create function public.create_voucher_claim(p_popup_id text, p_visitor_key text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  cfg jsonb;
  popup_owner uuid;
  item jsonb;
  chosen jsonb;
  total numeric := 0;
  cursor numeric;
  existing public.voucher_claims%rowtype;
  created public.voucher_claims%rowtype;
begin
  if p_popup_id !~ '^[A-Za-z0-9_-]{8,100}$' or p_visitor_key !~ '^[A-Za-z0-9_-]{16,100}$' then
    raise exception 'Invalid claim request';
  end if;

  select pp.config, p.owner_id into cfg, popup_owner
  from public.popup_publications pp
  join public.popups p on p.id = pp.id
  where pp.id = p_popup_id;
  if cfg is null then return null; end if;

  select * into existing from public.voucher_claims
  where popup_id = p_popup_id and visitor_key = p_visitor_key;
  if found then
    return jsonb_build_object('claimId', existing.id, 'voucherId', existing.voucher_id,
      'rewardText', existing.voucher_name, 'code', existing.voucher_code);
  end if;

  if coalesce((cfg->>'voucherRandomEnabled')::boolean, false) then
    for item in select value from jsonb_array_elements(coalesce(cfg->'vouchers', '[]'::jsonb)) loop
      total := total + greatest(coalesce((item->>'probability')::numeric, 0), 0);
    end loop;
    if total <= 0 then raise exception 'Voucher probabilities are invalid'; end if;
    cursor := random() * total;
    for item in select value from jsonb_array_elements(cfg->'vouchers') loop
      cursor := cursor - greatest(coalesce((item->>'probability')::numeric, 0), 0);
      if cursor < 0 then chosen := item; exit; end if;
    end loop;
  else
    chosen := jsonb_build_object('id', 'fixed', 'rewardText', coalesce(cfg->>'rewardText', 'Phần thưởng'),
      'code', '', 'rewardSubtitle', cfg->>'rewardSubtitle', 'rewardImage', cfg->>'rewardImage',
      'rewardTextColor', cfg->>'rewardTextColor', 'rewardSubtitleColor', cfg->>'rewardSubtitleColor');
  end if;
  if chosen is null then raise exception 'No voucher available'; end if;

  insert into public.voucher_claims(popup_id, owner_id, visitor_key, voucher_id, voucher_name, voucher_code)
  values(p_popup_id, popup_owner, p_visitor_key, coalesce(chosen->>'id','fixed'),
    coalesce(chosen->>'rewardText','Phần thưởng'), coalesce(chosen->>'code',''))
  on conflict(popup_id, visitor_key) do update set popup_id = excluded.popup_id
  returning * into created;

  return jsonb_strip_nulls(jsonb_build_object('claimId', created.id, 'voucherId', created.voucher_id,
    'rewardText', created.voucher_name, 'rewardSubtitle', chosen->>'rewardSubtitle',
    'rewardImage', chosen->>'rewardImage', 'rewardTextColor', chosen->>'rewardTextColor',
    'rewardSubtitleColor', chosen->>'rewardSubtitleColor', 'code', created.voucher_code));
end $$;

create function public.confirm_voucher_claim(p_claim_id uuid, p_contact_id text, p_email text, p_phone text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare updated public.voucher_claims%rowtype;
begin
  update public.voucher_claims set status = 'confirmed',
    ghl_contact_id = nullif(left(coalesce(p_contact_id,''), 200), ''),
    email = nullif(left(lower(trim(coalesce(p_email,''))), 320), ''),
    phone = nullif(left(trim(coalesce(p_phone,'')), 50), ''),
    confirmed_at = coalesce(confirmed_at, now())
  where id = p_claim_id returning * into updated;
  if not found then return null; end if;
  return jsonb_build_object('claimId', updated.id, 'voucherId', updated.voucher_id,
    'rewardText', updated.voucher_name, 'code', updated.voucher_code, 'status', updated.status);
end $$;

revoke all on function public.create_voucher_claim(text,text), public.confirm_voucher_claim(uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.create_voucher_claim(text,text), public.confirm_voucher_claim(uuid,text,text,text) to anon;

commit;
