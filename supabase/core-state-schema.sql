-- Career OS 전체 데이터 저장 스키마
-- 브랜딩 탭 전용이었던 Supabase 연결을, 경험/스킬/지원현황 등 나머지 전체 기능까지 확장한다.
-- branding-schema.sql을 먼저 실행한 뒤(같은 프로젝트, 같은 익명 인증을 재사용), 이 파일도 SQL Editor에서 실행하세요.

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
