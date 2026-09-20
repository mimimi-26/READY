-- Career OS 전체 데이터 저장 스키마
-- 경험/스킬/지원현황 등 앱 전체 데이터를 Supabase 에 저장한다.
-- Supabase SQL Editor 에 이 파일 전체를 붙여넣고 실행하세요.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────
-- 키-값 저장 테이블
-- 기존 localStorage 구조("careeros:experiences" 등 key별 JSON 하나)를 그대로 옮긴 것.
-- key 예시: experiences / metrics / outputs / applications / skills / certs / awards /
--          resumeProfile / masterEssays / masterInterviews / interviewCategories /
--          expCategories / questionBlocks / trash
-- ─────────────────────────────────────────────
create table if not exists career_os_state (
  user_id     uuid not null references auth.users(id) on delete cascade,
  key         text not null,
  value       jsonb not null default 'null'::jsonb,
  updated_at  timestamptz default now(),
  primary key (user_id, key)
);

create index if not exists idx_cos_user on career_os_state (user_id);

alter table career_os_state enable row level security;

drop policy if exists "own_rows" on career_os_state;
create policy "own_rows" on career_os_state for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function touch_updated_at_cos() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists t_cos on career_os_state;
create trigger t_cos before update on career_os_state
  for each row execute function touch_updated_at_cos();
