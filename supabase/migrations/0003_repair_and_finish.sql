-- Living GDD — repair + finish 0002
--
-- Run this once in your Supabase project's SQL Editor. Every statement
-- here is safe to run more than once (drop-if-exists / create-or-replace /
-- add-column-if-not-exists / a caught duplicate_object exception for the
-- realtime lines) — this exists because a partial run of 0002 stopped
-- part-way through (before its last two pieces: the `collaborators`
-- column and the updated `invite_project_member`), which also left the
-- `projects` RLS policies from that same file in an unconfirmed state.
-- This picks up from wherever that left off and re-asserts everything
-- from that point on, rather than trying to guess the exact stopping
-- point.

-- ---------------------------------------------------------------------
-- `projects` RLS — re-assert cleanly regardless of what's currently
-- there (including 0001's original "owner full access", in case the
-- `drop policy` in 0002 never ran).
-- ---------------------------------------------------------------------
drop policy if exists "owner full access" on public.projects;
drop policy if exists "members can view" on public.projects;
drop policy if exists "creator can insert" on public.projects;
drop policy if exists "members can update" on public.projects;
drop policy if exists "owner can delete" on public.projects;

create policy "members can view" on public.projects
  for select using (public.is_project_member(id));
create policy "creator can insert" on public.projects
  for insert with check (owner_id = auth.uid());
create policy "members can update" on public.projects
  for update using (public.is_project_member(id)) with check (public.is_project_member(id));
create policy "owner can delete" on public.projects
  for delete using (owner_id = auth.uid());

-- `owns_project` redefinition — already idempotent, re-asserted for
-- safety in case 0002 stopped before reaching it.
create or replace function public.owns_project(p_project_id text)
returns boolean
language sql
security definer
stable
as $$
  select public.is_project_member(p_project_id);
$$;

-- ---------------------------------------------------------------------
-- Invite a teammate by email — returns the invited account's id.
--
-- Dropped first: the version 0002 actually got to run still returns
-- `void` (this file's `create or replace` came after that stopping
-- point), and Postgres refuses to change an existing function's return
-- type via `create or replace` — it has to go entirely and come back.
-- ---------------------------------------------------------------------
drop function if exists public.invite_project_member(text, text, text);

create or replace function public.invite_project_member(
  p_project_id text,
  p_email text,
  p_role text default 'editor'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user_id uuid;
begin
  if not public.is_project_owner(p_project_id) then
    raise exception 'Only the project owner can invite members';
  end if;
  if p_role not in ('owner', 'editor') then
    raise exception 'Invalid role: %', p_role;
  end if;

  select id into target_user_id from auth.users where email = p_email;
  if target_user_id is null then
    raise exception 'No account found for %. They need to create one first.', p_email;
  end if;

  insert into public.project_members ("projectId", "userId", role)
  values (p_project_id, target_user_id, p_role)
  on conflict ("projectId", "userId") do update set role = excluded.role;

  return target_user_id;
end;
$$;

-- ---------------------------------------------------------------------
-- `collaborators.userId` — links a teammate row to the real account it
-- represents, when there is one.
-- ---------------------------------------------------------------------
alter table public.collaborators
  add column if not exists "userId" uuid references public.profiles(id) on delete set null;

-- ---------------------------------------------------------------------
-- Realtime — adding a table already in the publication raises
-- `duplicate_object`; caught so this is safe to re-run.
-- ---------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.project_members;
exception when duplicate_object then null;
end $$;
