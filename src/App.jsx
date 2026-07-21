import React, { useState, useMemo, useEffect, useRef } from "react";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

/* ============================================================
   Career OS MVP — v1.2 프로토타입
   - 더미 데이터 / 상태관리 useState / 데스크톱 우선
   - 핵심 5단계 + 심화 4단계 분석 플로우
   - 수치 토큰 {{metric:id|format}} 렌더링
   - 승인 상태(approvalStatus) / isStale 표시
   - 역량·스킬 탭 (활용 범위 + 경험 근거 연결)
   - 파일 가져오기: 비정형 텍스트/문서 → AI 추출 → 사용자 확인·수정 후 반영
   ============================================================ */

/* ---------- 디자인 토큰 ---------- */
const C = {
  bg: "#F7F7F5", panel: "#FFFFFF", line: "#E6E4DF", lineSoft: "#EFEDE8",
  text: "#2B2A28", sub: "#6E6B65", faint: "#9C988F",
  // 약한 강조 — 톤 다운된 그레이 (블루 끼 제거)
  blue: "#6E6B65", blueBg: "#EFEDE8",
  // 강한 강조 — 유일한 포인트 컬러: 채도 낮춘 파스텔 그린
  green: "#3F7A5C", greenBg: "#E7F1EA",
  // 경고·AI·미확인 표시도 전부 무채색 톤으로 통일
  orange: "#6E6B65", orangeBg: "#EFEDE8",
  ai: "#6E6B65", aiBg: "#EFEDE8",
  // 실제 오류(빨강)만 별도 유지
  red: "#B91C1C", redBg: "#FBEBEB",
  accent: "#F2F1EE",
};
const font = "'Pretendard','Apple SD Gothic Neo',-apple-system,'Noto Sans KR',sans-serif";

/* ---------- 예시 데이터 (일반적인 아르바이트·인턴 경험 기준) ---------- */
const seedMetrics = [
  { id: "m_001", experienceId: "e_1", metricType: "revenue", metricName: "매출", changeValue: 29, unit: "%", comparisonBasis: "전년 동기간", evidenceSource: "정산 리포트", certainty: "verified", isPublic: true },
  { id: "m_002", experienceId: "e_1", metricType: "orders", metricName: "주문 수", changeValue: 36, unit: "%", comparisonBasis: "전년 동기간", evidenceSource: "정산 리포트", certainty: "verified", isPublic: true },
  { id: "m_003", experienceId: "e_2", metricType: "time", metricName: "재고 확인 소요 시간", beforeValue: 180, afterValue: 5, unit: "분", certainty: "verified", isPublic: true },
  { id: "m_004", experienceId: "e_2", metricType: "operation", metricName: "출고 오류·CS", afterValue: 0, unit: "건", certainty: "verified", isPublic: true },
  { id: "m_005", experienceId: "e_3", metricType: "revenue", metricName: "채널 매출", changeValue: 42, unit: "%", comparisonBasis: "개편 전 3개월", certainty: "memory_based", isPublic: true },
];

const seedExperiences = [
  {
    id: "e_1", title: "웹사이트 운영 프로모션 기획", organization: "온라인 쇼핑몰 (인턴)", experienceType: "internship", primaryCategory: "온라인 쇼핑몰 인턴",
    startDate: "2024-06", endDate: "2024-08", role: "이커머스 운영 인턴",
    rawNote: "인턴 근무 중 시즌 프로모션을 진행했다. 기존 할인만 하는 것보다 사은품을 주는 게 좋을 것 같았다. 과거 데이터를 분석해서 제품을 골랐고 매출이 올랐다.",
    context: "시즌 최대 행사를 앞두고 이커머스팀 4명이 프로모션을 준비하는 상황",
    assignedTask: "시즌 프로모션 운영", discoveredProblem: "단순 할인만으로는 객단가와 연관 구매를 높이기 어려움",
    goal: "매출·주문 수 증가, 객단가 유지 또는 상승",
    personalContribution: "과거 3년 판매·장바구니 데이터를 분석하고, 인기 제품 3종과 조건부 증정 구조를 제안한 뒤 세팅과 성과 분석까지 담당",
    contributionLevel: "proposed_and_executed",
    contributionEvidence: "과거 3년 판매 데이터를 직접 분석하고, 사은품 제품과 구매 조건을 제안한 뒤, 프로모션 세팅과 결과 리포트까지 담당했다.",
    difficulty: "행사 2주 전 확정이라 분석 시간이 부족했고, 증정 재고 부담에 대한 매니저 우려를 설득해야 했다",
    learning: "할인 폭보다 구매 조건 설계가 객단가를 움직인다는 것을 확인 → 이후 모든 프로모션에서 장바구니 데이터를 먼저 확인하는 습관",
    jobRelevance: "MD·이커머스 직무의 상품 구성·딜 설계 역량과 직결",
    coreMessage: "데이터를 단순히 보고하는 데 그치지 않고, 고객의 구매 흐름을 설계해 매출 성과로 연결했다.",
    oneLineSummary: "3년간의 판매 데이터를 분석해 조건부 증정 프로모션을 설계하고, 전년 동기간 대비 매출 29%·주문 36% 증가를 달성",
    status: "complete", depthDone: true, usageCount: 5, updatedAt: "2026-07-18",
    competencies: ["데이터 분석", "프로모션 기획", "고객 분석", "문제 해결", "실행력"],
    tags: ["개인+팀", "성공", "정량 성과"],
    actions: [
      { id: "a1", actionType: "analysis", description: "과거 3년 판매량, 장바구니, 상품별 성과 분석", isDirectAction: true },
      { id: "a2", actionType: "judgment", description: "구매 가능성이 높은 인기 제품 3종 선정", isDirectAction: true },
      { id: "a3", actionType: "execution", description: "조건부 증정 구조와 연관 상품 배치 설계", isDirectAction: true },
      { id: "a4", actionType: "collaboration", description: "디자인·마케팅팀에 프로모션 콘텐츠 요청", isDirectAction: true },
    ],
    completion: { 배경: "충분", 문제: "충분", 행동: "충분", 기여도: "충분", 성과: "충분", 목표: "충분", 어려움: "충분", "배운 점": "충분", "직무 연결": "보완 필요" },
  },
  {
    id: "e_2", title: "재고 관리 업무 자동화", organization: "온라인 쇼핑몰 (인턴)", experienceType: "internship", primaryCategory: "온라인 쇼핑몰 인턴",
    startDate: "2024-07", endDate: "2024-09", role: "이커머스 운영 인턴",
    rawNote: "재고 시스템과 판매 플랫폼이 연동이 안 돼서 품절 상품이 계속 노출됐다. 엑셀 VBA를 배워서 자동화 파일을 만들었다.",
    context: "다수의 상품을 매주 수작업으로 대조하던 상황",
    assignedTask: "주간 재고 확인", discoveredProblem: "시스템 간 미연동으로 품절 상품이 노출되어 주문 취소·CS 반복",
    goal: "품절 상품을 빠르게 구분하고 출고 오류와 주문 취소를 줄이는 것",
    personalContribution: "Excel 함수와 VBA를 학습해 자동화 파일을 제작하고, 주간 점검 프로세스와 매뉴얼을 만들었다.",
    contributionLevel: "led", contributionEvidence: "문제 발견부터 자동화 파일 제작, 매뉴얼 배포까지 단독 수행",
    difficulty: "", learning: "", jobRelevance: "",
    coreMessage: "반복 업무를 문제로 정의하고 스스로 도구를 학습해 구조적으로 해결했다.",
    oneLineSummary: "Excel VBA 자동화로 재고 확인 시간을 180분→5분으로 단축하고 출고 오류 0건 달성",
    status: "complete", depthDone: false, usageCount: 3, updatedAt: "2026-07-15",
    competencies: ["문제 해결", "업무 자동화", "데이터 관리", "주도성", "운영 개선"],
    tags: ["개인", "성공", "정량 성과"],
    actions: [
      { id: "a5", actionType: "analysis", description: "재고 시스템 간 데이터를 비교해 품절 발생 원인 분석", isDirectAction: true },
      { id: "a6", actionType: "judgment", description: "다수 상품 수작업 비교는 지속 불가능하다고 판단", isDirectAction: true },
      { id: "a7", actionType: "execution", description: "Excel 함수·VBA로 품절 상품 자동 구분 파일 제작", isDirectAction: true },
      { id: "a8", actionType: "improvement", description: "주간 점검 프로세스와 사용 매뉴얼 배포", isDirectAction: true },
    ],
    completion: { 배경: "충분", 문제: "충분", 행동: "충분", 기여도: "충분", 성과: "충분", 목표: "미입력", 어려움: "미입력", "배운 점": "미입력", "직무 연결": "미입력" },
  },
  {
    id: "e_3", title: "온라인 채널 콘텐츠 개편", organization: "온라인 쇼핑몰 (인턴)", experienceType: "internship", primaryCategory: "온라인 쇼핑몰 인턴",
    startDate: "2024-08", endDate: "2024-10", role: "이커머스 운영 인턴",
    rawNote: "방치돼 있던 온라인 스토어를 다시 살렸다. 상세 콘텐츠를 만들고 리스팅을 정리했다.",
    context: "", assignedTask: "", discoveredProblem: "리스팅 이미지·키워드가 방치되어 노출·전환 모두 하락",
    goal: "", personalContribution: "상세 콘텐츠 제작과 리스팅 최적화를 직접 제안하고 실행",
    contributionLevel: "proposed_and_executed", contributionEvidence: "",
    coreMessage: "", oneLineSummary: "방치된 온라인 채널을 재정비해 매출 회복",
    status: "needs_revision", depthDone: false, usageCount: 1, updatedAt: "2026-07-10",
    competencies: ["채널 운영", "콘텐츠 기획", "주도성"],
    tags: ["개인", "성공", "정량 성과"],
    actions: [
      { id: "a9", actionType: "analysis", description: "경쟁 리스팅 대비 이미지·키워드 격차 분석", isDirectAction: true },
      { id: "a10", actionType: "execution", description: "상세 콘텐츠 제작 및 리스팅 재정비", isDirectAction: true },
    ],
    completion: { 배경: "보완 필요", 문제: "충분", 행동: "보완 필요", 기여도: "보완 필요", 성과: "보완 필요", 목표: "미입력", 어려움: "미입력", "배운 점": "미입력", "직무 연결": "미입력" },
  },
  {
    id: "e_4", title: "동아리 콘텐츠팀 운영", organization: "대학 홍보 동아리", experienceType: "club", primaryCategory: "동아리 활동",
    startDate: "2023-03", endDate: "2023-12", role: "콘텐츠팀장",
    rawNote: "콘텐츠팀장으로 6명 팀을 운영했다. 업로드 일정이 계속 밀리는 문제가 있었다.",
    context: "", assignedTask: "", discoveredProblem: "", goal: "", personalContribution: "",
    contributionLevel: "", contributionEvidence: "", coreMessage: "", oneLineSummary: "",
    status: "draft", depthDone: false, usageCount: 0, updatedAt: "2026-07-05",
    competencies: ["리더십"], tags: ["팀"], actions: [],
    completion: { 배경: "미입력", 문제: "미입력", 행동: "미입력", 기여도: "미입력", 성과: "미입력", 목표: "미입력", 어려움: "미입력", "배운 점": "미입력", "직무 연결": "미입력" },
  },
];

const seedOutputs = [
  { id: "o_1", experienceId: "e_1", outputType: "resume", style: "result_focused",
    content: "3년간 판매 데이터를 분석해 조건부 증정 프로모션을 기획하고, 전년 동기간 대비 매출 {{metric:m_001|exact}}·주문 수 {{metric:m_002|exact}} 증가 달성",
    referencedMetricIds: ["m_001", "m_002"], version: 2, isAiGenerated: true, approvalStatus: "approved", isStale: false },
  { id: "o_2", experienceId: "e_1", outputType: "resume", style: "role_focused",
    content: "온라인 채널 운영과 판매 데이터 분석, 프로모션 기획 담당",
    referencedMetricIds: [], version: 1, isAiGenerated: true, approvalStatus: "ai_draft", isStale: false },
  { id: "o_3", experienceId: "e_1", outputType: "interview",
    content: "데이터 분석으로 매출 성과를 낸 경험을 말씀드리겠습니다. 인턴 당시 시즌 프로모션에서 단순 할인의 한계를 발견하고, 3년치 판매·장바구니 데이터를 분석해 조건부 증정 구조를 제안·실행했습니다. 그 결과 매출 {{metric:m_001|rounded}}, 주문 수 {{metric:m_002|rounded}} 증가를 달성했습니다.",
    referencedMetricIds: ["m_001", "m_002"], version: 1, isAiGenerated: true, approvalStatus: "user_editing", isStale: false },
  { id: "o_4", experienceId: "e_2", outputType: "resume", style: "result_focused",
    content: "Excel VBA 기반 재고 자동화로 확인 시간 {{metric:m_003|exact}} 단축, 출고 오류 {{metric:m_004|exact}} 달성",
    referencedMetricIds: ["m_003", "m_004"], version: 1, isAiGenerated: true, approvalStatus: "approved", isStale: false },
  { id: "o_5", experienceId: "e_3", outputType: "resume", style: "result_focused",
    content: "방치된 온라인 채널을 재정비해 개편 전 대비 매출 {{metric:m_005|exact}} 회복",
    referencedMetricIds: ["m_005"], version: 1, isAiGenerated: true, approvalStatus: "ai_draft", isStale: true },
];

/* ---------- 스킬 · 자격증 예시 ---------- */
const seedSkills = [
  {
    id: "s_1", name: "쇼핑몰 관리 플랫폼", category: "tool",
    summary: "리스팅·프로모션·재고 연동까지 운영 전반",
    scopeItems: [
      { id: "sc1", text: "상품 리스팅 등록·수정, 컬렉션 구성", evidenceExpId: "e_3" },
      { id: "sc2", text: "조건부 증정 프로모션 세팅", evidenceExpId: "e_1" },
      { id: "sc3", text: "판매·장바구니 리포트 추출 및 분석", evidenceExpId: "e_1" },
      { id: "sc4", text: "재고 데이터 추출 후 시스템 간 대조", evidenceExpId: "e_2" },
      { id: "sc5", text: "테마·페이지 커스터마이징", evidenceExpId: null },
    ],
  },
  {
    id: "s_2", name: "Excel / VBA", category: "tool",
    summary: "함수·피벗은 능숙, VBA는 실무 자동화 1건 완수 수준",
    scopeItems: [
      { id: "sc6", text: "VLOOKUP·INDEX/MATCH·조건부 서식 등 실무 함수", evidenceExpId: "e_2" },
      { id: "sc7", text: "피벗 테이블 기반 판매 데이터 집계", evidenceExpId: "e_1" },
      { id: "sc8", text: "VBA 매크로로 재고 대조 자동화", evidenceExpId: "e_2" },
      { id: "sc9", text: "파워쿼리·대시보드 구축", evidenceExpId: null },
    ],
  },
  {
    id: "s_3", name: "온라인 채널 운영", category: "tool",
    summary: "리스팅 최적화·상세 콘텐츠 중심",
    scopeItems: [
      { id: "sc10", text: "상세 콘텐츠 기획·제작", evidenceExpId: "e_3" },
      { id: "sc11", text: "리스팅 키워드·이미지 최적화", evidenceExpId: "e_3" },
      { id: "sc12", text: "광고 운영", evidenceExpId: null },
    ],
  },
  {
    id: "s_4", name: "데이터 분석", category: "skill",
    summary: "판매·장바구니 데이터를 상품 구성 의사결정으로 연결",
    scopeItems: [
      { id: "sc13", text: "3년치 판매 데이터에서 상품 선정 근거 도출", evidenceExpId: "e_1" },
      { id: "sc14", text: "상품 단위 성과 비교로 문제 원인 분석", evidenceExpId: "e_2" },
    ],
  },
];
const seedCerts = [
  { id: "c_1", name: "컴퓨터활용능력 1급", issuer: "대한상공회의소", date: "2023-05", note: "" },
  { id: "c_2", name: "TOEIC 900", issuer: "ETS", date: "2025-11", note: "유효기간 2027-11" },
  { id: "c_3", name: "OPIc IH", issuer: "ACTFL", date: "", note: "응시 예정", planned: true },
];

const seedMasterEssays = [
  { id: "mq_1", question: "자기소개를 해주세요.", characterLimit: 800, draft: "", status: "not_started", chatHistory: [] },
  { id: "mq_2", question: "지원 동기는 무엇인가요?", characterLimit: 700, draft: "", status: "not_started", chatHistory: [] },
  { id: "mq_3", question: "입사 후 포부를 말씀해주세요.", characterLimit: 600, draft: "", status: "not_started", chatHistory: [] },
];
const seedMasterInterviews = [
  { id: "miq_1", question: "자신의 장단점은 무엇인가요?", category: "인성", selectedExperienceId: null, practiceCount: 0, confidence: null, followUps: [], draft: "", chatHistory: [] },
  { id: "miq_2", question: "팀워크를 발휘했던 경험을 말씀해주세요.", category: "협업", selectedExperienceId: null, practiceCount: 0, confidence: null, followUps: [], draft: "", chatHistory: [] },
  { id: "miq_3", question: "실패하거나 좌절했던 경험은 무엇인가요?", category: "실패", selectedExperienceId: null, practiceCount: 0, confidence: null, followUps: [], draft: "", chatHistory: [] },
];

const seedApplications = [
  { id: "ap_1", company: "A 리테일 기업", position: "MD (상품기획)", deadline: "2026-08-03", status: "writing", priority: "high",
    essayProgress: 60, interviewProgress: 30,
    requirements: [
      { id: "r1", requirement: "매출 데이터 분석", category: "required_competency", importance: 5, matchedExp: "e_1", matchReason: "판매 분석을 매출 성과로 연결", gap: "" },
      { id: "r2", requirement: "운영 개선 경험", category: "experience", importance: 4, matchedExp: "e_2", matchReason: "재고 관리 자동화 경험", gap: "" },
      { id: "r3", requirement: "채널 운영 이해", category: "preferred_competency", importance: 3, matchedExp: "e_3", matchReason: "채널 콘텐츠·리스팅 개선 경험", gap: "경험 분석 보완 필요" },
      { id: "r4", requirement: "협상·소싱 경험", category: "required_competency", importance: 4, matchedExp: null, matchReason: "", gap: "매칭 가능한 경험 없음" },
    ],
    essays: [
      { id: "q1", question: "지원 동기와 입사 후 포부를 기술하시오.", characterLimit: 700, status: "drafting", selectedExperienceIds: ["e_1"], isLocked: false, chatHistory: [] },
      { id: "q2", question: "가장 큰 성과를 낸 경험을 기술하시오.", characterLimit: 1000, status: "complete", selectedExperienceIds: ["e_1"], isLocked: true, chatHistory: [] },
    ],
    interviews: [
      { id: "iq1", question: "본인이 데이터로 성과를 낸 경험은?", category: "achievement", selectedExperienceId: "e_1", practiceCount: 4, confidence: 4,
        followUps: ["왜 그 방법을 선택했나요?", "본인이 직접 한 부분은 무엇인가요?", "성과가 본인의 행동 때문이라는 근거는?"] },
      { id: "iq2", question: "실패하거나 아쉬웠던 경험은?", category: "failure", selectedExperienceId: null, practiceCount: 0, confidence: null, followUps: [] },
    ],
  },
  { id: "ap_2", company: "B 유통 기업", position: "상품기획 MD", deadline: "2026-08-20", status: "analyzing", priority: "medium",
    essayProgress: 0, interviewProgress: 0, requirements: [], essays: [], interviews: [] },
];

/* ---------- 상수 ---------- */
const CORE_STEPS = ["배경", "문제", "행동", "기여도", "성과"];
const DEPTH_STEPS = ["목표", "어려움", "배운 점", "직무 연결"];
const STEP_QUESTIONS = {
  배경: ["언제, 어디에서 한 경험인가?", "팀이나 조직의 목표는 무엇이었나?", "당시 맡은 공식 역할은 무엇이었나?", "경험이 시작되기 전 상황은 어땠나?"],
  문제: ["당시 해결해야 했던 문제는 무엇이었나?", "기존 방식에는 어떤 한계가 있었나?", "어떤 데이터나 현상을 보고 문제라고 판단했나?"],
  행동: ["가장 먼저 한 행동은 무엇인가?", "왜 그 방법을 선택했나?", "본인이 직접 결정한 것은 무엇인가?", "다른 사람에게 요청하거나 설득한 것은 무엇인가?"],
  기여도: ["팀 전체가 한 일과 본인이 한 일을 구분하면?", "내가 없었다면 결과가 어떻게 달라졌을까?", "제안만 했는가, 실행까지 담당했는가?"],
  성과: ["결과가 이전보다 어떻게 달라졌나?", "수치로 표현할 수 있는가?", "비교 기준은 무엇인가?", "성과를 증명할 자료가 있는가?"],
  목표: ["달성해야 했던 목표는 무엇이었나?", "성공 여부를 어떤 기준으로 판단했나?", "시간·비용·인력 제약은 있었나?"],
  어려움: ["가장 어려웠던 점은 무엇인가?", "팀원 또는 상사와 의견 차이가 있었나?", "시간·인력·예산·정보 중 무엇이 부족했나?"],
  "배운 점": ["이전에는 어떻게 생각했나?", "경험을 통해 무엇을 새롭게 알게 됐나?", "다시 한다면 무엇을 바꾸겠나?"],
  "직무 연결": ["이 경험은 어떤 직무와 연결되는가?", "어떤 역량을 보여주는가?", "이 경험의 핵심 메시지는 무엇인가?"],
};
const STATUS_LABEL = { draft: "초기 메모", analyzing: "분석 중", needs_revision: "보완 필요", complete: "분석 완료" };
const STATUS_COLOR = { draft: [C.sub, C.lineSoft], analyzing: [C.blue, C.blueBg], needs_revision: [C.orange, C.orangeBg], complete: [C.green, C.greenBg] };
const CONTRIB_LABEL = { participated: "참여", responsible: "담당", led: "주도", proposed_and_executed: "제안 후 실행", full_ownership: "전체 책임" };
const ACTION_LABEL = { analysis: "분석", judgment: "판단", execution: "실행", collaboration: "협업", improvement: "개선" };
const APPROVAL = {
  ai_draft: { label: "AI 초안 · 미승인", color: C.ai, bg: C.aiBg },
  user_editing: { label: "수정 중", color: C.blue, bg: C.blueBg },
  approved: { label: "승인됨", color: C.green, bg: C.greenBg },
  rejected: { label: "폐기", color: C.faint, bg: C.lineSoft },
};
const CERTAINTY = { verified: ["자료로 확인됨", C.green, C.greenBg], memory_based: ["기억에 기반함", C.orange, C.orangeBg], estimated: ["추정치", C.orange, C.orangeBg], needs_verification: ["추가 확인 필요", C.red, C.redBg] };

/* ---------- 카테고리 선택 (드롭다운 + 새 카테고리 추가) ---------- */
function CategorySelect({ value, options, onChange, onAddOption, placeholder, style }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const commit = () => {
    const t = draft.trim();
    if (t) { onAddOption(t); onChange(t); }
    setAdding(false); setDraft("");
  };

  if (adding) {
    return (
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <Input autoFocus placeholder="새 카테고리명" value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === "Enter" && commit()} style={{ width: 140, fontSize: 12.5, padding: "5px 8px", ...style }} />
        <Btn small onClick={commit}>추가</Btn>
        <Btn small onClick={() => { setAdding(false); setDraft(""); }}>취소</Btn>
      </div>
    );
  }
  return (
    <select value={value || ""} onChange={e => e.target.value === "__add__" ? setAdding(true) : onChange(e.target.value)}
      style={{ fontFamily: font, fontSize: 12.5, padding: "5px 8px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.panel, color: C.text, ...style }}>
      <option value="">{placeholder || "미분류"}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
      <option value="__add__">+ 새 카테고리 추가</option>
    </select>
  );
}

/* ---------- 수치 토큰 렌더링 ---------- */
function formatMetric(m, fmt) {
  if (!m) return "?";
  let v;
  if (m.changeValue != null) v = `${m.changeValue}${m.unit}`;
  else if (m.beforeValue != null && m.afterValue != null) v = `${m.beforeValue}${m.unit}→${m.afterValue}${m.unit}`;
  else if (m.afterValue != null) v = `${m.afterValue}${m.unit}`;
  else v = "?";
  if (fmt === "rounded" && m.changeValue != null) v = `약 ${Math.round(m.changeValue / 5) * 5}${m.unit}`;
  return v;
}
function TokenText({ text, metrics }) {
  const parts = text.split(/(\{\{metric:[^}]+\}\})/g);
  return (
    <span>
      {parts.map((p, i) => {
        const m = p.match(/\{\{metric:([^|}]+)\|?([^}]*)\}\}/);
        if (!m) return <span key={i}>{p}</span>;
        const metric = metrics.find(x => x.id === m[1]);
        const cert = metric ? CERTAINTY[metric.certainty] : null;
        return (
          <span key={i} title={metric ? `${metric.metricName} · ${cert[0]} · 근거: ${metric.evidenceSource || "없음"}` : "삭제된 수치"}
            style={{ background: metric ? (metric.certainty === "verified" ? C.greenBg : C.orangeBg) : C.redBg,
              color: metric ? (metric.certainty === "verified" ? C.green : C.orange) : C.red,
              padding: "1px 5px", borderRadius: 12, fontWeight: 600, fontSize: "0.94em", cursor: "help" }}>
            {formatMetric(metric, m[2] || "exact")}
          </span>
        );
      })}
    </span>
  );
}

/* ---------- 공통 UI (와이어프레임 킷 톤 — 각진 박스, 아웃라인 태그) ---------- */
const Badge = ({ label, color, bg }) => (
  <span style={{ fontSize: 11, fontWeight: 600, color, background: "transparent", border: `1px solid ${color}55`,
    padding: "1px 7px", borderRadius: 14, whiteSpace: "nowrap", display: "inline-block", lineHeight: 1.6 }}>{label}</span>
);
const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18,
    cursor: onClick ? "pointer" : "default", transition: "border-color .15s", ...style }}
    onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = C.faint)}
    onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = C.line)}>
    {children}
  </div>
);
const H2 = ({ children }) => <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 14px", color: C.text }}>{children}</h2>;
const Label = ({ children }) => <div style={{ fontSize: 12, fontWeight: 600, color: C.faint, marginBottom: 4, letterSpacing: ".02em" }}>{children}</div>;
const Btn = ({ children, primary, small, onClick, disabled, style }) => (
  <button onClick={onClick} disabled={disabled} style={{
    fontFamily: font, fontSize: small ? 12 : 13.5, fontWeight: 600, padding: small ? "5px 11px" : "9px 16px",
    borderRadius: 12, border: primary ? `1px solid ${C.blue}` : `1px solid ${C.line}`, cursor: disabled ? "default" : "pointer",
    background: disabled ? C.lineSoft : primary ? C.blue : C.panel, color: disabled ? C.faint : primary ? "#fff" : C.text, ...style }}>
    {children}
  </button>
);
const Input = props => (
  <input {...props} style={{ fontFamily: font, fontSize: 13.5, padding: "9px 12px", borderRadius: 14, border: `1px solid ${C.line}`,
    width: "100%", boxSizing: "border-box", background: C.panel, color: C.text, outline: "none", ...props.style }} />
);
const Textarea = props => (
  <textarea {...props} style={{ fontFamily: font, fontSize: 13.5, lineHeight: 1.6, padding: "10px 12px", borderRadius: 14,
    border: `1px solid ${C.line}`, width: "100%", boxSizing: "border-box", background: C.panel, color: C.text, outline: "none",
    resize: "vertical", minHeight: 84, ...props.style }} />
);

/* ---------- 자동 저장 표시 ---------- */
function useAutosave(dep) {
  const [state, setState] = useState("saved");
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setState("saving");
    const t = setTimeout(() => setState("saved"), 800);
    return () => clearTimeout(t);
  }, [dep]);
  return state;
}
const AutosaveIndicator = ({ state }) => (
  <span style={{ fontSize: 12, color: state === "saving" ? C.blue : C.faint, display: "inline-flex", alignItems: "center", gap: 5 }}>
    <span style={{ width: 6, height: 6, borderRadius: 99, background: state === "saving" ? C.blue : C.green }} />
    {state === "saving" ? "저장 중…" : "자동 저장됨"}
  </span>
);

/* ============================================================ APP */
export default function App() {
  const [nav, setNav] = useState("home"); // home | analyze | archive | apply | resume
  const [experiences, setExperiences] = useState(seedExperiences);
  const [metrics, setMetrics] = useState(seedMetrics);
  const [outputs, setOutputs] = useState(seedOutputs);
  const [applications, setApplications] = useState(seedApplications);
  const [skills, setSkills] = useState(seedSkills);
  const [certs, setCerts] = useState(seedCerts);
  const [resumeProfile, setResumeProfile] = useState({ name: "", targetRole: "", headline: "", phone: "", email: "" });
  const [detailId, setDetailId] = useState(null);     // 경험 상세
  const [appDetailId, setAppDetailId] = useState(null); // 지원 상세
  const [analyzeId, setAnalyzeId] = useState(null);   // 분석 중 경험
  const [trash, setTrash] = useState([]); // { id, type, label, deletedAt, restore }
  const [masterEssays, setMasterEssays] = useState(seedMasterEssays);
  const [masterInterviews, setMasterInterviews] = useState(seedMasterInterviews);
  const [interviewCategories, setInterviewCategories] = useState(["성과", "실패", "협업", "갈등", "인성"]);
  const [expCategories, setExpCategories] = useState(["온라인 쇼핑몰 인턴", "동아리 활동"]);
  const addInterviewCategory = (c) => setInterviewCategories(prev => prev.includes(c) ? prev : [...prev, c]);
  const addExpCategory = (c) => setExpCategories(prev => prev.includes(c) ? prev : [...prev, c]);

  const addTrash = (type, label, restore) => setTrash(prev => [
    { id: "t_" + Date.now() + Math.random().toString(36).slice(2, 6), type, label, deletedAt: "방금", restore },
    ...prev,
  ]);
  const restoreTrash = (id) => {
    const entry = trash.find(t => t.id === id);
    if (entry) { entry.restore(); setTrash(prev => prev.filter(t => t.id !== id)); }
  };
  const purgeTrash = (id) => setTrash(prev => prev.filter(t => t.id !== id));
  const clearTrash = () => setTrash([]);

  const go = (n) => { setNav(n); setDetailId(null); setAppDetailId(null); if (n !== "analyze") setAnalyzeId(null); };

  const openAnalyze = (id) => { setAnalyzeId(id); setNav("analyze"); setDetailId(null); };
  const openDetail = (id) => { setDetailId(id); setNav("archive"); };

  const menuGroups = [
    { label: "시작", items: [["home", "홈"], ["guide", "사용 가이드"]] },
    { label: "경험 정리", items: [["import", "파일 가져오기"], ["analyze", "경험 분석"], ["archive", "경험 보관함"], ["skills", "역량·스킬"]] },
    { label: "지원 준비", items: [["apply", "지원 관리"], ["master", "마스터 자소서·면접"], ["resume", "기본 이력서"]] },
    { label: "기타", items: [["trash", "휴지통"]] },
  ];
  const [openGroups, setOpenGroups] = useState(() => Object.fromEntries(menuGroups.map(g => [g.label, true])));
  const toggleGroup = (label) => setOpenGroups(p => ({ ...p, [label]: !p[label] }));

  return (
    <div style={{ fontFamily: font, background: C.bg, minHeight: "100vh", display: "flex", color: C.text }}>
      {/* Sidebar */}
      <aside style={{ width: 208, background: C.panel, borderRight: `1px solid ${C.line}`, padding: "22px 14px", position: "sticky", top: 0, height: "100vh", boxSizing: "border-box", flexShrink: 0, overflowY: "auto" }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4, letterSpacing: "-.01em" }}>Career OS</div>
        <div style={{ fontSize: 11.5, color: C.faint, marginBottom: 20 }}>경험 분석 · 재사용</div>
        {menuGroups.map(g => (
          <div key={g.label} style={{ marginBottom: 6 }}>
            <div onClick={() => toggleGroup(g.label)} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 12px",
              fontSize: 11, fontWeight: 700, color: C.green, letterSpacing: ".03em", cursor: "pointer" }}>
              <span>{g.label}</span>
              <span style={{ fontSize: 10, color: C.green, transform: openGroups[g.label] ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform .1s" }}>▾</span>
            </div>
            {openGroups[g.label] && g.items.map(([k, l]) => (
              <div key={k} onClick={() => go(k)} style={{
                padding: "9px 12px", borderRadius: 14, fontSize: 13.5, fontWeight: nav === k ? 700 : 500, cursor: "pointer",
                background: nav === k ? C.lineSoft : "transparent", color: nav === k ? C.text : C.sub, marginBottom: 2 }}>
                {l}
              </div>
            ))}
          </div>
        ))}
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: "26px 32px", maxWidth: 1120, minWidth: 0 }}>
        {nav === "home" && <Home experiences={experiences} applications={applications} onGoAnalyze={() => go("analyze")} onGoImport={() => go("import")} onOpenDetail={openDetail} onOpenApp={id => { setNav("apply"); setAppDetailId(id); }} />}
        {nav === "guide" && <Guide onGo={go} />}
        {nav === "analyze" && <Analyze experiences={experiences} setExperiences={setExperiences} analyzeId={analyzeId} setAnalyzeId={setAnalyzeId} metrics={metrics} onDone={openDetail} />}
        {nav === "archive" && !detailId && <Archive experiences={experiences} setExperiences={setExperiences} metrics={metrics} setMetrics={setMetrics} outputs={outputs} setOutputs={setOutputs} onOpen={openDetail} onAnalyze={openAnalyze} onGoImport={() => go("import")} addTrash={addTrash} expCategories={expCategories} addExpCategory={addExpCategory} />}
        {nav === "archive" && detailId && <ExperienceDetail exp={experiences.find(e => e.id === detailId)} metrics={metrics} outputs={outputs} setOutputs={setOutputs} setExperiences={setExperiences} onBack={() => setDetailId(null)} onAnalyze={openAnalyze} onDeleted={() => setDetailId(null)} addTrash={addTrash} />}
        {nav === "import" && <ImportFlow setExperiences={setExperiences} setSkills={setSkills} setCerts={setCerts} setResumeProfile={setResumeProfile} onDone={openDetail} experiences={experiences} />}
        {nav === "skills" && <Skills skills={skills} setSkills={setSkills} certs={certs} setCerts={setCerts} experiences={experiences} onOpenExp={openDetail} addTrash={addTrash} />}
        {nav === "apply" && !appDetailId && <Applications applications={applications} setApplications={setApplications} onOpen={setAppDetailId} addTrash={addTrash} />}
        {nav === "apply" && appDetailId && <ApplicationDetail app={applications.find(a => a.id === appDetailId)} setApplications={setApplications} experiences={experiences} outputs={outputs} metrics={metrics} onBack={() => setAppDetailId(null)} onOpenExp={openDetail} addTrash={addTrash} interviewCategories={interviewCategories} addInterviewCategory={addInterviewCategory} />}
        {nav === "master" && <MasterPrep essays={masterEssays} setEssays={setMasterEssays} interviews={masterInterviews} setInterviews={setMasterInterviews} experiences={experiences} resumeProfile={resumeProfile} interviewCategories={interviewCategories} addInterviewCategory={addInterviewCategory} />}
        {nav === "resume" && <Resume experiences={experiences} outputs={outputs} metrics={metrics} resumeProfile={resumeProfile} setResumeProfile={setResumeProfile} skills={skills} certs={certs} />}
        {nav === "trash" && <Trash trash={trash} onRestore={restoreTrash} onPurge={purgeTrash} onClear={clearTrash} />}
      </main>
    </div>
  );
}

/* ============================================================ 홈 */
/* ============================================================ 아이콘 (선 스타일, 와이어프레임 톤) */
const Icon = ({ name, size = 22, color = "currentColor" }) => {
  const s = { stroke: color, strokeWidth: 1.6, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    upload: <><path d="M12 15V4" style={s} /><path d="M7 8l5-5 5 5" style={s} /><path d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3" style={s} /></>,
    layers: <><path d="M12 3l9 5-9 5-9-5 9-5z" style={s} /><path d="M3 13l9 5 9-5" style={s} /></>,
    archive: <><rect x="3" y="5" width="18" height="4" rx="1" style={s} /><path d="M5 9v9a2 2 0 002 2h10a2 2 0 002-2V9" style={s} /><path d="M10 13h4" style={s} /></>,
    star: <path d="M12 3l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 16.9l-5.6 3.2 1.4-6.3-4.8-4.3 6.4-.6L12 3z" style={s} />,
    briefcase: <><rect x="3" y="8" width="18" height="12" rx="2" style={s} /><path d="M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2" style={s} /><path d="M3 13h18" style={s} /></>,
    doc: <><path d="M7 3h7l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" style={s} /><path d="M14 3v4h4" style={s} /><path d="M9 12h6M9 15h6M9 9h2" style={s} /></>,
    check: <><circle cx="12" cy="12" r="9" style={s} /><path d="M8 12l3 3 5-6" style={s} /></>,
    arrowRight: <path d="M4 12h15M13 6l6 6-6 6" style={s} />,
    edit: <><path d="M4 20l1-4 11-11 3 3-11 11-4 1z" style={s} /><path d="M13 6l3 3" style={s} /></>,
    sparkle: <><path d="M12 4l1.4 4.6L18 10l-4.6 1.4L12 16l-1.4-4.6L6 10l4.6-1.4L12 4z" style={s} /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24">{paths[name]}</svg>;
};

/* ============================================================ 사용 가이드 */
function Guide({ onGo }) {
  const flow = [
    { icon: "upload", title: "자료 준비", desc: "기존 이력서·메모 파일을 가져오거나, 경험을 새로 등록" },
    { icon: "layers", title: "경험 분석", desc: "핵심 5단계 질문에 답하며 사실을 구조화" },
    { icon: "star", title: "역량·스킬 연결", desc: "도구·역량에 경험 근거를 연결" },
    { icon: "briefcase", title: "지원 등록", desc: "회사·직무별로 요구 역량과 경험을 매칭" },
    { icon: "doc", title: "자소서·면접 준비", desc: "문항별 문장 작성, 예상 질문 연습" },
    { icon: "check", title: "최종 이력서", desc: "승인된 문장만 모아 완성" },
  ];

  const tabs = [
    { icon: "upload", nav: "import", title: "파일 가져오기", desc: "기존 이력서·정리 파일(.docx/.xlsx/.txt)에서 AI가 초안을 추출합니다. 모든 항목은 반영 전 직접 확인·수정합니다." },
    { icon: "layers", nav: "analyze", title: "경험 분석", desc: "배경·문제·행동·기여도·성과 5단계로 경험을 구조화합니다. 심화 4단계는 나중에 채워도 됩니다." },
    { icon: "archive", nav: "archive", title: "경험 보관함", desc: "등록한 모든 경험을 경험별·역량별·질문별로 찾아봅니다." },
    { icon: "star", nav: "skills", title: "역량·스킬", desc: "도구·역량마다 실제로 할 수 있는 일을 적고, 근거가 되는 경험을 연결합니다." },
    { icon: "briefcase", nav: "apply", title: "지원 관리", desc: "지원할 회사마다 요구 역량 매칭, 자소서 문항, 면접 질문을 따로 관리합니다." },
    { icon: "doc", nav: "resume", title: "기본 이력서", desc: "경험 보관함에서 승인된 문장과, 근거가 연결된 역량·자격증만 자동으로 모입니다." },
  ];

  const approvalFlow = [
    { label: "AI 초안", color: C.ai, desc: "AI가 문장을 생성한 직후" },
    { label: "수정 중", color: C.blue, desc: "직접 내용을 고치는 단계" },
    { label: "승인됨", color: C.green, desc: "확인 완료 — 이력서에 사용 가능" },
  ];

  return (
    <div style={{ maxWidth: 880 }}>
      <H2>사용 가이드</H2>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 24, lineHeight: 1.6 }}>
        처음 쓰는 분들을 위한 전체 흐름입니다. 순서대로 하지 않아도 되지만, 처음이라면 이 순서를 추천합니다.
      </div>

      {/* 전체 흐름 */}
      <Card style={{ marginBottom: 20 }}>
        <Label>전체 흐름</Label>
        <div style={{ display: "flex", alignItems: "stretch", gap: 4, marginTop: 10, flexWrap: "wrap" }}>
          {flow.map((f, i) => (
            <React.Fragment key={f.title}>
              <div style={{ flex: "1 1 140px", minWidth: 130, border: `1px solid ${C.line}`, borderRadius: 14, padding: "14px 12px", textAlign: "center", background: C.bg }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 8, color: C.blue }}>
                  <Icon name={f.icon} size={26} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{i + 1}. {f.title}</div>
                <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.5 }}>{f.desc}</div>
              </div>
              {i < flow.length - 1 && (
                <div style={{ display: "flex", alignItems: "center", color: C.faint, flex: "0 0 auto" }}>
                  <Icon name="arrowRight" size={18} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </Card>

      {/* 탭별 설명 */}
      <Label>탭별 안내</Label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8, marginBottom: 20 }}>
        {tabs.map(t => (
          <Card key={t.nav} onClick={() => onGo(t.nav)} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ color: C.blue, flexShrink: 0, marginTop: 2 }}><Icon name={t.icon} size={24} /></div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{t.title}</div>
              <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.55 }}>{t.desc}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* 승인 개념 */}
      <Card>
        <Label>"승인"이 왜 필요한가요?</Label>
        <div style={{ fontSize: 13, color: C.sub, marginBottom: 14, lineHeight: 1.6 }}>
          AI가 쓴 문장을 그대로 이력서에 쓰지 않도록, 사실(경험 기록)과 표현(AI가 다듬은 문장)을 분리했습니다.
          문장은 아래 3단계를 거쳐야 최종 이력서·자소서에 쓸 수 있습니다.
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
          {approvalFlow.map((s, i) => (
            <React.Fragment key={s.label}>
              <div style={{ flex: "1 1 160px", border: `1px solid ${C.line}`, borderTop: `3px solid ${s.color}`, borderRadius: 14, padding: "12px 14px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.5 }}>{s.desc}</div>
              </div>
              {i < approvalFlow.length - 1 && <div style={{ color: C.faint }}><Icon name="arrowRight" size={16} /></div>}
            </React.Fragment>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Home({ experiences, applications, onGoAnalyze, onGoImport, onOpenDetail, onOpenApp }) {
  const total = experiences.length;
  const done = experiences.filter(e => e.status === "complete").length;
  const needs = experiences.filter(e => e.status === "needs_revision").length;
  const draft = experiences.filter(e => e.status === "draft").length;

  const typeCoverage = [
    ["데이터 분석 경험", experiences.filter(e => e.competencies.includes("데이터 분석") || e.competencies.includes("데이터 관리")).length],
    ["리더십 경험", experiences.filter(e => e.competencies.includes("리더십")).length],
    ["실패 경험", 0], ["갈등 경험", 0],
  ];

  const nextActions = [
    { text: "「온라인 채널 콘텐츠 개편」 배경·기여도 보완하기", act: () => onOpenDetail("e_3") },
    { text: "「재고 관리 업무 자동화」 심화 단계(어려움·배운 점) 입력하기", act: () => onOpenDetail("e_2") },
    { text: "A 리테일 기업 면접 질문 「실패 경험」에 사용할 경험 선택하기", act: () => onOpenApp("ap_1") },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>오늘 할 일부터 시작하세요</h1>
      <div style={{ fontSize: 13.5, color: C.sub, marginBottom: 22 }}>차트보다 행동. 다음에 해야 할 일을 바로 보여드립니다.</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* 다음 행동 */}
        <Card style={{ gridColumn: "1 / -1", background: C.lineSoft, border: "none" }}>
          <Label>다음 행동</Label>
          {nextActions.map((a, i) => (
            <div key={i} onClick={a.act} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < nextActions.length - 1 ? `1px solid ${C.line}` : "none", cursor: "pointer" }}>
              <span style={{ fontSize: 14 }}>{a.text}</span>
              <span style={{ color: C.faint, fontSize: 13 }}>→</span>
            </div>
          ))}
        </Card>

        {/* 준비 현황 */}
        <Card>
          <Label>경험 준비 현황</Label>
          <div style={{ display: "flex", gap: 22, marginTop: 8 }}>
            {[["전체", total, C.text], ["분석 완료", done, C.green], ["보완 필요", needs, C.orange], ["초기 메모", draft, C.sub]].map(([l, v, c]) => (
              <div key={l}>
                <div style={{ fontSize: 24, fontWeight: 800, color: c }}>{v}</div>
                <div style={{ fontSize: 12, color: C.faint }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, height: 6, background: C.lineSoft, borderRadius: 2, overflow: "hidden", display: "flex" }}>
            <div style={{ width: `${(done / total) * 100}%`, background: C.green }} />
            <div style={{ width: `${(needs / total) * 100}%`, background: C.orange }} />
          </div>
        </Card>

        {/* 부족한 경험 유형 */}
        <Card>
          <Label>부족한 경험 유형</Label>
          {typeCoverage.map(([l, n]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: 13.5 }}>
              <span>{l}</span>
              {n === 0 ? <Badge label="준비 부족" color={C.red} bg={C.redBg} /> : <span style={{ fontWeight: 700 }}>{n}개</span>}
            </div>
          ))}
          <div style={{ fontSize: 12, color: C.faint, marginTop: 6 }}>실패·갈등 경험은 면접 단골 질문입니다.</div>
        </Card>

        {/* 진행 중 지원 */}
        <Card style={{ gridColumn: "1 / -1" }}>
          <Label>진행 중인 지원</Label>
          {applications.map(a => (
            <div key={a.id} onClick={() => onOpenApp(a.id)} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 90px 100px 160px", alignItems: "center", gap: 10, padding: "11px 0", borderBottom: `1px solid ${C.lineSoft}`, cursor: "pointer", fontSize: 13.5 }}>
              <div style={{ fontWeight: 700 }}>{a.company} <span style={{ fontWeight: 400, color: C.sub }}>{a.position}</span></div>
              <div style={{ color: C.sub }}>마감 {a.deadline}</div>
              <Badge label={{ interested: "관심", analyzing: "분석 중", writing: "작성 중", submitted: "제출", interview: "면접", result: "결과" }[a.status]} color={C.blue} bg={C.blueBg} />
              <div style={{ fontSize: 12, color: C.sub }}>자소서 {a.essayProgress}%</div>
              <div style={{ height: 5, background: C.lineSoft, borderRadius: 2 }}><div style={{ width: `${a.essayProgress}%`, height: "100%", background: C.blue, borderRadius: 2 }} /></div>
            </div>
          ))}
        </Card>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn primary onClick={onGoAnalyze}>+ 새 경험 분석 시작</Btn>
        <Btn onClick={onGoImport}>파일에서 가져오기</Btn>
      </div>
    </div>
  );
}

/* ============================================================ 경험 분석 */
function Analyze({ experiences, setExperiences, analyzeId, setAnalyzeId, metrics, onDone }) {
  const exp = experiences.find(e => e.id === analyzeId);
  if (!exp) return <AnalyzeStart experiences={experiences} setExperiences={setExperiences} onStart={setAnalyzeId} />;
  return <AnalyzeFlow exp={exp} setExperiences={setExperiences} metrics={metrics} onExit={() => setAnalyzeId(null)} onDone={onDone} />;
}

function AnalyzeStart({ experiences, setExperiences, onStart }) {
  const [form, setForm] = useState({ title: "", organization: "", role: "", experienceType: "internship", rawNote: "" });
  const drafts = experiences.filter(e => e.status !== "complete");
  const canStart = form.title.trim() && form.rawNote.trim();

  const create = () => {
    const id = "e_" + Date.now();
    setExperiences(p => [...p, { id, ...form, status: "draft", depthDone: false, usageCount: 0, updatedAt: "2026-07-21", primaryCategory: "",
      competencies: [], tags: [], actions: [], context: "", assignedTask: "", discoveredProblem: "", goal: "", personalContribution: "",
      contributionLevel: "", contributionEvidence: "", coreMessage: "", oneLineSummary: "",
      completion: Object.fromEntries([...CORE_STEPS, ...DEPTH_STEPS].map(s => [s, "미입력"])) }]);
    onStart(id);
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <H2>새 경험 분석</H2>
      <Card>
        <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.7, marginBottom: 16, padding: 12, background: C.bg, borderRadius: 14 }}>
          처음부터 완벽하게 작성할 필요는 없습니다.<br />기억나는 내용을 자유롭게 적으면, 질문을 통해 함께 구체화합니다.
        </div>
        <div style={{ display: "grid", gap: 13 }}>
          <div><Label>경험 제목 *</Label><Input placeholder="예: 웹사이트 운영 프로모션 기획" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><Label>소속 또는 활동명</Label><Input placeholder="예: 온라인 쇼핑몰 (인턴)" value={form.organization} onChange={e => setForm(f => ({ ...f, organization: e.target.value }))} /></div>
            <div><Label>당시 역할</Label><Input placeholder="예: E-commerce Assistant" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} /></div>
          </div>
          <div>
            <Label>경험 유형</Label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[["internship", "인턴"], ["full_time", "정규직"], ["part_time", "아르바이트"], ["school_project", "학교 프로젝트"], ["external_activity", "대외활동"], ["club", "동아리"], ["competition", "공모전"], ["personal_project", "개인 프로젝트"], ["other", "기타"]].map(([v, l]) => (
                <button key={v} onClick={() => setForm(f => ({ ...f, experienceType: v }))} style={{
                  fontFamily: font, fontSize: 12.5, padding: "5px 11px", borderRadius: 14, cursor: "pointer",
                  border: `1px solid ${form.experienceType === v ? C.text : C.line}`,
                  background: form.experienceType === v ? C.text : C.panel, color: form.experienceType === v ? "#fff" : C.sub }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div><Label>자유 메모 *</Label>
            <Textarea rows={5} placeholder={"예: 아르바이트 근무 중 매장 프로모션을 진행했다.\n기존 할인만 하는 것보다 사은품을 주는 게 좋을 것 같았다.\n과거 데이터를 분석해서 제품을 골랐고 매출이 올랐다."}
              value={form.rawNote} onChange={e => setForm(f => ({ ...f, rawNote: e.target.value }))} />
          </div>
        </div>
        <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
          <Btn primary disabled={!canStart} onClick={create}>단계별 분석 시작 →</Btn>
        </div>
      </Card>

      {drafts.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <Label>분석 이어하기</Label>
          {drafts.map(e => (
            <Card key={e.id} onClick={() => onStart(e.id)} style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px" }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 13.5 }}>{e.title}</span>
                <span style={{ color: C.faint, fontSize: 12, marginLeft: 8 }}>{e.organization}</span>
              </div>
              <Badge label={STATUS_LABEL[e.status]} color={STATUS_COLOR[e.status][0]} bg={STATUS_COLOR[e.status][1]} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AnalyzeFlow({ exp, setExperiences, metrics, onExit, onDone }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [showDepth, setShowDepth] = useState(false);
  const steps = showDepth ? DEPTH_STEPS : CORE_STEPS;
  const step = steps[stepIdx];
  const [local, setLocal] = useState({ ...exp });
  const autosave = useAutosave(JSON.stringify(local));

  const patch = (k, v) => setLocal(p => ({ ...p, [k]: v }));
  const commit = (extra = {}) => setExperiences(prev => prev.map(e => e.id === exp.id ? { ...e, ...local, ...extra, updatedAt: "2026-07-21" } : e));

  const markStep = (name) => {
    const comp = { ...local.completion, [name]: "충분" };
    setLocal(p => ({ ...p, completion: comp }));
    return comp;
  };

  const next = () => {
    const comp = markStep(step);
    if (stepIdx < steps.length - 1) { setStepIdx(stepIdx + 1); commit({ completion: comp, status: "analyzing" }); }
    else if (!showDepth) {
      commit({ completion: comp, status: "complete" });
      setShowDepth(true); setStepIdx(0);
    } else {
      commit({ completion: comp, status: "complete", depthDone: true });
      onDone(exp.id);
    }
  };
  const finishCore = () => { commit({ completion: markStep(step), status: "complete" }); onDone(exp.id); };

  const fieldFor = {
    배경: [["context", "배경·상황", "언제, 어디서, 어떤 상황이었는지"], ],
    문제: [["assignedTask", "주어진 업무", "원래 맡은 업무"], ["discoveredProblem", "내가 발견한 문제", "주어진 업무와 구분해서 작성"]],
    행동: null, // 별도 UI
    기여도: null,
    성과: null,
    목표: [["goal", "목표", "수치 목표·성공 기준·제약"]],
    어려움: [["difficulty", "핵심 어려움", "부담·갈등·제약 조건"]],
    "배운 점": [["learning", "배운 점", "이전 생각 → 발견한 것 → 바뀐 행동"]],
    "직무 연결": [["jobRelevance", "직무 연결", "연결되는 직무와 보여주는 역량"], ["coreMessage", "핵심 메시지", "이 경험을 한 문장으로"]],
  };

  const aiHints = {
    배경: "팀 규모와 본인의 공식 역할이 아직 없습니다. \"몇 명 팀에서 어떤 역할이었나요?\"",
    문제: "\"어려웠다\"는 표현이 있다면 어떤 데이터·현상으로 문제라고 판단했는지 적어주세요.",
    행동: "행동을 분석·판단·실행·협업으로 나누면 면접 꼬리질문 대비가 쉬워집니다.",
    기여도: "기여 수준만 고르지 말고 근거를 함께 적으세요. \"내가 없었다면 무엇이 달라졌을까?\"",
    성과: "\"매출이 올랐다\"고 작성했다면 — 이전 기간 대비 몇 % 증가였나요? 확인할 리포트가 있나요?",
    목표: "목표를 누가 정했는지, 수치 기준이 있었는지 구분해 보세요.",
    어려움: "갈등이 있었다면 상대의 입장도 함께 기록해 두세요. 갈등 경험 문항에 재사용됩니다.",
    "배운 점": "\"협업의 중요성을 배웠다\" 같은 추상 문장 대신, 이후 실제로 바뀐 행동을 적으세요.",
    "직무 연결": "지원 직무의 JD 키워드와 연결해 보세요.",
  };

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 12, color: C.faint }}>{showDepth ? "심화 분석 (선택)" : "핵심 분석"} · {exp.title}</div>
          <h2 style={{ fontSize: 19, fontWeight: 800, margin: "2px 0 0" }}>{stepIdx + 1}. {step}</h2>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <AutosaveIndicator state={autosave} />
          <Btn small onClick={() => { commit(); onExit(); }}>임시 저장 후 나가기</Btn>
        </div>
      </div>

      {/* 스텝 네비게이터 */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {steps.map((s, i) => (
          <div key={s} onClick={() => setStepIdx(i)} style={{ flex: 1, cursor: "pointer" }}>
            <div style={{ height: 4, borderRadius: 2, background: i < stepIdx ? C.green : i === stepIdx ? C.blue : C.lineSoft, marginBottom: 4 }} />
            <div style={{ fontSize: 11.5, color: i === stepIdx ? C.text : C.faint, fontWeight: i === stepIdx ? 700 : 500 }}>{s}</div>
          </div>
        ))}
      </div>

      <Card>
        {/* 가이드 질문 */}
        <div style={{ marginBottom: 14 }}>
          <Label>가이드 질문</Label>
          {STEP_QUESTIONS[step].map((q, i) => (
            <div key={i} style={{ fontSize: 13, color: C.sub, padding: "3px 0" }}>· {q}</div>
          ))}
        </div>

        {/* AI 질문 힌트 */}
        <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: C.accent, border: `1px solid ${C.line}`, borderRadius: 14, marginBottom: 16, alignItems: "flex-start" }}>
          <Badge label="AI 질문" color={C.ai} bg="#fff" />
          <span style={{ fontSize: 13, color: C.text, lineHeight: 1.55 }}>{aiHints[step]}</span>
        </div>

        {/* 입력 영역 */}
        {step === "행동" && <ActionEditor local={local} setLocal={setLocal} />}
        {step === "기여도" && <ContributionEditor local={local} patch={patch} />}
        {step === "성과" && <MetricEditor expId={exp.id} metrics={metrics} local={local} patch={patch} />}
        {fieldFor[step] && fieldFor[step].map(([key, label, ph]) => (
          <div key={key} style={{ marginBottom: 12 }}>
            <Label>{label}</Label>
            <Textarea placeholder={ph} value={local[key] || ""} onChange={e => patch(key, e.target.value)} />
          </div>
        ))}

        {step === "배경" && (
          <div style={{ marginBottom: 12 }}>
            <Label>자유 메모 (참고)</Label>
            <div style={{ fontSize: 13, color: C.sub, padding: "10px 12px", background: C.bg, borderRadius: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{local.rawNote}</div>
          </div>
        )}
      </Card>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
        <Btn onClick={() => stepIdx > 0 ? setStepIdx(stepIdx - 1) : (showDepth ? (setShowDepth(false), setStepIdx(CORE_STEPS.length - 1)) : null)} disabled={stepIdx === 0 && !showDepth}>← 이전</Btn>
        <div style={{ display: "flex", gap: 8 }}>
          {!showDepth && stepIdx === CORE_STEPS.length - 1 && (
            <Btn onClick={finishCore}>핵심 5단계로 완료</Btn>
          )}
          <Btn primary onClick={next}>
            {stepIdx < steps.length - 1 ? "다음 →" : showDepth ? "심화 분석 완료" : "심화 단계 계속 →"}
          </Btn>
        </div>
      </div>
      {!showDepth && (
        <div style={{ fontSize: 12, color: C.faint, marginTop: 10, textAlign: "right" }}>
          핵심 5단계만으로 경험 카드가 생성됩니다. 심화 4단계(목표·어려움·배운 점·직무 연결)는 나중에 추가할 수 있습니다.
        </div>
      )}
    </div>
  );
}

function ActionEditor({ local, setLocal }) {
  const [draft, setDraft] = useState({ actionType: "analysis", description: "", isDirectAction: true });
  const add = () => {
    if (!draft.description.trim()) return;
    setLocal(p => ({ ...p, actions: [...(p.actions || []), { ...draft, id: "a_" + Date.now() }] }));
    setDraft({ actionType: "analysis", description: "", isDirectAction: true });
  };
  return (
    <div style={{ marginBottom: 12 }}>
      <Label>행동 카드 (유형별로 분리)</Label>
      {(local.actions || []).map((a, i) => (
        <div key={a.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.lineSoft}` }}>
          <Badge label={ACTION_LABEL[a.actionType]} color={C.blue} bg={C.blueBg} />
          <span style={{ fontSize: 13.5, flex: 1 }}>{a.description}</span>
          {!a.isDirectAction && <Badge label="타인 수행" color={C.orange} bg={C.orangeBg} />}
          <span onClick={() => setLocal(p => ({ ...p, actions: p.actions.filter(x => x.id !== a.id) }))} style={{ cursor: "pointer", color: C.faint, fontSize: 13 }}>✕</span>
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <select value={draft.actionType} onChange={e => setDraft(d => ({ ...d, actionType: e.target.value }))}
          style={{ fontFamily: font, fontSize: 13, padding: "8px 10px", borderRadius: 14, border: `1px solid ${C.line}`, background: C.panel }}>
          {Object.entries(ACTION_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <Input placeholder="행동 설명 — 예: 과거 3년 판매량, 장바구니 데이터 분석" value={draft.description}
          onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} onKeyDown={e => e.key === "Enter" && add()} style={{ flex: 1 }} />
        <label style={{ fontSize: 12, color: C.sub, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
          <input type="checkbox" checked={draft.isDirectAction} onChange={e => setDraft(d => ({ ...d, isDirectAction: e.target.checked }))} /> 직접 수행
        </label>
        <Btn small onClick={add}>추가</Btn>
      </div>
    </div>
  );
}

function ContributionEditor({ local, patch }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <Label>기여 수준</Label>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {Object.entries(CONTRIB_LABEL).map(([v, l]) => (
          <button key={v} onClick={() => patch("contributionLevel", v)} style={{
            fontFamily: font, fontSize: 12.5, padding: "6px 13px", borderRadius: 14, cursor: "pointer",
            border: `1px solid ${local.contributionLevel === v ? C.text : C.line}`,
            background: local.contributionLevel === v ? C.text : C.panel, color: local.contributionLevel === v ? "#fff" : C.sub }}>
            {l}
          </button>
        ))}
      </div>
      <Label>근거 (필수 — 수준만 선택할 수 없습니다)</Label>
      <Textarea placeholder="예: 과거 3년 판매 데이터를 직접 분석하고, 사은품 제품과 구매 조건을 제안한 뒤, 프로모션 세팅과 결과 리포트까지 담당했다."
        value={local.contributionEvidence || ""} onChange={e => patch("contributionEvidence", e.target.value)} />
      <div style={{ marginTop: 10 }}>
        <Label>팀이 한 일 / 내가 한 일 구분</Label>
        <Textarea style={{ minHeight: 60 }} placeholder="팀: ... / 나: ..." value={local.personalContribution || ""} onChange={e => patch("personalContribution", e.target.value)} />
      </div>
    </div>
  );
}

function MetricEditor({ expId, metrics, local, patch }) {
  const mine = metrics.filter(m => m.experienceId === expId);
  return (
    <div style={{ marginBottom: 12 }}>
      <Label>성과 수치 — ExperienceMetric 단일 원본</Label>
      <div style={{ fontSize: 12, color: C.faint, marginBottom: 10, lineHeight: 1.6 }}>
        수치는 여기에만 저장됩니다. 이력서·자소서·면접 문장은 이 수치를 토큰으로 참조하며, 원본이 바뀌면 모든 문장에 반영됩니다.
      </div>
      {mine.length > 0 ? mine.map(m => (
        <div key={m.id} style={{ display: "grid", gridTemplateColumns: "1fr 110px 130px 130px", gap: 8, alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.lineSoft}`, fontSize: 13.5 }}>
          <span style={{ fontWeight: 600 }}>{m.metricName}</span>
          <span style={{ color: C.blue, fontWeight: 700 }}>{formatMetric(m, "exact")}</span>
          <span style={{ fontSize: 12, color: C.sub }}>{m.comparisonBasis || "—"}</span>
          <Badge label={CERTAINTY[m.certainty][0]} color={CERTAINTY[m.certainty][1]} bg={CERTAINTY[m.certainty][2]} />
        </div>
      )) : (
        <div style={{ fontSize: 13, color: C.sub, padding: 14, background: C.bg, borderRadius: 14 }}>
          아직 수치가 없습니다. 정량 성과가 없다면 정성 변화(CS 감소, 프로세스 표준화 등)를 아래에 적어주세요.
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <Input placeholder="지표명 (예: 매출)" style={{ flex: 1 }} />
        <Input placeholder="변화 값 (예: 29)" style={{ width: 110 }} />
        <Input placeholder="단위 (%)" style={{ width: 70 }} />
        <Input placeholder="근거 자료" style={{ width: 130 }} />
        <Btn small>추가</Btn>
      </div>
      <div style={{ marginTop: 12 }}>
        <Label>정성 성과 / 성과 설명</Label>
        <Textarea style={{ minHeight: 60 }} placeholder="예: 출고 실패 0건, 협업 프로세스 표준화, 매뉴얼 배포" value={local.qualitative || ""} onChange={e => patch("qualitative", e.target.value)} />
      </div>
    </div>
  );
}

/* ============================================================ 보관함 */
function Archive({ experiences, setExperiences, metrics, setMetrics, outputs, setOutputs, onOpen, onAnalyze, onGoImport, addTrash, expCategories, addExpCategory }) {
  const [view, setView] = useState("exp"); // exp | comp | question
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [mergeMode, setMergeMode] = useState(false);
  const [selected, setSelected] = useState([]); // 합치기 선택된 experience id들
  const [mergeStep, setMergeStep] = useState(false); // 병합 확인 화면 표시 여부
  const [collapsed, setCollapsed] = useState({}); // 카테고리 블록 접힘 상태

  const deleteExp = (id) => {
    const exp = experiences.find(e => e.id === id);
    setExperiences(prev => prev.filter(e => e.id !== id));
    addTrash("experience", exp.title, () => setExperiences(prev => [...prev, exp]));
  };

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const cancelMerge = () => { setMergeMode(false); setSelected([]); setMergeStep(false); };

  const filtered = experiences.filter(e =>
    (filter === "all" || e.status === filter) &&
    (q === "" || e.title.includes(q) || e.competencies.some(c => c.includes(q)) || (e.organization || "").includes(q))
  );

  const allComps = [...new Set(experiences.flatMap(e => e.competencies))];
  const questions = [
    ["가장 큰 성과", e => e.tags.includes("정량 성과")],
    ["주도적으로 개선한 경험", e => ["led", "proposed_and_executed", "full_ownership"].includes(e.contributionLevel)],
    ["협업 경험", e => e.actions.some(a => a.actionType === "collaboration")],
    ["실패 경험", () => false],
    ["갈등 경험", () => false],
  ];

  return (
    <div>
      {mergeStep ? (
        <MergeReview ids={selected} experiences={experiences} setExperiences={setExperiences}
          metrics={metrics} setMetrics={setMetrics} outputs={outputs} setOutputs={setOutputs}
          addTrash={addTrash} onDone={(id) => { cancelMerge(); onOpen(id); }} onCancel={() => setMergeStep(false)} />
      ) : (
      <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <H2>경험 보관함</H2>
        <div style={{ display: "flex", gap: 6 }}>
          {mergeMode ? (
            <Btn small onClick={cancelMerge}>합치기 취소</Btn>
          ) : (
            <>
              <Btn small onClick={onGoImport}>파일 가져오기</Btn>
              <Btn small onClick={() => setMergeMode(true)}>경험 합치기</Btn>
              {[["exp", "경험별"], ["comp", "역량별"], ["question", "질문별"]].map(([v, l]) => (
                <Btn key={v} small primary={view === v} onClick={() => setView(v)}>{l}</Btn>
              ))}
            </>
          )}
        </div>
      </div>

      {mergeMode && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.accent, border: `1px solid ${C.line}`, borderRadius: 14, padding: "10px 14px", marginBottom: 14 }}>
          <span style={{ fontSize: 13 }}>같은 경험이 여러 카드로 나뉘어 있다면 2개 이상 선택하세요. 현재 {selected.length}개 선택됨.</span>
          <Btn small primary disabled={selected.length < 2} onClick={() => setMergeStep(true)}>선택한 경험 합치기 →</Btn>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <Input placeholder="경험·역량·소속 검색" value={q} onChange={e => setQ(e.target.value)} style={{ maxWidth: 300 }} />
        {[["all", "전체"], ["complete", "분석 완료"], ["needs_revision", "보완 필요"], ["draft", "초기 메모"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ fontFamily: font, fontSize: 12.5, padding: "6px 12px", borderRadius: 14, cursor: "pointer",
            border: `1px solid ${filter === v ? C.text : C.line}`, background: filter === v ? C.text : C.panel, color: filter === v ? "#fff" : C.sub }}>{l}</button>
        ))}
      </div>

      {view === "exp" && (() => {
        const groups = {};
        filtered.forEach(e => {
          const key = e.primaryCategory || "미분류";
          (groups[key] = groups[key] || []).push(e);
        });
        const orderedKeys = [...expCategories.filter(c => groups[c]), ...Object.keys(groups).filter(k => k !== "미분류" && !expCategories.includes(k)), ...(groups["미분류"] ? ["미분류"] : [])];

        const renderCard = (e) => {
          const doneCnt = Object.values(e.completion).filter(v => v === "충분").length;
          return (
            <Card key={e.id} onClick={() => mergeMode ? toggleSelect(e.id) : onOpen(e.id)}
              style={mergeMode && selected.includes(e.id) ? { borderColor: C.text, background: C.bg } : {}}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {mergeMode && <input type="checkbox" checked={selected.includes(e.id)} onChange={() => toggleSelect(e.id)} onClick={ev => ev.stopPropagation()} />}
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>{e.title}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Badge label={STATUS_LABEL[e.status]} color={STATUS_COLOR[e.status][0]} bg={STATUS_COLOR[e.status][1]} />
                  {!mergeMode && <span onClick={ev => { ev.stopPropagation(); deleteExp(e.id); }}
                    title="삭제 (휴지통에서 복구 가능)" style={{ cursor: "pointer", color: C.faint, fontSize: 13 }}>✕</span>}
                </div>
              </div>
              <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 8 }}>{e.organization} · {e.startDate}~{e.endDate}</div>
              {e.oneLineSummary && <div style={{ fontSize: 13, lineHeight: 1.55, marginBottom: 10, color: C.text }}>{e.oneLineSummary}</div>}
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                {e.competencies.slice(0, 3).map(c => <Badge key={c} label={"#" + c} color={C.sub} bg={C.lineSoft} />)}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11.5, color: C.faint, marginBottom: 8 }}>
                <span>완성도 {doneCnt}/9 {e.status === "complete" && !e.depthDone && "· 심화 미입력"}</span>
                <span>활용 {e.usageCount}회 · {e.updatedAt}</span>
              </div>
              <div onClick={ev => ev.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11.5, color: C.faint }}>카테고리:</span>
                <CategorySelect value={e.primaryCategory} options={expCategories} placeholder="미분류"
                  onAddOption={addExpCategory}
                  onChange={(v) => setExperiences(prev => prev.map(x => x.id === e.id ? { ...x, primaryCategory: v } : x))} />
              </div>
              {e.status !== "complete" && (
                <div style={{ marginTop: 10 }}><Btn small onClick={ev => { ev.stopPropagation(); onAnalyze(e.id); }}>분석 이어하기 →</Btn></div>
              )}
            </Card>
          );
        };

        return orderedKeys.map(key => (
          <div key={key} style={{ marginBottom: 20 }}>
            <div onClick={() => setCollapsed(p => ({ ...p, [key]: !p[key] }))} style={{
              display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 10 }}>
              <span style={{ fontSize: 10, color: C.faint, transform: collapsed[key] ? "rotate(-90deg)" : "rotate(0deg)" }}>▾</span>
              <span style={{ fontSize: 13.5, fontWeight: 700 }}>{key}</span>
              <span style={{ fontSize: 12, color: C.faint }}>({groups[key].length})</span>
            </div>
            {!collapsed[key] && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {groups[key].map(renderCard)}
              </div>
            )}
          </div>
        ));
      })()}

      {view === "comp" && allComps.map(c => (
        <Card key={c} style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8 }}>#{c}</div>
          {experiences.filter(e => e.competencies.includes(c)).map(e => (
            <div key={e.id} onClick={() => onOpen(e.id)} style={{ fontSize: 13, color: C.sub, padding: "4px 0", cursor: "pointer" }}>· {e.title}</div>
          ))}
        </Card>
      ))}

      {view === "question" && questions.map(([label, fn]) => {
        const hits = experiences.filter(fn);
        return (
          <Card key={label} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8 }}>{label}</div>
              {hits.length === 0 && <Badge label="준비 부족" color={C.red} bg={C.redBg} />}
            </div>
            {hits.length > 0 ? hits.map(e => (
              <div key={e.id} onClick={() => onOpen(e.id)} style={{ fontSize: 13, color: C.sub, padding: "4px 0", cursor: "pointer" }}>· {e.title}</div>
            )) : <div style={{ fontSize: 12.5, color: C.faint }}>이 질문에 쓸 경험이 아직 없습니다.</div>}
          </Card>
        );
      })}
      </>
      )}
    </div>
  );
}

/* ============================================================ 경험 합치기 검토 */
function MergeReview({ ids, experiences, setExperiences, metrics, setMetrics, outputs, setOutputs, addTrash, onDone, onCancel }) {
  const items = experiences.filter(e => ids.includes(e.id));
  const [primaryId, setPrimaryId] = useState(ids[0]);
  const [mergedNote, setMergedNote] = useState(
    items.map(e => `[${e.title}]\n${e.rawNote || e.oneLineSummary || "(내용 없음)"}`).join("\n\n")
  );

  const confirm = () => {
    const primary = items.find(e => e.id === primaryId);
    const others = items.filter(e => e.id !== primaryId);
    const otherIds = others.map(e => e.id);

    const merged = {
      ...primary,
      rawNote: mergedNote,
      competencies: [...new Set(items.flatMap(e => e.competencies))],
      tags: [...new Set(items.flatMap(e => e.tags))],
      actions: items.flatMap(e => e.actions),
    };

    setMetrics(prev => prev.map(m => otherIds.includes(m.experienceId) ? { ...m, experienceId: primaryId } : m));
    setOutputs(prev => prev.map(o => otherIds.includes(o.experienceId) ? { ...o, experienceId: primaryId } : o));
    setExperiences(prev => prev.filter(e => !otherIds.includes(e.id)).map(e => e.id === primaryId ? merged : e));
    others.forEach(o => addTrash("experience", o.title, () => setExperiences(prev => [...prev, o])));

    onDone(primaryId);
  };

  return (
    <div style={{ maxWidth: 700 }}>
      <H2>경험 합치기</H2>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 16, lineHeight: 1.6 }}>
        기준이 될 경험을 하나 고르세요. 나머지는 휴지통으로 이동하고, 그 경험에 딸린 성과 수치·활용 문장은 기준 경험으로 옮겨집니다.
      </div>
      {items.map(e => (
        <label key={e.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", borderBottom: `1px solid ${C.lineSoft}`, cursor: "pointer" }}>
          <input type="radio" name="primary" checked={primaryId === e.id} onChange={() => setPrimaryId(e.id)} style={{ marginTop: 3 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5, display: "flex", gap: 6, alignItems: "center" }}>
              {e.title} {primaryId === e.id && <Badge label="기준" color={C.green} bg={C.greenBg} />}
            </div>
            <div style={{ fontSize: 12, color: C.faint }}>{e.organization} · {e.startDate}~{e.endDate}</div>
          </div>
        </label>
      ))}
      <div style={{ marginTop: 16 }}>
        <Label>병합된 메모 (수정 가능)</Label>
        <Textarea rows={9} value={mergedNote} onChange={e => setMergedNote(e.target.value)} />
      </div>
      <div style={{ fontSize: 12, color: C.faint, marginTop: 8, lineHeight: 1.6 }}>
        배경·문제·행동 등 세부 필드는 기준 경험의 내용이 유지됩니다. 합친 뒤 경험 분석에서 전체 내용을 다시 확인·정리하는 것을 권장합니다.
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <Btn primary onClick={confirm}>합치기 확정</Btn>
        <Btn onClick={onCancel}>취소</Btn>
      </div>
    </div>
  );
}

/* ============================================================ 경험 상세 */
function ExperienceDetail({ exp, metrics, outputs, setOutputs, setExperiences, onBack, onAnalyze, onDeleted, addTrash }) {
  const [tab, setTab] = useState("요약");
  const mine = metrics.filter(m => m.experienceId === exp.id);
  const myOutputs = outputs.filter(o => o.experienceId === exp.id);

  const approve = (id) => setOutputs(prev => prev.map(o => o.id === id ? { ...o, approvalStatus: "approved", isStale: false } : o));
  const reject = (id) => setOutputs(prev => prev.map(o => o.id === id ? { ...o, approvalStatus: "rejected" } : o));
  const deleteExp = () => {
    setExperiences(prev => prev.filter(e => e.id !== exp.id));
    addTrash("experience", exp.title, () => setExperiences(prev => [...prev, exp]));
    onDeleted();
  };

  const [tagDraft, setTagDraft] = useState("");
  const addTag = () => {
    const t = tagDraft.trim();
    if (!t || exp.competencies.includes(t)) return;
    setExperiences(prev => prev.map(e => e.id === exp.id ? { ...e, competencies: [...e.competencies, t] } : e));
    setTagDraft("");
  };
  const removeTag = (t) => setExperiences(prev => prev.map(e => e.id === exp.id ? { ...e, competencies: e.competencies.filter(c => c !== t) } : e));

  const missing = [];
  if (!exp.context) missing.push("배경·상황 정보가 없습니다.");
  if (!exp.contributionEvidence) missing.push("성과가 본인의 행동 때문이라는 근거가 필요합니다.");
  if (!exp.difficulty) missing.push("실패·아쉬움 정보가 없어 실패 경험 문항에 활용할 수 없습니다.");

  return (
    <div style={{ maxWidth: 820 }}>
      <div onClick={onBack} style={{ fontSize: 13, color: C.sub, cursor: "pointer", marginBottom: 10 }}>← 경험 보관함</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{exp.title}</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Badge label={STATUS_LABEL[exp.status]} color={STATUS_COLOR[exp.status][0]} bg={STATUS_COLOR[exp.status][1]} />
          <Btn small onClick={() => onAnalyze(exp.id)}>{exp.depthDone ? "수정하기" : "심화 분석 계속"}</Btn>
          <span onClick={deleteExp} title="이 경험 삭제 (휴지통에서 복구 가능)" style={{ cursor: "pointer", color: C.faint, fontSize: 14, padding: "0 4px" }}>✕</span>
        </div>
      </div>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 16 }}>{exp.organization} · {exp.role} · {exp.startDate}~{exp.endDate}</div>

      <div style={{ display: "flex", gap: 2, borderBottom: `1px solid ${C.line}`, marginBottom: 18 }}>
        {["요약", "사실", "행동", "성과", "활용 문장", "완성도"].map(t => (
          <div key={t} onClick={() => setTab(t)} style={{ padding: "9px 14px", fontSize: 13.5, fontWeight: tab === t ? 700 : 500, cursor: "pointer",
            color: tab === t ? C.text : C.sub, borderBottom: tab === t ? `2px solid ${C.text}` : "2px solid transparent", marginBottom: -1 }}>{t}</div>
        ))}
      </div>

      {tab === "요약" && (
        <div style={{ display: "grid", gap: 12 }}>
          {exp.oneLineSummary && <Card><Label>한 줄 요약</Label><div style={{ fontSize: 14.5, lineHeight: 1.6 }}>{exp.oneLineSummary}</div></Card>}
          {exp.coreMessage && <Card style={{ background: C.accent }}><Label>핵심 메시지</Label><div style={{ fontSize: 14, lineHeight: 1.6 }}>{exp.coreMessage}</div></Card>}
          <Card>
            <Label>대표 역량 — 추가·삭제 가능</Label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {exp.competencies.map(c => (
                <span key={c} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Badge label={"#" + c} color={C.blue} bg={C.blueBg} />
                  <span onClick={() => removeTag(c)} style={{ cursor: "pointer", color: C.faint, fontSize: 11 }}>✕</span>
                </span>
              ))}
              {exp.competencies.length === 0 && <span style={{ fontSize: 12.5, color: C.faint }}>아직 태그가 없습니다.</span>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Input placeholder="역량 태그 추가 (예: 협상력)" value={tagDraft} onChange={e => setTagDraft(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addTag()} style={{ maxWidth: 220 }} />
              <Btn small onClick={addTag}>추가</Btn>
            </div>
          </Card>
          {missing.length > 0 && (
            <Card style={{ background: C.accent }}>
              <Label>부족한 정보</Label>
              {missing.map((m, i) => <div key={i} style={{ fontSize: 13, color: C.orange, padding: "3px 0" }}>· {m}</div>)}
            </Card>
          )}
        </div>
      )}

      {tab === "사실" && (
        <Card>
          <Label>사실 보관함 — 검증된 원본만 저장</Label>
          {[["소속", exp.organization], ["역할", exp.role], ["주어진 업무", exp.assignedTask], ["발견한 문제", exp.discoveredProblem],
            ["기여 수준", CONTRIB_LABEL[exp.contributionLevel]], ["기여 근거", exp.contributionEvidence]].map(([k, v]) => (
            <div key={k} style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 10, padding: "9px 0", borderBottom: `1px solid ${C.lineSoft}`, fontSize: 13.5 }}>
              <span style={{ color: C.faint, fontWeight: 600 }}>{k}</span>
              <span style={{ lineHeight: 1.55 }}>{v || <span style={{ color: C.faint }}>미입력</span>}</span>
            </div>
          ))}
          <div style={{ fontSize: 12, color: C.faint, marginTop: 10 }}>사실은 수정 이력이 남습니다. 활용 문장을 고쳐도 이 원본은 바뀌지 않습니다.</div>
        </Card>
      )}

      {tab === "행동" && (
        <Card>
          <Label>행동 타임라인</Label>
          {exp.actions.map((a, i) => (
            <div key={a.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderBottom: i < exp.actions.length - 1 ? `1px solid ${C.lineSoft}` : "none" }}>
              <div style={{ width: 22, height: 22, borderRadius: 99, background: C.lineSoft, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
              <Badge label={ACTION_LABEL[a.actionType]} color={C.blue} bg={C.blueBg} />
              <span style={{ fontSize: 13.5, lineHeight: 1.55 }}>{a.description}</span>
            </div>
          ))}
          {exp.actions.length === 0 && <div style={{ fontSize: 13, color: C.faint }}>행동이 아직 없습니다.</div>}
        </Card>
      )}

      {tab === "성과" && (
        <Card>
          <Label>성과 수치 — 단일 원본 (모든 문장이 여기를 참조)</Label>
          {mine.map(m => (
            <div key={m.id} style={{ display: "grid", gridTemplateColumns: "1fr 130px 140px 140px 140px", gap: 8, alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.lineSoft}`, fontSize: 13.5 }}>
              <span style={{ fontWeight: 600 }}>{m.metricName}</span>
              <span style={{ color: C.blue, fontWeight: 700 }}>{formatMetric(m, "exact")}</span>
              <span style={{ fontSize: 12, color: C.sub }}>{m.comparisonBasis || "—"}</span>
              <span style={{ fontSize: 12, color: C.sub }}>{m.evidenceSource || "근거 없음"}</span>
              <Badge label={CERTAINTY[m.certainty][0]} color={CERTAINTY[m.certainty][1]} bg={CERTAINTY[m.certainty][2]} />
            </div>
          ))}
          {mine.length === 0 && <div style={{ fontSize: 13, color: C.faint }}>수치가 없습니다.</div>}
        </Card>
      )}

      {tab === "활용 문장" && (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.6 }}>
            수치는 <span style={{ background: C.greenBg, color: C.green, padding: "1px 5px", borderRadius: 12, fontWeight: 600 }}>토큰</span>으로 원본을 참조합니다. 승인된 문장만 제출본에 사용할 수 있습니다.
          </div>
          {myOutputs.filter(o => o.approvalStatus !== "rejected").map(o => {
            const ap = APPROVAL[o.approvalStatus];
            return (
              <Card key={o.id} style={o.isStale ? { borderColor: C.red } : {}}>
                <div style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <Badge label={{ resume: "이력서", essay: "자소서", interview: "면접", portfolio: "포트폴리오" }[o.outputType]} color={C.sub} bg={C.lineSoft} />
                  {o.style && <Badge label={{ role_focused: "역할 중심", result_focused: "성과 중심", competency_focused: "역량 중심" }[o.style]} color={C.sub} bg={C.lineSoft} />}
                  {o.isAiGenerated && <Badge label="AI 생성" color={C.ai} bg={C.aiBg} />}
                  <Badge label={ap.label} color={ap.color} bg={ap.bg} />
                  {o.isStale && <Badge label="참조 수치 변경됨 · 재승인 필요" color={C.red} bg={C.redBg} />}
                  <span style={{ fontSize: 11, color: C.faint, marginLeft: "auto" }}>v{o.version}</span>
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.65 }}><TokenText text={o.content} metrics={metrics} /></div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  {o.approvalStatus !== "approved" && <Btn small primary onClick={() => approve(o.id)}>승인</Btn>}
                  {o.isStale && <Btn small primary onClick={() => approve(o.id)}>확인 후 재승인</Btn>}
                  <Btn small>재생성</Btn>
                  <Btn small onClick={() => reject(o.id)}>폐기</Btn>
                </div>
              </Card>
            );
          })}
          <div><Btn>+ 이력서 문장 만들기</Btn></div>
        </div>
      )}

      {tab === "완성도" && (
        <Card>
          <Label>항목별 완성도 — 점수보다 보완할 항목이 우선</Label>
          {Object.entries(exp.completion).map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.lineSoft}`, fontSize: 13.5 }}>
              <span>{k}{DEPTH_STEPS.includes(k) && <span style={{ fontSize: 11, color: C.faint, marginLeft: 6 }}>심화</span>}</span>
              <Badge label={v} color={v === "충분" ? C.green : v === "보완 필요" ? C.orange : C.faint} bg={v === "충분" ? C.greenBg : v === "보완 필요" ? C.orangeBg : C.lineSoft} />
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

/* ============================================================ 파일 가져오기 (AI 추출 → 검토 → 반영) */
function ImportFlow({ setExperiences, setSkills, setCerts, setResumeProfile, onDone, experiences }) {
  const [phase, setPhase] = useState("input"); // input | loading | review | done
  const [raw, setRaw] = useState("");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [workbook, setWorkbook] = useState(null); // 여러 시트가 있을 때 선택 UI용

  const loadSheet = (wb, sheetName) => {
    const ws = wb.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(ws);
    setRaw(csv);
    setWorkbook(null);
  };

  const onFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFileName(f.name); setError(""); setWorkbook(null);
    if (/\.(txt|md)$/i.test(f.name)) {
      const r = new FileReader();
      r.onload = () => setRaw(String(r.result));
      r.readAsText(f);
    } else if (/\.docx$/i.test(f.name)) {
      const r = new FileReader();
      r.onload = async () => {
        try {
          const { value } = await mammoth.extractRawText({ arrayBuffer: r.result });
          setRaw(value);
        } catch {
          setError("Word 파일을 읽지 못했습니다. 내용을 복사해 아래에 붙여넣어 주세요.");
        }
      };
      r.readAsArrayBuffer(f);
    } else if (/\.(xlsx|xls|csv)$/i.test(f.name)) {
      const r = new FileReader();
      r.onload = () => {
        try {
          const wb = XLSX.read(r.result, { type: "array" });
          if (wb.SheetNames.length === 1) {
            loadSheet(wb, wb.SheetNames[0]);
          } else {
            setWorkbook(wb); // 여러 시트 → 선택 UI 표시
          }
        } catch {
          setError("엑셀 파일을 읽지 못했습니다. 파일이 손상되지 않았는지 확인해 주세요.");
        }
      };
      r.readAsArrayBuffer(f);
    } else {
      setError("PDF는 이 프로토타입에서 직접 읽지 못합니다. 내용을 복사해 아래에 붙여넣어 주세요. (2차 구현에서 지원)");
    }
  };

  const extract = async () => {
    if (!raw.trim()) return;
    setPhase("loading"); setError("");
    try {
      const res = await fetch("/api/extract", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw }),
      });

      let data;
      try { data = await res.json(); }
      catch { throw new Error(`서버 응답을 읽지 못했습니다 (HTTP ${res.status})`); }

      if (!res.ok) {
        const msg = data?.error?.message
          || (typeof data?.error === "string" ? data.error : null)
          || `API 오류 (HTTP ${res.status}) — 응답 원문: ${JSON.stringify(data).slice(0, 500)}`;
        throw new Error(msg);
      }

      const textBlocks = (data.content || []).filter(b => b.type === "text").map(b => b.text);
      if (textBlocks.length === 0) {
        throw new Error("API 응답에 텍스트 내용이 없습니다. 응답: " + JSON.stringify(data).slice(0, 300));
      }
      const text = textBlocks.join("\n");

      let parsed;
      try {
        parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      } catch (e) {
        throw new Error("AI 응답을 JSON으로 해석하지 못했습니다: " + e.message + "\n\n응답 원문 일부: " + text.slice(0, 300));
      }

      setResult(normalize(parsed));
      setPhase("review");
    } catch (e) {
      setError(e.message || String(e));
      setPhase("input");
    }
  };

  const isDuplicate = (title, organization) => experiences.some(e =>
    e.title.trim().toLowerCase() === (title || "").trim().toLowerCase() &&
    (e.organization || "").trim().toLowerCase() === (organization || "").trim().toLowerCase()
  );

  const normalize = (r) => ({
    experiences: (r.experiences || []).map((e, i) => {
      const dup = isDuplicate(e.title, e.organization);
      return { ...e, _id: "ix" + i, _include: !dup, _duplicate: dup };
    }),
    skills: (r.skills || []).map((s, i) => ({ ...s, _id: "is" + i, _include: true })),
    certs: (r.certs || []).map((c, i) => ({ ...c, _id: "ic" + i, _include: true })),
    profile: r.profile || {},
    _profileInclude: !!(r.profile && (r.profile.name || r.profile.email)),
  });

  const patchProfile = (k, v) => setResult(p => ({ ...p, profile: { ...p.profile, [k]: v } }));

  const patchExp = (id, k, v) => setResult(p => ({ ...p, experiences: p.experiences.map(e => e._id === id ? { ...e, [k]: v } : e) }));
  const patchMetric = (eid, mi, k, v) => setResult(p => ({ ...p, experiences: p.experiences.map(e => e._id === eid ? { ...e, metrics: e.metrics.map((m, i) => i === mi ? { ...m, [k]: v } : m) } : e) }));
  const toggle = (list, id) => setResult(p => ({ ...p, [list]: p[list].map(x => x._id === id ? { ...x, _include: !x._include } : x) }));

  const commit = () => {
    const now = "2026-07-21";
    const newExps = result.experiences.filter(e => e._include).map(e => ({
      id: "e_" + Date.now() + Math.random().toString(36).slice(2, 6),
      title: e.title, organization: e.organization, role: e.role, experienceType: e.experienceType || "other",
      startDate: e.startDate, endDate: e.endDate, rawNote: e.rawNote,
      context: "", assignedTask: "", discoveredProblem: "", goal: "", personalContribution: "",
      contributionLevel: "", contributionEvidence: "", coreMessage: "", oneLineSummary: "",
      status: "draft", depthDone: false, usageCount: 0, updatedAt: now, primaryCategory: "",
      competencies: e.competencies || [], tags: ["가져옴"], actions: [],
      importedMetrics: e.metrics, // 분석 성과 단계에서 확인 후 정식 Metric으로 승격
      completion: Object.fromEntries([...CORE_STEPS, ...DEPTH_STEPS].map(s => [s, "미입력"])),
    }));
    setExperiences(p => [...p, ...newExps]);
    setSkills(p => {
      const names = p.map(x => x.name.toLowerCase());
      const add = result.skills.filter(s => s._include && !names.includes(s.name.toLowerCase()))
        .map(s => ({ id: "s_" + Date.now() + Math.random().toString(36).slice(2, 4), name: s.name, category: s.category || "tool", summary: "가져온 항목 — 활용 범위 확인 필요", scopeItems: (s.scopeItems || []).map((it, i) => ({ id: "sc_i" + i + Date.now(), ...it })) }));
      return [...p, ...add];
    });
    setCerts(p => {
      const names = p.map(x => x.name);
      return [...p, ...result.certs.filter(c => c._include && !names.includes(c.name)).map(c => ({ id: "c_" + Date.now() + Math.random().toString(36).slice(2, 4), name: c.name, issuer: c.issuer, date: c.date, note: c.note }))];
    });
    if (result.profile && result._profileInclude) {
      setResumeProfile(p => ({ ...p, ...Object.fromEntries(Object.entries(result.profile).filter(([, v]) => v)), _imported: true }));
    }
    setPhase("done");
  };

  if (phase === "input" || phase === "loading") return (
    <div style={{ maxWidth: 680 }}>
      <H2>파일 가져오기</H2>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 16, lineHeight: 1.65 }}>
        기존 이력서·경험 정리 파일이 정형화되어 있지 않아도 괜찮습니다.<br />
        AI가 내용을 추출해 초안을 만들면, <b>모든 항목을 직접 확인·수정한 뒤</b> 반영합니다. 확인 전에는 아무것도 저장되지 않습니다.
      </div>
      <Card>
        <Label>파일 선택 (.txt / .md / .docx / .xlsx / .xls / .csv) 또는 내용 붙여넣기</Label>
        <input type="file" accept=".txt,.md,.docx,.xlsx,.xls,.csv" onChange={onFile} style={{ fontFamily: font, fontSize: 13, marginBottom: 10 }} />
        {fileName && <div style={{ fontSize: 12.5, color: C.blue, marginBottom: 8 }}>선택됨: {fileName}</div>}

        {workbook && (
          <div style={{ marginBottom: 10, padding: "12px 14px", background: C.accent, border: `1px solid ${C.line}`, borderRadius: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>시트가 여러 개 있습니다 — 가져올 시트를 선택하세요</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {workbook.SheetNames.map(name => (
                <Btn key={name} small onClick={() => loadSheet(workbook, name)}>{name}</Btn>
              ))}
            </div>
          </div>
        )}

        <Textarea rows={11} placeholder="이력서·경험 메모 내용을 붙여넣으세요. 형식은 자유입니다." value={raw} onChange={e => setRaw(e.target.value)} />
        {raw.length > 12000 && (
          <div style={{ marginTop: 8, fontSize: 12, color: C.sub }}>
            원문이 {raw.length.toLocaleString()}자로 깁니다. 너무 길면 API 오류가 날 수 있으니, 관련 없는 시트·행은 미리 지우고 필요한 부분만 남기는 걸 권장합니다.
          </div>
        )}
        {error && (
          <div style={{ marginTop: 10, padding: "10px 12px", background: C.accent, border: `1px solid ${C.line}`, borderRadius: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.red, marginBottom: 4 }}>오류</div>
            <div style={{ fontSize: 12.5, color: C.red, whiteSpace: "pre-wrap", fontFamily: "monospace", lineHeight: 1.5 }}>{error}</div>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <Btn primary disabled={!raw.trim() || phase === "loading"} onClick={extract}>
            {phase === "loading" ? "AI 추출 중…" : "AI로 추출하기 →"}
          </Btn>
        </div>
      </Card>
      <div style={{ fontSize: 12, color: C.faint, marginTop: 12, lineHeight: 1.6 }}>
        AI 추출 규칙: 원문에 없는 내용은 만들지 않으며, 모든 수치는 근거 자료가 확인될 때까지 "추가 확인 필요" 상태로 들어옵니다.
      </div>
    </div>
  );

  if (phase === "review") return (
    <div style={{ maxWidth: 780 }}>
      <H2>추출 결과 검토 — 반영 전 확인·수정</H2>
      <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: C.accent, border: `1px solid ${C.line}`, borderRadius: 14, marginBottom: 16, alignItems: "center" }}>
        <Badge label="AI 추출" color={C.ai} bg="#fff" />
        <span style={{ fontSize: 13, color: C.text }}>모든 필드를 수정할 수 있습니다. 체크 해제한 항목은 반영되지 않습니다.</span>
      </div>

      {(result.profile.name || result.profile.email) && (
        <>
          <Label>기본 정보 → 기본 이력서</Label>
          <Card style={{ marginBottom: 16 }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={result._profileInclude} onChange={() => setResult(p => ({ ...p, _profileInclude: !p._profileInclude }))} />
              기본 이력서에 반영
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, opacity: result._profileInclude ? 1 : 0.45 }}>
              <div><Label>이름</Label><Input value={result.profile.name || ""} onChange={e => patchProfile("name", e.target.value)} /></div>
              <div><Label>이메일</Label><Input value={result.profile.email || ""} onChange={e => patchProfile("email", e.target.value)} /></div>
              {result.profile.targetRole && <div style={{ gridColumn: "1 / -1" }}><Label>목표 직무</Label><Input value={result.profile.targetRole || ""} onChange={e => patchProfile("targetRole", e.target.value)} /></div>}
            </div>
          </Card>
        </>
      )}

      <Label>경험 → 경험 보관함 (초기 메모 상태로 추가)</Label>
      {result.experiences.map(e => (
        <Card key={e._id} style={{ marginBottom: 10, opacity: e._include ? 1 : 0.45 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <input type="checkbox" checked={e._include} onChange={() => toggle("experiences", e._id)} style={{ marginTop: 8 }} />
            <div style={{ flex: 1, display: "grid", gap: 8 }}>
              {e._duplicate && (
                <div style={{ fontSize: 12, color: C.orange, background: C.accent, border: `1px solid ${C.line}`, padding: "6px 10px", borderRadius: 14 }}>
                  이미 보관함에 같은 제목·소속의 경험이 있습니다. 중복일 가능성이 있어 기본적으로 체크가 해제되어 있습니다.
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1.3fr 1.3fr", gap: 8 }}>
                <Input value={e.title} onChange={ev => patchExp(e._id, "title", ev.target.value)} />
                <Input value={e.organization || ""} placeholder="소속" onChange={ev => patchExp(e._id, "organization", ev.target.value)} />
                <Input value={e.role || ""} placeholder="역할" onChange={ev => patchExp(e._id, "role", ev.target.value)} />
              </div>
              <Textarea style={{ minHeight: 54 }} value={e.rawNote || ""} onChange={ev => patchExp(e._id, "rawNote", ev.target.value)} />
              {(e.competencies || []).length > 0 && (
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {e.competencies.map((c, i) => <Badge key={i} label={"#" + c} color={C.blue} bg={C.blueBg} />)}
                </div>
              )}
              {(e.metrics || []).map((m, mi) => (
                <div key={mi} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", background: C.accent, border: `1px solid ${C.line}`, padding: "8px 10px", borderRadius: 14 }}>
                  <Badge label="추가 확인 필요" color={C.red} bg={C.redBg} />
                  <Input value={m.metricName} onChange={ev => patchMetric(e._id, mi, "metricName", ev.target.value)} style={{ width: 120 }} />
                  {m.beforeValue != null ? (
                    <>
                      <Input value={m.beforeValue} onChange={ev => patchMetric(e._id, mi, "beforeValue", ev.target.value)} style={{ width: 70, textAlign: "right" }} />
                      <span style={{ color: C.faint }}>→</span>
                      <Input value={m.afterValue} onChange={ev => patchMetric(e._id, mi, "afterValue", ev.target.value)} style={{ width: 70 }} />
                    </>
                  ) : (
                    <Input value={m.changeValue} onChange={ev => patchMetric(e._id, mi, "changeValue", ev.target.value)} style={{ width: 70 }} />
                  )}
                  <Input value={m.unit || ""} onChange={ev => patchMetric(e._id, mi, "unit", ev.target.value)} style={{ width: 50 }} />
                  <span style={{ fontSize: 11.5, color: C.sub, flex: "1 1 100%" }}>{m.note}</span>
                </div>
              ))}
              <div style={{ fontSize: 11.5, color: C.faint }}>수치는 경험 분석의 성과 단계에서 근거를 확인해야 정식 수치(단일 원본)로 승격됩니다. 역량 태그는 AI 추정이니 경험 상세에서 다시 확인하세요.</div>
            </div>
          </div>
        </Card>
      ))}

      <Label>스킬 → 역량·스킬</Label>
      <Card style={{ marginBottom: 10 }}>
        {result.skills.map(s => (
          <div key={s._id} style={{ padding: "9px 0", borderBottom: `1px solid ${C.lineSoft}`, opacity: s._include ? 1 : 0.45 }}>
            <label style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer", marginBottom: 6 }}>
              <input type="checkbox" checked={s._include} onChange={() => toggle("skills", s._id)} />
              <span style={{ fontWeight: 600, fontSize: 13.5 }}>{s.name}</span>
            </label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingLeft: 26 }}>
              {(s.scopeItems || []).map((it, i) => <Badge key={i} label={it.text} color={C.sub} bg={C.lineSoft} />)}
              <Badge label="활용 범위 확인 필요" color={C.orange} bg={C.orangeBg} />
            </div>
          </div>
        ))}
      </Card>

      <Label>자격증 → 역량·스킬 / 기본 이력서</Label>
      <Card style={{ marginBottom: 16 }}>
        {result.certs.map(c => (
          <label key={c._id} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", padding: "7px 0", borderBottom: `1px solid ${C.lineSoft}`, fontSize: 13.5, cursor: "pointer", opacity: c._include ? 1 : 0.45 }}>
            <input type="checkbox" checked={c._include} onChange={() => toggle("certs", c._id)} />
            <span style={{ fontWeight: 600, flexShrink: 0 }}>{c.name}</span>
            <span style={{ color: C.sub, fontSize: 12.5 }}>{c.date || "취득일 미상"}</span>
            {c.note && <span style={{ color: C.orange, fontSize: 12 }}>{c.note}</span>}
          </label>
        ))}
      </Card>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Btn onClick={() => setPhase("input")}>← 다시 추출</Btn>
        <Btn primary onClick={commit}>확인한 항목 반영하기</Btn>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 640 }}>
      <H2>반영 완료</H2>
      <Card>
        <div style={{ fontSize: 14, lineHeight: 1.7 }}>
          선택한 항목이 <b>초기 메모</b> 상태로 추가되었습니다.<br />
          경험 보관함에서 각 경험의 <b>단계별 분석</b>을 진행하면, 가져온 수치도 근거 확인 후 정식 수치로 승격됩니다.
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <Btn primary onClick={() => { const last = experiences[experiences.length - 1]; last && onDone(last.id); }}>경험 보관함 보기 →</Btn>
          <Btn onClick={() => { setPhase("input"); setRaw(""); setResult(null); setFileName(""); }}>다른 파일 가져오기</Btn>
        </div>
      </Card>
    </div>
  );
}

/* ============================================================ 역량·스킬 */
function Skills({ skills, setSkills, certs, setCerts, experiences, onOpenExp, addTrash }) {
  const [tab, setTab] = useState("도구");
  const [newSkill, setNewSkill] = useState("");
  const [addingScope, setAddingScope] = useState(null); // skillId
  const [scopeDraft, setScopeDraft] = useState({ text: "", evidenceExpId: "" });
  const [certDraft, setCertDraft] = useState({ name: "", issuer: "", date: "", note: "" });

  const byCat = (cat) => skills.filter(s => s.category === cat);
  const catOf = { "도구": "tool", "직무 역량": "skill" };

  const addSkill = (cat) => {
    if (!newSkill.trim()) return;
    setSkills(p => [...p, { id: "s_" + Date.now(), name: newSkill.trim(), category: cat, summary: "", scopeItems: [] }]);
    setNewSkill("");
  };
  const addScope = (skillId) => {
    if (!scopeDraft.text.trim()) return;
    setSkills(p => p.map(s => s.id === skillId ? { ...s, scopeItems: [...s.scopeItems, { id: "sc_" + Date.now(), text: scopeDraft.text.trim(), evidenceExpId: scopeDraft.evidenceExpId || null }] } : s));
    setScopeDraft({ text: "", evidenceExpId: "" }); setAddingScope(null);
  };
  const removeScope = (skillId, scId) =>
    setSkills(p => p.map(s => s.id === skillId ? { ...s, scopeItems: s.scopeItems.filter(x => x.id !== scId) } : s));
  const patchSkill = (skillId, k, v) => setSkills(p => p.map(s => s.id === skillId ? { ...s, [k]: v } : s));
  const removeSkill = (skillId) => {
    const skill = skills.find(s => s.id === skillId);
    setSkills(p => p.filter(s => s.id !== skillId));
    addTrash("skill", skill.name, () => setSkills(p => [...p, skill]));
  };
  const addCert = () => {
    if (!certDraft.name.trim()) return;
    setCerts(p => [...p, { id: "c_" + Date.now(), ...certDraft }]);
    setCertDraft({ name: "", issuer: "", date: "", note: "" });
  };
  const patchCert = (certId, k, v) => setCerts(p => p.map(c => c.id === certId ? { ...c, [k]: v } : c));
  const removeCert = (certId) => {
    const cert = certs.find(c => c.id === certId);
    setCerts(p => p.filter(c => c.id !== certId));
    addTrash("cert", cert.name, () => setCerts(p => [...p, cert]));
  };

  const SkillCard = ({ s }) => {
    const linked = s.scopeItems.filter(i => i.evidenceExpId).length;
    return (
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4, gap: 10 }}>
          <Input value={s.name} onChange={e => patchSkill(s.id, "name", e.target.value)}
            style={{ fontWeight: 700, fontSize: 15, border: "none", padding: "2px 0", flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <span style={{ fontSize: 11.5, color: C.faint, whiteSpace: "nowrap" }}>근거 연결 {linked}/{s.scopeItems.length}</span>
            <span onClick={() => removeSkill(s.id)} title="이 항목 삭제" style={{ cursor: "pointer", color: C.faint, fontSize: 13 }}>✕</span>
          </div>
        </div>
        <Input value={s.summary || ""} placeholder="한 줄 요약 (선택)" onChange={e => patchSkill(s.id, "summary", e.target.value)}
          style={{ fontSize: 12.5, color: C.sub, border: "none", padding: "2px 0", marginBottom: 10 }} />

        <Label>활용 범위 — 할 수 있는 작업을 구체적으로</Label>
        {s.scopeItems.map(item => {
          const exp = experiences.find(e => e.id === item.evidenceExpId);
          return (
            <div key={item.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${C.lineSoft}`, fontSize: 13.5 }}>
              <span style={{ flex: 1, lineHeight: 1.5 }}>{item.text}</span>
              {exp ? (
                <span onClick={() => onOpenExp(exp.id)} style={{ fontSize: 11.5, color: C.blue, background: "transparent", border: `1px solid ${C.blue}55`, padding: "1px 7px", borderRadius: 14, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
                  {exp.title} →
                </span>
              ) : (
                <Badge label="경험 근거 없음" color={C.orange} bg={C.orangeBg} />
              )}
              <span onClick={() => removeScope(s.id, item.id)} style={{ cursor: "pointer", color: C.faint, fontSize: 12 }}>✕</span>
            </div>
          );
        })}

        {addingScope === s.id ? (
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <Input autoFocus placeholder="예: 피벗 테이블 기반 판매 데이터 집계" value={scopeDraft.text}
              onChange={e => setScopeDraft(d => ({ ...d, text: e.target.value }))} onKeyDown={e => e.key === "Enter" && addScope(s.id)} style={{ flex: 1 }} />
            <select value={scopeDraft.evidenceExpId} onChange={e => setScopeDraft(d => ({ ...d, evidenceExpId: e.target.value }))}
              style={{ fontFamily: font, fontSize: 12.5, padding: "8px 10px", borderRadius: 14, border: `1px solid ${C.line}`, background: C.panel, maxWidth: 200 }}>
              <option value="">근거 경험 (선택)</option>
              {experiences.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
            <Btn small primary onClick={() => addScope(s.id)}>추가</Btn>
            <Btn small onClick={() => setAddingScope(null)}>취소</Btn>
          </div>
        ) : (
          <div style={{ marginTop: 10 }}><Btn small onClick={() => { setAddingScope(s.id); setScopeDraft({ text: "", evidenceExpId: "" }); }}>+ 활용 범위 추가</Btn></div>
        )}
      </Card>
    );
  };

  return (
    <div style={{ maxWidth: 760 }}>
      <H2>역량·스킬</H2>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 6, lineHeight: 1.6 }}>
        "상·중·하" 자기 평가 대신 <b>실제로 할 수 있는 작업</b>을 적고, 경험 근거를 연결합니다.
      </div>
      <div style={{ fontSize: 12, color: C.faint, marginBottom: 16 }}>
        근거가 연결된 항목만 이력서·자소서에서 자신 있게 쓸 수 있습니다. 근거 없는 항목은 면접 검증 리스크가 있습니다.
      </div>

      <div style={{ display: "flex", gap: 2, borderBottom: `1px solid ${C.line}`, marginBottom: 18 }}>
        {["도구", "직무 역량", "자격증·어학"].map(t => (
          <div key={t} onClick={() => setTab(t)} style={{ padding: "9px 14px", fontSize: 13.5, fontWeight: tab === t ? 700 : 500, cursor: "pointer",
            color: tab === t ? C.text : C.sub, borderBottom: tab === t ? `2px solid ${C.text}` : "2px solid transparent", marginBottom: -1 }}>{t}</div>
        ))}
      </div>

      {(tab === "도구" || tab === "직무 역량") && (
        <>
          {byCat(catOf[tab]).map(s => <SkillCard key={s.id} s={s} />)}
          <div style={{ display: "flex", gap: 8 }}>
            <Input placeholder={tab === "도구" ? "도구 이름 (예: Google Analytics)" : "역량 이름 (예: 상품 기획)"} value={newSkill}
              onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === "Enter" && addSkill(catOf[tab])} style={{ maxWidth: 320 }} />
            <Btn onClick={() => addSkill(catOf[tab])}>+ 추가</Btn>
          </div>
        </>
      )}

      {tab === "자격증·어학" && (
        <Card>
          <Label>자격증 · 어학</Label>
          {certs.map(c => (
            <div key={c.id} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 110px 1fr 20px", gap: 10, alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.lineSoft}`, fontSize: 13.5 }}>
              <Input value={c.name} onChange={e => patchCert(c.id, "name", e.target.value)} style={{ fontWeight: 600, border: "none", padding: "2px 0" }} />
              <Input value={c.issuer || ""} placeholder="발급 기관" onChange={e => patchCert(c.id, "issuer", e.target.value)} style={{ color: C.sub, fontSize: 12.5, border: "none", padding: "2px 0" }} />
              <Input value={c.date || ""} placeholder="취득일" onChange={e => patchCert(c.id, "date", e.target.value)} style={{ color: C.sub, fontSize: 12.5, border: "none", padding: "2px 0" }} />
              <Input value={c.note || ""} placeholder="비고" onChange={e => patchCert(c.id, "note", e.target.value)} style={{ color: C.faint, fontSize: 12, border: "none", padding: "2px 0" }} />
              <span onClick={() => removeCert(c.id)} title="삭제" style={{ cursor: "pointer", color: C.faint, fontSize: 12 }}>✕</span>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Input placeholder="자격증명" value={certDraft.name} onChange={e => setCertDraft(d => ({ ...d, name: e.target.value }))} style={{ flex: 1.3 }} />
            <Input placeholder="발급 기관" value={certDraft.issuer} onChange={e => setCertDraft(d => ({ ...d, issuer: e.target.value }))} style={{ flex: 1 }} />
            <Input placeholder="취득일 (YYYY-MM)" value={certDraft.date} onChange={e => setCertDraft(d => ({ ...d, date: e.target.value }))} style={{ width: 130 }} />
            <Btn small onClick={addCert}>추가</Btn>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ============================================================ 지원 관리 */
function Applications({ applications, setApplications, onOpen, addTrash }) {
  const addApp = () => {
    const id = "ap_" + Date.now();
    setApplications(prev => [...prev, { id, company: "새 지원처", position: "", deadline: "", status: "interested", priority: "medium",
      essayProgress: 0, interviewProgress: 0, requirements: [], essays: [], interviews: [] }]);
    onOpen(id);
  };
  const deleteApp = (id) => {
    const app = applications.find(a => a.id === id);
    setApplications(prev => prev.filter(a => a.id !== id));
    addTrash("application", `${app.company} ${app.position}`.trim(), () => setApplications(prev => [...prev, app]));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <H2>지원 관리</H2>
        <Btn primary onClick={addApp}>+ 지원 등록</Btn>
      </div>
      {applications.map(a => (
        <Card key={a.id} onClick={() => onOpen(a.id)} style={{ marginBottom: 10, display: "grid", gridTemplateColumns: "1.5fr 1fr 100px 130px 130px 20px", alignItems: "center", gap: 10 }}>
          <div><span style={{ fontWeight: 700, fontSize: 14.5 }}>{a.company}</span><span style={{ color: C.sub, fontSize: 13, marginLeft: 8 }}>{a.position}</span></div>
          <div style={{ fontSize: 13, color: C.sub }}>마감 {a.deadline || "미정"}</div>
          <Badge label={{ interested: "관심", analyzing: "분석 중", writing: "작성 중", submitted: "제출", interview: "면접", result: "결과" }[a.status]} color={C.blue} bg={C.blueBg} />
          <div style={{ fontSize: 12.5, color: C.sub }}>자소서 {a.essayProgress}%</div>
          <div style={{ fontSize: 12.5, color: C.sub }}>면접 준비 {a.interviewProgress}%</div>
          <span onClick={ev => { ev.stopPropagation(); deleteApp(a.id); }}
            title="삭제 (휴지통에서 복구 가능)" style={{ cursor: "pointer", color: C.faint, fontSize: 13 }}>✕</span>
        </Card>
      ))}
      {applications.length === 0 && <div style={{ fontSize: 13, color: C.faint }}>등록된 지원처가 없습니다. "+ 지원 등록"으로 추가하세요.</div>}
    </div>
  );
}

/* ============================================================ 자소서 작성 챗봇 */
const ESSAY_COACH_SYSTEM_PROMPT = `지금부터 당신은 국내 대기업·외국계·스타트업 채용을 모두 경험한 시니어 채용담당자이자, 수천 건 이상의 합격 자기소개서를 첨삭한 커리어 컨설턴트입니다.
내가 아래와 같은 정보를 순서와 형식에 관계없이 제공할 것입니다.
   * 내 경력 및 경험
   * 이력서(Resume/CV)
   * 지원하려는 회사와 직무(Job Description)
   * 자기소개서 문항(있는 경우)
   * 추가로 강조하고 싶은 내용이나 피하고 싶은 표현
당신의 역할은 단순히 글을 작성하는 것이 아니라, 지원자의 경험을 채용담당자의 시각에서 가장 설득력 있게 재구성하는 것입니다.

반드시 수행해야 하는 작업
먼저 내가 제공한 정보를 분석하여 다음을 수행하십시오.
   1. 지원 직무에서 가장 중요하게 평가할 역량을 추론합니다.
   2. 내 이력서와 경험 중 어떤 사례가 가장 설득력이 높은지 선별합니다.
   3. 부족한 정보가 있다면 자소서를 쓰기 전에 반드시 질문합니다.
   4. 경험이 여러 개라면 가장 경쟁력 있는 스토리를 우선 추천하고, 그 이유도 간단히 설명합니다.
충분한 정보가 확보되면 자기소개서 작성을 시작하십시오.

작성 원칙
   * 절대 경험을 과장하거나 허위 사실을 만들어내지 마십시오.
   * 아래 제공되는 "사실 정보"에 없는 내용은 지어내지 마십시오. 사실 정보에 없는 수치나 성과는 절대 임의로 만들지 마십시오.
   * 추상적인 표현보다 실제 행동과 과정(Action)을 중심으로 작성하십시오.
   * "책임감이 강합니다", "열심히 했습니다"와 같은 진부한 표현은 사용하지 마십시오.
   * 내가 실제 수행한 업무, 사용한 도구, 의사결정 과정, 문제 해결 방식이 드러나도록 작성하십시오.
   * STAR, CAR 등의 구조를 참고하되 자연스럽게 녹여내십시오.
   * 결과보다 왜 그런 판단을 했는지, 어떻게 해결했는지가 드러나는 글을 작성하십시오.
   * 채용담당자가 읽기 쉬운 두괄식 구조를 유지하십시오.
   * 문항별 글자 수 제한이 있다면 90~95% 수준까지 작성하고, 제한이 없다면 공백 포함 약 700자 내외를 기본으로 합니다.
   * 전문적이고 담백한 경어체를 유지하십시오.

작성 방식
한 번에 모든 문항을 작성하지 마십시오.
반드시 다음 순서를 따르십시오.
   1. 먼저 어떤 경험을 사용할 것인지 추천합니다.
   2. 그 경험을 사용하는 이유를 설명합니다.
   3. 1번 문항만 작성합니다.
   4. 이후 사용자의 피드백을 기다립니다.
   5. 수정 요청이 있으면 즉시 반영합니다.
   6. 사용자가 "다음 문항"이라고 말하면 다음 문항을 작성합니다.

문항 작성 형식
각 문항은 다음 형식을 따르십시오.
   * 핵심 메시지를 담은 소제목 1개
   * 두괄식 첫 문장
   * 행동(Action) 중심의 본문
   * 결과와 직무 적합성으로 마무리

피드백 원칙
초안을 작성한 뒤에는 다음을 함께 제공하십시오.
   * 채용담당자 관점에서 가장 강한 부분
   * 더 보완하면 좋은 부분
   * 더 설득력 있게 만들기 위해 필요한 추가 정보(있다면)

작성이 끝나면 다음 안내만 덧붙이십시오.
"초안을 검토해 보시고 수정하고 싶은 부분(분량, 강조점, 표현 등)을 말씀해 주세요. 마음에 드신다면 '다음 문항'이라고 입력해 주세요."`;

function buildEssayContext(app, essay, experiences) {
  const factLines = experiences.filter(e => e.status !== "draft").map(e => {
    const parts = [`- [${e.title}] ${e.organization || ""} · ${e.role || ""} (${e.startDate}~${e.endDate})`];
    if (e.context) parts.push(`  배경: ${e.context}`);
    if (e.discoveredProblem) parts.push(`  문제: ${e.discoveredProblem}`);
    if (e.personalContribution) parts.push(`  본인 행동/기여: ${e.personalContribution}`);
    if (e.oneLineSummary) parts.push(`  성과 요약: ${e.oneLineSummary} (주의: 정확한 수치는 사용자가 직접 확인한 것만 활용. 확실하지 않으면 "정확한 수치는 확인이 필요합니다"라고 언급할 것)`);
    if (e.competencies?.length) parts.push(`  관련 역량: ${e.competencies.join(", ")}`);
    return parts.join("\n");
  }).join("\n\n");

  const reqLines = (app.requirements || []).map(r => `- ${r.requirement} (중요도 ${r.importance}/5)${r.matchReason ? ` — ${r.matchReason}` : ""}`).join("\n");

  return `[지원 정보]
회사: ${app.company}
직무: ${app.position}

[이 회사가 요구하는 역량 (공고 분석 결과)]
${reqLines || "등록된 요구 역량 없음"}

[자기소개서 문항]
"${essay.question || "(문항 미입력 — 사용자에게 문항을 먼저 물어볼 것)"}"
글자 수 제한: ${essay.characterLimit}자

[지원자의 사실 기반 경험 데이터베이스 — 여기 없는 내용은 지어내지 말 것]
${factLines || "아직 분석 완료된 경험이 없습니다. 먼저 경험 분석을 진행하도록 안내하십시오."}`;
}

function EssayChat({ essay, app, experiences, onClose, onSaveDraft, history, onHistoryChange }) {
  const [messages, setMessages] = useState(history || []); // {role, content}
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const started = useRef(false);

  const updateMessages = (updater) => {
    setMessages(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      onHistoryChange && onHistoryChange(next);
      return next;
    });
  };

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      if ((history || []).length === 0) {
        send("안녕하세요, 이 문항에 사용할 경험을 추천해 주시고 초안을 작성해 주세요.", true);
      }
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async (text, isAutoStart = false) => {
    if (!text.trim() && !isAutoStart) return;
    const nextMessages = [...messages, { role: "user", content: text }];
    updateMessages(nextMessages);
    setInput(""); setLoading(true); setError("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: buildEssayContext(app, essay, experiences),
          messages: nextMessages,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message
          || (typeof data?.error === "string" ? data.error : null)
          || `API 오류 (HTTP ${res.status}) — 응답 원문: ${JSON.stringify(data).slice(0, 500)}`);
      }
      const reply = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
      if (!reply) throw new Error("응답에 텍스트가 없습니다.");
      updateMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(e.message || String(e));
      updateMessages(prev => prev.slice(0, isAutoStart ? 0 : -1));
    } finally {
      setLoading(false);
    }
  };

  const lastAssistant = [...messages].reverse().find(m => m.role === "assistant");

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${C.line}` }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>자소서 작성 도우미</div>
          <div style={{ fontSize: 11.5, color: C.faint }}>{essay.question || "문항 미입력"}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {messages.length > 0 && <Btn small onClick={() => { updateMessages([]); started.current = false; }}>대화 초기화</Btn>}
          {lastAssistant && <Btn small onClick={() => onSaveDraft(lastAssistant.content)}>이 답변을 초안으로 저장</Btn>}
          <Btn small onClick={onClose}>← 목록으로</Btn>
        </div>
      </div>

      <div style={{ height: 420, overflowY: "auto", padding: "16px", background: C.bg }}>
        {messages.filter(m => m.role !== "system").map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
            <div style={{
              maxWidth: "80%", padding: "10px 13px", borderRadius: 14, fontSize: 13.5, lineHeight: 1.6, whiteSpace: "pre-wrap",
              background: m.role === "user" ? C.text : C.panel, color: m.role === "user" ? "#fff" : C.text,
              border: m.role === "user" ? "none" : `1px solid ${C.line}` }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div style={{ fontSize: 12.5, color: C.faint }}>답변을 작성하는 중…</div>}
        {error && (
          <div style={{ padding: "10px 12px", background: C.accent, border: `1px solid ${C.line}`, borderRadius: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.red, marginBottom: 4 }}>오류</div>
            <div style={{ fontSize: 12.5, color: C.red, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>{error}</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: 8, padding: 12, borderTop: `1px solid ${C.line}` }}>
        <Textarea rows={2} placeholder="피드백을 입력하거나 '다음 문항'이라고 입력하세요" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          style={{ flex: 1, minHeight: 44 }} />
        <Btn primary disabled={loading || !input.trim()} onClick={() => send(input)}>전송</Btn>
      </div>
    </Card>
  );
}

function ApplicationDetail({ app, setApplications, experiences, outputs, metrics, onBack, onOpenExp, addTrash, interviewCategories, addInterviewCategory }) {
  const [tab, setTab] = useState("공고 분석");
  const [chatEssayId, setChatEssayId] = useState(null);
  const patch = (k, v) => setApplications(prev => prev.map(a => a.id === app.id ? { ...a, [k]: v } : a));
  const deleteApp = () => {
    setApplications(prev => prev.filter(a => a.id !== app.id));
    addTrash("application", `${app.company} ${app.position}`.trim(), () => setApplications(prev => [...prev, app]));
    onBack();
  };

  return (
    <div style={{ maxWidth: 880 }}>
      <div onClick={onBack} style={{ fontSize: 13, color: C.sub, cursor: "pointer", marginBottom: 10 }}>← 지원 관리</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 4 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
          <Input value={app.company} onChange={e => patch("company", e.target.value)} style={{ fontSize: 20, fontWeight: 800, border: "none", padding: "2px 0", width: 220 }} />
          <Input value={app.position} placeholder="직무" onChange={e => patch("position", e.target.value)} style={{ fontSize: 15, color: C.sub, border: "none", padding: "2px 0", width: 160 }} />
        </div>
        <span onClick={deleteApp} title="이 지원 삭제 (휴지통에서 복구 가능)" style={{ cursor: "pointer", color: C.faint, fontSize: 14, padding: "4px" }}>✕</span>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, fontSize: 13, color: C.sub }}>
        마감 <Input value={app.deadline || ""} placeholder="YYYY-MM-DD" onChange={e => patch("deadline", e.target.value)} style={{ width: 120, border: "none", padding: "2px 0", color: C.sub }} />
        <span>·</span>
        우선순위
        <select value={app.priority} onChange={e => patch("priority", e.target.value)}
          style={{ fontFamily: font, fontSize: 13, border: "none", background: "transparent", color: C.sub, cursor: "pointer" }}>
          <option value="high">높음</option>
          <option value="medium">보통</option>
          <option value="low">낮음</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: 2, borderBottom: `1px solid ${C.line}`, marginBottom: 18 }}>
        {["공고 분석", "자소서", "면접"].map(t => (
          <div key={t} onClick={() => setTab(t)} style={{ padding: "9px 14px", fontSize: 13.5, fontWeight: tab === t ? 700 : 500, cursor: "pointer",
            color: tab === t ? C.text : C.sub, borderBottom: tab === t ? `2px solid ${C.text}` : "2px solid transparent", marginBottom: -1 }}>{t}</div>
        ))}
      </div>

      {tab === "공고 분석" && (
        <Card>
          <Label>요구 역량 ↔ 경험 매칭 (추천 이유와 부족한 점 필수)</Label>
          {app.requirements.map(r => {
            const exp = experiences.find(e => e.id === r.matchedExp);
            const patchReq = (k, v) => setApplications(prev => prev.map(a => a.id === app.id
              ? { ...a, requirements: a.requirements.map(x => x.id === r.id ? { ...x, [k]: v } : x) } : a));
            const removeReq = () => {
              setApplications(prev => prev.map(a => a.id === app.id
                ? { ...a, requirements: a.requirements.filter(x => x.id !== r.id) } : a));
              addTrash("requirement", r.requirement || "요구 역량 항목", () => setApplications(prev => prev.map(a => a.id === app.id
                ? { ...a, requirements: [...a.requirements, r] } : a)));
            };
            return (
              <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1.3fr 1.2fr 1.5fr 20px", gap: 12, padding: "11px 0", borderBottom: `1px solid ${C.lineSoft}`, fontSize: 13.5, alignItems: "center" }}>
                <div>
                  <Input value={r.requirement} onChange={e => patchReq("requirement", e.target.value)} style={{ fontWeight: 600, border: "none", padding: "2px 0" }} />
                  <div style={{ fontSize: 11.5, color: C.faint }}>중요도 {"●".repeat(r.importance)}{"○".repeat(5 - r.importance)}</div>
                </div>
                <select value={r.matchedExp || ""} onChange={e => patchReq("matchedExp", e.target.value || null)}
                  style={{ fontFamily: font, fontSize: 13, padding: "6px 8px", borderRadius: 14, border: `1px solid ${C.line}`, background: C.panel, color: exp ? C.blue : C.text }}>
                  <option value="">매칭 없음</option>
                  {experiences.map(e2 => <option key={e2.id} value={e2.id}>{e2.title}</option>)}
                </select>
                <Input value={r.matchReason || ""} placeholder="매칭 이유 / 부족한 점" onChange={e => patchReq("matchReason", e.target.value)}
                  style={{ fontSize: 12.5, color: C.sub, border: "none", padding: "2px 0" }} />
                <span onClick={removeReq} title="삭제" style={{ cursor: "pointer", color: C.faint, fontSize: 12 }}>✕</span>
              </div>
            );
          })}
          {app.requirements.length === 0 && <div style={{ fontSize: 13, color: C.faint, marginBottom: 10 }}>채용공고를 입력하면 요구 역량을 추출합니다.</div>}
          <Btn small onClick={() => setApplications(prev => prev.map(a => a.id === app.id
            ? { ...a, requirements: [...a.requirements, { id: "r_" + Date.now(), requirement: "", category: "required_competency", importance: 3, matchedExp: null, matchReason: "", gap: "" }] } : a))}>
            + 요구 역량 추가
          </Btn>
        </Card>
      )}

      {tab === "자소서" && chatEssayId && (
        <EssayChat
          essay={app.essays.find(x => x.id === chatEssayId)}
          app={app}
          experiences={experiences}
          onClose={() => setChatEssayId(null)}
          history={app.essays.find(x => x.id === chatEssayId)?.chatHistory || []}
          onHistoryChange={(h) => setApplications(prev => prev.map(a => a.id === app.id
            ? { ...a, essays: a.essays.map(x => x.id === chatEssayId ? { ...x, chatHistory: h } : x) } : a))}
          onSaveDraft={(text) => setApplications(prev => prev.map(a => a.id === app.id
            ? { ...a, essays: a.essays.map(x => x.id === chatEssayId ? { ...x, draft: text, status: "drafting" } : x) } : a))}
        />
      )}

      {tab === "자소서" && !chatEssayId && (
        <div style={{ display: "grid", gap: 12 }}>
          {app.essays.map(q => {
            const patchQ = (k, v) => setApplications(prev => prev.map(a => a.id === app.id
              ? { ...a, essays: a.essays.map(x => x.id === q.id ? { ...x, [k]: v } : x) } : a));
            const removeQ = () => {
              setApplications(prev => prev.map(a => a.id === app.id
                ? { ...a, essays: a.essays.filter(x => x.id !== q.id) } : a));
              addTrash("essay", q.question || "자소서 문항", () => setApplications(prev => prev.map(a => a.id === app.id
                ? { ...a, essays: [...a.essays, q] } : a)));
            };
            return (
              <Card key={q.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 10 }}>
                  <Input value={q.question} onChange={e => patchQ("question", e.target.value)} style={{ fontWeight: 700, fontSize: 14, border: "none", padding: "2px 0", flex: 1 }} />
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                    {q.isLocked && <Badge label="제출본 잠금" color={C.sub} bg={C.lineSoft} />}
                    <Badge label={{ not_started: "미시작", drafting: "초안 작성", reviewing: "검토", complete: "완료" }[q.status]}
                      color={q.status === "complete" ? C.green : C.blue} bg={q.status === "complete" ? C.greenBg : C.blueBg} />
                    <span onClick={removeQ} title="삭제" style={{ cursor: "pointer", color: C.faint, fontSize: 13 }}>✕</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 12.5, color: C.sub }}>글자 수 제한</span>
                  <Input type="number" value={q.characterLimit} onChange={e => patchQ("characterLimit", Number(e.target.value))} style={{ width: 80, border: "none", padding: "2px 0", fontSize: 12.5, color: C.sub }} />
                  <span style={{ fontSize: 12.5, color: C.sub }}>자</span>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: C.faint }}>선택 경험:</span>
                  {q.selectedExperienceIds.map(id => {
                    const e = experiences.find(x => x.id === id);
                    return e ? <Badge key={id} label={e.title} color={C.blue} bg={C.blueBg} /> : null;
                  })}
                </div>
                {q.draft && (
                  <div style={{ marginTop: 10, padding: "10px 12px", background: C.bg, border: `1px solid ${C.line}`, borderRadius: 14, fontSize: 12.5, color: C.sub, lineHeight: 1.6, maxHeight: 100, overflow: "hidden" }}>
                    {q.draft}
                  </div>
                )}
                {!q.isLocked && <div style={{ marginTop: 12 }}><Btn small onClick={() => setChatEssayId(q.id)}>{q.draft ? "이어서 작성하기 →" : "작성 화면 열기 →"}</Btn></div>}
              </Card>
            );
          })}
          <Btn small onClick={() => setApplications(prev => prev.map(a => a.id === app.id
            ? { ...a, essays: [...a.essays, { id: "q_" + Date.now(), question: "", characterLimit: 1000, status: "not_started", selectedExperienceIds: [], isLocked: false, chatHistory: [] }] } : a))}>
            + 문항 추가
          </Btn>
        </div>
      )}

      {tab === "면접" && (
        <div style={{ display: "grid", gap: 12 }}>
          {app.interviews.map(iq => {
            const exp = experiences.find(e => e.id === iq.selectedExperienceId);
            const patchIq = (k, v) => setApplications(prev => prev.map(a => a.id === app.id
              ? { ...a, interviews: a.interviews.map(x => x.id === iq.id ? { ...x, [k]: v } : x) } : a));
            const removeIq = () => {
              setApplications(prev => prev.map(a => a.id === app.id
                ? { ...a, interviews: a.interviews.filter(x => x.id !== iq.id) } : a));
              addTrash("interview", iq.question || "면접 질문", () => setApplications(prev => prev.map(a => a.id === app.id
                ? { ...a, interviews: [...a.interviews, iq] } : a)));
            };
            return (
              <Card key={iq.id}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, gap: 10 }}>
                  <Input value={iq.question} onChange={e => patchIq("question", e.target.value)} style={{ fontWeight: 700, fontSize: 14, border: "none", padding: "2px 0", flex: 1 }} />
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                    <CategorySelect value={iq.category} options={interviewCategories} placeholder="카테고리 없음" onAddOption={addInterviewCategory} onChange={(v) => patchIq("category", v)} />
                    <span onClick={removeIq} title="삭제" style={{ cursor: "pointer", color: C.faint, fontSize: 13 }}>✕</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: C.sub }}>사용 경험:</span>
                  <select value={iq.selectedExperienceId || ""} onChange={e => patchIq("selectedExperienceId", e.target.value || null)}
                    style={{ fontFamily: font, fontSize: 13, padding: "5px 8px", borderRadius: 14, border: `1px solid ${C.line}`, background: C.panel, color: exp ? C.blue : C.text }}>
                    <option value="">선택 안 함</option>
                    {experiences.map(e2 => <option key={e2.id} value={e2.id}>{e2.title}</option>)}
                  </select>
                  {exp && <span style={{ fontSize: 12.5, color: C.sub }}>연습 {iq.practiceCount}회 · 자신감 {iq.confidence ?? "—"}/5</span>}
                </div>
                {exp ? (
                  <>
                    <Label>예상 꼬리질문</Label>
                    {iq.followUps.map((f, i) => (
                      <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", padding: "3px 0" }}>
                        <span style={{ fontSize: 13, color: C.sub, flex: 1 }}>· {f}</span>
                        <span onClick={() => patchIq("followUps", iq.followUps.filter((_, fi) => fi !== i))} style={{ cursor: "pointer", color: C.faint, fontSize: 11 }}>✕</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                      <Btn small primary>60초 연습 시작</Btn><Btn small>키워드 가리기</Btn>
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: C.orange, background: C.accent, border: `1px solid ${C.line}`, padding: "10px 12px", borderRadius: 14 }}>
                    사용할 경험이 선택되지 않았습니다.
                  </div>
                )}
              </Card>
            );
          })}
          <Btn small onClick={() => setApplications(prev => prev.map(a => a.id === app.id
            ? { ...a, interviews: [...a.interviews, { id: "iq_" + Date.now(), question: "", category: "achievement", selectedExperienceId: null, practiceCount: 0, confidence: null, followUps: [] }] } : a))}>
            + 질문 추가
          </Btn>
        </div>
      )}
    </div>
  );
}

/* ============================================================ 기본 이력서 */
/* ============================================================ 휴지통 */
function Trash({ trash, onRestore, onPurge, onClear }) {
  const typeLabel = { experience: "경험", skill: "스킬", cert: "자격증", application: "지원", requirement: "요구 역량", essay: "자소서 문항", interview: "면접 질문" };
  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <H2>휴지통</H2>
        {trash.length > 0 && <Btn small onClick={onClear}>전체 비우기</Btn>}
      </div>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 16, lineHeight: 1.6 }}>
        삭제한 항목은 영구 삭제하기 전까지 여기서 복구할 수 있습니다.
      </div>
      {trash.length === 0 && (
        <Card><div style={{ fontSize: 13, color: C.faint, textAlign: "center", padding: "12px 0" }}>삭제한 항목이 없습니다.</div></Card>
      )}
      {trash.map(t => (
        <Card key={t.id} style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <Badge label={typeLabel[t.type] || t.type} color={C.sub} bg={C.lineSoft} />
            <span style={{ marginLeft: 8, fontSize: 13.5, fontWeight: 600 }}>{t.label || "(제목 없음)"}</span>
            <div style={{ fontSize: 11.5, color: C.faint, marginTop: 3 }}>{t.deletedAt} 삭제됨</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <Btn small primary onClick={() => onRestore(t.id)}>복구</Btn>
            <Btn small onClick={() => onPurge(t.id)}>영구 삭제</Btn>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ============================================================ 마스터 자소서·면접 */
function MasterPrep({ essays, setEssays, interviews, setInterviews, experiences, resumeProfile, interviewCategories, addInterviewCategory }) {
  const [tab, setTab] = useState("자소서");
  const [chatId, setChatId] = useState(null);
  const [iqChatId, setIqChatId] = useState(null);
  const masterApp = { company: "마스터 (공통 준비용)", position: resumeProfile.targetRole || "", requirements: [] };

  const patchQ = (id, k, v) => setEssays(prev => prev.map(x => x.id === id ? { ...x, [k]: v } : x));
  const removeQ = (id) => setEssays(prev => prev.filter(x => x.id !== id));
  const addQ = () => setEssays(prev => [...prev, { id: "mq_" + Date.now(), question: "", characterLimit: 1000, draft: "", status: "not_started", chatHistory: [] }]);

  const patchIq = (id, k, v) => setInterviews(prev => prev.map(x => x.id === id ? { ...x, [k]: v } : x));
  const removeIq = (id) => setInterviews(prev => prev.filter(x => x.id !== id));
  const addIq = () => setInterviews(prev => [...prev, { id: "miq_" + Date.now(), question: "", category: "", selectedExperienceId: null, practiceCount: 0, confidence: null, followUps: [], draft: "", chatHistory: [] }]);

  return (
    <div style={{ maxWidth: 820 }}>
      <H2>마스터 자소서·면접</H2>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 16, lineHeight: 1.6 }}>
        특정 회사에 매지 않고, 자주 나오는 공통 문항을 미리 준비해두는 곳입니다. 여기서 만든 답변은 지원 관리의 각 회사별 문항을 쓸 때 참고용으로 활용하세요.
      </div>

      <div style={{ display: "flex", gap: 2, borderBottom: `1px solid ${C.line}`, marginBottom: 18 }}>
        {["자소서", "면접"].map(t => (
          <div key={t} onClick={() => setTab(t)} style={{ padding: "9px 14px", fontSize: 13.5, fontWeight: tab === t ? 700 : 500, cursor: "pointer",
            color: tab === t ? C.text : C.sub, borderBottom: tab === t ? `2px solid ${C.text}` : "2px solid transparent", marginBottom: -1 }}>{t}</div>
        ))}
      </div>

      {tab === "자소서" && chatId && (
        <EssayChat
          essay={essays.find(x => x.id === chatId)}
          app={masterApp}
          experiences={experiences}
          onClose={() => setChatId(null)}
          history={essays.find(x => x.id === chatId)?.chatHistory || []}
          onHistoryChange={(h) => setEssays(prev => prev.map(x => x.id === chatId ? { ...x, chatHistory: h } : x))}
          onSaveDraft={(text) => setEssays(prev => prev.map(x => x.id === chatId ? { ...x, draft: text, status: "drafting" } : x))}
        />
      )}

      {tab === "자소서" && !chatId && (
        <div style={{ display: "grid", gap: 12 }}>
          {essays.map(q => (
            <Card key={q.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 10 }}>
                <Input value={q.question} onChange={e => patchQ(q.id, "question", e.target.value)} style={{ fontWeight: 700, fontSize: 14, border: "none", padding: "2px 0", flex: 1 }} />
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                  <Badge label={{ not_started: "미시작", drafting: "초안 작성", reviewing: "검토", complete: "완료" }[q.status]}
                    color={q.status === "complete" ? C.green : C.blue} bg={q.status === "complete" ? C.greenBg : C.blueBg} />
                  <span onClick={() => removeQ(q.id)} title="삭제" style={{ cursor: "pointer", color: C.faint, fontSize: 13 }}>✕</span>
                </div>
              </div>
              {q.draft && (
                <div style={{ padding: "10px 12px", background: C.bg, border: `1px solid ${C.line}`, borderRadius: 12, fontSize: 12.5, color: C.sub, lineHeight: 1.6, maxHeight: 100, overflow: "hidden" }}>
                  {q.draft}
                </div>
              )}
              <div style={{ marginTop: 12 }}><Btn small onClick={() => setChatId(q.id)}>{q.draft ? "이어서 작성하기 →" : "작성 도우미 열기 →"}</Btn></div>
            </Card>
          ))}
          <Btn small onClick={addQ}>+ 문항 추가</Btn>
        </div>
      )}

      {tab === "면접" && iqChatId && (
        <EssayChat
          essay={{ question: interviews.find(x => x.id === iqChatId)?.question, characterLimit: 400 }}
          app={masterApp}
          experiences={experiences}
          onClose={() => setIqChatId(null)}
          history={interviews.find(x => x.id === iqChatId)?.chatHistory || []}
          onHistoryChange={(h) => setInterviews(prev => prev.map(x => x.id === iqChatId ? { ...x, chatHistory: h } : x))}
          onSaveDraft={(text) => setInterviews(prev => prev.map(x => x.id === iqChatId ? { ...x, draft: text } : x))}
        />
      )}

      {tab === "면접" && !iqChatId && (
        <div style={{ display: "grid", gap: 12 }}>
          {interviews.map(iq => {
            const exp = experiences.find(e => e.id === iq.selectedExperienceId);
            return (
              <Card key={iq.id}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, gap: 10 }}>
                  <Input value={iq.question} onChange={e => patchIq(iq.id, "question", e.target.value)} style={{ fontWeight: 700, fontSize: 14, border: "none", padding: "2px 0", flex: 1 }} />
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                    <CategorySelect value={iq.category} options={interviewCategories} placeholder="카테고리 없음"
                      onAddOption={addInterviewCategory} onChange={(v) => patchIq(iq.id, "category", v)} />
                    <span onClick={() => removeIq(iq.id)} title="삭제" style={{ cursor: "pointer", color: C.faint, fontSize: 13 }}>✕</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: C.sub }}>참고 경험:</span>
                  <select value={iq.selectedExperienceId || ""} onChange={e => patchIq(iq.id, "selectedExperienceId", e.target.value || null)}
                    style={{ fontFamily: font, fontSize: 13, padding: "5px 8px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.panel }}>
                    <option value="">선택 안 함</option>
                    {experiences.map(e2 => <option key={e2.id} value={e2.id}>{e2.title}</option>)}
                  </select>
                  {exp && <span style={{ fontSize: 12.5, color: C.sub }}>연습 {iq.practiceCount}회</span>}
                </div>
                {iq.draft && (
                  <div style={{ padding: "10px 12px", background: C.bg, border: `1px solid ${C.line}`, borderRadius: 12, fontSize: 12.5, color: C.sub, lineHeight: 1.6, marginBottom: 10, maxHeight: 90, overflow: "hidden" }}>
                    {iq.draft}
                  </div>
                )}
                <Btn small onClick={() => setIqChatId(iq.id)}>{iq.draft ? "답변 이어서 작성하기 →" : "답변 작성 도우미 열기 →"}</Btn>
              </Card>
            );
          })}
          <Btn small onClick={addIq}>+ 질문 추가</Btn>
        </div>
      )}
    </div>
  );
}

function Resume({ experiences, outputs, metrics, resumeProfile, setResumeProfile, skills, certs }) {
  const approved = outputs.filter(o => o.outputType === "resume" && o.approvalStatus === "approved");
  const patch = (k, v) => setResumeProfile(p => ({ ...p, [k]: v }));
  const autosave = useAutosave(JSON.stringify(resumeProfile));

  // 승인된 문장을 경험(소속·역할) 단위로 그룹핑
  const groups = approved.reduce((acc, o) => {
    const exp = experiences.find(e => e.id === o.experienceId);
    const key = exp ? `${exp.organization} · ${exp.role}` : "기타";
    (acc[key] = acc[key] || []).push(o);
    return acc;
  }, {});

  // 근거가 연결된 스킬 항목만 배지로 노출
  const linkedSkillBadges = (skills || []).flatMap(s =>
    (s.scopeItems || []).filter(it => it.evidenceExpId).slice(0, 1).map(it => `${s.name} · ${it.text}`)
  );
  const certBadges = (certs || []).filter(c => !c.planned).map(c => c.name);

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <H2>기본 이력서</H2>
        <AutosaveIndicator state={autosave} />
      </div>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 16 }}>경력 문장은 직접 입력하지 않고, 경험 보관함의 <b>승인된</b> 문장만 불러옵니다.</div>
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Label>기본 정보</Label>
          {resumeProfile._imported && <Badge label="가져온 항목 · 확인 필요" color={C.orange} bg={C.orangeBg} />}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 6 }}>
          <div><Label>이름</Label><Input placeholder="이름" value={resumeProfile.name || ""} onChange={e => patch("name", e.target.value)} /></div>
          <div><Label>희망 직무</Label><Input placeholder="예: MD / 이커머스" value={resumeProfile.targetRole || ""} onChange={e => patch("targetRole", e.target.value)} /></div>
          <div><Label>이메일</Label><Input placeholder="이메일" value={resumeProfile.email || ""} onChange={e => patch("email", e.target.value)} /></div>
          <div><Label>연락처</Label><Input placeholder="연락처" value={resumeProfile.phone || ""} onChange={e => patch("phone", e.target.value)} /></div>
          <div style={{ gridColumn: "1 / -1" }}><Label>한 줄 소개</Label><Input placeholder="한 줄 소개" value={resumeProfile.headline || ""} onChange={e => patch("headline", e.target.value)} /></div>
        </div>
      </Card>
      <Card>
        <Label>경력</Label>
        {Object.keys(groups).length === 0 && <div style={{ fontSize: 13, color: C.faint, padding: "8px 0" }}>승인된 경력 문장이 없습니다. 경험 상세의 「활용 문장」 탭에서 문장을 승인하면 여기에 표시됩니다.</div>}
        {Object.entries(groups).map(([label, items]) => (
          <div key={label} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.sub, marginBottom: 4 }}>{label}</div>
            {items.map(o => (
              <div key={o.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", borderBottom: `1px solid ${C.lineSoft}` }}>
                <span style={{ color: C.faint }}>·</span>
                <span style={{ fontSize: 13.5, lineHeight: 1.6, flex: 1 }}><TokenText text={o.content} metrics={metrics} /></span>
                <Badge label="승인됨" color={C.green} bg={C.greenBg} />
              </div>
            ))}
          </div>
        ))}
        <div style={{ marginTop: 12 }}><Btn small>+ 경험 보관함에서 문장 불러오기</Btn></div>
        <div style={{ fontSize: 12, color: C.faint, marginTop: 10 }}>미승인(AI 초안) 문장은 여기에 표시되지 않습니다.</div>
      </Card>
      <Card style={{ marginTop: 12 }}>
        <Label>역량 · 자격증</Label>
        <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6 }}>
          역량·스킬 탭에서 <b>경험 근거가 연결된 항목</b>과 자격증을 자동으로 불러옵니다. (근거 없는 항목은 제외)
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
          {[...linkedSkillBadges, ...certBadges].length === 0
            ? <div style={{ fontSize: 12.5, color: C.faint }}>근거가 연결된 역량·자격증이 아직 없습니다.</div>
            : [...linkedSkillBadges, ...certBadges].map(t => <Badge key={t} label={t} color={C.sub} bg={C.lineSoft} />)}
        </div>
      </Card>
    </div>
  );
}
