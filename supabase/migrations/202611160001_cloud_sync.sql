-- PoultrySmart AI: secure cloud accounts and versioned farm snapshots.
-- Run this migration in the Supabase SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.farms (
 id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name)) between 1 and 120),
 location text not null default '', currency text not null default 'TZS',
 created_by uuid not null references auth.users(id) on delete restrict, created_at timestamptz not null default now()
);
create table if not exists public.farm_members (
 farm_id uuid not null references public.farms(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null default 'owner' check(role in ('owner','admin','staff','viewer')),
 joined_at timestamptz not null default now(), primary key(farm_id,user_id)
);
create table if not exists public.farm_snapshots (
 farm_id uuid primary key references public.farms(id) on delete cascade, state jsonb not null,
 revision bigint not null default 1 check(revision>0), updated_by uuid not null references auth.users(id) on delete restrict,
 updated_at timestamptz not null default now(), constraint farm_snapshot_state_object check(jsonb_typeof(state)='object')
);
alter table public.farms enable row level security;
alter table public.farm_members enable row level security;
alter table public.farm_snapshots enable row level security;
revoke all on table public.farms from anon,authenticated;
revoke all on table public.farm_members from anon,authenticated;
revoke all on table public.farm_snapshots from anon,authenticated;
grant select on table public.farms,public.farm_members,public.farm_snapshots to authenticated;
drop policy if exists "Members can read their farms" on public.farms;
create policy "Members can read their farms" on public.farms for select to authenticated using(exists(select 1 from public.farm_members m where m.farm_id=farms.id and m.user_id=(select auth.uid())));
drop policy if exists "Users can read their own membership" on public.farm_members;
create policy "Users can read their own membership" on public.farm_members for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists "Members can read their farm snapshots" on public.farm_snapshots;
create policy "Members can read their farm snapshots" on public.farm_snapshots for select to authenticated using(exists(select 1 from public.farm_members m where m.farm_id=farm_snapshots.farm_id and m.user_id=(select auth.uid())));
create or replace function public.create_farm_with_snapshot(p_name text,p_location text,p_currency text,p_state jsonb)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_user uuid:=auth.uid(); v_farm uuid;
begin
 if v_user is null then raise exception 'Authentication required' using errcode='28000'; end if;
 if p_state is null or jsonb_typeof(p_state)<>'object' or pg_column_size(p_state)>5000000 then raise exception 'Farm data invalid or exceeds 5 MB pilot limit' using errcode='22023'; end if;
 insert into public.farms(name,location,currency,created_by) values(left(coalesce(nullif(trim(p_name),''),'My Poultry Farm'),120),coalesce(p_location,''),coalesce(nullif(p_currency,''),'TZS'),v_user) returning id into v_farm;
 insert into public.farm_members(farm_id,user_id,role) values(v_farm,v_user,'owner');
 insert into public.farm_snapshots(farm_id,state,revision,updated_by) values(v_farm,p_state,1,v_user);
 return v_farm;
end; $$;
create or replace function public.save_farm_snapshot(p_farm_id uuid,p_state jsonb,p_expected_revision bigint)
returns bigint language plpgsql security definer set search_path=public,pg_temp as $$
declare v_user uuid:=auth.uid(); v_revision bigint;
begin
 if v_user is null then raise exception 'Authentication required' using errcode='28000'; end if;
 if not exists(select 1 from public.farm_members m where m.farm_id=p_farm_id and m.user_id=v_user and m.role in('owner','admin','staff')) then raise exception 'You do not have permission to update this farm' using errcode='42501'; end if;
 if p_state is null or jsonb_typeof(p_state)<>'object' or pg_column_size(p_state)>5000000 then raise exception 'Farm data invalid or exceeds 5 MB pilot limit' using errcode='22023'; end if;
 update public.farm_snapshots set state=p_state,revision=revision+1,updated_by=v_user,updated_at=now() where farm_id=p_farm_id and revision=p_expected_revision returning revision into v_revision;
 if v_revision is null then raise exception 'Cloud farm changed since last sync. Refresh before saving.' using errcode='40001'; end if;
 return v_revision;
end; $$;
revoke all on function public.create_farm_with_snapshot(text,text,text,jsonb) from public,anon;
revoke all on function public.save_farm_snapshot(uuid,jsonb,bigint) from public,anon;
grant execute on function public.create_farm_with_snapshot(text,text,text,jsonb) to authenticated;
grant execute on function public.save_farm_snapshot(uuid,jsonb,bigint) to authenticated;
comment on table public.farm_snapshots is 'Versioned JSON snapshots for PoultrySmart local-first cloud sync. Writes use permission-checked RPC functions and revision checks.';
