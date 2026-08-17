-- 퍼스널 브랜딩 워크북 스키마
-- Supabase SQL Editor에 전체를 붙여넣고 실행하세요.
-- Career OS의 기존 기능(경험/지원 관리 등)은 그대로 localStorage를 씁니다.
-- 이 스키마는 "브랜딩" 탭 전용이며, 전부 branding_ 프리픽스 신규 테이블입니다.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────
-- 1. 답변 스레드 (질문 1개당 1행)
-- ─────────────────────────────────────────────
create table if not exists branding_answers (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  question_id  text not null,
  category     text not null,
  step         int  not null,
  status       text not null default 'open'
               check (status in ('open','skipped','done')),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique (user_id, question_id)
);

-- ─────────────────────────────────────────────
-- 2. 답변 엔트리 (한 질문에 여러 개, 나중에 추가·수정 가능)
-- ─────────────────────────────────────────────
create table if not exists branding_answer_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  answer_id     uuid not null references branding_answers(id) on delete cascade,
  seq           int  not null,
  label         text,
  content       text,
  structured    jsonb,
  state         text not null default 'active'
                check (state in ('draft','active','archived')),
  edited_count  int default 0,
  imported_from text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique (answer_id, seq)
);

create index if not exists idx_bae_answer_seq on branding_answer_entries (answer_id, seq);
create index if not exists idx_bae_user_state on branding_answer_entries (user_id, state);

-- ─────────────────────────────────────────────
-- 3. 꼬리질문 (엔트리 단위로 붙음)
-- ─────────────────────────────────────────────
create table if not exists branding_followups (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  entry_id     uuid not null references branding_answer_entries(id) on delete cascade,
  depth        int  not null check (depth between 1 and 3),
  origin       text not null default 'ai' check (origin in ('ai','user')),
  probe_type   text,
  question     text not null,
  answer       text,
  skipped      boolean default false,
  created_at   timestamptz default now()
);

create index if not exists idx_bf_entry_depth on branding_followups (entry_id, depth);

-- ─────────────────────────────────────────────
-- 4. 프로필 항목 (누적 자산)
-- ─────────────────────────────────────────────
create table if not exists branding_profile_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  type         text not null
               check (type in ('strength','weakness','value','pattern','evidence','taste','motivation')),
  content      text not null,
  evidence     text,
  confidence   text check (confidence in ('high','medium','low')),
  status       text not null default '제안'
               check (status in ('제안','확정','기각')),
  source_entry_ids uuid[] default '{}',
  origin       text not null default 'ai' check (origin in ('ai','user','consolidate')),
  stale        boolean default false,
  stale_reason text,
  user_edited  boolean default false,
  original_content text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists idx_bpi_user_status_type on branding_profile_items (user_id, status, type);
create index if not exists idx_bpi_user_stale on branding_profile_items (user_id, stale);
create index if not exists idx_bpi_source_entries on branding_profile_items using gin (source_entry_ids);

-- ─────────────────────────────────────────────
-- 5. 산출물 (버전 관리)
-- ─────────────────────────────────────────────
create table if not exists branding_outputs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  version      int not null,
  positioning  jsonb,
  headline     jsonb,
  archetype    jsonb,
  pillars      jsonb,
  gaps         jsonb,
  selected_positioning_idx int,
  is_current   boolean default true,
  created_at   timestamptz default now()
);

create index if not exists idx_bo_user_current on branding_outputs (user_id, is_current);

-- ─────────────────────────────────────────────
-- 6. Career OS 내보내기 로그 (다음 단계에서 사용 — 테이블만 미리 생성)
-- ─────────────────────────────────────────────
create table if not exists branding_exports (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  target       text not null check (target in ('resume','cover_letter','portfolio')),
  suggestions  jsonb not null,
  applied      boolean default false,
  source_item_ids uuid[] default '{}',
  created_at   timestamptz default now()
);

-- ─────────────────────────────────────────────
-- RLS — 익명 로그인 사용자도 auth.uid()를 가지므로 그대로 적용됨
-- ─────────────────────────────────────────────
alter table branding_answers        enable row level security;
alter table branding_answer_entries enable row level security;
alter table branding_followups      enable row level security;
alter table branding_profile_items  enable row level security;
alter table branding_outputs        enable row level security;
alter table branding_exports        enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'branding_answers','branding_answer_entries','branding_followups',
    'branding_profile_items','branding_outputs','branding_exports'
  ] loop
    execute format('drop policy if exists "own_rows" on %I', t);
    execute format(
      'create policy "own_rows" on %I for all
       using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end $$;

-- ─────────────────────────────────────────────
-- updated_at 트리거
-- ─────────────────────────────────────────────
create or replace function touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists t_ans on branding_answers;
create trigger t_ans  before update on branding_answers
  for each row execute function touch_updated_at();

drop trigger if exists t_ent on branding_answer_entries;
create trigger t_ent  before update on branding_answer_entries
  for each row execute function touch_updated_at();

drop trigger if exists t_item on branding_profile_items;
create trigger t_item before update on branding_profile_items
  for each row execute function touch_updated_at();

-- ─────────────────────────────────────────────
-- 엔트리 수정·보관 시 파생 프로필 항목을 stale 처리
-- ─────────────────────────────────────────────
create or replace function mark_items_stale() returns trigger as $$
begin
  if (new.content is distinct from old.content)
     or (new.state is distinct from old.state) then

    update branding_profile_items
       set stale = true,
           stale_reason = case
             when new.state = 'archived' then '출처 답변이 보관됨'
             else '출처 답변이 수정됨'
           end
     where new.id = any(source_entry_ids)
       and status <> '기각';

    if new.content is distinct from old.content then
      new.edited_count := coalesce(old.edited_count, 0) + 1;
    end if;
  end if;
  return new;
end $$ language plpgsql;

drop trigger if exists t_stale on branding_answer_entries;
create trigger t_stale before update on branding_answer_entries
  for each row execute function mark_items_stale();

-- ─────────────────────────────────────────────
-- 진행도 뷰 (엔트리 기준)
-- ─────────────────────────────────────────────
create or replace view branding_progress as
select
  a.user_id,
  a.category,
  count(distinct a.question_id) filter (where e.id is not null) as answered_questions,
  count(e.id) filter (where e.state = 'active')                 as total_entries,
  count(distinct a.question_id) filter (where a.status = 'skipped') as skipped
from branding_answers a
left join branding_answer_entries e
       on e.answer_id = a.id and e.state = 'active'
group by a.user_id, a.category;

-- ─────────────────────────────────────────────
-- 산출물 생성 가능 여부 (stale 제외)
-- ─────────────────────────────────────────────
create or replace view branding_readiness as
select
  user_id,
  count(*)                                            as confirmed_total,
  count(*) filter (where type = 'strength')           as strength_cnt,
  count(*) filter (where type = 'value')              as value_cnt,
  (count(*) >= 12
   and count(*) filter (where type = 'strength') >= 3
   and count(*) filter (where type = 'value')    >= 2) as can_synthesize
from branding_profile_items
where status = '확정' and stale = false
group by user_id;
