-- Living GDD — profiles + real multi-user project access
--
-- Run this once in your Supabase project's SQL Editor, after 0001_init.sql
-- has already been applied. Adds:
--   1. `profiles` — a display name + avatar per account, auto-created on
--      signup, so people show up as themselves instead of a raw email.
--   2. `project_members` — the extension point 0001's own comments called
--      out ("adding real team sharing later means adding a
--      `project_members` table"). Replaces "one owner per project" with
--      "one or more members per project," each with a role.
--
-- Design notes:
--
-- 1. `profiles` is deliberately simple: readable by *any* authenticated
--    user (not just fellow project members), writable only by your own
--    row. It only ever holds a display name + avatar — nothing sensitive
--    — and scoping reads to "shares a project with you" would need
--    another security-definer join for very little actual benefit here.
--    A conscious simplification, not an oversight.
--
-- 2. `owns_project` (from 0001) is redefined in place, not renamed —
--    every project-scoped table's RLS policy already calls
--    `public.owns_project("projectId")`, and `create or replace function`
--    updates what those existing policies enforce without having to touch
--    17 policy definitions. Its meaning shifts from "is the sole owner"
--    to "is any member (owner or editor)" — which is exactly the access
--    level every project-scoped table's content should have: any member
--    can fully edit the document, same as an owner could before.
--
-- 3. Two roles only: `owner` (created automatically for whoever creates
--    the project — see the trigger below — everything an editor can do,
--    plus invite/remove members and delete the project) and `editor`
--    (full read/write on the project's content *and* its own name/intro/
--    status, same as today's single-owner model, but can't manage
--    membership or delete the project outright). No `viewer`/read-only
--    role yet — nothing in the app enforces read-only anywhere today, so
--    adding one here would be UI the rest of the app can't honor yet.
--
-- 4. Inviting by email goes through `invite_project_member`, a
--    `security definer` function, rather than exposing `auth.users` (or
--    letting the client look people up directly). It re-checks the
--    caller is an owner of the target project itself — RLS on the RPC's
--    *effects* (the `insert` it performs), not just on who's allowed to
--    call it at all.
--
-- 5. `project_members` RLS uses its own `is_project_member`/
--    `is_project_owner` security-definer helpers rather than a plain
--    policy that queries `project_members` from within a policy *on*
--    `project_members` — that's the classic self-referential-RLS
--    recursion trap; `security definer` sidesteps it the same way
--    `owns_project` already did for every other table in 0001.
--
-- 6. `project_members."userId"` references `profiles(id)`, not
--    `auth.users(id)` directly — `profiles.id` already references
--    `auth.users(id)` 1:1 (every user gets a profile row at signup, via
--    the trigger below, before anyone could ever invite them), so this
--    loses nothing, and it's what lets PostgREST auto-embed the profile
--    (display name, avatar) straight into a `project_members` query
--    instead of a second round-trip per member.

-- ---------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  "displayName" text not null default '',
  "avatarUrl" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "any authenticated user can view profiles" on public.profiles
  for select using (auth.role() = 'authenticated');
create policy "own profile only" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Auto-create a profile the moment someone signs up — a default display
-- name derived from their email's local part, editable later. Runs as
-- the function owner (implicitly security definer via `auth` schema
-- trigger conventions) so it can insert despite the table's RLS.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, "displayName")
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: `handle_new_user` only fires for signups *from here on* — any
-- account created before this migration ran (there's already at least
-- one, from testing this whole setup) would otherwise have no profile
-- row at all. Safe to run even on a brand-new project with zero users.
insert into public.profiles (id, "displayName")
select id, split_part(email, '@', 1) from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Project membership
-- ---------------------------------------------------------------------
create table public.project_members (
  "projectId" text not null references public.projects(id) on delete cascade,
  "userId" uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'editor' check (role in ('owner', 'editor')),
  "createdAt" timestamptz not null default now(),
  primary key ("projectId", "userId")
);
create index project_members_user_idx on public.project_members ("userId");

create or replace function public.is_project_member(p_project_id text)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.project_members
    where "projectId" = p_project_id and "userId" = auth.uid()
  );
$$;

create or replace function public.is_project_owner(p_project_id text)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.project_members
    where "projectId" = p_project_id and "userId" = auth.uid() and role = 'owner'
  );
$$;

alter table public.project_members enable row level security;
create policy "members can view the roster" on public.project_members
  for select using (public.is_project_member("projectId"));
create policy "owners add members" on public.project_members
  for insert with check (public.is_project_owner("projectId"));
create policy "owners change roles" on public.project_members
  for update using (public.is_project_owner("projectId")) with check (public.is_project_owner("projectId"));
create policy "owners remove members, members remove themselves" on public.project_members
  for delete using (public.is_project_owner("projectId") or "userId" = auth.uid());

-- Whoever creates a project becomes its first member, as owner —
-- transparent to `SupabaseRepository.projects.create`/`bulkPut`, neither
-- of which needs to know `project_members` exists.
create or replace function public.handle_new_project()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.project_members ("projectId", "userId", role)
  values (new.id, new.owner_id, 'owner')
  on conflict ("projectId", "userId") do nothing;
  return new;
end;
$$;

create trigger on_project_created
  after insert on public.projects
  for each row execute function public.handle_new_project();

-- Backfill, same reasoning as the profiles one above: any project created
-- before this migration ran (there's already a real, migrated "Stormline"
-- project by the time this file exists) has no `project_members` row yet.
-- Without this, the RLS rework a few statements down would make every
-- pre-existing project invisible to its own owner the instant it takes
-- effect — `is_project_member`/`owns_project` would have nothing to find.
insert into public.project_members ("projectId", "userId", role)
select id, owner_id, 'owner' from public.projects
on conflict ("projectId", "userId") do nothing;

-- `owns_project` (0001) now means "is a member, any role" — every
-- project-scoped table's existing policy already calls this function, so
-- redefining its body is enough to extend all of them to every member,
-- not just the original single owner.
create or replace function public.owns_project(p_project_id text)
returns boolean
language sql
security definer
stable
as $$
  select public.is_project_member(p_project_id);
$$;

-- `projects` itself had one blanket "owner full access" policy (0001) —
-- split into per-command policies. Renaming, changing status/intro, etc.
-- (`OverviewView.tsx`'s `ProjectHeader`) is content-editing same as any
-- other field in the document, so any member can do it, same as an owner
-- — only creating (implicitly owner-only, since `owner_id` must be your
-- own id) and deleting the project outright stay owner-only, alongside
-- membership management above.
drop policy "owner full access" on public.projects;

create policy "members can view" on public.projects
  for select using (public.is_project_member(id));
create policy "creator can insert" on public.projects
  for insert with check (owner_id = auth.uid());
create policy "members can update" on public.projects
  for update using (public.is_project_member(id)) with check (public.is_project_member(id));
create policy "owner can delete" on public.projects
  for delete using (owner_id = auth.uid());

-- ---------------------------------------------------------------------
-- Invite a teammate by email. `security definer` so it can look up
-- `auth.users` (never exposed directly) and insert into `project_members`
-- on the caller's behalf — but it re-derives and re-checks the caller's
-- own permission itself rather than trusting RLS on the tables it
-- touches, since running as definer bypasses that RLS entirely.
--
-- Returns the invited account's id (not just success/failure) — the
-- caller (`TeamView.tsx`, via `useProjectMembers.invite`) uses it to link
-- a `Collaborator` row to the real account it just granted access to, in
-- one round trip.
-- ---------------------------------------------------------------------
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
-- `collaborators` (0001) predates real accounts — it's always been a
-- free-form "who's on the team" directory (name/discipline/role/
-- presence), populated by hand, with no notion of login at all. This
-- links a row to the real account it represents, when there is one:
-- `null` for a purely decorative entry (every row before this, and any
-- teammate added without an email going forward). See `TeamView.tsx`.
-- No RLS change needed — `collaborators` already has full member access
-- via `owns_project` from 0001, same as every other project-scoped table.
-- ---------------------------------------------------------------------
alter table public.collaborators
  add column "userId" uuid references public.profiles(id) on delete set null;

-- ---------------------------------------------------------------------
-- Realtime, matching 0001's pattern.
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.profiles, public.project_members;
