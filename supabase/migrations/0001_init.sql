-- Living GDD — cloud schema
--
-- Run this once in your Supabase project's SQL Editor (Dashboard → SQL
-- Editor → New query → paste → Run) after creating the project. See
-- README.md's "Cloud sync" section for the full setup walkthrough.
--
-- Design notes (read before extending this):
--
-- 1. IDs stay `text`, not `uuid`. The app already generates its own ids
--    (`"<prefix>_<uuid>"` for live-created records, `"<kind>:<slug>"` for
--    seed data — see `data/repository/crud.ts` and `data/seed/ids.ts`).
--    Keeping `id text primary key` here means `SupabaseRepository` needs
--    zero id-format translation and stays a near-exact mirror of
--    `DexieRepository`.
--
-- 2. Columns are camelCase, quoted (`"projectId"`, not `project_id`).
--    Not idiomatic SQL, but it means every row maps to/from the app's own
--    TS objects with zero field-renaming code — one fewer place per table
--    for a typo to silently drop or misroute a field. A deliberate
--    trade-off, not an oversight.
--
-- 3. `created_at`/`updated_at`/`date`/`at`/`lastSeen` are real `timestamptz`
--    / `date` columns, not text — PostgREST (Supabase's REST layer)
--    serializes these to the same ISO-8601 strings the app's `BaseEntity`
--    type already expects, so this is a free correctness upgrade (real
--    sorting/indexing) with no extra conversion code.
--
-- 4. Access model (v1, intentionally simple): every project has exactly
--    one owner (`projects.owner_id`, a Supabase auth user). RLS grants
--    full read/write on a project's rows to its owner only — this solves
--    "my data, all my devices," not yet "invite teammates." Adding real
--    team sharing later means adding a `project_members` table and
--    extending the policies below; nothing here blocks that.
--
-- 5. Known gap carried over from the local-only model, not introduced by
--    this migration: `scope_entries` (keyed by a single shared
--    `matrixId`, not `projectId` — see `data/scopeMatrixId.ts`), `tags`,
--    and `comments` (keyed by `anchor`, not `projectId`) were never
--    project-scoped even in Dexie — locally harmless (one browser
--    profile ~= one active project), but it means these three tables
--    can't get the same per-project RLS as everything else without first
--    adding real project scoping to their data model. Their policies
--    below are "any authenticated project owner," not "only your own
--    project" — noted here so it's a known, chosen trade-off, not a
--    silent hole.

-- ---------------------------------------------------------------------
-- Projects
--
-- Created before `owns_project` below, deliberately: that helper is a
-- `language sql` function, and (unlike `plpgsql`) SQL-language functions
-- are resolved against real tables at `CREATE FUNCTION` time, not lazily
-- on first call — defining it before `public.projects` exists fails with
-- `42P01: relation "public.projects" does not exist`, even though the
-- function is never actually invoked yet.
-- ---------------------------------------------------------------------
create table public.projects (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  version text not null,
  status text not null,
  "editPolicy" text not null,
  intro text not null default '',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "updatedBy" text not null default ''
);
create index projects_owner_idx on public.projects (owner_id);

alter table public.projects enable row level security;
create policy "owner full access" on public.projects
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------
-- Helper: is the current user the owner of this project?
-- ---------------------------------------------------------------------
create or replace function public.owns_project(p_project_id text)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.projects
    where id = p_project_id and owner_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------
-- Generic per-project tables — same shape of policy repeated for each.
-- (Written out per table, not looped — plain SQL files don't have a
-- clean per-table loop construct worth the indirection here.)
-- ---------------------------------------------------------------------

create table public.sections (
  id text primary key,
  "projectId" text not null references public.projects(id) on delete cascade,
  index int not null,
  key text not null,
  title text not null,
  icon text not null,
  blocks jsonb not null default '[]',
  owners text[] not null default '{}',
  freshness text not null,
  "reviewedAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "updatedBy" text not null default ''
);

create table public.pillars (
  id text primary key,
  "projectId" text not null references public.projects(id) on delete cascade,
  label text not null,
  rationale text not null default '',
  "order" int not null default 0,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "updatedBy" text not null default ''
);

create table public.non_goals (
  id text primary key,
  "projectId" text not null references public.projects(id) on delete cascade,
  statement text not null,
  reason text not null default '',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "updatedBy" text not null default ''
);

create table public.loops (
  id text primary key,
  "projectId" text not null references public.projects(id) on delete cascade,
  name text not null,
  nodes jsonb not null default '[]',
  edges jsonb not null default '[]',
  "isCycle" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "updatedBy" text not null default ''
);

create table public.feature_cards (
  id text primary key,
  "projectId" text not null references public.projects(id) on delete cascade,
  name text not null,
  "playerPromise" text not null default '',
  summary text not null default '',
  logic text not null default '',
  dependencies text[] not null default '{}',
  "logicNoteIds" text[] not null default '{}',
  status text not null,
  owner text not null default '',
  risk text not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "updatedBy" text not null default ''
);
create index feature_cards_status_idx on public.feature_cards (status);

create table public.decisions (
  id text primary key,
  "projectId" text not null references public.projects(id) on delete cascade,
  title text not null,
  date date not null,
  "decidedBy" text[] not null default '{}',
  context text not null default '',
  choice text not null default '',
  alternatives text not null default '',
  consequences text not null default '',
  supersedes text references public.decisions(id) on delete set null,
  affects jsonb not null default '[]',
  "syncState" text not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "updatedBy" text not null default ''
);

create table public.logic_notes (
  id text primary key,
  "projectId" text not null references public.projects(id) on delete cascade,
  "folderPath" text not null,
  title text not null,
  scope text not null,
  kind text not null,
  "valueType" text not null,
  values text not null default '',
  logic text not null default '',
  inbound text[] not null default '{}',
  outbound text[] not null default '{}',
  tags text[] not null default '{}',
  extras text not null default '',
  "engineRef" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "updatedBy" text not null default ''
);
create index logic_notes_folder_idx on public.logic_notes ("folderPath");
create index logic_notes_tags_idx on public.logic_notes using gin (tags);

create table public.milestones (
  id text primary key,
  "projectId" text not null references public.projects(id) on delete cascade,
  name text not null,
  date date not null,
  state text not null,
  "exitCriteria" text[] not null default '{}',
  "linkedFeatureIds" text[] not null default '{}',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "updatedBy" text not null default ''
);

create table public.collaborators (
  id text primary key,
  "projectId" text not null references public.projects(id) on delete cascade,
  name text not null,
  discipline text not null default '',
  role text not null,
  presence text not null default 'offline',
  "lastSeen" timestamptz not null default now(),
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "updatedBy" text not null default ''
);

create table public.change_entries (
  id text primary key,
  "projectId" text not null references public.projects(id) on delete cascade,
  at timestamptz not null default now(),
  by text not null,
  target jsonb not null,
  kind text not null,
  "diffSummary" text not null default '',
  "versionBump" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "updatedBy" text not null default ''
);
create index change_entries_at_idx on public.change_entries (at desc);

create table public.assets (
  id text primary key,
  "projectId" text not null references public.projects(id) on delete cascade,
  kind text not null,
  url text not null,
  caption text not null default '',
  tags text[] not null default '{}',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "updatedBy" text not null default ''
);

create table public.production_assets (
  id text primary key,
  "projectId" text not null references public.projects(id) on delete cascade,
  name text not null,
  kind text not null,
  purpose text not null default '',
  status text not null,
  notes text not null default '',
  "assetId" text references public.assets(id) on delete set null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "updatedBy" text not null default ''
);

create table public.levels (
  id text primary key,
  "projectId" text not null references public.projects(id) on delete cascade,
  name text not null,
  summary text not null default '',
  "uniqueFeatures" text not null default '',
  "assetId" text references public.assets(id) on delete set null,
  status text not null,
  "order" int not null default 0,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "updatedBy" text not null default ''
);

-- ---------------------------------------------------------------------
-- Not project-scoped in the app's own data model (see note 5 above) —
-- kept exactly as loose as they already were locally.
-- ---------------------------------------------------------------------

create table public.scope_entries (
  id text primary key,
  "matrixId" text not null,
  item text not null,
  verdict text not null,
  "decisionId" text references public.decisions(id) on delete set null,
  "evidenceUrl" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "updatedBy" text not null default ''
);
create index scope_entries_matrix_idx on public.scope_entries ("matrixId");

create table public.tags (
  id text primary key,
  path text not null unique,
  color text not null default '',
  count int not null default 0,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "updatedBy" text not null default ''
);

create table public.comments (
  id text primary key,
  anchor jsonb not null,
  body text not null,
  by text not null,
  at timestamptz not null default now(),
  resolved boolean not null default false,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "updatedBy" text not null default ''
);

-- Per-account app settings (the "has the demo been seeded for this
-- account yet" flag, mirroring Dexie's `meta` table — see `ensureSeeded`).
create table public.meta (
  owner_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value jsonb not null,
  primary key (owner_id, key)
);

-- ---------------------------------------------------------------------
-- RLS: enable + policies for every project-scoped table.
-- ---------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'sections', 'pillars', 'non_goals', 'loops', 'feature_cards',
    'decisions', 'logic_notes', 'milestones', 'collaborators',
    'change_entries', 'assets', 'production_assets', 'levels'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "project owner full access" on public.%I
         for all using (public.owns_project("projectId"))
         with check (public.owns_project("projectId"))',
      t
    );
  end loop;
end $$;

-- Not project-scoped (see note 5): gate on "is an authenticated user who
-- owns at least one project" rather than a specific project.
alter table public.scope_entries enable row level security;
create policy "any project owner" on public.scope_entries
  for all
  using (exists (select 1 from public.projects where owner_id = auth.uid()))
  with check (exists (select 1 from public.projects where owner_id = auth.uid()));

alter table public.tags enable row level security;
create policy "any project owner" on public.tags
  for all
  using (exists (select 1 from public.projects where owner_id = auth.uid()))
  with check (exists (select 1 from public.projects where owner_id = auth.uid()));

alter table public.comments enable row level security;
create policy "any project owner" on public.comments
  for all
  using (exists (select 1 from public.projects where owner_id = auth.uid()))
  with check (exists (select 1 from public.projects where owner_id = auth.uid()));

alter table public.meta enable row level security;
create policy "own rows only" on public.meta
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------
-- Realtime: broadcast changes on every project-scoped table so
-- `useRealtimeSync` (src/data/supabase/realtimeSync.ts) can invalidate
-- the app's local query cache when another device changes something.
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table
  public.projects, public.sections, public.pillars, public.non_goals,
  public.loops, public.feature_cards, public.decisions, public.logic_notes,
  public.milestones, public.collaborators, public.change_entries,
  public.assets, public.production_assets, public.levels,
  public.scope_entries, public.tags, public.comments;
