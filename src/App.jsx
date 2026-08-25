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
  text: "#26251F", sub: "#63605A", faint: "#8A867D",
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

const seedQuestionBlocks = [
  { id: "qb_1", label: "가장 큰 성과", expIds: ["e_1"] },
  { id: "qb_2", label: "주도적으로 개선한 경험", expIds: ["e_1", "e_2"] },
  { id: "qb_3", label: "협업 경험", expIds: ["e_1"] },
  { id: "qb_4", label: "리더십 경험", expIds: ["e_4"] },
  { id: "qb_5", label: "어려움을 극복한 경험", expIds: ["e_1"] },
  { id: "qb_6", label: "문제 해결 경험", expIds: ["e_2"] },
];
// 신규 사용자 기본값 — 예시 경험을 참조하지 않는 빈 질문 블록
const emptyQuestionBlocks = [
  { id: "qb_1", label: "가장 큰 성과", expIds: [] },
  { id: "qb_2", label: "주도적으로 개선한 경험", expIds: [] },
  { id: "qb_3", label: "협업 경험", expIds: [] },
  { id: "qb_4", label: "리더십 경험", expIds: [] },
  { id: "qb_5", label: "어려움을 극복한 경험", expIds: [] },
  { id: "qb_6", label: "문제 해결 경험", expIds: [] },
];

/* ============================================================ 퍼스널 브랜딩 워크북 데이터 ============================================================ */
const BRANDING_STEPS = [{"id": 1, "name": "발굴", "desc": "재료를 전부 꺼낸다", "categories": ["experience", "flow", "taste"]}, {"id": 2, "name": "검증", "desc": "진짜 강점만 남긴다", "categories": ["strength", "external"]}, {"id": 3, "name": "정의", "desc": "정체성과 기준을 잡는다", "categories": ["identity", "motivation", "values"]}, {"id": 4, "name": "압축", "desc": "한 문장으로 만든다", "categories": ["output"]}];
const BRANDING_CATEGORIES = [{"id": "experience", "label": "경험 인벤토리", "icon": "archive"}, {"id": "flow", "label": "몰입·즐거움", "icon": "zap"}, {"id": "taste", "label": "취향·기질", "icon": "palette"}, {"id": "strength", "label": "강점·약점", "icon": "target"}, {"id": "external", "label": "타인이 본 나", "icon": "users"}, {"id": "identity", "label": "아이덴티티", "icon": "fingerprint"}, {"id": "motivation", "label": "왜 일하는가", "icon": "compass"}, {"id": "values", "label": "가치관·판단기준", "icon": "scale"}, {"id": "output", "label": "산출물", "icon": "sparkles"}];
const BRANDING_QUESTIONS = [{"id": "exp_01", "category": "experience", "step": 1, "order": 1, "text": "최근 3년간 시간을 많이 쓴 활동을 10개 이상 적어줘. 업무·사이드·취미 구분 없이.", "hint": "재료가 많을수록 뒤 단계가 정확해져. 사소해 보여도 다 적어.", "input_type": "list", "probe": "나열만 있고 맥락이 없으면, 그 중 가장 오래 지속된 것과 가장 빨리 그만둔 것의 차이를 묻는다."}, {"id": "exp_02", "category": "experience", "step": 1, "order": 2, "text": "그중 아무도 시키지 않았는데 스스로 시작한 건 뭐야?", "hint": "자발성은 재능의 가장 강한 신호야.", "input_type": "text", "probe": "왜 하필 그걸 시작했는지, 시작 직전에 무슨 일이 있었는지 파고든다."}, {"id": "exp_03", "category": "experience", "step": 1, "order": 3, "text": "남들은 어려워하는데 나는 자연스럽게 했던 일 2~3개는?", "hint": "재능 = 반복적으로 나타나는 사고·행동 패턴. 나에게 쉬운 건 잘 안 보여.", "input_type": "list", "probe": "'남들이 어려워했다'는 근거를 요구한다. 실제로 남이 못 하는 걸 본 장면이 있는지."}, {"id": "exp_04", "category": "experience", "step": 1, "order": 4, "text": "최근 1년간 남이 나에게 먼저 부탁하거나 물어본 건 주로 어떤 주제였어?", "hint": "시장이 이미 인식한 내 강점이야. 가장 신뢰도 높은 데이터.", "input_type": "text", "probe": "요청한 사람들의 공통점(직군·관계·상황)을 묻는다. 그게 타겟 오디언스 후보다."}, {"id": "exp_05", "category": "experience", "step": 1, "order": 5, "text": "돈을 받지 않았는데도 시간을 쏟은 일이 있어?", "hint": "경제적 보상 없이 지속된 활동은 내적 동기의 위치를 알려줘.", "input_type": "text", "probe": "그 일을 돈 받고 하게 되면 재미가 사라질지 물어본다."}, {"id": "exp_06", "category": "experience", "step": 1, "order": 6, "text": "끝까지 못 끝낸 일 중 지금도 아쉬운 게 있어? 왜 못 끝냈어?", "hint": "중단 패턴은 약점보다 '환경 조건'을 알려주는 경우가 많아.", "input_type": "text", "probe": "다른 중단 사례와 비교해서 같은 이유인지 확인한다. 반복되면 그게 패턴."}, {"id": "flow_01", "category": "flow", "step": 1, "order": 1, "text": "시간 가는 줄 몰랐던 최근 순간 하나를 구체적으로 적어줘. 언제, 어디서, 뭘 하고 있었어?", "hint": "감상 말고 장면으로. 몰입의 조건은 디테일에 숨어 있어.", "input_type": "text", "probe": "그 상황의 조건(혼자/함께, 마감 유무, 난이도)을 하나씩 확인한다."}, {"id": "flow_02", "category": "flow", "step": 1, "order": 2, "text": "그 일에서 정확히 어느 부분이 재밌었어? 과정 자체? 결과물? 남의 반응?", "hint": "같은 일을 해도 사람마다 즐거운 지점이 달라. 여기서 방향이 갈려.", "input_type": "choice_text", "options": ["과정 자체", "완성된 결과물", "남의 반응·인정", "문제가 풀리는 순간", "기타"], "probe": "고른 항목이 다른 경험에서도 동일했는지 교차 검증한다."}, {"id": "flow_03", "category": "flow", "step": 1, "order": 3, "text": "반대로, 결과는 좋았는데 하는 내내 괴로웠던 일은?", "hint": "잘하는 것과 즐거운 것을 분리하는 질문이야. 이 갭이 번아웃 지점.", "input_type": "text", "probe": "괴로움의 원인이 일 자체인지, 사람·환경인지 분리하게 만든다."}, {"id": "flow_04", "category": "flow", "step": 1, "order": 4, "text": "혼자 할 때와 같이 할 때, 어느 쪽에서 에너지가 더 나? 예를 들어봐.", "hint": "협업 성향은 나중에 채널·콘텐츠 형식을 결정해.", "input_type": "text", "probe": "예외 상황을 묻는다. '혼자가 좋다'면 그럼에도 같이 해서 좋았던 경우는?"}, {"id": "flow_05", "category": "flow", "step": 1, "order": 5, "text": "완벽했다고 느낀 하루의 시간표를 아침부터 밤까지 적어봐.", "hint": "이상적 일상의 구조가 곧 내가 설계해야 할 커리어 형태야.", "input_type": "text", "probe": "지금 실제 하루와 겹치는 시간이 몇 %인지 계산하게 한다."}, {"id": "taste_01", "category": "taste", "step": 1, "order": 1, "text": "좋아하는 색 하나. 그리고 최근에 그 색을 실제로 고른 순간(옷·물건·화면 등)을 같이 적어줘.", "hint": "색 자체는 재료가 아니야. '왜'와 '실제 선택'이 재료야.", "input_type": "text", "probe": "말한 색과 실제 고른 색이 다르면 그 갭을 지적한다. 자기이미지 vs 실제 취향."}, {"id": "taste_02", "category": "taste", "step": 1, "order": 2, "text": "그 색이 나에게 주는 느낌을 3단어로. 그리고 왜 그 느낌이 좋아?", "hint": "여기서 나온 단어가 브랜드 톤앤매너의 씨앗이 돼.", "input_type": "text", "probe": "그 3단어가 실제 내 성격과 일치하는지, 아니면 되고 싶은 모습인지 묻는다."}, {"id": "taste_03", "category": "taste", "step": 1, "order": 3, "text": "내 공간(방·책상)에서 절대 못 버리는 물건 3개와 이유는?", "hint": "물건은 가치관의 물리적 증거야.", "input_type": "list", "probe": "세 물건의 공통점을 스스로 찾게 한다."}, {"id": "taste_04", "category": "taste", "step": 1, "order": 4, "text": "돈이 하나도 안 아까운 소비 카테고리와, 쓰기 아까운 카테고리는?", "hint": "지출 패턴은 말보다 정직한 우선순위 지표야.", "input_type": "text", "probe": "아까운 쪽에 돈을 쓴 최근 사례가 있는지, 있다면 왜였는지 묻는다."}, {"id": "taste_05", "category": "taste", "step": 1, "order": 5, "text": "좋아하는 브랜드·가게·공간 하나. 그게 나에게 주는 느낌을 3단어로.", "hint": "내가 끌리는 브랜드는 내가 되고 싶은 브랜드와 겹쳐.", "input_type": "text", "probe": "그 브랜드의 어떤 요소(비주얼·가격·태도·스토리)에 끌리는지 분해시킨다."}, {"id": "taste_06", "category": "taste", "step": 1, "order": 6, "text": "절대 못 견디는 스타일이나 분위기는? 왜?", "hint": "싫어하는 것의 경계가 브랜드 정체성을 더 선명하게 만들어.", "input_type": "text", "probe": "그 반감이 취향인지 가치관 충돌인지 구분하게 한다."}, {"id": "str_01", "category": "strength", "step": 2, "order": 1, "text": "남들보다 잘한다고 확신하는 것 3개. 각각 증거를 한 줄씩 붙여줘.", "hint": "증거 없는 강점은 브랜드에 쓸 수 없어.", "input_type": "list", "probe": "증거가 감상이면 숫자·상황·제3자 반응 중 하나를 요구한다."}, {"id": "str_02", "category": "strength", "step": 2, "order": 2, "text": "그중 하나를 골라볼게. 그때 남들은 왜 그걸 못 했다고 생각해?", "hint": "상대적 우위의 원인을 알아야 재현 가능한 강점이 돼.", "input_type": "text", "probe": "'운이 좋았다'류 답이면, 그 운을 만든 사전 준비가 뭐였는지 되묻는다."}, {"id": "str_03", "category": "strength", "step": 2, "order": 3, "text": "칭찬받았는데 '이게 뭐 대단한가' 싶었던 건 뭐야?", "hint": "★ 가장 중요한 질문. 나에게 쉬워서 안 보이는 강점이 여기 숨어 있어.", "input_type": "text", "probe": "누가, 어떤 상황에서 칭찬했는지 구체화하고 반복 사례를 찾는다."}, {"id": "str_04", "category": "strength", "step": 2, "order": 4, "text": "스스로 자랑스러운데 아무도 알아주지 않은 건?", "hint": "인식 갭. 브랜딩으로 해결 가능한 영역인지 판단하는 재료야.", "input_type": "text", "probe": "안 알려진 이유가 '결과가 안 보여서'인지 '말을 안 해서'인지 나눈다."}, {"id": "str_05", "category": "strength", "step": 2, "order": 5, "text": "내 약점 3개. 각각 '고칠 것'과 '그냥 안고 갈 것'으로 나눠줘.", "hint": "약점 보완보다 강점 극대화가 훨씬 효율적이야. 다 고치려 하지 마.", "input_type": "list", "probe": "'안고 갈 것'이 강점의 뒷면은 아닌지 검토시킨다."}, {"id": "str_06", "category": "strength", "step": 2, "order": 6, "text": "지적받은 말 중 가장 여러 번 반복해서 들은 건?", "hint": "반복된 피드백은 실제 패턴일 확률이 높아.", "input_type": "text", "probe": "그 지적이 성과를 실제로 망친 적이 있는지, 아니면 스타일 차이인지 구분한다."}, {"id": "ext_01", "category": "external", "step": 2, "order": 1, "text": "주변 5명(동료 2·친구 2·가족 1)에게 물어봐. \"나한테 뭘 물어보고 싶어질 때가 있어? 어떤 주제로?\" 받은 답을 그대로 옮겨줘.", "hint": "자기인식과 타인인식의 갭이 브랜딩의 출발점이야. 이 단계는 혼자 못 해.", "input_type": "matrix", "matrix_fields": ["관계", "받은 답"], "probe": "답변자 간 공통 키워드를 뽑아 보여주고, 예상했던 답인지 묻는다."}, {"id": "ext_02", "category": "external", "step": 2, "order": 2, "text": "같은 사람들에게: \"내가 남들보다 잘한다고 느낀 순간이 있었어? 구체적으로 언제?\"", "hint": "타인이 기억하는 장면은 내가 기억 못 하는 경우가 많아.", "input_type": "matrix", "matrix_fields": ["관계", "받은 답"], "probe": "내가 str_01에서 쓴 강점과 겹치는지 대조해서 보여준다."}, {"id": "ext_03", "category": "external", "step": 2, "order": 3, "text": "같은 사람들에게: \"나를 세 단어로 표현하면?\"", "hint": "빈도수가 높은 단어가 이미 형성된 내 브랜드야.", "input_type": "matrix", "matrix_fields": ["관계", "세 단어"], "probe": "가장 많이 나온 단어와 가장 뜻밖이었던 단어를 짚는다."}, {"id": "ext_04", "category": "external", "step": 2, "order": 4, "text": "받은 답 중 전혀 예상 못 했던 건 뭐야? 어떤 기분이었어?", "hint": "불편한 답일수록 정보량이 커.", "input_type": "text", "probe": "그 인식이 틀렸다고 생각하면, 왜 그렇게 보였을지 원인을 찾게 한다."}, {"id": "id_01", "category": "identity", "step": 3, "order": 1, "text": "직업·소속·학교를 다 빼고 나를 소개해봐.", "hint": "명함이 사라져도 남는 게 진짜 정체성이야.", "input_type": "text", "probe": "추상적 형용사만 있으면 그걸 증명하는 행동 하나씩을 요구한다."}, {"id": "id_02", "category": "identity", "step": 3, "order": 2, "text": "나를 설명하는 문장 3개를 써줘.", "hint": "다음 질문에서 이 문장들을 반박할 거야.", "input_type": "list", "probe": "각 문장의 반례를 사용자가 직접 찾게 한다. 반례가 없으면 너무 두루뭉술한 것."}, {"id": "id_03", "category": "identity", "step": 3, "order": 3, "text": "10년 전의 나와 지금의 나, 가장 크게 바뀐 판단 기준은 뭐야?", "hint": "변화의 방향에 성장 서사가 들어 있어.", "input_type": "text", "probe": "그 변화를 만든 결정적 사건을 특정하게 한다."}, {"id": "id_04", "category": "identity", "step": 3, "order": 4, "text": "사람들이 나를 오해하는 지점이 있어? 어떤 식으로?", "hint": "오해는 브랜딩으로 교정 가능한 영역이야.", "input_type": "text", "probe": "그 오해가 내 어떤 행동에서 비롯됐는지 역추적시킨다."}, {"id": "id_05", "category": "identity", "step": 3, "order": 5, "text": "나에 대해 절대 안 바뀔 것 같은 성질 하나는?", "hint": "브랜드의 축. 여기가 흔들리면 전부 흔들려.", "input_type": "text", "probe": "그게 강점으로도, 약점으로도 작동한 사례를 각각 요구한다."}, {"id": "mot_01", "category": "motivation", "step": 3, "order": 1, "text": "돈이 충분하다면 일을 할까? 한다면 어떤 일?", "hint": "생계를 걷어냈을 때 남는 동기가 진짜 동기야.", "input_type": "text", "probe": "'안 한다'면 대신 뭘 하며 시간을 보낼지 묻고, 그것도 일의 일종인지 따진다."}, {"id": "mot_02", "category": "motivation", "step": 3, "order": 2, "text": "일에서 절대 포기 못 하는 조건 1개, 포기할 수 있는 것 1개.", "hint": "협상 불가 조건이 커리어 필터가 돼.", "input_type": "text", "probe": "포기 못 하는 조건 때문에 실제로 뭔가를 거절한 적이 있는지 묻는다."}, {"id": "mot_03", "category": "motivation", "step": 3, "order": 3, "text": "최근에 일을 그만두거나 옮기고 싶었던 순간과 그 이유는?", "hint": "이탈 충동의 원인이 곧 결핍된 가치야.", "input_type": "text", "probe": "그때 무엇이 채워졌다면 남았을지 구체적으로 특정하게 한다."}, {"id": "mot_04", "category": "motivation", "step": 3, "order": 4, "text": "어떤 칭찬을 들었을 때 가장 기뻤어? 결과? 과정? 태도? 사람됨?", "hint": "기쁨의 종류가 내가 인정받고 싶은 정체성이야.", "input_type": "choice_text", "options": ["결과·성과", "과정·방법", "태도·성실함", "사람됨·인간미", "기타"], "probe": "반대로 별로 안 기뻤던 칭찬도 물어서 대비시킨다."}, {"id": "mot_05", "category": "motivation", "step": 3, "order": 5, "text": "일을 그만두는 날, 사람들이 나를 뭐라고 기억했으면 좋겠어?", "hint": "이 답이 포지셔닝 문장의 방향을 결정해.", "input_type": "text", "probe": "그렇게 기억되려면 지금 뭘 하고 있어야 하는지 역산시킨다."}, {"id": "val_01", "category": "values", "step": 3, "order": 1, "text": "인생 방향이 바뀐 사건 3개와, 그때 무엇을 기준으로 선택했는지 적어줘.", "hint": "반복되는 판단 기준 = 핵심 가치. '성장' 같은 사전적 단어 말고 실제 선택으로.", "input_type": "matrix", "matrix_fields": ["사건", "판단 기준"], "probe": "세 사건의 판단 기준에서 공통 축을 찾아 제시하고 동의 여부를 묻는다."}, {"id": "val_02", "category": "values", "step": 3, "order": 2, "text": "최근 큰 결정 하나. 무엇을 포기하고 무엇을 택했어?", "hint": "가치는 선언이 아니라 트레이드오프에서 드러나.", "input_type": "text", "probe": "포기한 것을 다시 택할 상황이 오면 같은 선택을 할지 묻는다."}, {"id": "val_03", "category": "values", "step": 3, "order": 3, "text": "도저히 못 참는 사람 유형은? 왜 그게 나를 건드려?", "hint": "혐오의 대상은 내 가치의 반대편이야.", "input_type": "text", "probe": "내가 그 유형처럼 행동한 적은 없는지 되묻는다."}, {"id": "val_04", "category": "values", "step": 3, "order": 4, "text": "손해를 보면서도 지킨 원칙이 있어? 어떤 상황이었어?", "hint": "비용을 치른 원칙만 진짜 원칙이야.", "input_type": "text", "probe": "그 손해의 크기를 구체화하고, 후회했는지 묻는다."}, {"id": "val_05", "category": "values", "step": 3, "order": 5, "text": "다들 당연하다는데 나는 동의 안 되는 게 있어?", "hint": "관점의 차이가 콘텐츠의 차별점이 돼.", "input_type": "text", "probe": "그 반대 의견을 실제로 말해본 적이 있는지, 반응은 어땠는지 묻는다."}];

const BRANDING_ARCHETYPES = ["돌보는자","통치자","순수한자","탐험가","현자","반항아","영웅","마법사","창조자","광대","평범한사람","연인"];

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
/* ---------- 단계 충족도 평가 · 완성도 재계산 · 규칙 점검 ---------- */
const hasNumber = (s) => /\d/.test(s || "");
// 한 단계의 충족도를 실제 내용으로 평가한다: "미입력" | "보완 필요" | "충분"
// 글자수뿐 아니라 가벼운 품질 규칙(성과=숫자, 직무 연결=직무+핵심메시지 모두)까지 본다.
function evalStepStatus(name, e, metrics = []) {
  const len = (v) => (v || "").trim().length;
  if (name === "행동") {
    const n = (e.actions || []).length;
    return n === 0 ? "미입력" : "충분";
  }
  if (name === "성과") {
    const myMetrics = metrics.filter(m => m.experienceId === e.id);
    const txt = `${e.oneLineSummary || ""} ${e.qualitative || ""}`;
    if (!len(e.oneLineSummary) && !len(e.qualitative) && myMetrics.length === 0) return "미입력";
    // 정량 근거(수치)가 있어야 '충분' — 면접·자소서에서 성과의 핵심은 숫자다
    return (myMetrics.length > 0 || hasNumber(txt)) ? "충분" : "보완 필요";
  }
  if (name === "직무 연결") {
    const job = (e.jobRelevance || "").trim();
    const core = (e.coreMessage || "").trim();
    if (!job && !core) return "미입력";
    // 직무 연결과 핵심 메시지를 모두 채워야 '충분'
    return (job.length >= 4 && core.length >= 4) ? "충분" : "보완 필요";
  }
  const fieldMap = { 배경: "context", 문제: "discoveredProblem", 기여도: "contributionEvidence",
    목표: "goal", 어려움: "difficulty", "배운 점": "learning" };
  const minLen = { 배경: 8, 문제: 8, 기여도: 8, 목표: 4, 어려움: 8, "배운 점": 8 };
  const val = (e[fieldMap[name]] || "").trim();
  if (val.length === 0) return "미입력";
  return val.length >= (minLen[name] || 1) ? "충분" : "보완 필요";
}
// 왜 '충분'이 아닌지 사용자에게 보여줄 맞춤 메시지 (해당 단계가 충분하면 null)
function stepIssueMessage(name, e, metrics = []) {
  const st = evalStepStatus(name, e, metrics);
  if (st === "충분") return null;
  if (name === "성과") {
    const myMetrics = metrics.filter(m => m.experienceId === e.id);
    if (st === "보완 필요") return "성과에 숫자가 없어요. 몇 %·몇 건·몇 시간처럼 정량 근거를 넣으면 완성돼요.";
    return "결과가 이전과 어떻게 달라졌는지 적어주세요.";
  }
  if (name === "직무 연결") return "직무 연결과 핵심 메시지를 모두 채워야 완성돼요.";
  if (st === "미입력") return "아직 비어 있어요. 이대로 넘어가면 나중에 다시 채워야 합니다.";
  return "내용이 조금 짧아요. 한두 문장 더 구체적으로 적어보세요.";
}
// 저장 시 9단계 충족도를 한 번에 재계산 (표시가 실제 내용과 어긋나지 않게)
function recomputeCompletion(e, metrics = []) {
  const comp = {};
  [...CORE_STEPS, ...DEPTH_STEPS].forEach(s => { comp[s] = evalStepStatus(s, e, metrics); });
  return comp;
}
const coreAllFilled = (e, metrics = []) => CORE_STEPS.every(s => evalStepStatus(s, e, metrics) === "충분");
// 심화 4단계까지 모두 충분해야 '분석 완료(complete)'로 본다
function isFullyComplete(e, metrics = []) {
  return [...CORE_STEPS, ...DEPTH_STEPS].every(s => evalStepStatus(s, e, metrics) === "충분");
}
// 내용에서 status를 유도한다 (심화까지 완료해야 complete)
function deriveStatus(e, metrics = []) {
  const anyFilled = [...CORE_STEPS, ...DEPTH_STEPS].some(s => evalStepStatus(s, e, metrics) !== "미입력");
  if (!anyFilled) return "draft";
  if (isFullyComplete(e, metrics)) return "complete";
  if (coreAllFilled(e, metrics)) return e.depthDone ? "needs_revision" : "analyzing";
  return "needs_revision";
}
// API 없이 즉시 도는 개연성 규칙 점검 (앞뒤 단계가 서로 안 맞는 곳)
function localConsistencyIssues(e, metrics = []) {
  const issues = [];
  const acts = e.actions || [];
  const hasCollab = acts.some(a => a.actionType === "collaboration");
  const soloClaim = e.contributionLevel === "full_ownership" || /혼자|단독|나 혼자|스스로 전부/.test(e.contributionEvidence || "");
  if (soloClaim && hasCollab)
    issues.push({ step: "기여도", issue: "기여도는 단독·전체 책임에 가까운데 행동에는 협업이 들어 있어요. 표현이 서로 맞는지 확인하세요." });
  const myMetrics = metrics.filter(m => m.experienceId === e.id);
  const perf = `${e.oneLineSummary || ""} ${e.qualitative || ""}`;
  if ((e.oneLineSummary || e.qualitative) && myMetrics.length === 0 && !hasNumber(perf))
    issues.push({ step: "성과", issue: "성과에 숫자가 없어요. 정량 근거(%·건·시간·금액)를 넣으면 설득력이 올라갑니다." });
  if ((e.difficulty || "").trim() && !(e.learning || "").trim())
    issues.push({ step: "배운 점", issue: "어려움은 적었는데 배운 점이 비어 있어요. 그 경험에서 무엇이 바뀌었는지 이어서 적어보세요." });
  if ((e.goal || "").trim() && !coreAllFilled(e, metrics) && evalStepStatus("성과", e, metrics) === "충분")
    issues.push({ step: "행동", issue: "목표·성과는 있는데 그 사이 행동이 덜 정리됐어요. 목표를 이루려고 한 행동을 채워보세요." });
  return issues;
}

// AI가 돌려준 텍스트에서 JSON을 최대한 견고하게 파싱 (코드펜스·앞뒤 잡텍스트·트레일링 콤마·객체 사이 누락 콤마·스마트따옴표 보정)
function parseAIJson(text) {
  if (!text || !text.trim()) throw new Error("AI 응답이 비어 있습니다.");
  let t = text.replace(/```json|```/gi, "").trim();
  const objStart = t.indexOf("{");
  const arrStart = t.indexOf("[");
  let start = objStart;
  if (arrStart >= 0 && (objStart < 0 || arrStart < objStart)) start = arrStart;
  const end = Math.max(t.lastIndexOf("}"), t.lastIndexOf("]"));
  if (start >= 0 && end > start) t = t.slice(start, end + 1);
  const repairs = [
    (x) => x,
    (x) => x.replace(/,\s*([}\]])/g, "$1"),                         // 트레일링 콤마 제거
    (x) => x.replace(/}\s*{/g, "},{").replace(/]\s*\[/g, "],["),    // 객체·배열 사이 누락 콤마
    (x) => x.replace(/[“”]/g, '"').replace(/[‘’]/g, "'"), // 스마트 따옴표 정규화
  ];
  let cur = t, lastErr;
  for (const fix of repairs) {
    cur = fix(cur);
    try { return JSON.parse(cur); } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("JSON 파싱 실패");
}

const STATUS_LABEL = { draft: "초기 메모", analyzing: "분석 중", needs_revision: "보완 필요", complete: "분석 완료" };
const STATUS_COLOR = { draft: [C.sub, C.lineSoft], analyzing: [C.blue, C.blueBg], needs_revision: [C.orange, C.orangeBg], complete: [C.green, C.greenBg] };
const CONTRIB_LABEL = { participated: "참여", responsible: "담당", led: "주도", proposed_and_executed: "제안 후 실행", full_ownership: "전체 책임" };
const ACTION_LABEL = { goal: "목표", analysis: "분석", judgment: "판단", execution: "실행", collaboration: "협업", improvement: "개선" };
// 행동 카드 전용 색상 (앱 전체는 무채색 기조지만, 유형 구분이 중요한 이 영역만 예외적으로 색을 씀)
const ACTION_COLOR = {
  goal: ["#5F6B99", "#EAECF5"],
  analysis: ["#2F6FA8", "#E7F0F7"],
  judgment: ["#7A5AA8", "#EFEAF6"],
  execution: ["#3F7A5C", "#E7F1EA"],
  collaboration: ["#B8547E", "#FBEAF0"],
  improvement: ["#B0791A", "#FBF1DF"],
};
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
function resolveTokenText(text, metrics) {
  if (!text) return "";
  return text.replace(/\{\{metric:([^|}]+)\|?([^}]*)\}\}/g, (_, id, fmt) => {
    const metric = metrics.find(x => x.id === id);
    return formatMetric(metric, fmt || "exact");
  });
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
// 태그는 채우지 않고 얇은 아웃라인만 — 문서처럼 조용하게
const Badge = ({ label, color, bg }) => (
  <span style={{ fontSize: 11, fontWeight: 600, color, background: "transparent", border: `1px solid ${color}40`,
    padding: "1px 7px", borderRadius: 6, whiteSpace: "nowrap", display: "inline-block", lineHeight: 1.6 }}>{label}</span>
);
// 카드: 은은한 그림자로 층위를 주되 과하지 않게. 클릭 카드만 테두리·그림자로 반응.
const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 18,
    boxShadow: "0 1px 2px rgba(43,42,40,.04)",
    cursor: onClick ? "pointer" : "default", transition: "border-color .15s, box-shadow .15s", ...style }}
    onMouseEnter={e => { if (onClick) { e.currentTarget.style.borderColor = C.sub; e.currentTarget.style.boxShadow = "0 2px 8px rgba(43,42,40,.07)"; } }}
    onMouseLeave={e => { if (onClick) { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.boxShadow = "0 1px 2px rgba(43,42,40,.04)"; } }}>
    {children}
  </div>
);
const H2 = ({ children }) => <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 16px", color: C.text, letterSpacing: "-.01em", lineHeight: 1.3 }}>{children}</h2>;
const Label = ({ children }) => <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, marginBottom: 6 }}>{children}</div>;
// 주요 버튼 = 진한 잉크(무채색) 솔리드. 초록은 CTA 채움색이 아니라 '진행·현재' 표시로만 쓴다.
const Btn = ({ children, primary, small, onClick, disabled, style, title }) => (
  <button onClick={onClick} disabled={disabled} title={title}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = primary ? "#3A3832" : C.accent; }}
    onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = primary ? C.text : C.panel; }}
    style={{
      fontFamily: font, fontSize: small ? 12 : 13.5, fontWeight: 600, padding: small ? "6px 12px" : "9px 16px",
      borderRadius: 8, border: primary ? `1px solid ${C.text}` : `1px solid ${C.line}`, cursor: disabled ? "not-allowed" : "pointer",
      background: disabled ? C.lineSoft : primary ? C.text : C.panel, color: disabled ? C.faint : primary ? "#fff" : C.text,
      transition: "background .12s, border-color .12s", ...style }}>
    {children}
  </button>
);
// 입력 포커스는 은은하게 — 테두리만 진하게, 발광 링 없음
const Input = ({ style, onFocus, onBlur, ...props }) => (
  <input {...props}
    onFocus={e => { e.currentTarget.style.borderColor = C.sub; onFocus && onFocus(e); }}
    onBlur={e => { e.currentTarget.style.borderColor = C.line; onBlur && onBlur(e); }}
    style={{ fontFamily: font, fontSize: 13.5, padding: "9px 12px", borderRadius: 10, border: `1px solid ${C.line}`,
      width: "100%", boxSizing: "border-box", background: C.panel, color: C.text, outline: "none",
      transition: "border-color .15s", ...style }} />
);
const Textarea = ({ style, onFocus, onBlur, ...props }) => (
  <textarea {...props}
    onFocus={e => { e.currentTarget.style.borderColor = C.sub; onFocus && onFocus(e); }}
    onBlur={e => { e.currentTarget.style.borderColor = C.line; onBlur && onBlur(e); }}
    style={{ fontFamily: font, fontSize: 13.5, lineHeight: 1.7, padding: "10px 12px", borderRadius: 10,
      border: `1px solid ${C.line}`, width: "100%", boxSizing: "border-box", background: C.panel, color: C.text, outline: "none",
      resize: "vertical", minHeight: 84, transition: "border-color .15s", ...style }} />
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
/* ---------- 로컬 저장(localStorage) 지속성 훅 ---------- */
const STORAGE_PREFIX = "careeros:";
function useIsMobile(breakpoint = 820) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < breakpoint);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

/* ============================================================ 퍼스널 브랜딩 — Supabase 연결 ============================================================ */
// 동적 import: Claude.ai 아티팩트 미리보기 등 @supabase/supabase-js가 없는 환경에서도
// 나머지 Career OS 기능이 깨지지 않도록 방어. 배포된 사이트(Vercel + 환경변수)에서만 실제로 연결된다.
let _cloudSupabasePromise = null;
function getCloudClient() {
  if (_cloudSupabasePromise) return _cloudSupabasePromise;
  _cloudSupabasePromise = (async () => {
    let url, anonKey;
    try {
      url = typeof import.meta !== "undefined" ? import.meta.env?.VITE_SUPABASE_URL : undefined;
      anonKey = typeof import.meta !== "undefined" ? import.meta.env?.VITE_SUPABASE_ANON_KEY : undefined;
    } catch { /* import.meta 미지원 환경 */ }
    if (!url || !anonKey) return null;
    try {
      const mod = await import("@supabase/supabase-js");
      return mod.createClient(url, anonKey);
    } catch {
      return null;
    }
  })();
  return _cloudSupabasePromise;
}

let _cloudAuthPromise = null;
function ensureCloudAuth(supabase) {
  if (!supabase) return Promise.resolve({ user: null, error: "Supabase 클라이언트가 없습니다 (환경변수 미설정)" });
  if (_cloudAuthPromise) return _cloudAuthPromise;
  _cloudAuthPromise = (async () => {
    try {
      const { data: { session }, error: sessErr } = await supabase.auth.getSession();
      if (sessErr) return { user: null, error: `세션 확인 실패: ${sessErr.message}` };
      if (session?.user) return { user: session.user, error: null };
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) return { user: null, error: `익명 로그인 실패: ${error.message}` };
      if (!data?.user) return { user: null, error: "익명 로그인 응답에 사용자 정보가 없습니다." };
      return { user: data.user, error: null };
    } catch (e) {
      return { user: null, error: `연결 중 예외 발생: ${e.message || String(e)}` };
    }
  })();
  return _cloudAuthPromise;
}
function resetCloudAuth() { _cloudAuthPromise = null; }

let _lastCloudAuthError = null;
function setLastCloudAuthError(msg) { _lastCloudAuthError = msg; }
function getLastCloudAuthError() { return _lastCloudAuthError; }

/* ---------- 로그인(이메일) — 기기 간 동기화용 ---------- */
// 현재 세션의 사용자 (익명이면 is_anonymous=true, 로그인하면 email 있음)
async function getAuthUser() {
  const supabase = await getCloudClient();
  if (!supabase) return null;
  try { const { data: { session } } = await supabase.auth.getSession(); return session?.user || null; }
  catch { return null; }
}
async function authSignIn(email, password) {
  const supabase = await getCloudClient();
  if (!supabase) throw new Error("클라우드(Supabase)가 설정되어 있지 않습니다.");
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  return data.user;
}
// 회원가입: 현재 익명 계정이면 이메일/비번을 붙여 '승격'(기존 데이터 그대로 유지). 아니면 일반 가입.
async function authSignUp(email, password) {
  const supabase = await getCloudClient();
  if (!supabase) throw new Error("클라우드(Supabase)가 설정되어 있지 않습니다.");
  const em = email.trim();
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.is_anonymous) {
      const { data, error } = await supabase.auth.updateUser({ email: em, password });
      if (!error) return { user: data.user, upgraded: true };
      // 이미 가입된 이메일 등으로 승격 실패 시 아래 일반 가입으로 폴백
    }
  } catch { /* 폴백 진행 */ }
  const { data, error } = await supabase.auth.signUp({ email: em, password });
  if (error) throw error;
  return { user: data.user, upgraded: false };
}
async function authSignOut() {
  const supabase = await getCloudClient();
  if (supabase) { try { await supabase.auth.signOut(); } catch { /* 무시 */ } }
  resetCloudAuth();
}

/* ---------- 브랜딩 데이터 CRUD (Supabase) ---------- */
async function baGetOrCreateAnswer(supabase, userId, question) {
  const { data: existing, error: selErr } = await supabase.from("branding_answers")
    .select("*").eq("user_id", userId).eq("question_id", question.id).maybeSingle();
  if (selErr) throw selErr;
  if (existing) return existing;
  const { data, error } = await supabase.from("branding_answers")
    .insert({ user_id: userId, question_id: question.id, category: question.category, step: question.step })
    .select().single();
  if (error) throw error;
  return data;
}
async function baSetAnswerStatus(supabase, answerId, status) {
  const { error } = await supabase.from("branding_answers").update({ status }).eq("id", answerId);
  if (error) throw error;
}
async function baListEntries(supabase, answerId) {
  const { data, error } = await supabase.from("branding_answer_entries")
    .select("*, branding_followups(*)").eq("answer_id", answerId).order("seq");
  if (error) throw error;
  return (data || []).map(e => ({ ...e, branding_followups: (e.branding_followups || []).sort((a, b) => a.depth - b.depth) }));
}
async function baNextSeq(supabase, answerId) {
  const { data, error } = await supabase.from("branding_answer_entries")
    .select("seq").eq("answer_id", answerId).order("seq", { ascending: false }).limit(1);
  if (error) throw error;
  return (data?.[0]?.seq || 0) + 1;
}
async function baAddEntry(supabase, userId, answerId, { label, content }) {
  const seq = await baNextSeq(supabase, answerId);
  const { data, error } = await supabase.from("branding_answer_entries")
    .insert({ user_id: userId, answer_id: answerId, seq, label: label || null, content, state: "active" })
    .select().single();
  if (error) throw error;
  return data;
}
async function baUpdateEntry(supabase, entryId, patch) {
  const { data, error } = await supabase.from("branding_answer_entries").update(patch).eq("id", entryId).select().single();
  if (error) throw error;
  return data; // stale 처리는 DB 트리거(mark_items_stale)가 자동 수행
}
async function baAddFollowup(supabase, userId, entryId, { depth, origin, probeType, question }) {
  const { data, error } = await supabase.from("branding_followups")
    .insert({ user_id: userId, entry_id: entryId, depth, origin: origin || "ai", probe_type: probeType || null, question })
    .select().single();
  if (error) throw error;
  return data;
}
async function baPatchFollowup(supabase, followupId, patch) {
  const { data, error } = await supabase.from("branding_followups").update(patch).eq("id", followupId).select().single();
  if (error) throw error;
  return data;
}
async function baInsertProfileItems(supabase, userId, items, sourceEntryId) {
  const rows = (items || []).filter(it => !it.merge_into).map(it => ({
    user_id: userId, type: it.type, content: it.content, confidence: it.confidence || "medium",
    evidence: it.evidence || null, source_entry_ids: [sourceEntryId], status: "제안", origin: "ai",
  }));
  if (rows.length === 0) return [];
  const { data, error } = await supabase.from("branding_profile_items").insert(rows).select();
  if (error) throw error;
  return data;
}
async function baInsertConsolidatedItems(supabase, userId, constants, entries) {
  const seqToId = Object.fromEntries(entries.map(e => [e.seq, e.id]));
  const rows = (constants || []).map(c => ({
    user_id: userId, type: "pattern", content: c.content, confidence: "high",
    evidence: null, source_entry_ids: (c.seqs || []).map(s => seqToId[s]).filter(Boolean),
    status: "제안", origin: "consolidate",
  }));
  if (rows.length === 0) return [];
  const { data, error } = await supabase.from("branding_profile_items").insert(rows).select();
  if (error) throw error;
  return data;
}
async function baListProfileItems(supabase, userId) {
  const { data, error } = await supabase.from("branding_profile_items")
    .select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
async function baUpdateProfileItem(supabase, itemId, patch) {
  const { data, error } = await supabase.from("branding_profile_items").update(patch).eq("id", itemId).select().single();
  if (error) throw error;
  return data;
}
async function baAddManualProfileItem(supabase, userId, { type, content }) {
  const { data, error } = await supabase.from("branding_profile_items")
    .insert({ user_id: userId, type, content, status: "제안", origin: "user", confidence: "medium" })
    .select().single();
  if (error) throw error;
  return data;
}
async function baListAnswersWithEntries(supabase, userId) {
  const { data, error } = await supabase.from("branding_answers")
    .select("*, branding_answer_entries(id, state)").eq("user_id", userId);
  if (error) throw error;
  return data || [];
}
async function baSaveOutput(supabase, userId, output) {
  await supabase.from("branding_outputs").update({ is_current: false }).eq("user_id", userId).eq("is_current", true);
  const { data: last } = await supabase.from("branding_outputs")
    .select("version").eq("user_id", userId).order("version", { ascending: false }).limit(1);
  const version = (last?.[0]?.version || 0) + 1;
  const { data, error } = await supabase.from("branding_outputs")
    .insert({ user_id: userId, version, is_current: true, ...output }).select().single();
  if (error) throw error;
  return data;
}
async function baGetCurrentOutput(supabase, userId) {
  const { data } = await supabase.from("branding_outputs").select("*").eq("user_id", userId).eq("is_current", true).maybeSingle();
  return data;
}
async function baCallAI(endpoint, body) {
  const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  let data;
  try { data = await res.json(); }
  catch { throw new Error(`서버 응답을 읽지 못했습니다 (HTTP ${res.status})`); }
  if (!res.ok) {
    throw new Error(data?.error?.message || (typeof data?.error === "string" ? data.error : null) || `API 오류 (HTTP ${res.status})`);
  }
  const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
  if (!text) throw new Error("응답에 내용이 없습니다.");
  return parseAIJson(text);
}

function usePersisted(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
      if (raw != null) return JSON.parse(raw);
    } catch (e) { /* 저장소 접근 불가 시 기본값으로 진행 */ }
    return initialValue;
  });
  const [cloudStatus, setCloudStatus] = useState("idle"); // idle | syncing | synced | offline | error
  const lastSyncedRef = useRef(null);
  const cloudReadyRef = useRef(false);

  // 1) 로컬 저장 — 항상 즉시 (Supabase 연결 여부와 무관하게 안전망 역할)
  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(state)); }
    catch (e) { /* 저장 실패해도 앱은 계속 동작 */ }
  }, [key, state]);

  // 2) 클라우드에서 최초 1회 불러오기 (Supabase 설정된 경우만)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = await getCloudClient();
      if (!supabase) { setCloudStatus("offline"); return; }
      const { user, error: authErr } = await ensureCloudAuth(supabase);
      if (!user || cancelled) {
        if (authErr) setLastCloudAuthError(authErr);
        setCloudStatus("offline");
        return;
      }
      try {
        const { data, error } = await supabase.from("career_os_state")
          .select("value").eq("user_id", user.id).eq("key", key).maybeSingle();
        if (cancelled) return;
        if (error) throw error;
        if (data && data.value !== null && data.value !== undefined) {
          setState(data.value);
          lastSyncedRef.current = JSON.stringify(data.value);
        } else {
          // 클라우드에 아직 없으면 지금 로컬 값을 최초 1회 업로드 (마이그레이션)
          await supabase.from("career_os_state").upsert({ user_id: user.id, key, value: state });
          lastSyncedRef.current = JSON.stringify(state);
        }
        cloudReadyRef.current = true;
        setCloudStatus("synced");
      } catch (e) {
        console.error("[cloud sync 실패]", key, e);
        setLastCloudAuthError(e.message || String(e));
        setCloudStatus("error");
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // 3) 이후 변경분을 클라우드로 반영 (디바운스)
  useEffect(() => {
    if (!cloudReadyRef.current) return;
    const serialized = JSON.stringify(state);
    if (serialized === lastSyncedRef.current) return;
    setCloudStatus("syncing");
    const t = setTimeout(async () => {
      const supabase = await getCloudClient();
      if (!supabase) return;
      const { user } = await ensureCloudAuth(supabase);
      if (!user) return;
      try {
        await supabase.from("career_os_state").upsert({ user_id: user.id, key, value: state });
        lastSyncedRef.current = serialized;
        setCloudStatus("synced");
      } catch (e) {
        console.error("[cloud sync 실패]", key, e);
        setCloudStatus("error");
      }
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return [state, setState, cloudStatus];
}

/* ---------- 로그인 위젯 · 모달 ---------- */
function translateAuthError(m) {
  const s = (m || "").toLowerCase();
  if (s.includes("invalid login")) return "이메일 또는 비밀번호가 올바르지 않아요.";
  if (s.includes("already registered") || s.includes("already been registered")) return "이미 가입된 이메일이에요. 아래 '로그인'으로 들어오세요.";
  if (s.includes("email not confirmed")) return "이메일 확인이 필요해요. 받은 메일의 링크를 눌러 확인해주세요.";
  if (s.includes("password") && s.includes("6")) return "비밀번호는 6자 이상이어야 해요.";
  if (s.includes("anonymous")) return "익명 사용이 꺼져 있어요. Supabase 설정을 확인해주세요.";
  if (s.includes("설정되어 있지 않")) return m;
  return m || "알 수 없는 오류가 발생했어요.";
}
function AuthWidget() {
  const [user, setUser] = useState(undefined); // undefined=로딩, null=비로그인/익명, {email}=로그인됨
  const [open, setOpen] = useState(false);
  useEffect(() => { getAuthUser().then(u => setUser(u && !u.is_anonymous && u.email ? u : null)).catch(() => setUser(null)); }, []);
  if (user === undefined) return null;
  return (
    <>
      {user ? (
        <div style={{ fontSize: 11, color: C.faint, lineHeight: 1.6 }}>
          <span style={{ color: C.sub, fontWeight: 600 }}>{user.email}</span> 로그인됨{" "}
          <span onClick={async () => { await authSignOut(); window.location.reload(); }} style={{ cursor: "pointer", textDecoration: "underline" }}>로그아웃</span>
        </div>
      ) : (
        <span onClick={() => setOpen(true)} style={{ fontSize: 11, color: C.sub, cursor: "pointer", textDecoration: "underline", fontWeight: 600 }}>
          로그인 / 회원가입 (기기 간 동기화)
        </span>
      )}
      {open && <AuthModal onClose={() => setOpen(false)} />}
    </>
  );
}
function AuthModal({ onClose }) {
  const [mode, setMode] = useState("signup"); // signup | signin
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const submit = async () => {
    if (!email.trim() || !pw) { setErr("이메일과 비밀번호를 입력해주세요."); return; }
    setErr(""); setMsg(""); setBusy(true);
    try {
      if (mode === "signin") {
        await authSignIn(email, pw);
        window.location.reload();
      } else {
        const r = await authSignUp(email, pw);
        if (r.upgraded || r.user?.email_confirmed_at || r.user?.confirmed_at) {
          window.location.reload();
        } else {
          setMsg("가입 확인 메일을 보냈어요. 메일의 링크를 누르면 완료됩니다.\n(Supabase에서 이메일 확인이 꺼져 있으면 바로 '로그인'하면 돼요.)");
        }
      }
    } catch (e) {
      setErr(translateAuthError(e.message || String(e)));
    } finally { setBusy(false); }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(38,37,31,.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16, padding: 22, width: 380, maxWidth: "100%", boxShadow: "0 8px 30px rgba(38,37,31,.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>{mode === "signup" ? "회원가입" : "로그인"}</div>
          <span onClick={onClose} style={{ cursor: "pointer", color: C.faint, fontSize: 15 }}>✕</span>
        </div>
        <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.6, marginBottom: 16 }}>
          {mode === "signup"
            ? "지금 이 브라우저의 데이터를 그대로 계정에 저장하고, 다른 기기(폰 등)에서도 같은 데이터를 열 수 있게 합니다."
            : "다른 기기에서 만든 계정으로 들어옵니다. 이 브라우저에는 그 계정의 데이터가 표시돼요."}
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <div><Label>이메일</Label><Input type="email" value={email} placeholder="you@example.com" onChange={e => setEmail(e.target.value)} /></div>
          <div><Label>비밀번호 {mode === "signup" && <span style={{ color: C.faint, fontWeight: 400 }}>(6자 이상)</span>}</Label>
            <Input type="password" value={pw} placeholder="비밀번호" onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()} /></div>
        </div>
        {err && <div style={{ fontSize: 12.5, color: C.red, marginTop: 10, whiteSpace: "pre-wrap" }}>{err}</div>}
        {msg && <div style={{ fontSize: 12.5, color: C.green, marginTop: 10, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{msg}</div>}
        <Btn primary onClick={submit} disabled={busy} style={{ width: "100%", marginTop: 16, justifyContent: "center" }}>
          {busy ? "처리 중…" : mode === "signup" ? "이 데이터로 계정 만들기" : "로그인"}
        </Btn>
        <div style={{ fontSize: 12, color: C.sub, textAlign: "center", marginTop: 12 }}>
          {mode === "signup" ? "이미 계정이 있나요? " : "계정이 없나요? "}
          <span onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setErr(""); setMsg(""); }} style={{ cursor: "pointer", color: C.text, fontWeight: 700, textDecoration: "underline" }}>
            {mode === "signup" ? "로그인" : "회원가입"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [nav, setNav] = useState("home"); // home | analyze | archive | apply | resume
  const backupInputRef = useRef(null);
  const [experiences, setExperiences, cloudStatus] = usePersisted("experiences", []);
  const [metrics, setMetrics] = usePersisted("metrics", []);
  const [outputs, setOutputs] = usePersisted("outputs", []);
  const [applications, setApplications] = usePersisted("applications", []);
  const [skills, setSkills] = usePersisted("skills", []);
  const [certs, setCerts] = usePersisted("certs", []);
  const [awards, setAwards] = usePersisted("awards", []);
  const [resumeProfile, setResumeProfile] = usePersisted("resumeProfile", { name: "", targetRole: "", headline: "", phone: "", email: "" });
  const [detailId, setDetailId] = useState(null);     // 경험 상세
  const [appDetailId, setAppDetailId] = useState(null); // 지원 상세
  const [analyzeId, setAnalyzeId] = useState(null);   // 분석 중 경험
  const [trash, setTrash] = usePersisted("trash", []); // { id, type, label, deletedAt, payload }
  const [masterEssays, setMasterEssays] = usePersisted("masterEssays", seedMasterEssays);
  const [masterInterviews, setMasterInterviews] = usePersisted("masterInterviews", seedMasterInterviews);
  const [interviewCategories, setInterviewCategories] = usePersisted("interviewCategories", ["성과", "실패", "협업", "갈등", "인성"]);
  const [expCategories, setExpCategories] = usePersisted("expCategories", ["온라인 쇼핑몰 인턴", "동아리 활동"]);
  const [questionBlocks, setQuestionBlocks] = usePersisted("questionBlocks", emptyQuestionBlocks);
  const [timelineActivities, setTimelineActivities] = usePersisted("timelineActivities", []);
  const [reviewChatHistory, setReviewChatHistory] = usePersisted("reviewChatHistory", []);
  const [personalChatHistory, setPersonalChatHistory] = usePersisted("personalChatHistory", []);
  const addInterviewCategory = (c) => setInterviewCategories(prev => prev.includes(c) ? prev : [...prev, c]);
  const addExpCategory = (c) => setExpCategories(prev => prev.includes(c) ? prev : [...prev, c]);

  const isBlankSlate = experiences.length === 0 && applications.length === 0 && skills.length === 0 && certs.length === 0;
  const loadDemoData = () => {
    // 데모 데이터의 완성도·상태를 현재 규칙으로 재계산해 표시가 실제 내용과 일치하도록
    setExperiences(seedExperiences.map(e => ({ ...e, completion: recomputeCompletion(e, seedMetrics), status: deriveStatus(e, seedMetrics) })));
    setMetrics(seedMetrics);
    setOutputs(seedOutputs);
    setApplications(seedApplications);
    setSkills(seedSkills);
    setCerts(seedCerts);
    setQuestionBlocks(seedQuestionBlocks);
  };

  const exportBackup = () => {
    const payload = {
      _type: "career-os-backup", _version: 1, exportedAt: new Date().toISOString(),
      experiences, metrics, outputs, applications, skills, certs, awards,
      resumeProfile, masterEssays, masterInterviews, interviewCategories,
      expCategories, questionBlocks,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `career-os-백업-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const importBackup = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const d = JSON.parse(reader.result);
        if (d._type !== "career-os-backup") throw new Error("Career OS 백업 파일이 아닙니다.");
        if (!window.confirm("불러오면 현재 데이터를 덮어씁니다. 계속할까요?")) return;
        if (d.experiences) setExperiences(d.experiences);
        if (d.metrics) setMetrics(d.metrics);
        if (d.outputs) setOutputs(d.outputs);
        if (d.applications) setApplications(d.applications);
        if (d.skills) setSkills(d.skills);
        if (d.certs) setCerts(d.certs);
        if (d.awards) setAwards(d.awards);
        if (d.resumeProfile) setResumeProfile(d.resumeProfile);
        if (d.masterEssays) setMasterEssays(d.masterEssays);
        if (d.masterInterviews) setMasterInterviews(d.masterInterviews);
        if (d.interviewCategories) setInterviewCategories(d.interviewCategories);
        if (d.expCategories) setExpCategories(d.expCategories);
        if (d.questionBlocks) setQuestionBlocks(d.questionBlocks);
        alert("백업을 불러왔습니다.");
      } catch (err) {
        alert("백업 파일을 읽지 못했습니다: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const addTrash = (type, label, payload) => setTrash(prev => [
    { id: "t_" + Date.now() + Math.random().toString(36).slice(2, 6), type, label, deletedAt: new Date().toISOString(), payload },
    ...prev,
  ]);
  const restoreTrash = (id) => {
    const entry = trash.find(t => t.id === id);
    if (!entry) return;
    const { type, payload } = entry;
    if (type === "experience") setExperiences(prev => [...prev, payload]);
    else if (type === "skill") setSkills(prev => [...prev, payload]);
    else if (type === "cert") setCerts(prev => [...prev, payload]);
    else if (type === "award") setAwards(prev => [...prev, payload]);
    else if (type === "application") setApplications(prev => [...prev, payload]);
    else if (type === "requirement") setApplications(prev => prev.map(a => a.id === payload.appId ? { ...a, requirements: [...a.requirements, payload.item] } : a));
    else if (type === "essay") setApplications(prev => prev.map(a => a.id === payload.appId ? { ...a, essays: [...a.essays, payload.item] } : a));
    else if (type === "interview") setApplications(prev => prev.map(a => a.id === payload.appId ? { ...a, interviews: [...a.interviews, payload.item] } : a));
    else if (type === "timeline_activity") setTimelineActivities(prev => [...prev, payload]);
    setTrash(prev => prev.filter(t => t.id !== id));
  };
  const purgeTrash = (id) => setTrash(prev => prev.filter(t => t.id !== id));
  const clearTrash = () => setTrash([]);

  const go = (n) => { setNav(n); setDetailId(null); setAppDetailId(null); if (n !== "analyze") setAnalyzeId(null); };

  const openAnalyze = (id) => { setAnalyzeId(id); setNav("analyze"); setDetailId(null); };
  const openDetail = (id) => { setDetailId(id); setNav("archive"); };

  const menuGroups = [
    { label: "시작", items: [["home", "홈"], ["guide", "사용 가이드"], ["chat", "AI에게 물어보기"]] },
    { label: "경험 정리", items: [["timeline", "타임라인"], ["import", "파일 가져오기"], ["analyze", "경험 분석"], ["archive", "경험 보관함"], ["skills", "역량·스킬"]] },
    { label: "브랜딩", items: [["branding", "퍼스널 브랜딩"]] },
    { label: "지원 준비", items: [["apply", "지원 관리"], ["master", "자소서·면접 준비"], ["resume", "기본 이력서"]] },
    { label: "기타", items: [["trash", "휴지통"]] },
  ];
  const [openGroups, setOpenGroups] = useState(() => Object.fromEntries(menuGroups.map(g => [g.label, true])));
  const toggleGroup = (label) => setOpenGroups(p => ({ ...p, [label]: !p[label] }));
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div style={{ fontFamily: font, background: C.bg, minHeight: "100vh", display: "flex", flexDirection: isMobile ? "column" : "row", color: C.text }}>
      {/* Sidebar */}
      <aside style={{
        width: isMobile ? "100%" : 208, background: C.panel,
        borderRight: isMobile ? "none" : `1px solid ${C.line}`,
        borderBottom: isMobile ? `1px solid ${C.line}` : "none",
        padding: isMobile ? "14px 16px" : "22px 14px",
        position: isMobile ? "static" : "sticky", top: 0,
        height: isMobile ? "auto" : "100vh", boxSizing: "border-box", flexShrink: 0,
        overflowY: isMobile ? "visible" : "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-.01em" }}>Career OS</div>
            {!isMobile && <div style={{ fontSize: 11.5, color: C.faint, marginTop: 4, marginBottom: 20 }}>경험 분석 · 재사용</div>}
          </div>
          {isMobile && (
            <Btn small onClick={() => setMobileMenuOpen(o => !o)}>{mobileMenuOpen ? "메뉴 접기 ▴" : "메뉴 ▾"}</Btn>
          )}
        </div>
        {(!isMobile || mobileMenuOpen) && (
          <div style={{ marginTop: isMobile ? 12 : 4 }}>
            {menuGroups.map((g, gi) => (
              <div key={g.label} style={{ marginBottom: 4, marginTop: gi === 0 ? 0 : 14, paddingTop: gi === 0 ? 0 : 14, borderTop: gi === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                <div onClick={() => toggleGroup(g.label)} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 10px 8px",
                  fontSize: 10.5, fontWeight: 700, color: C.faint, letterSpacing: ".07em", cursor: "pointer" }}>
                  <span>{g.label.toUpperCase()}</span>
                  <span style={{ fontSize: 9, color: C.faint, transform: openGroups[g.label] ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform .1s" }}>▾</span>
                </div>
                {openGroups[g.label] && g.items.map(([k, l]) => (
                  <div key={k} onClick={() => { go(k); if (isMobile) setMobileMenuOpen(false); }}
                    onMouseEnter={e => { if (nav !== k) e.currentTarget.style.background = C.accent; }}
                    onMouseLeave={e => { if (nav !== k) e.currentTarget.style.background = "transparent"; }}
                    style={{
                    position: "relative", padding: "8px 10px 8px 16px", fontSize: 13.5, fontWeight: nav === k ? 700 : 500, cursor: "pointer",
                    color: nav === k ? C.text : C.sub, marginBottom: 1, borderRadius: 10, transition: "background .12s, color .12s",
                    background: nav === k ? C.lineSoft : "transparent" }}>
                    {nav === k && <span style={{ position: "absolute", left: 4, top: "50%", transform: "translateY(-50%)", width: 3, height: 14, borderRadius: 99, background: C.green }} />}
                    {l}
                  </div>
                ))}
              </div>
            ))}
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.lineSoft}` }}>
              <div style={{ fontSize: 11, color: C.faint, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: 99, background:
                  cloudStatus === "synced" ? C.green : cloudStatus === "syncing" ? C.blue : cloudStatus === "error" ? C.red : C.faint }} />
                {cloudStatus === "synced" ? "클라우드에 저장됨" : cloudStatus === "syncing" ? "동기화 중…" : cloudStatus === "error" ? "동기화 실패 (로컬엔 저장됨)" : "이 브라우저에만 저장됨"}
              </div>
              <div style={{ marginBottom: 10 }}><AuthWidget /></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span onClick={exportBackup} style={{ fontSize: 11, color: C.faint, cursor: "pointer", textDecoration: "underline" }}>
                  데이터 백업 (다운로드)
                </span>
                <span onClick={() => backupInputRef.current?.click()} style={{ fontSize: 11, color: C.faint, cursor: "pointer", textDecoration: "underline" }}>
                  백업 불러오기
                </span>
                <input ref={backupInputRef} type="file" accept="application/json" style={{ display: "none" }}
                  onChange={e => { const f = e.target.files[0]; if (f) importBackup(f); e.target.value = ""; }} />
                <span onClick={async () => {
                  if (!window.confirm("저장된 모든 데이터를 지우고 초기 상태로 되돌릴까요? (클라우드에 저장된 데이터도 함께 지워집니다) 되돌릴 수 없습니다.")) return;
                  Object.keys(window.localStorage).filter(k => k.startsWith(STORAGE_PREFIX)).forEach(k => window.localStorage.removeItem(k));
                  try {
                    const supabase = await getCloudClient();
                    if (supabase) {
                      const user = await ensureCloudAuth(supabase);
                      if (user) await supabase.from("career_os_state").delete().eq("user_id", user.id);
                    }
                  } catch (e) { console.error("[클라우드 초기화 실패]", e); }
                  window.location.reload();
                }} style={{ fontSize: 11, color: C.faint, cursor: "pointer", textDecoration: "underline" }}>
                  전체 데이터 초기화
                </span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: isMobile ? "16px" : "26px 32px", maxWidth: 1120, minWidth: 0 }}>
        {nav === "home" && <Home experiences={experiences} applications={applications} onGoAnalyze={() => go("analyze")} onGoImport={() => go("import")} onOpenDetail={openDetail} onOpenApp={id => { setNav("apply"); setAppDetailId(id); }} isBlankSlate={isBlankSlate} onLoadDemo={loadDemoData} onGoGuide={() => go("guide")} />}
        {nav === "guide" && <Guide onGo={go} />}
        {nav === "chat" && <PersonalAssistant experiences={experiences} skills={skills} certs={certs} awards={awards} resumeProfile={resumeProfile} applications={applications} metrics={metrics}
          history={personalChatHistory} setHistory={setPersonalChatHistory} onGo={go} />}
        {nav === "analyze" && <Analyze experiences={experiences} setExperiences={setExperiences} analyzeId={analyzeId} setAnalyzeId={setAnalyzeId} metrics={metrics} setMetrics={setMetrics} onDone={openDetail} />}
        {nav === "archive" && !detailId && <Archive experiences={experiences} setExperiences={setExperiences} metrics={metrics} setMetrics={setMetrics} outputs={outputs} setOutputs={setOutputs} onOpen={openDetail} onAnalyze={openAnalyze} onGoImport={() => go("import")} addTrash={addTrash} expCategories={expCategories} addExpCategory={addExpCategory} questionBlocks={questionBlocks} setQuestionBlocks={setQuestionBlocks} reviewChatHistory={reviewChatHistory} setReviewChatHistory={setReviewChatHistory} />}
        {nav === "archive" && detailId && <ExperienceDetail exp={experiences.find(e => e.id === detailId)} metrics={metrics} setMetrics={setMetrics} outputs={outputs} setOutputs={setOutputs} setExperiences={setExperiences} onBack={() => setDetailId(null)} onAnalyze={openAnalyze} onDeleted={() => setDetailId(null)} addTrash={addTrash} />}
        {nav === "timeline" && <Timeline experiences={experiences} setExperiences={setExperiences} activities={timelineActivities} setActivities={setTimelineActivities} addTrash={addTrash} onOpenExp={openDetail} onAnalyze={openAnalyze} onGoArchive={() => go("archive")} />}
        {nav === "import" && <ImportFlow setExperiences={setExperiences} setSkills={setSkills} setCerts={setCerts} setResumeProfile={setResumeProfile} onDone={openDetail} experiences={experiences} />}
        {nav === "skills" && <Skills skills={skills} setSkills={setSkills} experiences={experiences} onOpenExp={openDetail} addTrash={addTrash} />}
        {nav === "branding" && <BrandingHub experiences={experiences} metrics={metrics} applications={applications} />}
        {nav === "apply" && !appDetailId && <Applications applications={applications} setApplications={setApplications} onOpen={setAppDetailId} addTrash={addTrash} />}
        {nav === "apply" && appDetailId && <ApplicationDetail app={applications.find(a => a.id === appDetailId)} setApplications={setApplications} experiences={experiences} outputs={outputs} metrics={metrics} onBack={() => setAppDetailId(null)} onOpenExp={openDetail} addTrash={addTrash} interviewCategories={interviewCategories} addInterviewCategory={addInterviewCategory} />}
        {nav === "master" && <MasterPrep essays={masterEssays} setEssays={setMasterEssays} interviews={masterInterviews} setInterviews={setMasterInterviews} experiences={experiences} metrics={metrics} resumeProfile={resumeProfile} interviewCategories={interviewCategories} addInterviewCategory={addInterviewCategory} />}
        {nav === "resume" && <Resume experiences={experiences} outputs={outputs} metrics={metrics} resumeProfile={resumeProfile} setResumeProfile={setResumeProfile} skills={skills} certs={certs} setCerts={setCerts} awards={awards} setAwards={setAwards} addTrash={addTrash} />}
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
/* ============================================================ 타임라인 ============================================================ */
function ymToIndex(ym) { // "2024-08" -> 2024*12+8 (오래될수록 작은 수)
  if (!ym) return null;
  const [y, m] = ym.split("-").map(Number);
  if (!y) return null;
  return y * 12 + (m || 1);
}
function indexToYM(idx) {
  const y = Math.floor((idx - 1) / 12);
  const m = idx - y * 12;
  return { y, m };
}
function nowYM() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// 겹치지 않으면 최대한 왼쪽(레인 0)에, 겹치면 다음 레인으로 배치하는 그리디 알고리즘
function assignLanes(items) {
  const sorted = [...items].sort((a, b) => a.startIdx - b.startIdx);
  const laneEnds = [];
  for (const item of sorted) {
    let placed = false;
    for (let i = 0; i < laneEnds.length; i++) {
      if (item.startIdx > laneEnds[i]) {
        item.lane = i; laneEnds[i] = item.endIdx; placed = true; break;
      }
    }
    if (!placed) { item.lane = laneEnds.length; laneEnds.push(item.endIdx); }
  }
  return sorted;
}

function makeDraftExperience(title, ym, endYm) {
  const id = "e_" + Date.now() + Math.random().toString(36).slice(2, 5);
  return {
    id, title: title || "(제목 없음)", organization: "", experienceType: "other",
    startDate: ym, endDate: endYm || ym, status: "draft", depthDone: false, usageCount: 0,
    updatedAt: new Date().toISOString().slice(0, 10), primaryCategory: "",
    competencies: [], tags: [], actions: [], context: "", assignedTask: "", discoveredProblem: "", goal: "", personalContribution: "",
    contributionLevel: "", contributionEvidence: "", coreMessage: "", oneLineSummary: "",
    completion: Object.fromEntries([...CORE_STEPS, ...DEPTH_STEPS].map(s => [s, "미입력"])),
  };
}

const TIMELINE_ROW_H = 30;
const TIMELINE_START_YM = "2021-01";

function Timeline({ experiences, setExperiences, activities, setActivities, addTrash, onOpenExp, onAnalyze, onGoArchive }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filter, setFilter] = useState("all"); // all | unorganized
  const [selected, setSelected] = useState(new Set());
  const laneScrollRef = useRef(null);
  const scrollLanes = (dir) => { if (laneScrollRef.current) laneScrollRef.current.scrollBy({ left: dir * 320, behavior: "smooth" }); };

  const startIdx = ymToIndex(TIMELINE_START_YM);
  const endIdx = ymToIndex(nowYM());
  const totalRows = endIdx - startIdx + 1;

  const addActivity = () => {
    if (!title.trim() || !date) return;
    const finalEnd = endDate && endDate >= date ? endDate : date;
    setActivities(prev => [...prev, { id: "act_" + Date.now(), title: title.trim(), date, endDate: finalEnd, organized: false, linkedExpId: null }]);
    setTitle(""); setDate(""); setEndDate("");
  };

  const toggleSelect = (key) => setSelected(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  const selectedActivities = activities.filter(a => selected.has("a_" + a.id));

  const organizeSelected = () => {
    if (selectedActivities.length === 0) return;
    if (selectedActivities.length === 1) {
      const a = selectedActivities[0];
      const draft = makeDraftExperience(a.title, a.date.slice(0, 7), (a.endDate || a.date).slice(0, 7));
      setExperiences(prev => [...prev, draft]);
      setActivities(prev => prev.map(x => x.id === a.id ? { ...x, organized: true, linkedExpId: draft.id } : x));
      setSelected(new Set());
      onAnalyze(draft.id);
      return;
    }
    const newIds = [];
    setExperiences(prev => {
      const drafts = selectedActivities.map(a => makeDraftExperience(a.title, a.date.slice(0, 7), (a.endDate || a.date).slice(0, 7)));
      drafts.forEach(d => newIds.push(d.id));
      return [...prev, ...drafts];
    });
    setActivities(prev => prev.map(x => {
      const i = selectedActivities.findIndex(a => a.id === x.id);
      return i >= 0 ? { ...x, organized: true, linkedExpId: newIds[i] } : x;
    }));
    setSelected(new Set());
    onGoArchive();
  };

  const deleteSelected = () => {
    if (selectedActivities.length === 0) return;
    if (!window.confirm(`선택한 활동 ${selectedActivities.length}개를 삭제할까요?`)) return;
    selectedActivities.forEach(a => addTrash("timeline_activity", a.title, a));
    const idsToRemove = new Set(selectedActivities.map(a => a.id));
    setActivities(prev => prev.filter(a => !idsToRemove.has(a.id)));
    setSelected(new Set());
  };

  // 블록 드래그로 시기 이동 (기간 길이는 유지한 채 통째로 이동)
  const dragRef = useRef({ moved: false, justDragged: false });
  const startDrag = (it) => (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const startY = e.clientY;
    const durationMonths = it.endIdx - it.startIdx;
    dragRef.current = { moved: false, justDragged: false, deltaRows: 0 };

    const onMove = (ev) => {
      const deltaRows = Math.round((ev.clientY - startY) / TIMELINE_ROW_H);
      if (deltaRows !== dragRef.current.deltaRows) dragRef.current.moved = true;
      dragRef.current.deltaRows = deltaRows;
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      const { moved, deltaRows } = dragRef.current;
      if (moved && deltaRows) {
        dragRef.current.justDragged = true;
        const newStartIdx = it.startIdx - deltaRows;
        const newEndIdx = newStartIdx + durationMonths;
        const s = indexToYM(newStartIdx), en = indexToYM(newEndIdx);
        const sStr = `${s.y}-${String(s.m).padStart(2, "0")}-01`;
        const enStr = `${en.y}-${String(en.m).padStart(2, "0")}-01`;
        if (it.kind === "activity") {
          setActivities(prev => prev.map(a => a.id === it.raw.id ? { ...a, date: sStr, endDate: enStr } : a));
        } else {
          setExperiences(prev => prev.map(x => x.id === it.raw.id ? { ...x, startDate: sStr.slice(0, 7), endDate: enStr.slice(0, 7) } : x));
        }
      }
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };
  const handleBlockClick = (it) => {
    if (dragRef.current.justDragged) { dragRef.current.justDragged = false; return; }
    toggleSelect(it.key);
  };

  // 경험 + (미정리 필터가 아니면 정리된 활동도 숨김 — 이미 경험으로 존재하므로 중복 방지)
  const expItems = experiences.filter(e => e.startDate).map(e => {
    const s = ymToIndex(e.startDate.slice(0, 7));
    const en = ymToIndex((e.endDate || e.startDate).slice(0, 7)) || s;
    return { key: "e_" + e.id, kind: "experience", title: e.title, startIdx: Math.max(s, startIdx), endIdx: Math.min(Math.max(en, s), endIdx), raw: e };
  }).filter(it => it.startIdx <= endIdx && it.endIdx >= startIdx);

  const actItems = activities.filter(a => !a.organized).map(a => {
    const s = ymToIndex(a.date.slice(0, 7));
    const en = Math.max(ymToIndex((a.endDate || a.date).slice(0, 7)) || s, s);
    return { key: "a_" + a.id, kind: "activity", title: a.title, startIdx: Math.max(s, startIdx), endIdx: Math.min(en, endIdx), raw: a };
  }).filter(it => it.startIdx <= endIdx);

  const allItems = filter === "unorganized" ? actItems : [...expItems, ...actItems];
  const lanedItems = assignLanes(allItems);
  const laneCount = Math.max(1, ...lanedItems.map(it => it.lane + 1));

  const rows = [];
  for (let idx = endIdx; idx >= startIdx; idx--) rows.push(idx);

  return (
    <div>
      <H2>타임라인</H2>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 16, lineHeight: 1.6 }}>
        연도·월을 쭉 훑어보면서, 아직 경험 보관함에 정리하지 않은 활동을 빠르게 기록하고 골라서 정리하세요.
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <Input placeholder="이때 무슨 일이 있었나요? (예: 팀 프로젝트 발표)" value={title} onChange={e => setTitle(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="month" value={date ? date.slice(0, 7) : ""} onChange={e => setDate(e.target.value ? e.target.value + "-01" : "")}
              style={{ fontFamily: font, fontSize: 13.5, padding: "9px 12px", borderRadius: 14, border: `1px solid ${C.line}`, width: 140 }} />
            <span style={{ fontSize: 12, color: C.faint }}>~</span>
            <input type="month" value={endDate ? endDate.slice(0, 7) : ""} min={date ? date.slice(0, 7) : undefined}
              onChange={e => setEndDate(e.target.value ? e.target.value + "-01" : "")}
              style={{ fontFamily: font, fontSize: 13.5, padding: "9px 12px", borderRadius: 14, border: `1px solid ${C.line}`, width: 140 }} />
          </div>
          <Btn primary disabled={!title.trim() || !date} onClick={addActivity}>추가</Btn>
        </div>
        <div style={{ fontSize: 11.5, color: C.faint, marginTop: 6 }}>종료 년월은 선택 사항입니다 — 비워두면 하루·한 달짜리 활동(점)으로, 채우면 기간이 있는 활동(막대)으로 표시됩니다.</div>
      </Card>

      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[["all", "전체"], ["unorganized", "미정리만"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ fontFamily: font, fontSize: 12.5, padding: "6px 12px", borderRadius: 14, cursor: "pointer",
            border: `1px solid ${filter === v ? C.text : C.line}`, background: filter === v ? C.text : C.panel, color: filter === v ? "#fff" : C.sub }}>{l}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 6 }}>
        <span style={{ fontSize: 11.5, color: C.sub }}><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 99, background: C.panel, border: `2px solid ${C.sub}`, marginRight: 5 }} />미정리 (점선/테두리만)</span>
        <span style={{ fontSize: 11.5, color: C.sub }}><span style={{ display: "inline-block", width: 12, height: 8, borderRadius: 3, background: C.greenBg, border: `1px solid ${C.green}`, marginRight: 5 }} />정리된 경험 (채움)</span>
      </div>

      <div style={{ display: "flex" }}>
        <div style={{ width: 52, flexShrink: 0 }}>
          {rows.map((idx, i) => {
            const { y, m } = indexToYM(idx);
            const isJan = m === 1;
            const isTop = i === 0;
            return (
              <div key={idx} style={{ height: TIMELINE_ROW_H, display: "flex", alignItems: "center", fontSize: 11, color: C.faint,
                borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                {(isJan || isTop) ? <span style={{ fontWeight: 700, color: C.text, fontSize: 11.5 }}>{y}·{m}월</span> : `${m}월`}
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {laneCount > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 11.5, color: C.faint }}>동시에 진행된 활동이 많아서 옆으로 넘어갑니다 ({laneCount}칸)</span>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => scrollLanes(-1)} style={{ fontFamily: font, fontSize: 12, padding: "3px 10px", borderRadius: 10, border: `1px solid ${C.line}`, background: C.panel, color: C.sub, cursor: "pointer" }}>◀</button>
                <button onClick={() => scrollLanes(1)} style={{ fontFamily: font, fontSize: 12, padding: "3px 10px", borderRadius: 10, border: `1px solid ${C.line}`, background: C.panel, color: C.sub, cursor: "pointer" }}>▶</button>
              </div>
            </div>
          )}
          <div ref={laneScrollRef} style={{ overflowX: "auto", scrollbarWidth: "thin" }}>
          <div style={{ position: "relative", height: totalRows * TIMELINE_ROW_H, display: "flex", gap: 12, paddingLeft: 12, borderLeft: `1px solid ${C.line}`, minWidth: laneCount * 162 }}>
            {Array.from({ length: laneCount }).map((_, laneIdx) => (
              <div key={laneIdx} style={{ position: "relative", width: 150, flexShrink: 0 }}>
                {rows.map((idx, i) => (
                  <div key={idx} style={{ position: "absolute", top: i * TIMELINE_ROW_H, left: 0, right: 0, height: 1, background: i === 0 ? "transparent" : C.lineSoft }} />
                ))}
                {lanedItems.filter(it => it.lane === laneIdx).map(it => {
                  const topRow = endIdx - it.endIdx;
                  const bottomRow = endIdx - it.startIdx;
                  const top = topRow * TIMELINE_ROW_H + 3;
                  const height = (bottomRow - topRow + 1) * TIMELINE_ROW_H - 6;
                  const isDot = it.startIdx === it.endIdx && it.kind === "activity";
                  const isSelected = selected.has(it.key);
                  const isOrganized = it.kind === "experience";
                  if (isDot) {
                    return (
                      <div key={it.key} onMouseDown={startDrag(it)} onClick={() => handleBlockClick(it)} title={it.title + " (드래그해서 시기 이동)"}
                        style={{ position: "absolute", top: top + 6, left: 2, right: 2, display: "flex", alignItems: "flex-start", gap: 7, cursor: "grab" }}>
                        <span style={{ width: 10, height: 10, borderRadius: 99, background: isSelected ? C.text : C.panel, border: `2px solid ${isSelected ? C.text : C.sub}`, flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 12, fontWeight: isSelected ? 700 : 500, color: C.text, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{it.title}</span>
                      </div>
                    );
                  }
                  return (
                    <div key={it.key} onMouseDown={startDrag(it)} onClick={() => handleBlockClick(it)} title={it.title + " (드래그해서 시기 이동)"} style={{
                      position: "absolute", top, left: 3, right: 3, height: Math.max(height, 24), borderRadius: 8, cursor: "grab", boxSizing: "border-box",
                      background: isOrganized ? C.greenBg : C.panel,
                      border: isOrganized ? `1px solid ${C.green}` : `1.5px dashed ${isSelected ? C.text : C.sub}`,
                      outline: isSelected ? `2px solid ${C.text}` : "none", outlineOffset: 1,
                      padding: "6px 8px", fontSize: 12, fontWeight: isSelected ? 700 : 500, color: isOrganized ? C.green : C.text, lineHeight: 1.35,
                      display: "-webkit-box", WebkitLineClamp: Math.max(1, Math.floor((Math.max(height, 24) - 12) / 16)), WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {it.title}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          </div>
        </div>
      </div>

      {selected.size === 1 && (() => {
        const key = [...selected][0];
        if (key.startsWith("a_")) {
          const a = activities.find(x => "a_" + x.id === key);
          if (!a) return null;
          return <TimelineActivityPanel activity={a} setActivities={setActivities} onDeselect={() => setSelected(new Set())}
            onOrganize={() => organizeSelected()} onDelete={() => deleteSelected()} />;
        }
        const e = experiences.find(x => "e_" + x.id === key);
        if (!e) return null;
        return <TimelineExperienceNote exp={e} setExperiences={setExperiences} onOpenExp={onOpenExp} onDeselect={() => setSelected(new Set())} />;
      })()}

      {selected.size > 1 && (
        <div style={{ position: "sticky", bottom: 16, marginTop: 16, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
          <span style={{ fontSize: 12.5 }}>{selected.size}개 선택됨{selectedActivities.length < selected.size ? " (정리된 경험은 일괄 작업 대상에서 제외)" : ""}</span>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn small onClick={() => setSelected(new Set())}>선택 해제</Btn>
            <Btn small onClick={deleteSelected} disabled={selectedActivities.length === 0}>삭제</Btn>
            <Btn small primary onClick={organizeSelected} disabled={selectedActivities.length === 0}>선택한 항목 정리하기</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineActivityPanel({ activity, setActivities, onDeselect, onOrganize, onDelete }) {
  const [title, setTitle] = useState(activity.title);
  const [date, setDate] = useState(activity.date.slice(0, 7));
  const [endDate, setEndDate] = useState((activity.endDate || activity.date).slice(0, 7));

  const save = () => {
    if (!title.trim() || !date) return;
    const finalEnd = endDate && endDate >= date ? endDate : date;
    setActivities(prev => prev.map(a => a.id === activity.id ? { ...a, title: title.trim(), date: date + "-01", endDate: finalEnd + "-01" } : a));
  };

  return (
    <Card style={{ marginTop: 16, background: C.accent }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <Label>미정리 활동 — 수정</Label>
        <span onClick={onDeselect} style={{ cursor: "pointer", color: C.faint, fontSize: 13 }}>✕</span>
      </div>
      <Input value={title} onChange={e => setTitle(e.target.value)} style={{ marginBottom: 8 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <input type="month" value={date} onChange={e => setDate(e.target.value)}
          style={{ fontFamily: font, fontSize: 13.5, padding: "8px 10px", borderRadius: 14, border: `1px solid ${C.line}`, width: 140 }} />
        <span style={{ fontSize: 12, color: C.faint }}>~</span>
        <input type="month" value={endDate} min={date} onChange={e => setEndDate(e.target.value)}
          style={{ fontFamily: font, fontSize: 13.5, padding: "8px 10px", borderRadius: 14, border: `1px solid ${C.line}`, width: 140 }} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn small primary onClick={save}>저장</Btn>
        <Btn small onClick={onOrganize}>정리하기 →</Btn>
        <Btn small onClick={onDelete}>삭제</Btn>
      </div>
    </Card>
  );
}

function TimelineExperienceNote({ exp, setExperiences, onOpenExp, onDeselect }) {
  const [note, setNote] = useState(exp.rawNote || "");
  const [title, setTitle] = useState(exp.title);
  const [startYm, setStartYm] = useState((exp.startDate || "").slice(0, 7));
  const [endYm, setEndYm] = useState((exp.endDate || exp.startDate || "").slice(0, 7));
  const autosave = useAutosave(note);

  useEffect(() => {
    const t = setTimeout(() => {
      setExperiences(prev => prev.map(e => e.id === exp.id ? { ...e, rawNote: note } : e));
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note]);

  const saveDates = () => {
    if (!title.trim() || !startYm) return;
    const finalEnd = endYm && endYm >= startYm ? endYm : startYm;
    setExperiences(prev => prev.map(e => e.id === exp.id ? { ...e, title: title.trim(), startDate: startYm, endDate: finalEnd } : e));
  };

  return (
    <Card style={{ marginTop: 16, background: C.greenBg }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <Label>정리된 경험 — 제목·시기 수정</Label>
        <span onClick={onDeselect} style={{ cursor: "pointer", color: C.faint, fontSize: 13 }}>✕</span>
      </div>
      <Input value={title} onChange={e => setTitle(e.target.value)} style={{ marginBottom: 8, fontWeight: 700 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <input type="month" value={startYm} onChange={e => setStartYm(e.target.value)}
          style={{ fontFamily: font, fontSize: 13.5, padding: "8px 10px", borderRadius: 14, border: `1px solid ${C.line}`, width: 140 }} />
        <span style={{ fontSize: 12, color: C.faint }}>~</span>
        <input type="month" value={endYm} min={startYm} onChange={e => setEndYm(e.target.value)}
          style={{ fontFamily: font, fontSize: 13.5, padding: "8px 10px", borderRadius: 14, border: `1px solid ${C.line}`, width: 140 }} />
        <Btn small primary onClick={saveDates}>저장</Btn>
      </div>
      <Label>관련 메모</Label>
      <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="이 경험과 관련해서 떠오른 걸 자유롭게 적어두세요" rows={4} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <AutosaveIndicator state={autosave} />
        <Btn small onClick={() => onOpenExp(exp.id)}>전체 경험 보기 →</Btn>
      </div>
    </Card>
  );
}
function PersonalAssistant({ experiences, skills, certs, awards, resumeProfile, applications, metrics, history, setHistory, onGo }) {
  return (
    <div style={{ maxWidth: 720 }}>
      <H2>AI에게 물어보기</H2>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 16, lineHeight: 1.6 }}>
        취업 준비하면서 드는 사소한 질문이나 개인적인 고민을 편하게 물어보세요. 정리해두신 경험·역량·지원 현황을 참고해서 답합니다. 채용담당자처럼 평가하는 곳이 아니라, 옆에서 같이 생각해보는 곳입니다.
      </div>
      <EssayChat
        title="AI에게 물어보기"
        subtitle="내 정보를 참고해서 답합니다"
        systemPrompt={PERSONAL_ASSISTANT_SYSTEM_PROMPT}
        contextText={buildPersonalContext(experiences, skills, certs, awards, resumeProfile, applications, metrics)}
        autoStartMessage="안녕! 요즘 취업 준비하면서 궁금한 거나 고민되는 거 있으면 편하게 물어봐."
        inputPlaceholder="예: 내 경험 중에 뭐가 제일 강점인 것 같아? / 이 회사 지원할까 말까 고민돼"
        onClose={() => onGo("home")}
        closeLabel="← 홈으로"
        history={history}
        onHistoryChange={setHistory}
      />
    </div>
  );
}

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
    { icon: "doc", nav: "resume", title: "기본 이력서", desc: "경험 보관함에서 승인된 문장과 근거가 연결된 역량이 자동으로 모이고, 자격증·어학·수상기록은 여기서 직접 관리합니다." },
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

      {/* 데이터 저장/전송 안내 */}
      <Card style={{ marginTop: 20 }}>
        <Label>내 데이터는 어디에 저장되고, 어디로 전송되나요</Label>
        <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.8 }}>
          · 모든 데이터는 <b>이 브라우저에만</b> 저장됩니다 (서버 저장 없음). 다른 기기·다른 브라우저·시크릿 모드에서는 보이지 않습니다.<br />
          · 브라우저 데이터를 지우면 복구할 수 없습니다. 사이드바 하단의 <b>"데이터 백업"</b>을 주기적으로 받아두는 걸 권장합니다.<br />
          · <b>"파일 가져오기"</b>와 <b>"자소서·면접 챗봇"</b>을 사용하면, 그 순간 입력한 내용이 AI 응답 생성을 위해 외부 AI 서버(Anthropic/OpenAI/Gemini 중 설정된 곳)로 전송됩니다. 전송된 내용은 응답 생성에만 쓰이고 이 앱이 별도로 저장하지 않습니다.<br />
          · 백업 파일은 암호화되지 않은 평문 JSON입니다. 공유 컴퓨터에 저장하지 않도록 주의하세요.
        </div>
      </Card>
    </div>
  );
}

/* ============================================================ 첫 방문자 온보딩 화면 */
function HomeOnboarding({ onGoAnalyze, onGoImport, onLoadDemo, onGoGuide }) {
  const steps = [
    { icon: "upload", title: "파일 가져오기", desc: "기존 이력서·메모가 있다면 AI가 초안을 뽑아줍니다", act: onGoImport, primary: false },
    { icon: "layers", title: "새 경험 등록", desc: "빈 페이지부터 하나씩 정리하고 싶다면", act: onGoAnalyze, primary: true },
  ];
  return (
    <div style={{ maxWidth: 640, margin: "40px auto 0" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14, color: C.green }}>
          <Icon name="sparkle" size={34} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>Career OS에 오신 걸 환영합니다</h1>
        <div style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.6 }}>
          아직 등록된 경험이 없습니다. 아래 두 가지 중 편한 방법으로 시작해보세요.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        {steps.map(s => (
          <Card key={s.title} onClick={s.act} style={{
            textAlign: "center", padding: "26px 18px",
            border: s.primary ? `1px solid ${C.green}` : `1px solid ${C.line}`,
            background: s.primary ? C.greenBg : C.panel }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12, color: s.primary ? C.green : C.sub }}>
              <Icon name={s.icon} size={28} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{s.title}</div>
            <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.5 }}>{s.desc}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 18, fontSize: 12.5 }}>
        <span onClick={onGoGuide} style={{ color: C.sub, textDecoration: "underline", cursor: "pointer" }}>전체 사용법 먼저 보기</span>
        <span onClick={onLoadDemo} style={{ color: C.sub, textDecoration: "underline", cursor: "pointer" }}>예시 데이터로 먼저 둘러보기</span>
      </div>
    </div>
  );
}

function Home({ experiences, applications, onGoAnalyze, onGoImport, onOpenDetail, onOpenApp, isBlankSlate, onLoadDemo, onGoGuide }) {
  if (isBlankSlate) {
    return <HomeOnboarding onGoAnalyze={onGoAnalyze} onGoImport={onGoImport} onLoadDemo={onLoadDemo} onGoGuide={onGoGuide} />;
  }

  const total = experiences.length;
  const done = experiences.filter(e => e.status === "complete").length;
  const needs = experiences.filter(e => e.status === "needs_revision").length;
  const draft = experiences.filter(e => e.status === "draft").length;

  const typeCoverage = [
    ["데이터 분석 경험", experiences.filter(e => e.competencies.includes("데이터 분석") || e.competencies.includes("데이터 관리")).length],
    ["리더십 경험", experiences.filter(e => e.competencies.includes("리더십")).length],
    ["어려움 극복 경험", experiences.filter(e => !!e.difficulty).length],
    ["협업 경험", experiences.filter(e => e.actions?.some(a => a.actionType === "collaboration")).length],
  ];

  const nextActions = (() => {
    const acts = [];
    experiences.filter(e => e.status === "needs_revision").forEach(e =>
      acts.push({ text: `「${e.title}」 부족한 부분 보완하기`, act: () => onOpenDetail(e.id) }));
    experiences.filter(e => e.status === "draft").forEach(e =>
      acts.push({ text: `「${e.title}」 경험 분석 시작하기`, act: () => onOpenDetail(e.id) }));
    experiences.filter(e => e.status === "analyzing" && !e.depthDone).forEach(e =>
      acts.push({ text: `「${e.title}」 심화 단계(목표·어려움·배운 점·직무 연결) 채워 완성하기`, act: () => onOpenDetail(e.id) }));
    applications.forEach(a => {
      if ((a.interviews || []).some(iq => !iq.selectedExperienceId)) {
        acts.push({ text: `${a.company} 면접 질문에 사용할 경험 선택하기`, act: () => onOpenApp(a.id) });
      }
      if ((a.essays || []).some(q => q.status === "not_started")) {
        acts.push({ text: `${a.company} 자소서 문항 작성 시작하기`, act: () => onOpenApp(a.id) });
      }
    });
    return acts.slice(0, 5);
  })();

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>오늘 할 일부터 시작하세요</h1>
      <div style={{ fontSize: 13.5, color: C.sub, marginBottom: 22 }}>차트보다 행동. 다음에 해야 할 일을 바로 보여드립니다.</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* 다음 행동 */}
        <Card style={{ gridColumn: "1 / -1", background: C.lineSoft, border: "none" }}>
          <Label>다음 행동</Label>
          {nextActions.length === 0 && <div style={{ fontSize: 13.5, color: C.sub, padding: "8px 0" }}>지금 당장 처리할 일이 없습니다. 새 경험을 등록하거나 지원을 추가해보세요.</div>}
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
function Analyze({ experiences, setExperiences, analyzeId, setAnalyzeId, metrics, setMetrics, onDone }) {
  const exp = experiences.find(e => e.id === analyzeId);
  if (!exp) return <AnalyzeStart experiences={experiences} setExperiences={setExperiences} onStart={setAnalyzeId} />;
  return <AnalyzeFlow exp={exp} setExperiences={setExperiences} metrics={metrics} setMetrics={setMetrics} onExit={() => setAnalyzeId(null)} onDone={onDone} />;
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

function AnalyzeFlow({ exp, setExperiences, metrics, setMetrics, onExit, onDone }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [showDepth, setShowDepth] = useState(false);
  const steps = showDepth ? DEPTH_STEPS : CORE_STEPS;
  const step = steps[stepIdx];
  const [local, setLocal] = useState({ ...exp });
  const autosave = useAutosave(JSON.stringify(local));

  const patch = (k, v) => setLocal(p => ({ ...p, [k]: v }));
  // 저장: 편집 내용 병합 + 9단계 충족도/상태를 실제 내용으로 재계산 (표시와 데이터가 항상 일치)
  const commit = (extra = {}) => setExperiences(prev => prev.map(e => {
    if (e.id !== exp.id) return e;
    const merged = { ...e, ...local, ...extra, updatedAt: new Date().toISOString().slice(0, 10) };
    merged.completion = recomputeCompletion(merged, metrics);
    if (!("status" in extra)) merged.status = deriveStatus(merged, metrics);
    return merged;
  }));

  // 실제 자동 저장: local이 바뀌면 잠시 뒤 저장한다 (status·depthDone은 commit이 관리하므로 보존)
  useEffect(() => {
    const t = setTimeout(() => {
      setExperiences(prev => prev.map(e => {
        if (e.id !== exp.id) return e;
        const merged = { ...e, ...local, status: e.status, depthDone: e.depthDone, updatedAt: new Date().toISOString().slice(0, 10) };
        merged.completion = recomputeCompletion(merged, metrics);
        return merged;
      }));
    }, 900);
    return () => clearTimeout(t);
  }, [local]); // eslint-disable-line react-hooks/exhaustive-deps

  const isStepFilled = (name) => evalStepStatus(name, local, metrics) === "충분";

  const next = () => {
    if (stepIdx < steps.length - 1) { setStepIdx(stepIdx + 1); commit(); }
    else if (!showDepth) {
      // 핵심 5단계를 끝내도 아직 '완료'가 아니다 — 심화까지 채워야 완성으로 본다
      commit(); setShowDepth(true); setStepIdx(0);
    } else {
      const finalLocal = { ...local, depthDone: true };
      commit({ depthDone: true, status: isFullyComplete(finalLocal, metrics) ? "complete" : "needs_revision" });
      onDone(exp.id);
    }
  };
  // 핵심만 저장하고 심화는 나중에 (아직 '완료'로 표시하지 않음)
  const finishCore = () => { commit(); onDone(exp.id); };

  const [reviewIssues, setReviewIssues] = useState(null);
  const [reviewOverall, setReviewOverall] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");

  // ── 실제 AI 꼬리질문 (단계 내용 기반) — 기존의 고정 문구를 대체 ──
  const [aiQ, setAiQ] = useState({});             // step -> 생성된 질문
  const [aiQState, setAiQState] = useState("idle"); // idle | loading | error
  const stepContentText = (name) => {
    if (name === "행동") return (local.actions || []).map(a => `(${ACTION_LABEL[a.actionType] || a.actionType}) ${a.description}`).join("; ");
    if (name === "기여도") return `${CONTRIB_LABEL[local.contributionLevel] || ""} ${local.contributionEvidence || ""}`.trim();
    if (name === "성과") return `${local.oneLineSummary || ""} ${local.qualitative || ""}`.trim();
    const map = { 배경: "context", 문제: "discoveredProblem", 목표: "goal", 어려움: "difficulty", "배운 점": "learning", "직무 연결": "jobRelevance" };
    return (local[map[name]] || "").trim();
  };
  const genAiQuestion = async (name) => {
    const content = stepContentText(name);
    if (content.replace(/\s/g, "").length < 4) { setAiQState("idle"); return; }
    setAiQState("loading");
    try {
      const sys = `너는 취업 면접 코치다. 지원자가 경험의 '${name}' 단계에 아래 내용을 적었다. 이 내용에서 면접관이 더 파고들, 아직 안 드러난 지점 딱 하나를 골라 한국어 꼬리질문 한 문장만 만들어라. 이미 적힌 내용을 그대로 되묻지 마라. 다른 말 없이 질문 한 문장만 출력.`;
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt: sys, context: `[${name}]\n${content}`, messages: [{ role: "user", content: "꼬리질문 한 문장만 주세요." }] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "");
      const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join(" ").trim().replace(/^["“']|["”']$/g, "");
      if (text) { setAiQ(p => ({ ...p, [name]: text })); setAiQState("idle"); } else setAiQState("error");
    } catch { setAiQState("error"); }
  };
  // 단계 진입 시 내용이 있으면 자동으로 한 번 생성 (없으면 정적 예시 질문으로 대체)
  useEffect(() => {
    if (aiQ[step]) { setAiQState("idle"); return; }
    setAiQState("idle");
    const t = setTimeout(() => genAiQuestion(step), 700);
    return () => clearTimeout(t);
  }, [step, showDepth]); // eslint-disable-line react-hooks/exhaustive-deps

  const localIssues = localConsistencyIssues(local, metrics);

  const runConsistencyReview = async () => {
    setReviewLoading(true); setReviewError(""); setReviewIssues(null);
    try {
      const myMetrics = metrics.filter(m => m.experienceId === exp.id);
      const depthFilled = local.goal || local.difficulty || local.learning || local.jobRelevance || local.coreMessage;
      const prompt = `당신은 채용담당자 시점에서 지원자가 정리한 경험 하나를 검토합니다. 아래 단계들을 한꺼번에 보고, 서로 이어지는 이야기로서 문제가 있는지 확인하세요.

[배경] ${local.context || "(없음)"}
[문제] ${local.discoveredProblem || "(없음)"} (주어진 업무: ${local.assignedTask || "(없음)"})
[행동] ${(local.actions || []).map(a => `- (${ACTION_LABEL[a.actionType] || a.actionType}) ${a.description}`).join("\n") || "(없음)"}
[기여도] 수준: ${CONTRIB_LABEL[local.contributionLevel] || "(없음)"} / 근거: ${local.contributionEvidence || "(없음)"}
[성과] ${local.oneLineSummary || "(없음)"} / 정성 성과: ${local.qualitative || "(없음)"} / 수치: ${myMetrics.map(m => `${m.metricName} ${formatMetric(m, "exact")}`).join(", ") || "(없음)"}
${depthFilled ? `[목표] ${local.goal || "(없음)"}
[어려움] ${local.difficulty || "(없음)"}
[배운 점] ${local.learning || "(없음)"}
[직무 연결] ${local.jobRelevance || "(없음)"} / 핵심 메시지: ${local.coreMessage || "(없음)"}` : "(심화 단계는 아직 입력하지 않았습니다 — 입력된 항목만 검토하세요)"}

확인할 것:
- 빠진 정보: 특정 단계에 근거나 구체성이 없는 곳
- 개연성 문제: 앞뒤 단계가 서로 안 맞는 곳 (예: 문제에서 언급 안 된 게 성과에 갑자기 나옴, 기여도는 "혼자"라는데 행동엔 협업이 많음, 목표와 실제 행동이 안 맞음). 판단하지 말고 사실만 병치할 것.
- 구체성 부족: 숫자·장면 없이 추상적으로만 쓴 곳

없는 사실을 지어내지 마라. 각 이슈는 어느 단계(배경/문제/행동/기여도/성과/목표/어려움/배운 점/직무 연결) 얘기인지 명시하라. 입력되지 않은 심화 단계는 "빠진 정보"로 지적하지 말고 건너뛰어라 (선택 사항이므로). 문제가 없으면 issues를 빈 배열로 두라.

JSON만 응답 (마크다운 백틱 없이):
{"issues":[{"step":"성과","issue":"..."}],"overall":"전체적으로 한 줄 총평"}`;

      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt: prompt, messages: [{ role: "user", content: "위 기준으로 검토해 JSON으로만 답해줘." }] }),
      });
      let data;
      try { data = await res.json(); }
      catch { throw new Error(`서버 응답을 읽지 못했습니다 (HTTP ${res.status})`); }
      if (!res.ok) {
        throw new Error(data?.error?.message || (typeof data?.error === "string" ? data.error : null) || `API 오류 (HTTP ${res.status}) — 응답 원문: ${JSON.stringify(data).slice(0, 300)}`);
      }
      const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
      const parsed = parseAIJson(text);
      setReviewIssues(parsed.issues || []);
      setReviewOverall(parsed.overall || "");
    } catch (e) {
      setReviewError(e.message || String(e));
    } finally {
      setReviewLoading(false);
    }
  };
  const jumpToStep = (stepName) => {
    const coreI = CORE_STEPS.indexOf(stepName);
    if (coreI >= 0) { setShowDepth(false); setStepIdx(coreI); return; }
    const depthI = DEPTH_STEPS.indexOf(stepName);
    if (depthI >= 0) { setShowDepth(true); setStepIdx(depthI); }
  };

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

        {/* AI 꼬리질문 (내용을 읽고 실제 생성 · 없으면 예시 질문) */}
        <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: C.accent, border: `1px solid ${C.line}`, borderRadius: 14, marginBottom: 16, alignItems: "flex-start" }}>
          <Badge label={aiQ[step] ? "AI 꼬리질문" : "질문 도우미"} color={C.ai} bg="#fff" />
          <div style={{ flex: 1, minWidth: 0 }}>
            {aiQ[step]
              ? <span style={{ fontSize: 13, color: C.text, lineHeight: 1.55 }}>{aiQ[step]}</span>
              : aiQState === "loading"
                ? <span style={{ fontSize: 13, color: C.faint }}>적은 내용을 읽고 질문을 만드는 중…</span>
                : <span style={{ fontSize: 13, color: C.sub, lineHeight: 1.55 }}>{aiHints[step]} <span style={{ color: C.faint }}>· 예시 질문</span></span>}
          </div>
          <span onClick={() => aiQState !== "loading" && genAiQuestion(step)} style={{ cursor: aiQState === "loading" ? "default" : "pointer", fontSize: 12, color: C.blue, whiteSpace: "nowrap", flexShrink: 0 }}>
            {aiQState === "loading" ? "…" : (aiQ[step] ? "다시 질문" : "AI 질문 받기")}
          </span>
        </div>

        {/* 입력 영역 */}
        {step === "행동" && <ActionEditor local={local} setLocal={setLocal} />}
        {step === "기여도" && <ContributionEditor local={local} patch={patch} />}
        {step === "성과" && <MetricEditor expId={exp.id} metrics={metrics} setMetrics={setMetrics} local={local} patch={patch} />}
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

      {!isStepFilled(step) && (
        <div style={{ fontSize: 12, color: C.orange, marginTop: 10, background: C.orangeBg, padding: "8px 12px", borderRadius: 14 }}>
          {stepIssueMessage(step, local, metrics) || "이 단계 입력이 비어있거나 짧습니다."} 이대로 넘어가면 "보완 필요"로 표시돼요.
        </div>
      )}

      {/* 규칙 점검 — API 없이 즉시 확인되는 앞뒤 단계 개연성 */}
      {localIssues.length > 0 && (
        <div style={{ marginTop: 10, background: C.accent, border: `1px solid ${C.line}`, borderRadius: 14, padding: "10px 12px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, marginBottom: 6 }}>빠른 점검</div>
          <div style={{ display: "grid", gap: 6 }}>
            {localIssues.map((iss, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <Badge label={iss.step} color={C.orange} bg={C.orangeBg} />
                <span style={{ fontSize: 12.5, color: C.text, lineHeight: 1.5, flex: 1 }}>{iss.issue}</span>
                <span onClick={() => jumpToStep(iss.step)} style={{ cursor: "pointer", fontSize: 12, color: C.blue, whiteSpace: "nowrap" }}>가기</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
        <Btn onClick={() => stepIdx > 0 ? setStepIdx(stepIdx - 1) : (showDepth ? (setShowDepth(false), setStepIdx(CORE_STEPS.length - 1)) : null)} disabled={stepIdx === 0 && !showDepth}>← 이전</Btn>
        <div style={{ display: "flex", gap: 8 }}>
          {!showDepth && stepIdx === CORE_STEPS.length - 1 && (
            <>
              <Btn onClick={runConsistencyReview} disabled={reviewLoading}>{reviewLoading ? "검토 중…" : "AI로 검토받기"}</Btn>
              <Btn onClick={finishCore}>핵심만 저장 · 심화는 나중에</Btn>
            </>
          )}
          {showDepth && stepIdx === DEPTH_STEPS.length - 1 && (
            <Btn onClick={runConsistencyReview} disabled={reviewLoading}>{reviewLoading ? "검토 중…" : "AI로 검토받기"}</Btn>
          )}
          <Btn primary onClick={next}>
            {stepIdx < steps.length - 1 ? "다음 →" : showDepth ? "심화 분석 완료" : "심화 단계 계속 →"}
          </Btn>
        </div>
      </div>

      {((!showDepth && stepIdx === CORE_STEPS.length - 1) || (showDepth && stepIdx === DEPTH_STEPS.length - 1)) && (
        <>
          {reviewError && (
            <div style={{ marginTop: 12, padding: "10px 12px", background: C.accent, border: `1px solid ${C.line}`, borderRadius: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.red, marginBottom: 4 }}>오류</div>
              <div style={{ fontSize: 12, color: C.red, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>{reviewError}</div>
            </div>
          )}
          {reviewIssues && (
            <Card style={{ marginTop: 12, background: C.accent }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <Label>AI 검토 결과</Label>
                <span onClick={() => setReviewIssues(null)} style={{ cursor: "pointer", color: C.faint, fontSize: 13 }}>✕</span>
              </div>
              {reviewOverall && <div style={{ fontSize: 13, marginBottom: 10, lineHeight: 1.6 }}>{reviewOverall}</div>}
              {reviewIssues.length === 0 ? (
                <div style={{ fontSize: 13, color: C.sub }}>뚜렷한 문제가 안 보입니다. 이대로 완료해도 좋습니다.</div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {reviewIssues.map((iss, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 12px", gap: 10 }}>
                      <div>
                        <Badge label={iss.step} color={C.blue} bg={C.blueBg} />
                        <div style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>{iss.issue}</div>
                      </div>
                      <Btn small onClick={() => jumpToStep(iss.step)} style={{ flexShrink: 0 }}>이 단계로 가기</Btn>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </>
      )}
      {!showDepth && (
        <div style={{ fontSize: 12, color: C.faint, marginTop: 10, textAlign: "right" }}>
          핵심 5단계로 경험 카드가 생성돼요. 다만 <b>심화 4단계(목표·어려움·배운 점·직무 연결)까지 채워야 '분석 완료'</b>가 됩니다 — 자소서·면접에서 실제로 쓰이는 부분이에요.
        </div>
      )}
    </div>
  );
}

function ActionEditor({ local, setLocal }) {
  const actions = local.actions || [];
  const [draft, setDraft] = useState({ actionType: "analysis", description: "", isDirectAction: true, parentId: "" });
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);

  const add = () => {
    if (!draft.description.trim()) return;
    setLocal(p => ({ ...p, actions: [...(p.actions || []), {
      id: "a_" + Date.now(), actionType: draft.actionType, description: draft.description.trim(),
      isDirectAction: draft.isDirectAction, parentId: draft.parentId || null,
    }] }));
    setDraft({ actionType: "analysis", description: "", isDirectAction: true, parentId: "" });
  };

  const startEdit = (a) => { setEditingId(a.id); setEditDraft({ actionType: a.actionType, description: a.description, isDirectAction: a.isDirectAction, parentId: a.parentId || "" }); };
  const cancelEdit = () => { setEditingId(null); setEditDraft(null); };
  const saveEdit = (id) => {
    if (!editDraft.description.trim()) return;
    setLocal(p => ({ ...p, actions: p.actions.map(x => x.id === id ? {
      ...x, actionType: editDraft.actionType, description: editDraft.description.trim(),
      isDirectAction: editDraft.isDirectAction, parentId: editDraft.parentId || null,
    } : x) }));
    cancelEdit();
  };
  const remove = (id) => {
    // 부모를 지우면 자식은 삭제되지 않고 최상위로 승격됨 (데이터 손실 방지)
    setLocal(p => ({ ...p, actions: p.actions.filter(x => x.id !== id).map(x => x.parentId === id ? { ...x, parentId: null } : x) }));
  };

  const childrenOf = (id) => actions.filter(a => a.parentId === id);
  const validParentIds = new Set(actions.map(a => a.id));
  const roots = actions.filter(a => !a.parentId || !validParentIds.has(a.parentId));

  const parentOptions = (excludeId) => actions.filter(a => a.id !== excludeId);

  const renderRow = (a) => {
    const [color, bg] = ACTION_COLOR[a.actionType] || [C.blue, C.blueBg];
    const isEditing = editingId === a.id;
    return (
      <div key={a.id}>
        {isEditing ? (
          <div style={{ padding: "10px 0", borderBottom: `1px solid ${C.lineSoft}` }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
              <select value={editDraft.actionType} onChange={e => setEditDraft(d => ({ ...d, actionType: e.target.value }))}
                style={{ fontFamily: font, fontSize: 12.5, padding: "6px 8px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.panel }}>
                {Object.entries(ACTION_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <select value={editDraft.parentId} onChange={e => setEditDraft(d => ({ ...d, parentId: e.target.value }))}
                style={{ fontFamily: font, fontSize: 12.5, padding: "6px 8px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.panel, maxWidth: 220 }}>
                <option value="">최상위 (독립 행동)</option>
                {parentOptions(a.id).map(o => <option key={o.id} value={o.id}>↳ {o.description.slice(0, 20)}{o.description.length > 20 ? "…" : ""}</option>)}
              </select>
              <label style={{ fontSize: 12, color: C.sub, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                <input type="checkbox" checked={editDraft.isDirectAction} onChange={e => setEditDraft(d => ({ ...d, isDirectAction: e.target.checked }))} /> 직접 수행
              </label>
            </div>
            <Textarea value={editDraft.description} onChange={e => setEditDraft(d => ({ ...d, description: e.target.value }))} rows={2} style={{ fontSize: 13 }} />
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <Btn small primary onClick={() => saveEdit(a.id)}>저장</Btn>
              <Btn small onClick={cancelEdit}>취소</Btn>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.lineSoft}` }}>
            <Badge label={ACTION_LABEL[a.actionType]} color={color} bg={bg} />
            <span onClick={() => startEdit(a)} style={{ fontSize: 13.5, flex: 1, cursor: "pointer" }}>{a.description}</span>
            {!a.isDirectAction && <Badge label="타인 수행" color={C.orange} bg={C.orangeBg} />}
            <span onClick={() => startEdit(a)} title="수정" style={{ cursor: "pointer", color: C.faint, fontSize: 12, textDecoration: "underline" }}>수정</span>
            <span onClick={() => remove(a.id)} title="삭제" style={{ cursor: "pointer", color: C.faint, fontSize: 13 }}>✕</span>
          </div>
        )}
        {childrenOf(a.id).length > 0 && (
          <div style={{ marginLeft: 10, paddingLeft: 14, borderLeft: `2px solid ${C.line}` }}>
            {childrenOf(a.id).map(renderRow)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <Label>행동 카드 — 연관된 행동은 아래로 이어서 연결할 수 있습니다</Label>
      {roots.map(renderRow)}
      {actions.length === 0 && <div style={{ fontSize: 13, color: C.faint, padding: "8px 0" }}>아직 입력된 행동이 없습니다.</div>}

      <div style={{ marginTop: 12, padding: 12, background: C.bg, borderRadius: 14 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          <select value={draft.actionType} onChange={e => setDraft(d => ({ ...d, actionType: e.target.value }))}
            style={{ fontFamily: font, fontSize: 13, padding: "8px 10px", borderRadius: 14, border: `1px solid ${C.line}`, background: C.panel }}>
            {Object.entries(ACTION_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={draft.parentId} onChange={e => setDraft(d => ({ ...d, parentId: e.target.value }))}
            style={{ fontFamily: font, fontSize: 13, padding: "8px 10px", borderRadius: 14, border: `1px solid ${C.line}`, background: C.panel, maxWidth: 220 }}>
            <option value="">최상위 (독립 행동)</option>
            {actions.map(a => <option key={a.id} value={a.id}>↳ {a.description.slice(0, 24)}{a.description.length > 24 ? "…" : ""}</option>)}
          </select>
          <label style={{ fontSize: 12, color: C.sub, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
            <input type="checkbox" checked={draft.isDirectAction} onChange={e => setDraft(d => ({ ...d, isDirectAction: e.target.checked }))} /> 직접 수행
          </label>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Input placeholder="행동 설명 — 예: 과거 3년 판매량, 장바구니 데이터 분석" value={draft.description}
            onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} onKeyDown={e => e.key === "Enter" && add()} style={{ flex: 1 }} />
          <Btn small onClick={add}>추가</Btn>
        </div>
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

function MetricEditor({ expId, metrics, setMetrics, local, patch }) {
  const mine = metrics.filter(m => m.experienceId === expId);
  const [draft, setDraft] = useState({ metricName: "", changeValue: "", unit: "", evidenceSource: "" });

  const addMetric = () => {
    if (!draft.metricName.trim() || draft.changeValue === "") return;
    setMetrics(prev => [...prev, {
      id: "m_" + Date.now() + Math.random().toString(36).slice(2, 4),
      experienceId: expId,
      metricType: "custom",
      metricName: draft.metricName.trim(),
      changeValue: Number(draft.changeValue),
      unit: draft.unit || "",
      evidenceSource: draft.evidenceSource || "",
      certainty: "needs_verification", // 직접 입력은 근거 확인 전까지 항상 "확인 필요"로 시작
      isPublic: true,
    }]);
    setDraft({ metricName: "", changeValue: "", unit: "", evidenceSource: "" });
  };
  const updateCertainty = (id, certainty) => setMetrics(prev => prev.map(m => m.id === id ? { ...m, certainty } : m));
  const removeMetric = (id) => setMetrics(prev => prev.filter(m => m.id !== id));

  return (
    <div style={{ marginBottom: 12 }}>
      <Label>성과 수치 — ExperienceMetric 단일 원본</Label>
      <div style={{ fontSize: 12, color: C.faint, marginBottom: 10, lineHeight: 1.6 }}>
        수치는 여기에만 저장됩니다. 이력서·자소서·면접 문장은 이 수치를 토큰으로 참조하며, 원본이 바뀌면 모든 문장에 반영됩니다.
        <br />"추가 확인 필요"는 자소서 AI가 이 수치를 확정적으로 쓰지 않고 조심스럽게 다루게 하고, 면접 복습 화면에서도 경고로 표시됩니다. 실제 자료로 맞는지 확인했다면 아래에서 상태를 바꿔주세요.
      </div>
      {mine.length > 0 ? mine.map(m => (
        <div key={m.id} style={{ display: "grid", gridTemplateColumns: "1fr 110px 130px 150px 20px", gap: 8, alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.lineSoft}`, fontSize: 13.5 }}>
          <span style={{ fontWeight: 600 }}>{m.metricName}</span>
          <span style={{ color: C.blue, fontWeight: 700 }}>{formatMetric(m, "exact")}</span>
          <span style={{ fontSize: 12, color: C.sub }}>{m.comparisonBasis || m.evidenceSource || "—"}</span>
          <select value={m.certainty} onChange={e => updateCertainty(m.id, e.target.value)}
            style={{ fontFamily: font, fontSize: 11.5, padding: "4px 6px", borderRadius: 10, border: `1px solid ${CERTAINTY[m.certainty][1]}55`, background: CERTAINTY[m.certainty][2], color: CERTAINTY[m.certainty][1] }}>
            {Object.entries(CERTAINTY).map(([v, [label]]) => <option key={v} value={v}>{label}</option>)}
          </select>
          <span onClick={() => removeMetric(m.id)} title="삭제" style={{ cursor: "pointer", color: C.faint, fontSize: 12 }}>✕</span>
        </div>
      )) : (
        <div style={{ fontSize: 13, color: C.sub, padding: 14, background: C.bg, borderRadius: 14 }}>
          아직 수치가 없습니다. 정량 성과가 없다면 정성 변화(CS 감소, 프로세스 표준화 등)를 아래에 적어주세요.
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <Input placeholder="지표명 (예: 매출)" value={draft.metricName} onChange={e => setDraft(d => ({ ...d, metricName: e.target.value }))} style={{ flex: 1 }} />
        <Input placeholder="변화 값 (예: 29)" value={draft.changeValue} onChange={e => setDraft(d => ({ ...d, changeValue: e.target.value }))} style={{ width: 110 }} />
        <Input placeholder="단위 (%)" value={draft.unit} onChange={e => setDraft(d => ({ ...d, unit: e.target.value }))} style={{ width: 70 }} />
        <Input placeholder="근거 자료" value={draft.evidenceSource} onChange={e => setDraft(d => ({ ...d, evidenceSource: e.target.value }))} style={{ width: 130 }} />
        <Btn small onClick={addMetric}>추가</Btn>
      </div>
      <div style={{ marginTop: 12 }}>
        <Label>정성 성과 / 성과 설명</Label>
        <Textarea style={{ minHeight: 60 }} placeholder="예: 출고 실패 0건, 협업 프로세스 표준화, 매뉴얼 배포" value={(local && local.qualitative) || ""} onChange={e => patch && patch("qualitative", e.target.value)} />
      </div>
    </div>
  );
}

/* ============================================================ 보관함 */
function Archive({ experiences, setExperiences, metrics, setMetrics, outputs, setOutputs, onOpen, onAnalyze, onGoImport, addTrash, expCategories, addExpCategory, questionBlocks, setQuestionBlocks, reviewChatHistory, setReviewChatHistory }) {
  const [showReview, setShowReview] = useState(false);
  const [view, setView] = useState("exp"); // exp | comp | question
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [mergeMode, setMergeMode] = useState(false);
  const [selected, setSelected] = useState([]); // 합치기 선택된 experience id들
  const [mergeStep, setMergeStep] = useState(false); // 병합 확인 화면 표시 여부
  const [collapsed, setCollapsed] = useState({}); // 카테고리 블록 접힘 상태

  const exportExcel = () => {
    const rows = experiences.map(e => ({
      제목: e.title, 카테고리: e.primaryCategory || "", 소속: e.organization || "", 역할: e.role || "",
      시작: e.startDate || "", 종료: e.endDate || "", 상태: STATUS_LABEL[e.status] || e.status,
      배경: e.context || "", 문제: e.discoveredProblem || "", 본인기여: e.personalContribution || "",
      기여근거: e.contributionEvidence || "", 성과요약: e.oneLineSummary || "",
      어려움: e.difficulty || "", 배운점: e.learning || "", 직무연결: e.jobRelevance || "",
      역량태그: (e.competencies || []).join(", "), 활용횟수: e.usageCount || 0, 최근수정: e.updatedAt || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = Object.keys(rows[0] || {}).map(k => ({ wch: Math.min(Math.max(k.length + 2, 12), 40) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "경험 목록");
    XLSX.writeFile(wb, `career-os-경험목록-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const deleteExp = (id) => {
    const exp = experiences.find(e => e.id === id);
    setExperiences(prev => prev.filter(e => e.id !== id));
    addTrash("experience", exp.title, exp);
  };

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const cancelMerge = () => { setMergeMode(false); setSelected([]); setMergeStep(false); };

  const FILTERS = [
    ["all", "전체", () => true],
    ["complete", "분석 완료", e => e.status === "complete"],
    ["needs_revision", "보완 필요", e => e.status === "needs_revision"],
    ["draft", "초기 메모", e => e.status === "draft"],
    ["unused", "아직 안 쓴 경험", e => (e.usageCount || 0) === 0],
    ["frequent", "자주 쓴 경험", e => (e.usageCount || 0) >= 3],
    ["hasMetric", "정량 성과 있음", e => metrics.some(m => m.experienceId === e.id)],
    ["needsCheck", "근거 미확인 수치", e => metrics.some(m => m.experienceId === e.id && m.certainty !== "verified")],
    ["hardship", "실패/갈등용", e => !!e.difficulty],
  ];
  const activeFilter = FILTERS.find(f => f[0] === filter) || FILTERS[0];

  const filtered = experiences.filter(e =>
    activeFilter[2](e) &&
    (q === "" || e.title.includes(q) || e.competencies.some(c => c.includes(q)) || (e.organization || "").includes(q))
  );

  const allComps = [...new Set(experiences.flatMap(e => e.competencies))]
    .sort((a, b) => experiences.filter(e => e.competencies.includes(b)).length - experiences.filter(e => e.competencies.includes(a)).length);
  const [compQ, setCompQ] = useState("");
  const [expandedComp, setExpandedComp] = useState({});
  const shownComps = allComps.filter(c => c.includes(compQ));

  const [editingBlockId, setEditingBlockId] = useState(null);
  const [noteDraft, setNoteDraft] = useState({});
  const patchBlock = (id, k, v) => setQuestionBlocks(prev => prev.map(b => b.id === id ? { ...b, [k]: v } : b));
  const addBlockExp = (id, expId) => setQuestionBlocks(prev => prev.map(b => b.id === id && expId && !b.expIds.includes(expId) ? { ...b, expIds: [...b.expIds, expId] } : b));
  const removeBlockExp = (id, expId) => setQuestionBlocks(prev => prev.map(b => b.id === id ? { ...b, expIds: b.expIds.filter(x => x !== expId) } : b));
  const addBlockNote = (id, text) => setQuestionBlocks(prev => prev.map(b => b.id === id
    ? { ...b, notes: [...(b.notes || []), { id: "n_" + Date.now() + Math.random().toString(36).slice(2, 4), text }] } : b));
  const patchBlockNote = (id, noteId, text) => setQuestionBlocks(prev => prev.map(b => b.id === id
    ? { ...b, notes: (b.notes || []).map(n => n.id === noteId ? { ...n, text } : n) } : b));
  const removeBlockNote = (id, noteId) => setQuestionBlocks(prev => prev.map(b => b.id === id
    ? { ...b, notes: (b.notes || []).filter(n => n.id !== noteId) } : b));
  const removeBlock = (id) => setQuestionBlocks(prev => prev.filter(b => b.id !== id));
  const addBlock = () => {
    const id = "qb_" + Date.now();
    setQuestionBlocks(prev => [...prev, { id, label: "", expIds: [] }]);
    setEditingBlockId(id);
  };

  return (
    <div>
      {showReview ? (
        <EssayChat
          title="AI 경험 진단"
          subtitle="현직 채용담당자 시점으로 전체 경험을 검토합니다"
          systemPrompt={EXPERIENCE_REVIEW_SYSTEM_PROMPT}
          contextText={buildReviewContext(experiences, metrics)}
          autoStartMessage="제 경험 데이터를 전체적으로 검토하고, 우선순위 높은 보완점부터 짚어주세요."
          inputPlaceholder="특정 경험에 대해 더 물어보거나, 다른 관점으로 다시 봐달라고 요청해보세요"
          onClose={() => setShowReview(false)}
          history={reviewChatHistory}
          onHistoryChange={setReviewChatHistory}
        />
      ) : mergeStep ? (
        <MergeReview ids={selected} experiences={experiences} setExperiences={setExperiences}
          metrics={metrics} setMetrics={setMetrics} outputs={outputs} setOutputs={setOutputs}
          addTrash={addTrash} onDone={(id) => { cancelMerge(); onOpen(id); }} onCancel={() => setMergeStep(false)} />
      ) : (
      <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <H2>경험 보관함</H2>
        <div style={{ display: "flex", gap: 6 }}>
          {mergeMode ? (
            <Btn small onClick={cancelMerge}>선택 모드 종료</Btn>
          ) : (
            <>
              <Btn small onClick={onGoImport}>파일 가져오기</Btn>
              <Btn small onClick={exportExcel}>엑셀로 내보내기</Btn>
              <Btn small onClick={() => setShowReview(true)}>AI 진단 받기</Btn>
              <Btn small onClick={() => setMergeMode(true)}>선택 모드</Btn>
              {[["exp", "경험별"], ["comp", "역량별"], ["question", "질문별"]].map(([v, l]) => (
                <Btn key={v} small primary={view === v} onClick={() => setView(v)}>{l}</Btn>
              ))}
            </>
          )}
        </div>
      </div>

      {mergeMode && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.accent, border: `1px solid ${C.line}`, borderRadius: 14, padding: "10px 14px", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 13 }}>{selected.length}개 선택됨</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <CategorySelect value="" options={expCategories} placeholder="카테고리 일괄 지정"
              onAddOption={addExpCategory}
              onChange={(v) => { setExperiences(prev => prev.map(e => selected.includes(e.id) ? { ...e, primaryCategory: v } : e)); }} />
            <Btn small disabled={selected.length === 0} onClick={() => {
              if (!window.confirm(`선택한 경험 ${selected.length}개를 삭제할까요?`)) return;
              selected.forEach(id => { const e = experiences.find(x => x.id === id); if (e) addTrash("experience", e.title, e); });
              setExperiences(prev => prev.filter(e => !selected.includes(e.id)));
              setSelected([]);
            }}>선택 삭제</Btn>
            <Btn small primary disabled={selected.length < 2} onClick={() => setMergeStep(true)}>선택한 경험 합치기 →</Btn>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <Input placeholder="경험·역량·소속 검색" value={q} onChange={e => setQ(e.target.value)} style={{ maxWidth: 300 }} />
        {FILTERS.map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ fontFamily: font, fontSize: 12.5, padding: "6px 12px", borderRadius: 14, cursor: "pointer", whiteSpace: "nowrap",
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

      {view === "comp" && (
        <div>
          <Input placeholder="역량 검색" value={compQ} onChange={e => setCompQ(e.target.value)} style={{ maxWidth: 260, marginBottom: 14 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {shownComps.map(c => {
              const hits = experiences.filter(e => e.competencies.includes(c));
              const isOpen = expandedComp[c];
              const shown = isOpen ? hits : hits.slice(0, 4);
              return (
                <Card key={c}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>#{c}</div>
                    <span style={{ fontSize: 11.5, color: C.faint }}>{hits.length}개</span>
                  </div>
                  {shown.map(e => (
                    <div key={e.id} onClick={() => onOpen(e.id)} style={{ padding: "6px 0", borderBottom: `1px solid ${C.lineSoft}`, cursor: "pointer" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{e.title}</span>
                        <Badge label={STATUS_LABEL[e.status]} color={STATUS_COLOR[e.status][0]} bg={STATUS_COLOR[e.status][1]} />
                      </div>
                      {e.oneLineSummary && <div style={{ fontSize: 11.5, color: C.faint, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.oneLineSummary}</div>}
                    </div>
                  ))}
                  {hits.length > 4 && (
                    <div onClick={() => setExpandedComp(p => ({ ...p, [c]: !p[c] }))} style={{ fontSize: 12, color: C.sub, cursor: "pointer", marginTop: 6 }}>
                      {isOpen ? "접기" : `+ ${hits.length - 4}개 더보기`}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
          {shownComps.length === 0 && <div style={{ fontSize: 13, color: C.faint }}>일치하는 역량이 없습니다.</div>}
        </div>
      )}

      {view === "question" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {questionBlocks.map(b => {
              const hits = b.expIds.map(id => experiences.find(e => e.id === id)).filter(Boolean);
              const notes = b.notes || [];
              const isEditing = editingBlockId === b.id;
              const candidates = experiences.filter(e => !b.expIds.includes(e.id));
              const total = hits.length + notes.length;
              return (
                <Card key={b.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 8 }}>
                    {isEditing ? (
                      <Input value={b.label} placeholder="질문 내용" onChange={e => patchBlock(b.id, "label", e.target.value)}
                        style={{ fontWeight: 700, fontSize: 13.5, border: "none", padding: "2px 0", flex: 1 }} />
                    ) : (
                      <div onClick={() => setEditingBlockId(b.id)} style={{ fontWeight: 700, fontSize: 13.5, cursor: "pointer", flex: 1 }}>{b.label || "(제목 없음 — 클릭해서 입력)"}</div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      {total === 0 ? <Badge label="준비 부족" color={C.red} bg={C.redBg} /> : <span style={{ fontSize: 11.5, color: C.faint }}>{total}개</span>}
                      {isEditing ? (
                        <Btn small onClick={() => setEditingBlockId(null)}>완료</Btn>
                      ) : (
                        <span onClick={() => removeBlock(b.id)} title="질문 삭제" style={{ cursor: "pointer", color: C.faint, fontSize: 13 }}>✕</span>
                      )}
                    </div>
                  </div>

                  {hits.map(e => (
                    <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.lineSoft}` }}>
                      <Badge label="경험" color={C.sub} bg={C.lineSoft} />
                      <span onClick={() => !isEditing && onOpen(e.id)} style={{ fontSize: 13, fontWeight: 600, flex: 1, cursor: isEditing ? "default" : "pointer" }}>{e.title}</span>
                      {isEditing && <span onClick={() => removeBlockExp(b.id, e.id)} style={{ cursor: "pointer", color: C.faint, fontSize: 12 }}>✕</span>}
                    </div>
                  ))}

                  {notes.map(n => (
                    <div key={n.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.lineSoft}` }}>
                      <Badge label="메모" color={C.sub} bg={C.lineSoft} />
                      {isEditing ? (
                        <Textarea value={n.text} onChange={e => patchBlockNote(b.id, n.id, e.target.value)} style={{ flex: 1, minHeight: 44, fontSize: 13 }} />
                      ) : (
                        <span style={{ fontSize: 13, lineHeight: 1.5, flex: 1, whiteSpace: "pre-wrap" }}>{n.text}</span>
                      )}
                      {isEditing && <span onClick={() => removeBlockNote(b.id, n.id)} style={{ cursor: "pointer", color: C.faint, fontSize: 12 }}>✕</span>}
                    </div>
                  ))}

                  {total === 0 && !isEditing && <div style={{ fontSize: 12.5, color: C.faint }}>이 질문에 쓸 경험이나 메모가 아직 없습니다.</div>}

                  {isEditing && (
                    <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                      <select value="" onChange={e => addBlockExp(b.id, e.target.value)}
                        style={{ fontFamily: font, fontSize: 12.5, padding: "6px 8px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.panel, width: "100%" }}>
                        <option value="">+ 경험 불러오기</option>
                        {candidates.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                      </select>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Textarea placeholder="경험 없이 바로 메모나 답변 초안을 적어도 됩니다" value={noteDraft[b.id] || ""}
                          onChange={e => setNoteDraft(p => ({ ...p, [b.id]: e.target.value }))} style={{ flex: 1, minHeight: 44, fontSize: 13 }} />
                        <Btn small onClick={() => { if ((noteDraft[b.id] || "").trim()) { addBlockNote(b.id, noteDraft[b.id].trim()); setNoteDraft(p => ({ ...p, [b.id]: "" })); } }}>메모 추가</Btn>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
          <div style={{ marginTop: 12 }}><Btn small onClick={addBlock}>+ 질문 추가</Btn></div>
        </div>
      )}
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
    others.forEach(o => addTrash("experience", o.title, o));

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
function ExperienceDetail({ exp, metrics, setMetrics, outputs, setOutputs, setExperiences, onBack, onAnalyze, onDeleted, addTrash }) {
  const [tab, setTab] = useState("요약");
  const mine = metrics.filter(m => m.experienceId === exp.id);
  const myOutputs = outputs.filter(o => o.experienceId === exp.id);

  const patchField = (k, v) => setExperiences(prev => prev.map(e => e.id === exp.id ? { ...e, [k]: v } : e));
  const setExpLocal = (updater) => setExperiences(prev => prev.map(e => e.id === exp.id ? (typeof updater === "function" ? updater(e) : updater) : e));

  const approve = (id) => setOutputs(prev => prev.map(o => o.id === id ? { ...o, approvalStatus: "approved", isStale: false } : o));
  const reject = (id) => setOutputs(prev => prev.map(o => o.id === id ? { ...o, approvalStatus: "rejected" } : o));
  const deleteExp = () => {
    setExperiences(prev => prev.filter(e => e.id !== exp.id));
    addTrash("experience", exp.title, exp);
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

  const [chatMode, setChatMode] = useState(null); // { type: "regenerate", outputId } | { type: "new" }
  const [showReview, setShowReview] = useState(false);
  const [reviewHistory, setReviewHistory] = useState([]);
  const expApp = { company: exp.organization || exp.title, position: exp.role || "", requirements: [] };
  const closeChat = () => setChatMode(null);

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
          <Btn small onClick={() => setShowReview(true)}>이 경험만 AI 진단</Btn>
          <Btn small onClick={() => onAnalyze(exp.id)}>{exp.depthDone ? "수정하기" : "심화 분석 계속"}</Btn>
          <span onClick={deleteExp} title="이 경험 삭제 (휴지통에서 복구 가능)" style={{ cursor: "pointer", color: C.faint, fontSize: 14, padding: "0 4px" }}>✕</span>
        </div>
      </div>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 16 }}>{exp.organization} · {exp.role} · {exp.startDate}~{exp.endDate}</div>

      {showReview && (
        <div style={{ marginBottom: 18 }}>
          <EssayChat
            title="AI 경험 진단 (이 경험만)"
            subtitle={exp.title}
            systemPrompt={EXPERIENCE_REVIEW_SYSTEM_PROMPT}
            contextText={buildReviewContext([exp], metrics)}
            autoStartMessage="이 경험 하나만 자세히 검토하고, 우선순위 높은 보완점부터 짚어주세요."
            inputPlaceholder="더 물어보거나, 다른 관점으로 다시 봐달라고 요청해보세요"
            onClose={() => setShowReview(false)}
            history={reviewHistory}
            onHistoryChange={setReviewHistory}
          />
        </div>
      )}

      <div style={{ display: "flex", gap: 2, borderBottom: `1px solid ${C.line}`, marginBottom: 18 }}>
        {["요약", "사실", "행동", "성과", "활용 문장", "완성도"].map(t => (
          <div key={t} onClick={() => setTab(t)} style={{ padding: "9px 14px", fontSize: 13.5, fontWeight: tab === t ? 700 : 500, cursor: "pointer",
            color: tab === t ? C.text : C.sub, borderBottom: tab === t ? `2px solid ${C.text}` : "2px solid transparent", marginBottom: -1 }}>{t}</div>
        ))}
      </div>

      {tab === "요약" && (
        <div style={{ display: "grid", gap: 12 }}>
          <Card><Label>한 줄 요약</Label><Textarea value={exp.oneLineSummary || ""} placeholder="이 경험을 한 줄로 요약하면" onChange={e => patchField("oneLineSummary", e.target.value)} style={{ fontSize: 14.5, minHeight: 50 }} /></Card>
          <Card style={{ background: C.accent }}><Label>핵심 메시지</Label><Textarea value={exp.coreMessage || ""} placeholder="이 경험의 핵심 메시지" onChange={e => patchField("coreMessage", e.target.value)} style={{ fontSize: 14, minHeight: 50, background: "transparent" }} /></Card>
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
          <Label>사실 보관함 — 직접 수정 가능</Label>
          {[["organization", "소속"], ["role", "역할"], ["assignedTask", "주어진 업무"], ["discoveredProblem", "발견한 문제"]].map(([k, label]) => (
            <div key={k} style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 10, padding: "9px 0", borderBottom: `1px solid ${C.lineSoft}`, fontSize: 13.5, alignItems: "center" }}>
              <span style={{ color: C.faint, fontWeight: 600 }}>{label}</span>
              <Input value={exp[k] || ""} placeholder="미입력" onChange={e => patchField(k, e.target.value)} style={{ border: "none", padding: "2px 0" }} />
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 10, padding: "9px 0", borderBottom: `1px solid ${C.lineSoft}`, fontSize: 13.5, alignItems: "center" }}>
            <span style={{ color: C.faint, fontWeight: 600 }}>기여 수준</span>
            <select value={exp.contributionLevel || ""} onChange={e => patchField("contributionLevel", e.target.value)}
              style={{ fontFamily: font, fontSize: 13.5, padding: "6px 8px", borderRadius: 14, border: `1px solid ${C.line}`, background: C.panel, width: 200 }}>
              <option value="">미입력</option>
              {Object.entries(CONTRIB_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div style={{ padding: "9px 0", fontSize: 13.5 }}>
            <div style={{ color: C.faint, fontWeight: 600, marginBottom: 6 }}>기여 근거</div>
            <Textarea value={exp.contributionEvidence || ""} placeholder="본인 기여를 증명할 근거를 적어주세요" onChange={e => patchField("contributionEvidence", e.target.value)} />
          </div>
          <div style={{ fontSize: 12, color: C.faint, marginTop: 10 }}>여기서 고친 내용은 활용 문장이 참조하는 원본에 바로 반영됩니다. 이미 승인된 문장 자체는 자동으로 바뀌지 않으니, 필요하면 "재생성"으로 새로 만들어주세요.</div>
        </Card>
      )}

      {tab === "행동" && (
        <Card>
          <ActionEditor local={exp} setLocal={setExpLocal} />
        </Card>
      )}

      {tab === "성과" && (
        <Card>
          <MetricEditor expId={exp.id} metrics={metrics} setMetrics={setMetrics} local={exp} patch={patchField} />
        </Card>
      )}

      {tab === "활용 문장" && chatMode && (
        <EssayChat
          title={chatMode.type === "regenerate" ? "문장 재생성" : "새 이력서 문장 만들기"}
          subtitle={exp.title}
          systemPrompt={ESSAY_COACH_SYSTEM_PROMPT}
          contextText={buildEssayContext(expApp,
            chatMode.type === "regenerate"
              ? { question: `아래 기존 문장을 더 설득력 있게 다시 써주세요 (성과 중심, 이력서용 한 문장):\n"${outputs.find(o => o.id === chatMode.outputId)?.content || ""}"`, characterLimit: 150 }
              : { question: "이 경험을 바탕으로 이력서에 쓸 성과 중심의 한 문장을 만들어주세요.", characterLimit: 150 },
            [exp], metrics)}
          autoStartMessage={chatMode.type === "regenerate" ? "다시 써주세요." : "문장을 만들어주세요."}
          onClose={closeChat}
          onSaveDraft={(text) => {
            if (chatMode.type === "regenerate") {
              setOutputs(prev => prev.map(o => o.id === chatMode.outputId
                ? { ...o, content: text, version: o.version + 1, approvalStatus: "ai_draft", isStale: false } : o));
            } else {
              setOutputs(prev => [...prev, {
                id: "o_" + Date.now(), experienceId: exp.id, outputType: "resume",
                content: text, referencedMetricIds: [], version: 1, isAiGenerated: true,
                approvalStatus: "ai_draft", isStale: false,
              }]);
            }
            closeChat();
          }}
          saveDraftLabel="이 문장으로 저장"
        />
      )}

      {tab === "활용 문장" && !chatMode && (
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
                  <Btn small onClick={() => setChatMode({ type: "regenerate", outputId: o.id })}>재생성</Btn>
                  <Btn small onClick={() => reject(o.id)}>폐기</Btn>
                </div>
              </Card>
            );
          })}
          <div><Btn onClick={() => setChatMode({ type: "new" })}>+ 이력서 문장 만들기</Btn></div>
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
        parsed = parseAIJson(text);
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
        AI 추출 규칙: 원문에 없는 내용은 만들지 않으며, 모든 수치는 근거 자료가 확인될 때까지 "추가 확인 필요" 상태로 들어옵니다.<br />
        입력한 내용은 추출을 위해 외부 AI 서버로 전송되며, 이 앱이 별도로 저장하지 않습니다.
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
function Skills({ skills, setSkills, experiences, onOpenExp, addTrash }) {
  const [tab, setTab] = useState("도구");
  const [newSkill, setNewSkill] = useState("");
  const [addingScope, setAddingScope] = useState(null); // skillId
  const [scopeDraft, setScopeDraft] = useState({ text: "", evidenceExpId: "" });

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
    addTrash("skill", skill.name, skill);
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
        {["도구", "직무 역량"].map(t => (
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
    addTrash("application", `${app.company} ${app.position}`.trim(), app);
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

const PERSONAL_ASSISTANT_SYSTEM_PROMPT = `당신은 사용자의 취업 준비를 옆에서 도와주는 친근한 개인 어시스턴트입니다. 채용담당자나 컨설턴트 페르소나가 아니라, 사용자의 경험과 상황을 잘 아는 친구 같은 존재입니다.

역할
사용자가 취업 준비 중 드는 개인적인 고민이나 사소한 질문(예: "이 회사 지원할까 말까", "내 경험 중에 뭐가 제일 강점인 것 같아?", "요즘 너무 불안한데 어떻게 해야 할까", "이 자격증 딸 가치가 있을까")에, 아래 제공되는 사용자의 실제 데이터(경험/역량/자격증/지원 현황)를 참고해서 답합니다.

원칙
- 아래 데이터에 없는 사실을 지어내지 마십시오. 데이터에 없으면 "그 부분은 아직 정리가 안 되어 있네요"라고 솔직히 말하십시오.
- 채용담당자처럼 평가하거나 심사하는 톤을 쓰지 마십시오. 옆에서 같이 고민해주는 톤을 쓰십시오.
- 진로·심리적으로 무거운 고민이면 성급하게 정답을 주기보다 사용자의 상황을 먼저 이해하려는 질문을 해도 됩니다.
- 사소한 질문(맞춤법, 이 표현이 나은지 등)은 바로 간단히 답하십시오.
- 답변은 짧고 자연스럽게. 보고서처럼 항목별로 나열하지 말고, 대화하듯 쓰십시오.`;

function buildPersonalContext(experiences, skills, certs, awards, resumeProfile, applications, metrics) {
  const expLines = experiences.map(e => {
    const myMetrics = (metrics || []).filter(m => m.experienceId === e.id);
    const metricStr = myMetrics.length ? ` [수치: ${myMetrics.map(m => `${m.metricName} ${formatMetric(m, "exact")}`).join(", ")}]` : "";
    const extras = [
      e.goal ? `목표: ${e.goal}` : null,
      e.difficulty ? `어려움: ${e.difficulty}` : null,
      e.learning ? `배운 점: ${e.learning}` : null,
      e.jobRelevance ? `직무 연결: ${e.jobRelevance}` : null,
    ].filter(Boolean).join(" / ");
    return `- ${e.title} (${e.organization || "소속 미상"}, ${e.status}) — ${e.oneLineSummary || e.context || "요약 없음"}${metricStr}${(e.competencies || []).length ? ` [역량: ${e.competencies.join(", ")}]` : ""}${extras ? ` [${extras}]` : ""}`;
  }).join("\n");
  const skillLines = (skills || []).map(s => `- ${s.name}`).join(", ");
  const certLines = (certs || []).map(c => `- ${c.name}${c.date ? ` (${c.date})` : ""}`).join(", ");
  const awardLines = (awards || []).map(a => `- ${a.name}`).join(", ");
  const appLines = (applications || []).map(a => `- ${a.company} · ${a.position} (${a.status}${a.deadline ? `, 마감 ${a.deadline}` : ""})`).join("\n");

  return `[사용자 프로필]
이름: ${resumeProfile?.name || "미입력"} / 희망 직무: ${resumeProfile?.targetRole || "미입력"}
한 줄 소개: ${resumeProfile?.headline || "미입력"}

[정리된 경험 — ${experiences.length}건]
${expLines || "아직 정리된 경험이 없습니다."}

[역량·스킬]
${skillLines || "없음"}

[자격증·어학]
${certLines || "없음"}

[수상기록]
${awardLines || "없음"}

[지원 현황]
${appLines || "등록된 지원처가 없습니다."}`;
}

const EXPERIENCE_REVIEW_SYSTEM_PROMPT = `당신은 국내 대기업·외국계·스타트업 채용을 두루 경험한 시니어 채용담당자입니다. 지금부터 지원자가 정리한 "경험 데이터베이스" 전체를 검토합니다.

역할
지원자가 이 데이터를 이력서·자소서·면접에 그대로 활용할 것이므로, 실무자 시선에서 부족한 부분을 냉정하게 짚어주는 것이 당신의 역할입니다. 무조건적인 칭찬은 도움이 되지 않습니다.

검토 시 반드시 확인할 것
   * 수치·성과가 빠져 있거나 모호한 경험 (예: "매출이 늘었다" 수준에서 멈춘 경우)
   * 배경·문제·행동·기여도·성과 중 비어 있는 항목이 있는 경험
   * 본인이 한 일과 팀이 한 일이 구분되지 않는 경험 (기여도 근거 부실)
   * 서로 내용이 겹치거나 같은 일화가 여러 경험으로 쪼개져 있는 것으로 보이는 경우 (합치기를 제안할 것)
   * 어려움·배운 점이 비어 있어 면접 압박 질문(실패, 갈등, 어려움 극복)에 쓸 수 없는 경험
   * 전체적으로 부족한 역량 유형 (예: 리더십, 협업, 문제 해결 중 특정 유형의 경험이 없는 경우)

답변 방식
   * 한 번에 모든 걸 나열하지 말고, 가장 시급하고 임팩트가 큰 문제 3~5가지를 우선순위대로 짚으십시오.
   * 각 지적에는 어떤 경험(제목)의 어떤 부분이 문제인지 구체적으로 명시하십시오.
   * 추상적인 조언("더 구체적으로 쓰세요") 대신, 무엇을 확인하거나 채워 넣으면 되는지 실행 가능한 다음 행동을 제시하십시오.
   * 절대 지어내지 마십시오 — 데이터에 없는 내용을 추측해서 "이랬을 것이다"라고 단정하지 말고, 없으면 "확인이 필요합니다"라고 하십시오.
   * 사용자가 특정 경험에 대해 더 파고들어 질문하면 그 경험에 집중해서 답하십시오.`;

function buildReviewContext(experiences, metrics) {
  const lines = experiences.map(e => {
    const parts = [`- [${e.title}] (${e.organization || "소속 미상"} · ${e.status}${e.depthDone ? "" : " · 심화 미입력"})`];
    parts.push(`  배경: ${e.context || "(없음)"}`);
    parts.push(`  문제: ${e.discoveredProblem || "(없음)"}`);
    parts.push(`  본인 기여: ${e.personalContribution || "(없음)"} / 기여 근거: ${e.contributionEvidence || "(없음)"}`);
    if (e.goal) parts.push(`  목표: ${e.goal}`);
    if (e.actions?.length) {
      parts.push(`  행동:\n${e.actions.map(a => `    · (${ACTION_LABEL[a.actionType] || a.actionType}) ${a.description}`).join("\n")}`);
    }
    const myMetrics = (metrics || []).filter(m => m.experienceId === e.id);
    if (myMetrics.length) {
      parts.push(`  성과 수치:\n${myMetrics.map(m => `    · ${m.metricName}: ${formatMetric(m, "exact")} (${CERTAINTY[m.certainty]?.[0] || m.certainty})`).join("\n")}`);
    }
    parts.push(`  성과 요약: ${e.oneLineSummary || "(없음)"}`);
    if (e.qualitative) parts.push(`  정성 성과: ${e.qualitative}`);
    parts.push(`  어려움: ${e.difficulty || "(없음)"} / 배운 점: ${e.learning || "(없음)"}`);
    if (e.coreMessage) parts.push(`  핵심 메시지: ${e.coreMessage}`);
    if (e.jobRelevance) parts.push(`  직무 연결: ${e.jobRelevance}`);
    parts.push(`  역량 태그: ${(e.competencies || []).join(", ") || "(없음)"}`);
    return parts.join("\n");
  }).join("\n\n");

  return `[지원자의 경험 데이터베이스 전체 — ${experiences.length}건]
${lines || "등록된 경험이 없습니다."}`;
}

// 경험의 '정리된 모든 내용'을 읽기 전용으로 보여주는 재사용 뷰 (자소서·면접 등 연동되는 곳 어디서나)
function ExperienceContentView({ exp: e, metrics = [] }) {
  if (!e) return null;
  const myMetrics = (metrics || []).filter(m => m.experienceId === e.id);
  const Row = ({ k, v }) => v ? (
    <div style={{ marginBottom: 6 }}>
      <span style={{ fontSize: 11, color: C.faint }}>{k}</span>
      <div style={{ fontSize: 12.5, color: C.text, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{v}</div>
    </div>
  ) : null;
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 12px", marginTop: 6 }}>
      <Row k="배경" v={e.context} />
      <Row k="문제" v={e.discoveredProblem} />
      {(e.actions || []).length > 0 && (
        <div style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: C.faint }}>행동</span>
          {e.actions.map((a, i) => <div key={i} style={{ fontSize: 12.5, color: C.text, lineHeight: 1.5 }}>· ({ACTION_LABEL[a.actionType] || a.actionType}) {a.description}</div>)}
        </div>
      )}
      <Row k="기여 근거" v={e.contributionEvidence} />
      <Row k="성과 요약" v={e.oneLineSummary} />
      <Row k="정성 성과" v={e.qualitative} />
      {myMetrics.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: C.faint }}>성과 수치</span>
          {myMetrics.map(m => <div key={m.id} style={{ fontSize: 12.5, color: C.text }}>· {m.metricName}: {formatMetric(m, "exact")} <span style={{ color: (CERTAINTY[m.certainty]?.[1]) || C.faint }}>({CERTAINTY[m.certainty]?.[0] || m.certainty})</span></div>)}
        </div>
      )}
      <Row k="목표" v={e.goal} />
      <Row k="어려움" v={e.difficulty} />
      <Row k="배운 점" v={e.learning} />
      <Row k="직무 연결" v={e.jobRelevance} />
      <Row k="핵심 메시지" v={e.coreMessage} />
      {(e.competencies || []).length > 0 && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 4 }}>
          {e.competencies.map(c => <Badge key={c} label={"#" + c} color={C.sub} bg={C.lineSoft} />)}
        </div>
      )}
    </div>
  );
}
// 접었다 폈다 하는 래퍼
function ExperiencePeek({ exp, metrics, label = "정리 내용 보기" }) {
  const [open, setOpen] = useState(false);
  if (!exp) return null;
  return (
    <div style={{ marginTop: 6 }}>
      <span onClick={() => setOpen(o => !o)} style={{ cursor: "pointer", fontSize: 11.5, color: C.blue }}>
        {open ? "▴ 접기" : `▾ ${label}`}
      </span>
      {open && <ExperienceContentView exp={exp} metrics={metrics} />}
    </div>
  );
}

function buildEssayContext(app, essay, experiences, metrics) {
  const describeExp = (e) => {
    const parts = [`- [${e.title}] ${e.organization || ""} · ${e.role || ""} (${e.startDate}~${e.endDate})`];
    if (e.context) parts.push(`  배경: ${e.context}`);
    if (e.discoveredProblem) parts.push(`  문제: ${e.discoveredProblem}`);
    if (e.personalContribution) parts.push(`  본인 행동/기여: ${e.personalContribution}`);
    if (e.contributionEvidence) parts.push(`  기여 근거: ${e.contributionEvidence}`);
    if (e.goal) parts.push(`  목표: ${e.goal}`);
    if (e.actions?.length) {
      const actionLines = e.actions.map(a => `    · (${ACTION_LABEL[a.actionType] || a.actionType}) ${a.description}`).join("\n");
      parts.push(`  행동 타임라인:\n${actionLines}`);
    }
    const myMetrics = (metrics || []).filter(m => m.experienceId === e.id);
    if (myMetrics.length) {
      const metricLines = myMetrics.map(m =>
        `    · ${m.metricName}: ${formatMetric(m, "exact")} (${CERTAINTY[m.certainty]?.[0] || m.certainty}${m.evidenceSource ? `, 근거: ${m.evidenceSource}` : ""})`
      ).join("\n");
      parts.push(`  성과 수치 (certainty가 "확인 필요"인 값은 문장에 그대로 확정적으로 쓰지 말고 사용자에게 확인을 권할 것):\n${metricLines}`);
    }
    if (e.oneLineSummary) parts.push(`  성과 요약: ${e.oneLineSummary}`);
    if (e.qualitative) parts.push(`  정성 성과: ${e.qualitative}`);
    if (e.difficulty) parts.push(`  어려움: ${e.difficulty}`);
    if (e.learning) parts.push(`  배운 점: ${e.learning}`);
    if (e.coreMessage) parts.push(`  핵심 메시지: ${e.coreMessage}`);
    if (e.jobRelevance) parts.push(`  직무 연결: ${e.jobRelevance}`);
    if (e.competencies?.length) parts.push(`  관련 역량: ${e.competencies.join(", ")}`);
    return parts.join("\n");
  };

  const selected = (essay.selectedExperienceIds || []).map(id => experiences.find(e => e.id === id)).filter(Boolean);
  const usable = selected.length > 0 ? selected : experiences.filter(e => e.status !== "draft");
  const others = selected.length > 0
    ? experiences.filter(e => e.status !== "draft" && !selected.some(s => s.id === e.id))
    : [];

  const factLines = usable.map(describeExp).join("\n\n");
  const otherTitles = others.map(e => `- ${e.title}`).join("\n");

  const reqLines = (app.requirements || []).map(r => `- ${r.requirement} (중요도 ${r.importance}/5)${r.matchReason ? ` — ${r.matchReason}` : ""}`).join("\n");

  return `[지원 정보]
회사: ${app.company}
직무: ${app.position}

[이 회사가 요구하는 역량 (공고 분석 결과) — 답변에서 이 키워드와 최대한 연결지어 서술할 것]
${reqLines || "등록된 요구 역량 없음"}

[자기소개서 문항]
"${essay.question || "(문항 미입력 — 사용자에게 문항을 먼저 물어볼 것)"}"
글자 수 제한: ${essay.characterLimit}자

[이 문항에 사용하기로 선택된 경험 — 우선적으로 이것만 활용하고, 여기 없는 내용은 지어내지 말 것]
${factLines || "선택되었거나 분석 완료된 경험이 없습니다. 먼저 어떤 경험을 쓸지 사용자에게 추천/확인하십시오."}
${others.length > 0 ? `\n[그 외 참고 가능한 경험 (제목만) — 선택된 경험이 문항과 잘 안 맞아 보이면 이 중에서 대안을 제안할 것]\n${otherTitles}` : ""}`;
}

function EssayChat({ title, subtitle, systemPrompt, contextText, autoStartMessage, inputPlaceholder, onClose, closeLabel, onSaveDraft, saveDraftLabel, history, onHistoryChange }) {
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
        send(autoStartMessage || "안녕하세요, 도와주세요.", true);
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
          systemPrompt,
          context: contextText,
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
          <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11.5, color: C.faint }}>{subtitle}</div>}
          <div style={{ fontSize: 10.5, color: C.faint, marginTop: 2 }}>이 대화 내용은 응답 생성을 위해 외부 AI 서버로 전송됩니다</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {messages.length > 0 && <Btn small onClick={() => { updateMessages([]); started.current = false; }}>대화 초기화</Btn>}
          {onSaveDraft && lastAssistant && <Btn small onClick={() => onSaveDraft(lastAssistant.content)}>{saveDraftLabel || "이 답변을 초안으로 저장"}</Btn>}
          <Btn small onClick={onClose}>{closeLabel || "← 목록으로"}</Btn>
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
        <Textarea rows={2} placeholder={inputPlaceholder || "피드백을 입력하거나 '다음 문항'이라고 입력하세요"} value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          style={{ flex: 1, minHeight: 44 }} />
        <Btn primary disabled={loading || !input.trim()} onClick={() => send(input)}>전송</Btn>
      </div>
    </Card>
  );
}

function JobPostingExtractor({ experiences, raw, onExtracted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const extract = async () => {
    if (!raw.trim()) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/extract-jd", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw }),
      });
      let data;
      try { data = await res.json(); }
      catch { throw new Error(`서버 응답을 읽지 못했습니다 (HTTP ${res.status})`); }
      if (!res.ok) {
        throw new Error(data?.error?.message
          || (typeof data?.error === "string" ? data.error : null)
          || `API 오류 (HTTP ${res.status}) — 응답 원문: ${JSON.stringify(data).slice(0, 300)}`);
      }
      const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
      const parsed = parseAIJson(text);
      const newReqs = (parsed.requirements || []).map(r => {
        // 역량 키워드 겹침으로 매칭 경험 자동 제안 — 최종 확인은 사람이
        const match = experiences.find(e => (e.competencies || []).some(c => r.requirement.includes(c) || c.includes(r.requirement)));
        return {
          id: "r_" + Date.now() + Math.random().toString(36).slice(2, 4),
          requirement: r.requirement, category: "required_competency",
          importance: r.importance || 3, matchedExp: match ? match.id : null,
          matchReason: match ? "역량 키워드로 자동 매칭됨 — 적절한지 확인 필요" : "",
          gap: match ? "" : "매칭 가능한 경험 없음",
        };
      });
      onExtracted(newReqs);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 10 }}>
      {error && (
        <div style={{ marginBottom: 8, padding: "8px 10px", background: C.accent, border: `1px solid ${C.line}`, borderRadius: 12 }}>
          <div style={{ fontSize: 12, color: C.red, fontWeight: 700 }}>오류</div>
          <div style={{ fontSize: 12, color: C.red, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>{error}</div>
        </div>
      )}
      <Btn small primary disabled={loading || !raw.trim()} onClick={extract}>{loading ? "추출 중…" : "AI로 요구 역량 추출"}</Btn>
    </div>
  );
}

function ApplicationReview({ app, experiences, metrics }) {
  const keywordSet = (app.requirements || []).map(r => r.requirement);
  return (
    <div>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 16, lineHeight: 1.6 }}>
        면접·자소서 직전에 이 회사 관련 내용만 압축해서 훑어보는 화면입니다.
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Label>이 회사 핵심 키워드 (공고 분석 결과)</Label>
        {keywordSet.length > 0 ? (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {keywordSet.map(k => <Badge key={k} label={k} color={C.blue} bg={C.blueBg} />)}
          </div>
        ) : <div style={{ fontSize: 12.5, color: C.faint }}>등록된 요구 역량이 없습니다. 공고 분석 탭에서 추가하세요.</div>}
      </Card>

      <Label>면접 질문별 요약</Label>
      {(app.interviews || []).map(iq => {
        const exp = experiences.find(e => e.id === iq.selectedExperienceId);
        const unverified = exp ? metrics.filter(m => m.experienceId === exp.id && m.certainty !== "verified") : [];
        const matchedKeywords = exp ? keywordSet.filter(k => (exp.competencies || []).some(c => k.includes(c) || c.includes(k))) : [];
        return (
          <Card key={iq.id} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{iq.question || "(질문 미입력)"}</div>
            {exp ? (
              <>
                <div style={{ fontSize: 13, color: C.text, marginBottom: 6 }}>
                  <b>{exp.title}</b> — {exp.coreMessage || exp.oneLineSummary || "핵심 메시지 미입력"}
                </div>
                {matchedKeywords.length > 0 && (
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 6 }}>
                    {matchedKeywords.map(k => <Badge key={k} label={k} color={C.green} bg={C.greenBg} />)}
                  </div>
                )}
                {unverified.length > 0 && (
                  <div style={{ fontSize: 12, color: C.red, background: C.redBg, padding: "6px 10px", borderRadius: 12, marginBottom: 6 }}>
                    ⚠ 확인 안 된 수치: {unverified.map(m => `${m.metricName} (${formatMetric(m, "exact")})`).join(", ")}
                  </div>
                )}
                {(iq.followUps || []).length > 0 && (
                  <div style={{ fontSize: 12.5, color: C.sub }}>
                    예상 꼬리질문: {iq.followUps.join(" / ")}
                  </div>
                )}
                <ExperiencePeek exp={exp} metrics={metrics} label="이 경험 정리 내용 전체 보기" />
              </>
            ) : (
              <div style={{ fontSize: 12.5, color: C.faint }}>사용할 경험이 아직 선택되지 않았습니다.</div>
            )}
          </Card>
        );
      })}
      {(app.interviews || []).length === 0 && <div style={{ fontSize: 13, color: C.faint }}>등록된 면접 질문이 없습니다.</div>}
    </div>
  );
}

function AppLinks({ app, setApplications }) {
  const links = app.links || [];
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  const normalizeUrl = (u) => /^https?:\/\//i.test(u) ? u : `https://${u}`;

  const add = () => {
    if (!url.trim()) return;
    setApplications(prev => prev.map(a => a.id === app.id
      ? { ...a, links: [...(a.links || []), { id: "lk_" + Date.now(), label: label.trim() || "링크", url: normalizeUrl(url.trim()) }] } : a));
    setLabel(""); setUrl(""); setAdding(false);
  };
  const remove = (id) => setApplications(prev => prev.map(a => a.id === app.id ? { ...a, links: (a.links || []).filter(l => l.id !== id) } : a));

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
      {links.map(l => (
        <span key={l.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: C.lineSoft, borderRadius: 14, padding: "5px 10px", fontSize: 12.5 }}>
          <a href={l.url} target="_blank" rel="noreferrer" style={{ color: C.text, textDecoration: "none" }}>🔗 {l.label}</a>
          <span onClick={() => remove(l.id)} style={{ cursor: "pointer", color: C.faint }}>✕</span>
        </span>
      ))}
      {adding ? (
        <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
          <Input placeholder="이름 (예: 회사 홈페이지)" value={label} onChange={e => setLabel(e.target.value)} style={{ width: 140, fontSize: 12.5, padding: "5px 8px" }} />
          <Input placeholder="URL" value={url} onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && add()} style={{ width: 200, fontSize: 12.5, padding: "5px 8px" }} />
          <Btn small primary onClick={add}>추가</Btn>
          <Btn small onClick={() => { setAdding(false); setLabel(""); setUrl(""); }}>취소</Btn>
        </span>
      ) : (
        <span onClick={() => setAdding(true)} style={{ fontSize: 12.5, color: C.sub, cursor: "pointer", textDecoration: "underline" }}>+ 링크 추가 (회사 홈페이지, 채용공고, 지원 포탈 등)</span>
      )}
    </div>
  );
}

/* ---------- 기업분석 (컨설턴트 방법론: 키워드 → '왜' 질문 → 파고들기 → 전략) ---------- */
const CA_CATEGORIES = [
  { id: "vision", label: "신년사·CEO 메시지", hint: "회장·CEO 공식 발언에서 눈에 띄는 키워드" },
  { id: "performance", label: "실적의 '왜'", hint: "숫자 나열 말고, 증감의 '왜'" },
  { id: "business", label: "사업 현황·정의", hint: "이 회사가 산업을 어떻게 정의하는지 (DART·뉴스)" },
  { id: "newbiz", label: "신사업·M&A", hint: "새 사업/인수. 미시(내 역량) vs 거시(공통분모)" },
  { id: "talent", label: "인재상·핵심가치", hint: "원하는 사람·가치, 내 경험과 연결" },
  { id: "issue", label: "기타 이슈", hint: "최근 뉴스·트렌드·논란" },
];
const CA_CAT_LABEL = Object.fromEntries(CA_CATEGORIES.map(c => [c.id, c.label]));
const CA_PURPOSE = { essay: "자소서용", interview: "면접용", both: "둘 다" };
// 카테고리별 추출 규칙 (컨설턴트 문서 방법론)
const CA_RULES = {
  vision: "CEO·회장 발언에서 방향을 드러내는 키워드를 뽑고, 그 키워드로 '더 찾아볼 검색어'를 제안하라.",
  performance: "매출·실적 숫자를 나열하지 말고, 증감의 '원인(왜)'을 묻는 질문을 만들어라. 키워드도 원인·배경 중심으로.",
  business: "이 회사가 자기 산업을 '어떻게 정의'하는지 드러내는 키워드와, 경쟁사 대비 차별 키워드를 뽑아라.",
  newbiz: "신사업을 '미시(내 역량·경험과 연결할 구체 지점)'와 '거시(여러 사업을 하나로 묶는 공통분모)' 두 관점으로 나눠 키워드·질문을 만들어라.",
  talent: "회사가 원하는 인재상·가치와, 그것을 내 경험으로 증명할 연결 키워드를 뽑아라.",
  issue: "이슈의 배경과 회사에 미칠 영향을 묻는 '왜/어떻게' 질문을 만들어라.",
};

// 섹션 헤더 (가독성 — 번호 + 제목 + 부제)
function CASection({ n, title, desc, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: C.green }}>{n}</span>
        <span style={{ fontSize: 15.5, fontWeight: 800, letterSpacing: "-.01em" }}>{title}</span>
      </div>
      {desc && <div style={{ fontSize: 12.5, color: C.faint, margin: "3px 0 14px", lineHeight: 1.55 }}>{desc}</div>}
      {children}
    </div>
  );
}

function CompanyAnalysis({ app, setApplications, experiences, metrics }) {
  const ca = app.companyAnalysis || { research: [], digs: [], strategy: null };
  const setCA = (updater) => setApplications(prev => prev.map(a => {
    if (a.id !== app.id) return a;
    const cur = a.companyAnalysis || { research: [], digs: [], strategy: null };
    return { ...a, companyAnalysis: typeof updater === "function" ? updater(cur) : updater };
  }));
  const selStyle = { fontFamily: font, fontSize: 13, padding: "8px 10px", borderRadius: 10, border: `1px solid ${C.line}`, background: C.panel, color: C.text };

  const callAI = async (systemPrompt, context) => {
    let res;
    try {
      res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt, context, messages: [{ role: "user", content: "위 지시대로 JSON으로만 답해줘." }] }),
      });
    } catch { throw new Error("AI 서버에 연결하지 못했어요. 잠시 후 다시 시도해주세요."); }
    let json;
    try { json = await res.json(); } catch { throw new Error("AI 응답을 읽지 못했어요. 다시 시도해주세요."); }
    if (!res.ok) throw new Error(typeof json?.error === "string" ? json.error : "AI 호출에 실패했어요.");
    const text = (json.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
    return parseAIJson(text);
  };
  // 웹 검색 그라운딩 호출 — 실제 정보 + 출처. 빈 응답(간헐적)이면 1회 재시도해 항상 답이 나오게.
  const callResearch = async (systemPrompt, context) => {
    const once = async () => {
      let res;
      try {
        res = await fetch("/api/chat", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ systemPrompt, context, useSearch: true, messages: [{ role: "user", content: "검색으로 확인해 JSON으로만 답해줘." }] }),
        });
      } catch { throw new Error("연결 실패"); }
      let json;
      try { json = await res.json(); } catch { throw new Error("응답 파싱 실패"); }
      if (!res.ok) throw new Error(typeof json?.error === "string" ? json.error : "AI 호출 실패");
      const text = (json.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
      if (!text.trim()) throw new Error("빈 응답");
      let parsed; try { parsed = parseAIJson(text); } catch { parsed = { _raw: text }; }
      return { parsed, sources: json._sources || [] };
    };
    try { return await once(); }
    catch { await new Promise(r => setTimeout(r, 600)); return once(); }  // 간헐적 빈 응답 대비 1회 재시도
  };
  // B) 직접 리서치 링크 (구글·네이버·DART)
  const searchUrl = (q, engine) => {
    const e = encodeURIComponent(q);
    if (engine === "naver") return `https://search.naver.com/search.naver?query=${e}`;
    if (engine === "dart") return `https://www.google.com/search?q=${encodeURIComponent("site:dart.fss.or.kr " + q)}`;
    return `https://www.google.com/search?q=${e}`;
  };
  const SearchLinks = ({ q }) => (
    <span style={{ fontSize: 11, color: C.faint, whiteSpace: "nowrap" }}>
      {[["구글", "google"], ["네이버", "naver"], ["DART", "dart"]].map(([label, eng], i) => (
        <span key={eng}>
          {i > 0 && <span style={{ color: C.line }}> · </span>}
          <a href={searchUrl(q, eng)} target="_blank" rel="noopener noreferrer" style={{ color: C.blue, textDecoration: "none" }}>{label}</a>
        </span>
      ))}
    </span>
  );

  // ── 자료 수집 ──
  const [draft, setDraft] = useState({ category: "vision", source: "", summary: "", purpose: "both" });
  const [extracting, setExtracting] = useState(false);
  const aiExtract = (summary, category) => callAI(
    `너는 유통·기업분석 코치다. '${app.company}'(${app.position || ""}) 지원자가 '${CA_CAT_LABEL[category]}' 자료를 조사했다.\n${CA_RULES[category] || ""}\n【사실만】 오직 아래 [내용]에 실제로 적힌 것만 근거로 삼아라. [내용]에 없는 회사 사실을 추측해 만들어 넣지 마라. 키워드도 [내용]에 나온 표현·개념에서 뽑아라.\n공통 원칙: 매출 숫자 나열 금지, '왜'에 초점.\nJSON만: {"keywords":["자소서·면접에 쓸 핵심 키워드 3~6개"],"whyQuestions":["'왜?'로 파고들 면접 대비 질문 2~4개"],"suggestions":["다음에 더 찾아볼 검색어·자료 1~3개"]}`,
    `[내용]\n${summary}`
  );
  const addResearch = async () => {
    if (!draft.summary.trim()) return;
    setExtracting(true);
    let ext = { keywords: [], whyQuestions: [], suggestions: [] };
    try { const r = await aiExtract(draft.summary, draft.category); ext = { keywords: r.keywords || [], whyQuestions: r.whyQuestions || [], suggestions: r.suggestions || [] }; }
    catch { /* AI 실패해도 카드는 저장 */ }
    setCA(cur => ({ ...cur, research: [...(cur.research || []), { id: "ca_" + Date.now(), ...draft, ...ext }] }));
    setDraft({ category: draft.category, source: "", summary: "", purpose: "both" });
    setExtracting(false);
  };
  const patchItem = (id, k, v) => setCA(cur => ({ ...cur, research: cur.research.map(r => r.id === id ? { ...r, [k]: v } : r) }));
  const removeItem = (id) => setCA(cur => ({ ...cur, research: cur.research.filter(r => r.id !== id) }));
  const [reExtractId, setReExtractId] = useState(null);
  const reExtract = async (item) => {
    setReExtractId(item.id);
    try { const r = await aiExtract(item.summary, item.category); patchItem(item.id, "keywords", r.keywords || []); patchItem(item.id, "whyQuestions", r.whyQuestions || []); patchItem(item.id, "suggestions", r.suggestions || []); } catch { /* 무시 */ }
    setReExtractId(null);
  };

  const sendToInterview = (q) => setApplications(prev => prev.map(a => a.id === app.id
    ? { ...a, interviews: [...(a.interviews || []), { id: "iq_" + Date.now() + Math.random().toString(36).slice(2, 4), question: q, category: "기업분석", selectedExperienceId: null, practiceCount: 0, confidence: null, followUps: [] }] } : a));

  // ── 키워드 파고들기 ──
  const [digInput, setDigInput] = useState("");
  const [digging, setDigging] = useState("");
  const [digErr, setDigErr] = useState("");
  const researchContext = () => (ca.research || []).map(r => `- [${CA_CAT_LABEL[r.category]}] ${r.summary}`).join("\n").slice(0, 1500);
  const dig = async (keyword) => {
    const kw = (keyword || "").trim();
    if (!kw || digging) return;
    setDigging(kw); setDigErr("");
    try {
      const { parsed, sources } = await callResearch(
        `너는 기업분석 코치다. '${app.company}'의 '${kw}'를 정리하라.
【절대 규칙 — 사실만】 확실하지 않은 회사 고유 사실(구체 수치·연도·M&A·제품명·인물·실적)은 절대 단정하지 마라. 확신이 없으면 사실처럼 쓰지 말고 (3)의 '확인할 것'으로 돌려라. 널리 알려진 산업 상식 수준만 단정해도 된다. 지어내는 것보다 "확인 필요"가 낫다.
(1) why: 이 키워드가 이 회사·산업에서 왜 중요한지 2~3문장 — 확실한 것만. 애매하면 "~로 알려져 있으나 확인 필요" 식으로.
(2) questions: '왜/어떻게'로 파고들 면접 대비 질문 3~5개.
(3) searches: 사실 확인을 위해 검색·조사할 구체적 방향·검색어 3~5개 (확인이 필요한 구체 사실을 여기 넣어라).
JSON만: {"why":"...","questions":["..."],"searches":["..."]}`,
        `[사용자가 이미 정리한 자료]\n${researchContext() || "(없음)"}`
      );
      const digItem = { id: "dig_" + Date.now(), keyword: kw, why: parsed.why || "", questions: parsed.questions || [], searches: parsed.searches || [], raw: parsed._raw || "", sources: sources || [], at: new Date().toISOString().slice(0, 10) };
      setCA(cur => ({ ...cur, digs: [digItem, ...(cur.digs || []).filter(d => d.keyword !== kw)] }));
      setDigInput("");
    } catch (e) { setDigErr(e.message || String(e)); }
    finally { setDigging(""); }
  };
  const removeDig = (id) => setCA(cur => ({ ...cur, digs: (cur.digs || []).filter(d => d.id !== id) }));

  // ── 전략 브리핑 ──
  const [stratLoading, setStratLoading] = useState(false);
  const [stratErr, setStratErr] = useState("");
  const runStrategy = async () => {
    setStratLoading(true); setStratErr("");
    try {
      const researchText = (ca.research || []).map(r => `- [${CA_CAT_LABEL[r.category]}] ${r.summary} / 키워드: ${(r.keywords || []).join(", ")}`).join("\n") || "(수집 자료 없음)";
      const expText = experiences.filter(e => e.status !== "draft").map(e => `- ${e.title}: 역량[${(e.competencies || []).join(", ")}]${e.coreMessage ? ` / ${e.coreMessage}` : ""}`).join("\n") || "(분석된 경험 없음)";
      const reqText = (app.requirements || []).map(r => `- ${r.requirement}`).join("\n") || "(요구 역량 없음)";
      let r;
      try {
        r = await callAI(
          `너는 유통·기업 취업 컨설턴트다. 아래 자료(기업분석)+지원자 경험·역량+공고 요구역량을 종합해 자소서·면접 전략을 짜라. 원칙: 매출 숫자 나열 금지·'왜' 중심, 키워드 중심, 반드시 '이 사람 실제 경험'과 연결. 【사실만】 회사 관련 사실·수치·사업 내용은 위 '기업분석 자료'에 있는 것만 사용하고, 자료에 없는 회사 사실을 지어내지 마라. essayFrame의 '현황'도 자료에 근거해야 한다. JSON만: {"coreKeywords":["핵심 키워드 4~6"],"microStrategy":"미시 전략 2~3문장","macroStrategy":"거시 전략 2~3문장","essayFrame":{"현황":"","분석":"","나의역량경험":"","기여포부":""},"cautions":"쓰면 안 되는 것 한 줄"}`,
          `[기업분석 자료]\n${researchText}\n\n[내 경험·역량]\n${expText}\n\n[공고 요구역량]\n${reqText}`
        );
      } catch (e) { setStratErr(e.message || String(e)); setStratLoading(false); return; }
      r._at = new Date().toISOString().slice(0, 10);
      setCA(cur => ({ ...cur, strategy: r }));
    } finally { setStratLoading(false); }
  };

  const allKeywords = [...new Set((ca.research || []).flatMap(r => r.keywords || []))];
  const digs = ca.digs || [];
  const st = ca.strategy;
  const grouped = CA_CATEGORIES.map(c => ({ ...c, items: (ca.research || []).filter(r => r.category === c.id) })).filter(g => g.items.length);

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ fontSize: 12.5, color: C.sub, background: C.accent, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 12px", marginBottom: 24, lineHeight: 1.6 }}>
        숫자 나열은 분석이 아니에요. <b>키워드를 잡고 '왜?'로 파고드는 것</b>이 핵심 — 자료를 모으면 AI가 키워드·질문을 뽑고, 원하는 키워드를 눌러 더 깊이 팔 수 있어요.
      </div>

      {/* 1. 자료 수집 */}
      <CASection n="1" title="자료 수집" desc="신년사·실적·사업 현황·신사업 등을 카테고리별로. 저장하면 AI가 카테고리에 맞춰 키워드·'왜' 질문·다음 조사 방향을 뽑아줘요.">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <select value={draft.category} onChange={e => setDraft(d => ({ ...d, category: e.target.value }))} style={selStyle}>
            {CA_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <select value={draft.purpose} onChange={e => setDraft(d => ({ ...d, purpose: e.target.value }))} style={{ ...selStyle, color: C.sub }}>
            {Object.entries(CA_PURPOSE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <Input placeholder="출처 (뉴스 제목·링크)" value={draft.source} onChange={e => setDraft(d => ({ ...d, source: e.target.value }))} style={{ flex: "1 1 180px" }} />
        </div>
        <div style={{ fontSize: 11.5, color: C.faint, marginBottom: 6 }}>{CA_CATEGORIES.find(c => c.id === draft.category)?.hint}</div>
        <Textarea rows={3} placeholder="조사한 핵심 내용을 적으세요 (기사 요약·사업보고서 내용 등)" value={draft.summary} onChange={e => setDraft(d => ({ ...d, summary: e.target.value }))} />
        <div style={{ marginTop: 8 }}><Btn primary small onClick={addResearch} disabled={extracting || !draft.summary.trim()}>{extracting ? "키워드 뽑는 중…" : "자료 추가 + 키워드·질문 추출"}</Btn></div>

        {grouped.length > 0 && <div style={{ marginTop: 18, display: "grid", gap: 18 }}>
          {grouped.map(g => (
            <div key={g.id}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, marginBottom: 8, paddingBottom: 5, borderBottom: `1px solid ${C.lineSoft}` }}>{g.label} <span style={{ color: C.faint, fontWeight: 500 }}>· {g.items.length}</span></div>
              <div style={{ display: "grid", gap: 16 }}>
                {g.items.map(r => (
                  <div key={r.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", minWidth: 0 }}>
                        <Badge label={CA_PURPOSE[r.purpose] || "둘 다"} color={C.sub} bg={C.lineSoft} />
                        {r.source && <span style={{ fontSize: 11.5, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.source}</span>}
                      </div>
                      <span onClick={() => removeItem(r.id)} title="삭제" style={{ cursor: "pointer", color: C.faint, fontSize: 12, flexShrink: 0 }}>✕</span>
                    </div>
                    <div style={{ fontSize: 13.5, lineHeight: 1.65, marginBottom: 8, whiteSpace: "pre-wrap" }}>{r.summary}</div>
                    {(r.keywords || []).length > 0 && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                        {r.keywords.map((k, i) => <span key={i} onClick={() => dig(k)} title="이 키워드로 파고들기 →" style={{ fontSize: 12, fontWeight: 600, color: C.green, border: `1px solid ${C.green}44`, borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}>#{k}</span>)}
                      </div>
                    )}
                    {(r.whyQuestions || []).length > 0 && (
                      <div style={{ display: "grid", gap: 3, marginBottom: 6 }}>
                        {r.whyQuestions.map((q, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                            <span style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.55 }}>· {q}</span>
                            <span onClick={() => sendToInterview(q)} title="면접 질문으로" style={{ cursor: "pointer", fontSize: 11.5, color: C.blue, whiteSpace: "nowrap" }}>면접에 추가</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {(r.suggestions || []).length > 0 && (
                      <div style={{ fontSize: 11.5, color: C.faint, lineHeight: 1.7 }}>
                        <span>다음 조사(눌러서 검색): </span>
                        {r.suggestions.map((s, i) => (
                          <span key={i}>{i > 0 && " · "}<a href={searchUrl(`${app.company} ${s}`, "google")} target="_blank" rel="noopener noreferrer" style={{ color: C.text, textDecoration: "underline", textDecorationColor: C.line }}>{s}</a></span>
                        ))}
                      </div>
                    )}
                    <div style={{ marginTop: 6, display: "flex", gap: 12, alignItems: "center" }}>
                      <span onClick={() => reExtract(r)} style={{ fontSize: 11.5, color: C.blue, cursor: "pointer" }}>{reExtractId === r.id ? "다시 뽑는 중…" : "AI로 다시 뽑기"}</span>
                      <SearchLinks q={`${app.company} ${(r.keywords || [])[0] || r.summary.slice(0, 20)}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>}
      </CASection>

      {/* 2. 키워드 파고들기 */}
      <CASection n="2" title="키워드 파고들기" desc="중요하다고 느낀 키워드를 눌러(또는 직접 입력해) 더 깊이 파세요. AI는 확실하지 않은 구체 사실은 단정하지 않고 '확인 필요'로 돌립니다 — 옆 구글·네이버·DART 링크로 교차 확인하세요.">
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <Input placeholder="파고들 키워드 입력 (예: O2O, 옴니채널, 상생)" value={digInput} onChange={e => setDigInput(e.target.value)} onKeyDown={e => e.key === "Enter" && dig(digInput)} />
          <Btn primary small onClick={() => dig(digInput)} disabled={!!digging || !digInput.trim()} style={{ flexShrink: 0 }}>{digging ? "파고드는 중…" : "파고들기"}</Btn>
        </div>
        {allKeywords.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11.5, color: C.faint, marginBottom: 6 }}>모은 키워드 — 눌러서 파고들기</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {allKeywords.map((k, i) => <span key={i} onClick={() => dig(k)} style={{ fontSize: 12, fontWeight: 600, color: digging === k ? "#fff" : C.text, background: digging === k ? C.green : C.panel, border: `1px solid ${C.line}`, borderRadius: 999, padding: "4px 10px", cursor: "pointer" }}>#{k}</span>)}
            </div>
          </div>
        )}
        {digErr && <div style={{ fontSize: 12, color: C.red, marginBottom: 8 }}>{digErr}</div>}
        {digs.length === 0 && <div style={{ fontSize: 12.5, color: C.faint }}>아직 파고든 키워드가 없어요.</div>}
        <div style={{ display: "grid", gap: 10 }}>
          {digs.map(d => (
            <div key={d.id} style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: 14, boxShadow: "0 1px 2px rgba(43,42,40,.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: C.green }}>#{d.keyword}</span>
                  <SearchLinks q={`${app.company} ${d.keyword}`} />
                </div>
                <span onClick={() => removeDig(d.id)} style={{ cursor: "pointer", color: C.faint, fontSize: 12 }}>✕</span>
              </div>
              {d.raw
                ? <div style={{ fontSize: 13, lineHeight: 1.65, marginBottom: 10, whiteSpace: "pre-wrap" }}>{d.raw}</div>
                : (d.why && <div style={{ fontSize: 13, lineHeight: 1.65, marginBottom: 10 }}>{d.why}</div>)}
              {(d.questions || []).length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11.5, color: C.faint, marginBottom: 4 }}>파고들 질문</div>
                  <div style={{ display: "grid", gap: 3 }}>
                    {d.questions.map((q, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                        <span style={{ fontSize: 12.5, lineHeight: 1.55 }}>· {q}</span>
                        <span onClick={() => sendToInterview(q)} title="면접 질문으로" style={{ cursor: "pointer", fontSize: 11.5, color: C.blue, whiteSpace: "nowrap" }}>면접에 추가</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(d.searches || []).length > 0 && (
                <div style={{ fontSize: 12, color: C.sub, marginBottom: (d.sources || []).length ? 8 : 0 }}>
                  <span style={{ color: C.faint }}>다음 조사 방향: </span>
                  {d.searches.map((s, i) => (
                    <span key={i}>{i > 0 && " · "}<a href={searchUrl(`${app.company} ${s}`, "google")} target="_blank" rel="noopener noreferrer" style={{ color: C.text, textDecoration: "underline", textDecorationColor: C.line }}>{s}</a></span>
                  ))}
                </div>
              )}
              {(d.sources || []).length > 0 && (
                <div style={{ fontSize: 11.5, color: C.faint, borderTop: `1px solid ${C.lineSoft}`, paddingTop: 8 }}>
                  <span>출처: </span>
                  {d.sources.slice(0, 5).map((s, i) => (
                    <span key={i}>{i > 0 && " · "}<a href={s.uri} target="_blank" rel="noopener noreferrer" style={{ color: C.blue, textDecoration: "none" }}>{(s.title || s.uri).slice(0, 30)}</a></span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CASection>

      {/* 3. 전략 브리핑 */}
      <CASection n="3" title="전략 브리핑" desc="모은 자료 + 내 경험을 묶어 핵심 키워드·미시/거시 전략·자소서 골격을 만들어요.">
        <Btn primary small onClick={runStrategy} disabled={stratLoading}>{stratLoading ? "전략 짜는 중…" : st ? "다시 만들기" : "AI 전략·자소서 골격 만들기"}</Btn>
        {stratErr && <div style={{ fontSize: 12, color: C.red, marginTop: 8 }}>{stratErr}</div>}
        {st && (
          <div style={{ marginTop: 12, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16, background: C.accent, display: "grid", gap: 12 }}>
            {st._raw ? <div style={{ fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.65 }}>{st._raw}</div> : <>
              {(st.coreKeywords || []).length > 0 && <div><div style={{ fontSize: 11.5, color: C.faint, marginBottom: 4 }}>핵심 키워드</div><div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{st.coreKeywords.map((k, i) => <Badge key={i} label={"#" + k} color={C.green} bg={C.greenBg} />)}</div></div>}
              {st.microStrategy && <div><div style={{ fontSize: 11.5, color: C.faint, marginBottom: 2 }}>미시 전략 (내 역량·경험 연결)</div><div style={{ fontSize: 13, lineHeight: 1.65 }}>{st.microStrategy}</div></div>}
              {st.macroStrategy && <div><div style={{ fontSize: 11.5, color: C.faint, marginBottom: 2 }}>거시 전략 (산업 이해·열정)</div><div style={{ fontSize: 13, lineHeight: 1.65 }}>{st.macroStrategy}</div></div>}
              {st.essayFrame && <div><div style={{ fontSize: 11.5, color: C.faint, marginBottom: 4 }}>자소서 골격</div><div style={{ display: "grid", gap: 6 }}>{[["현황", st.essayFrame.현황], ["분석", st.essayFrame.분석], ["내 역량·경험", st.essayFrame.나의역량경험], ["기여·포부", st.essayFrame.기여포부]].map(([k, v]) => v ? <div key={k} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: "8px 10px" }}><span style={{ fontSize: 11, fontWeight: 700, color: C.green }}>{k}</span><div style={{ fontSize: 13, lineHeight: 1.6, marginTop: 2 }}>{v}</div></div> : null)}</div></div>}
              {st.cautions && <div style={{ fontSize: 12.5, color: C.sub }}>⚠ {st.cautions}</div>}
            </>}
            {st._at && <div style={{ fontSize: 11, color: C.faint, textAlign: "right" }}>{st._at} 기준</div>}
          </div>
        )}
      </CASection>
    </div>
  );
}

function ApplicationDetail({ app, setApplications, experiences, outputs, metrics, onBack, onOpenExp, addTrash, interviewCategories, addInterviewCategory }) {
  const [tab, setTab] = useState("공고 분석");
  const [chatEssayId, setChatEssayId] = useState(null);
  const patch = (k, v) => setApplications(prev => prev.map(a => a.id === app.id ? { ...a, [k]: v } : a));
  const deleteApp = () => {
    setApplications(prev => prev.filter(a => a.id !== app.id));
    addTrash("application", `${app.company} ${app.position}`.trim(), app);
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
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, fontSize: 13, color: C.sub }}>
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

      <AppLinks app={app} setApplications={setApplications} />

      <div style={{ display: "flex", gap: 2, borderBottom: `1px solid ${C.line}`, marginBottom: 18, flexWrap: "wrap" }}>
        {["공고 분석", "기업분석", "자소서", "면접", "복습"].map(t => (
          <div key={t} onClick={() => setTab(t)} style={{ padding: "9px 14px", fontSize: 13.5, fontWeight: tab === t ? 700 : 500, cursor: "pointer",
            color: tab === t ? C.text : C.sub, borderBottom: tab === t ? `2px solid ${C.text}` : "2px solid transparent", marginBottom: -1 }}>{t}</div>
        ))}
      </div>

      {tab === "기업분석" && <CompanyAnalysis app={app} setApplications={setApplications} experiences={experiences} metrics={metrics} />}

      {tab === "복습" && <ApplicationReview app={app} experiences={experiences} metrics={metrics} />}

      {tab === "공고 분석" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 16, alignItems: "start" }}>
          <Card style={{ position: "sticky", top: 16 }}>
            <Label>채용공고 원문</Label>
            <Textarea rows={20} placeholder="채용공고 원문을 여기에 붙여넣으세요" value={app.jobPostingRaw || ""}
              onChange={e => setApplications(prev => prev.map(a => a.id === app.id ? { ...a, jobPostingRaw: e.target.value } : a))}
              style={{ fontSize: 13, lineHeight: 1.75, background: C.bg }} />
            <JobPostingExtractor experiences={experiences} raw={app.jobPostingRaw || ""}
              onExtracted={(newReqs) => setApplications(prev => prev.map(a => a.id === app.id
                ? { ...a, requirements: [...a.requirements, ...newReqs] } : a))} />
          </Card>

          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
              <Label>요구 역량 ↔ 내 경험</Label>
              {app.requirements.length > 0 && <span style={{ fontSize: 11.5, color: C.faint }}>{app.requirements.filter(r => r.matchedExp).length} / {app.requirements.length} 연결됨</span>}
            </div>
            <div style={{ fontSize: 12, color: C.faint, marginBottom: 6 }}>각 역량에 맞는 경험을 연결하고, 왜 맞는지·부족한 점을 한 줄로 적으세요.</div>
            {app.requirements.map(r => {
              const exp = experiences.find(e => e.id === r.matchedExp);
              const patchReq = (k, v) => setApplications(prev => prev.map(a => a.id === app.id
                ? { ...a, requirements: a.requirements.map(x => x.id === r.id ? { ...x, [k]: v } : x) } : a));
              const removeReq = () => {
                setApplications(prev => prev.map(a => a.id === app.id
                  ? { ...a, requirements: a.requirements.filter(x => x.id !== r.id) } : a));
                addTrash("requirement", r.requirement || "요구 역량 항목", { appId: app.id, item: r });
              };
              return (
                <div key={r.id} style={{ padding: "12px 0", borderBottom: `1px solid ${C.lineSoft}` }}>
                  {/* 1행: 요구 역량(주인공) + 중요도 + 삭제 */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Input value={r.requirement} placeholder="요구 역량" onChange={e => patchReq("requirement", e.target.value)} style={{ fontWeight: 600, fontSize: 14, border: "none", padding: "1px 0", flex: 1 }} />
                    <span title={`중요도 ${r.importance}/5`} style={{ fontSize: 9, letterSpacing: 1.5, flexShrink: 0, whiteSpace: "nowrap", color: C.sub }}>
                      {"●".repeat(r.importance)}<span style={{ color: C.line }}>{"●".repeat(5 - r.importance)}</span>
                    </span>
                    <span onClick={removeReq} title="삭제" style={{ cursor: "pointer", color: C.faint, fontSize: 12, flexShrink: 0 }}>✕</span>
                  </div>
                  {/* 2행: 매칭(보조) — 상태 점 + 컴팩트 셀렉트 + 밑줄 입력 */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 99, flexShrink: 0, background: exp ? C.green : "transparent", border: exp ? "none" : `1px solid ${C.line}` }} />
                    <select value={r.matchedExp || ""} onChange={e => patchReq("matchedExp", e.target.value || null)}
                      style={{ fontFamily: font, fontSize: 12.5, padding: "4px 6px", borderRadius: 8, border: `1px solid ${C.line}`, background: C.panel, color: exp ? C.text : C.faint, maxWidth: 170, flexShrink: 0 }}>
                      <option value="">경험 연결…</option>
                      {experiences.map(e2 => <option key={e2.id} value={e2.id}>{e2.title}</option>)}
                    </select>
                    <Input value={r.matchReason || ""} placeholder={exp ? "왜 맞는지 · 부족한 점" : "메모 (선택)"} onChange={e => patchReq("matchReason", e.target.value)}
                      style={{ fontSize: 12.5, color: C.sub, flex: 1, minWidth: 100, border: "none", borderBottom: `1px solid ${C.lineSoft}`, borderRadius: 0, padding: "3px 0" }} />
                  </div>
                </div>
              );
            })}
            {app.requirements.length === 0 && <div style={{ fontSize: 13, color: C.faint, margin: "6px 0 10px" }}>왼쪽에 채용공고를 붙여넣고 "AI로 요구 역량 추출"을 누르거나, 아래에서 직접 추가하세요.</div>}
            <div style={{ marginTop: 12 }}>
              <Btn small onClick={() => setApplications(prev => prev.map(a => a.id === app.id
                ? { ...a, requirements: [...a.requirements, { id: "r_" + Date.now(), requirement: "", category: "required_competency", importance: 3, matchedExp: null, matchReason: "", gap: "" }] } : a))}>
                + 요구 역량 추가
              </Btn>
            </div>
          </Card>
        </div>
      )}

      {tab === "자소서" && chatEssayId && (() => {
        const q = app.essays.find(x => x.id === chatEssayId);
        return (
          <EssayChat
            title="자소서 작성 도우미"
            subtitle={q.question || "문항 미입력"}
            systemPrompt={ESSAY_COACH_SYSTEM_PROMPT}
            contextText={buildEssayContext(app, q, experiences, metrics)}
            autoStartMessage="안녕하세요, 이 문항에 사용할 경험을 추천해 주시고 초안을 작성해 주세요."
            onClose={() => setChatEssayId(null)}
            history={q.chatHistory || []}
            onHistoryChange={(h) => setApplications(prev => prev.map(a => a.id === app.id
              ? { ...a, essays: a.essays.map(x => x.id === chatEssayId ? { ...x, chatHistory: h } : x) } : a))}
            onSaveDraft={(text) => setApplications(prev => prev.map(a => a.id === app.id
              ? { ...a, essays: a.essays.map(x => x.id === chatEssayId ? { ...x, draft: text, status: "drafting" } : x) } : a))}
          />
        );
      })()}

      {tab === "자소서" && !chatEssayId && (
        <div style={{ display: "grid", gap: 12 }}>
          {app.essays.map(q => {
            const patchQ = (k, v) => setApplications(prev => prev.map(a => a.id === app.id
              ? { ...a, essays: a.essays.map(x => x.id === q.id ? { ...x, [k]: v } : x) } : a));
            const removeQ = () => {
              setApplications(prev => prev.map(a => a.id === app.id
                ? { ...a, essays: a.essays.filter(x => x.id !== q.id) } : a));
              addTrash("essay", q.question || "자소서 문항", { appId: app.id, item: q });
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
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: C.faint }}>선택 경험:</span>
                  {q.selectedExperienceIds.map(id => {
                    const e = experiences.find(x => x.id === id);
                    if (!e) return null;
                    return (
                      <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Badge label={e.title} color={C.blue} bg={C.blueBg} />
                        <span onClick={() => patchQ("selectedExperienceIds", q.selectedExperienceIds.filter(x => x !== id))}
                          style={{ cursor: "pointer", color: C.faint, fontSize: 11 }}>✕</span>
                      </span>
                    );
                  })}
                  {q.selectedExperienceIds.length === 0 && <span style={{ fontSize: 11.5, color: C.faint }}>없음 — AI가 전체 경험 중 추천합니다</span>}
                  <select value="" onChange={e => {
                    const id = e.target.value;
                    if (id && !q.selectedExperienceIds.includes(id)) patchQ("selectedExperienceIds", [...q.selectedExperienceIds, id]);
                  }} style={{ fontFamily: font, fontSize: 11.5, padding: "3px 6px", borderRadius: 8, border: `1px solid ${C.line}`, background: C.panel, color: C.sub }}>
                    <option value="">+ 경험 추가</option>
                    {experiences.filter(e => !q.selectedExperienceIds.includes(e.id)).map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                  </select>
                </div>
                {q.selectedExperienceIds.map(id => {
                  const e = experiences.find(x => x.id === id);
                  return e ? <ExperiencePeek key={id} exp={e} metrics={metrics} label={`「${e.title}」 정리 내용 전체 보기`} /> : null;
                })}
                <div style={{ marginTop: 10 }}>
                  <Textarea value={q.draft || ""} placeholder="여기에 직접 작성해도 되고, 아래 'AI와 함께 작성'으로 도움받아도 됩니다."
                    onChange={e => patchQ("draft", e.target.value)}
                    onBlur={() => { if (q.draft?.trim() && q.status === "not_started") patchQ("status", "drafting"); }}
                    disabled={q.isLocked} rows={5} style={{ fontSize: 13, lineHeight: 1.6 }} />
                  <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 11.5, color: (q.draft || "").length > q.characterLimit ? C.red : C.faint, marginTop: 4 }}>
                    {(q.draft || "").length} / {q.characterLimit}자
                  </div>
                </div>
                {!q.isLocked && <div style={{ marginTop: 6 }}><Btn small onClick={() => setChatEssayId(q.id)}>AI와 함께 작성하기 →</Btn></div>}
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
              addTrash("interview", iq.question || "면접 질문", { appId: app.id, item: iq });
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
                      <Btn small primary disabled title="준비 중인 기능입니다">60초 연습 시작</Btn><Btn small disabled title="준비 중인 기능입니다">키워드 가리기</Btn>
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
function formatDeletedAt(iso) {
  try {
    const d = new Date(iso);
    const diffMin = Math.round((Date.now() - d.getTime()) / 60000);
    if (diffMin < 1) return "방금";
    if (diffMin < 60) return `${diffMin}분 전`;
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return `${diffHr}시간 전`;
    return d.toISOString().slice(0, 16).replace("T", " ");
  } catch { return ""; }
}

function Trash({ trash, onRestore, onPurge, onClear }) {
  const typeLabel = { experience: "경험", skill: "스킬", cert: "자격증", award: "수상기록", application: "지원", requirement: "요구 역량", essay: "자소서 문항", interview: "면접 질문", timeline_activity: "타임라인 활동" };
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
            <div style={{ fontSize: 11.5, color: C.faint, marginTop: 3 }}>{formatDeletedAt(t.deletedAt)} 삭제됨</div>
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
function MasterPrep({ essays, setEssays, interviews, setInterviews, experiences, metrics, resumeProfile, interviewCategories, addInterviewCategory }) {
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
      <H2>자소서·면접 준비 (공통)</H2>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 16, lineHeight: 1.6 }}>
        특정 회사에 매지 않고, 자주 나오는 공통 문항을 미리 준비해두는 곳입니다. 여기서 만든 답변은 지원 관리의 각 회사별 문항을 쓸 때 참고용으로 활용하세요.
      </div>

      <div style={{ display: "flex", gap: 2, borderBottom: `1px solid ${C.line}`, marginBottom: 18 }}>
        {["자소서", "면접"].map(t => (
          <div key={t} onClick={() => setTab(t)} style={{ padding: "9px 14px", fontSize: 13.5, fontWeight: tab === t ? 700 : 500, cursor: "pointer",
            color: tab === t ? C.text : C.sub, borderBottom: tab === t ? `2px solid ${C.text}` : "2px solid transparent", marginBottom: -1 }}>{t}</div>
        ))}
      </div>

      {tab === "자소서" && chatId && (() => {
        const q = essays.find(x => x.id === chatId);
        return (
          <EssayChat
            title="자소서 작성 도우미"
            subtitle={q.question || "문항 미입력"}
            systemPrompt={ESSAY_COACH_SYSTEM_PROMPT}
            contextText={buildEssayContext(masterApp, q, experiences, metrics)}
            autoStartMessage="안녕하세요, 이 문항에 사용할 경험을 추천해 주시고 초안을 작성해 주세요."
            onClose={() => setChatId(null)}
            history={q.chatHistory || []}
            onHistoryChange={(h) => setEssays(prev => prev.map(x => x.id === chatId ? { ...x, chatHistory: h } : x))}
            onSaveDraft={(text) => setEssays(prev => prev.map(x => x.id === chatId ? { ...x, draft: text, status: "drafting" } : x))}
          />
        );
      })()}

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
              <Textarea value={q.draft || ""} placeholder="여기에 직접 작성해도 되고, 아래 'AI와 함께 작성'으로 도움받아도 됩니다."
                onChange={e => patchQ(q.id, "draft", e.target.value)}
                onBlur={() => { if (q.draft?.trim() && q.status === "not_started") patchQ(q.id, "status", "drafting"); }}
                rows={5} style={{ fontSize: 13, lineHeight: 1.6 }} />
              <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 11.5, color: (q.draft || "").length > q.characterLimit ? C.red : C.faint, marginTop: 4, marginBottom: 8 }}>
                {(q.draft || "").length} / {q.characterLimit}자
              </div>
              <Btn small onClick={() => setChatId(q.id)}>AI와 함께 작성하기 →</Btn>
            </Card>
          ))}
          <Btn small onClick={addQ}>+ 문항 추가</Btn>
        </div>
      )}

      {tab === "면접" && iqChatId && (() => {
        const iq = interviews.find(x => x.id === iqChatId);
        const pseudoEssay = { question: iq.question, characterLimit: 400 };
        return (
          <EssayChat
            title="면접 답변 작성 도우미"
            subtitle={iq.question || "질문 미입력"}
            systemPrompt={ESSAY_COACH_SYSTEM_PROMPT}
            contextText={buildEssayContext(masterApp, pseudoEssay, experiences, metrics)}
            autoStartMessage="안녕하세요, 이 면접 질문에 쓸 경험을 추천해 주시고 답변 초안을 작성해 주세요."
            saveDraftLabel="이 답변을 초안으로 저장"
            onClose={() => setIqChatId(null)}
            history={iq.chatHistory || []}
            onHistoryChange={(h) => setInterviews(prev => prev.map(x => x.id === iqChatId ? { ...x, chatHistory: h } : x))}
            onSaveDraft={(text) => setInterviews(prev => prev.map(x => x.id === iqChatId ? { ...x, draft: text } : x))}
          />
        );
      })()}

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

/* ============================================================ 퍼스널 브랜딩 — UI ============================================================ */
/* ---------- 브랜딩 오프라인 모드 (클라우드 연결 안 될 때 로컬에만 답변 저장) ---------- */
function loadOfflineAnswers() {
  try { return JSON.parse(window.localStorage.getItem(STORAGE_PREFIX + "branding_offline") || "{}"); }
  catch { return {}; }
}
function saveOfflineAnswers(data) {
  try { window.localStorage.setItem(STORAGE_PREFIX + "branding_offline", JSON.stringify(data)); } catch (e) { /* ignore */ }
}
function clearOfflineAnswers() {
  try { window.localStorage.removeItem(STORAGE_PREFIX + "branding_offline"); } catch (e) { /* ignore */ }
}

function CloudDiagnostics() {
  const [checks, setChecks] = useState(null);
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    const results = [];

    let url, anonKey;
    try {
      url = typeof import.meta !== "undefined" ? import.meta.env?.VITE_SUPABASE_URL : undefined;
      anonKey = typeof import.meta !== "undefined" ? import.meta.env?.VITE_SUPABASE_ANON_KEY : undefined;
    } catch { /* ignore */ }
    results.push({
      label: "Supabase 환경변수",
      ok: !!(url && anonKey),
      detail: url && anonKey ? `${url}` : "VITE_SUPABASE_URL 또는 VITE_SUPABASE_ANON_KEY가 비어있습니다.",
      hint: !(url && anonKey) ? "Vercel 프로젝트 → Settings → Environment Variables 확인 후 Redeploy 하세요." : null,
    });

    const supabase = await getCloudClient();
    results.push({ label: "Supabase 클라이언트 생성", ok: !!supabase, detail: supabase ? "정상" : "클라이언트를 만들지 못했습니다 (환경변수 또는 라이브러리 문제)." });

    if (supabase) {
      resetCloudAuth();
      const { user, error } = await ensureCloudAuth(supabase);
      results.push({
        label: "익명 로그인",
        ok: !!user,
        detail: user ? `사용자 ID ${user.id.slice(0, 8)}…` : (error || "알 수 없는 오류"),
        hint: !user ? 'Supabase 대시보드 → Authentication → Sign In / Providers → "Anonymous Sign-Ins"가 꺼져있을 가능성이 가장 높습니다. 켜고 다시 시도하세요.' : null,
      });

      if (user) {
        try {
          const { error: qErr } = await supabase.from("career_os_state").select("key").eq("user_id", user.id).limit(1);
          results.push({
            label: "데이터베이스 접근 (core_os_state)", ok: !qErr, detail: qErr ? qErr.message : "정상",
            hint: qErr ? "supabase/core-state-schema.sql을 SQL Editor에서 실행했는지 확인하세요." : null,
          });
        } catch (e) {
          results.push({ label: "데이터베이스 접근", ok: false, detail: e.message, hint: "SQL 스키마가 적용되지 않았을 수 있습니다." });
        }
      }
    }

    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      results.push({
        label: "서버 AI 키 등록 상태", ok: data.anthropic || data.openai || data.gemini,
        detail: `Anthropic ${data.anthropic ? "✓" : "✗"} · OpenAI ${data.openai ? "✓" : "✗"} · Gemini ${data.gemini ? "✓" : "✗"}`,
        hint: (!data.anthropic && !data.openai && !data.gemini) ? "Vercel 환경변수에 ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY 중 최소 하나를 등록하세요." : null,
      });
    } catch (e) {
      results.push({ label: "서버 연결 (/api/health)", ok: false, detail: "응답 없음 — 로컬 미리보기 등 서버리스 함수가 없는 환경일 수 있습니다.", hint: null });
    }

    setChecks(results); setRunning(false);
  };

  useEffect(() => { run(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <Label>연결 상태 진단</Label>
        <Btn small onClick={run} disabled={running}>{running ? "확인 중…" : "다시 확인"}</Btn>
      </div>
      {!checks ? <div style={{ fontSize: 13, color: C.faint }}>확인 중…</div> : (
        <div style={{ display: "grid", gap: 10 }}>
          {checks.map((c, i) => (
            <div key={i} style={{ fontSize: 12.5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: c.ok ? C.green : C.red, flexShrink: 0 }} />
                <span style={{ fontWeight: 700 }}>{c.label}</span>
              </div>
              <div style={{ color: C.sub, marginLeft: 14, wordBreak: "break-all" }}>{c.detail}</div>
              {c.hint && <div style={{ color: C.red, marginLeft: 14, marginTop: 2 }}>💡 {c.hint}</div>}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function BrandingOfflineWorkbook({ onRetryConnect, authError }) {
  const [idx, setIdx] = useState(0);
  const question = BRANDING_FLAT_QUESTIONS[idx];
  const [store, setStore] = useState(loadOfflineAnswers);
  const [composerOpen, setComposerOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [content, setContent] = useState("");

  const entries = store[question.id] || [];
  const totalOffline = Object.values(store).reduce((s, arr) => s + arr.length, 0);

  const addEntry = () => {
    if (!content.trim()) return;
    const next = { ...store, [question.id]: [...entries, { id: "off_" + Date.now(), label, content, createdAt: new Date().toISOString() }] };
    setStore(next); saveOfflineAnswers(next);
    setContent(""); setLabel(""); setComposerOpen(false);
  };
  const removeEntry = (id) => {
    const next = { ...store, [question.id]: entries.filter(e => e.id !== id) };
    setStore(next); saveOfflineAnswers(next);
  };

  return (
    <div style={{ maxWidth: 820 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <H2>퍼스널 브랜딩 (오프라인 모드)</H2>
        <Btn small onClick={onRetryConnect}>연결 다시 시도</Btn>
      </div>
      <Card style={{ marginBottom: 16, background: C.accent }}>
        <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.6 }}>
          클라우드에 연결되지 않아 AI 꼬리질문·프로필 추출 없이 <b>답변만</b> 저장됩니다. 답변은 이 브라우저에 안전하게 남고, 연결되면 자동으로 업로드를 제안합니다.
          {authError && <div style={{ marginTop: 6, fontFamily: "monospace", color: C.red, fontSize: 11.5 }}>마지막 오류: {authError}</div>}
        </div>
        {totalOffline > 0 && <div style={{ marginTop: 8, fontSize: 12.5, fontWeight: 700 }}>오프라인 저장된 답변 {totalOffline}개</div>}
      </Card>

      <div style={{ fontSize: 12, color: C.faint, marginBottom: 6 }}>{idx + 1}/{BRANDING_FLAT_QUESTIONS.length}</div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, lineHeight: 1.5 }}>{question.text}</div>
      {question.hint && <div style={{ fontSize: 12.5, color: C.sub, background: C.accent, padding: "8px 12px", borderRadius: 12, marginBottom: 16 }}>💡 {question.hint}</div>}

      {entries.map(e => (
        <Card key={e.id} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontSize: 12, color: C.faint }}>{(e.createdAt || "").slice(0, 10)}{e.label ? ` · "${e.label}"` : ""}</div>
            <span onClick={() => removeEntry(e.id)} style={{ fontSize: 11.5, color: C.faint, cursor: "pointer", textDecoration: "underline" }}>삭제</span>
          </div>
          <div style={{ fontSize: 13.5, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{e.content}</div>
        </Card>
      ))}

      {composerOpen ? (
        <Card style={{ marginBottom: 12 }}>
          <Input placeholder="라벨 (선택)" value={label} onChange={e => setLabel(e.target.value)} style={{ marginBottom: 8 }} />
          <Textarea placeholder="답변을 적어주세요" value={content} onChange={e => setContent(e.target.value)} rows={5} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <Btn small primary disabled={!content.trim()} onClick={addEntry}>저장</Btn>
            <Btn small onClick={() => setComposerOpen(false)}>취소</Btn>
          </div>
        </Card>
      ) : (
        <Btn small onClick={() => setComposerOpen(true)}>+ 답변 추가</Btn>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
        <Btn onClick={() => setIdx(i => Math.max(i - 1, 0))} disabled={idx === 0}>← 이전</Btn>
        <Btn primary onClick={() => setIdx(i => Math.min(i + 1, BRANDING_FLAT_QUESTIONS.length - 1))} disabled={idx >= BRANDING_FLAT_QUESTIONS.length - 1}>다음 →</Btn>
      </div>
    </div>
  );
}

function BrandingSetupNotice() {
  return (
    <div style={{ maxWidth: 640 }}>
      <H2>퍼스널 브랜딩</H2>
      <Card>
        <Label>설정이 필요합니다</Label>
        <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.7 }}>
          이 탭은 Supabase(별도 데이터베이스)를 사용합니다. 나머지 Career OS 기능과 달리, 답변이 쌓일수록 AI가 참고할 자료가 많아지기 때문에 브라우저 저장소보다 정식 DB가 필요해서입니다.
          <br /><br />
          <b>설정 방법 (5분)</b>
          <ol style={{ margin: "8px 0 0", paddingLeft: 18 }}>
            <li><a href="https://supabase.com" target="_blank" rel="noreferrer">supabase.com</a>에서 무료 계정 생성 → New Project</li>
            <li>프로젝트 생성 후 SQL Editor에서 <code>supabase/branding-schema.sql</code> 파일 내용을 통째로 붙여넣고 실행</li>
            <li>Project Settings → API 에서 Project URL, anon public key 확인</li>
            <li>배포 환경(Vercel 등)에 환경변수 등록: <code>VITE_SUPABASE_URL</code>, <code>VITE_SUPABASE_ANON_KEY</code></li>
            <li>재배포 후 이 탭 다시 열기</li>
          </ol>
        </div>
      </Card>
    </div>
  );
}

function BrandingHub({ experiences = [], metrics = [], applications = [] }) {
  const [supabase, setSupabase] = useState(undefined); // undefined=로딩중, null=미설정
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [connecting, setConnecting] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [tab, setTab] = useState("home");
  const [profileItems, setProfileItems] = useState([]);
  const [answersProgress, setAnswersProgress] = useState([]);
  const [jumpTo, setJumpTo] = useState(null); // 프로필에서 워크북으로 점프할 질문 id
  const [showDiag, setShowDiag] = useState(false);

  const connect = async () => {
    setConnecting(true); setAuthError(null);
    resetCloudAuth();
    const sb = await getCloudClient();
    setSupabase(sb);
    if (sb) {
      const { user: u, error } = await ensureCloudAuth(sb);
      setUser(u);
      if (error) setAuthError(error);
    }
    setConnecting(false);
  };

  useEffect(() => { connect(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  const refreshProfile = async () => {
    if (!supabase || !user) return;
    try { setProfileItems(await baListProfileItems(supabase, user.id)); } catch (e) { console.error(e); }
  };
  const refreshProgress = async () => {
    if (!supabase || !user) return;
    try { setAnswersProgress(await baListAnswersWithEntries(supabase, user.id)); } catch (e) { console.error(e); }
  };
  useEffect(() => { if (supabase && user) { refreshProfile(); refreshProgress(); } }, [supabase, user]);

  const [offlineCount, setOfflineCount] = useState(0);
  const [syncingOffline, setSyncingOffline] = useState(false);
  useEffect(() => {
    if (supabase && user) {
      const store = loadOfflineAnswers();
      setOfflineCount(Object.values(store).reduce((s, arr) => s + arr.length, 0));
    }
  }, [supabase, user]);

  const syncOfflineToCloud = async () => {
    setSyncingOffline(true);
    try {
      const store = loadOfflineAnswers();
      for (const [questionId, entries] of Object.entries(store)) {
        const question = BRANDING_FLAT_QUESTIONS.find(q => q.id === questionId);
        if (!question || entries.length === 0) continue;
        const answer = await baGetOrCreateAnswer(supabase, user.id, question);
        for (const e of entries) {
          await baAddEntry(supabase, user.id, answer.id, { label: e.label, content: e.content });
        }
      }
      clearOfflineAnswers();
      setOfflineCount(0);
      refreshProgress();
      alert("오프라인 답변을 클라우드에 업로드했습니다. 워크북에서 열어보면 AI 꼬리질문·프로필 추출이 새로 진행됩니다 (해당 문항에 새 답변을 추가하면 자동 실행돼요).");
    } catch (e) {
      alert("동기화 중 오류: " + (e.message || String(e)));
    } finally {
      setSyncingOffline(false);
    }
  };

  if (supabase === undefined || connecting) return <div style={{ fontSize: 13, color: C.sub }}>불러오는 중…</div>;
  if (supabase === null) return <BrandingSetupNotice />;

  if (!user && !offlineMode) {
    return (
      <div style={{ maxWidth: 640 }}>
        <H2>퍼스널 브랜딩</H2>
        <Card style={{ marginBottom: 12 }}>
          <Label>클라우드 연결에 실패했습니다</Label>
          <div style={{ fontSize: 13, color: C.red, background: C.redBg, padding: "10px 12px", borderRadius: 12, marginTop: 8, marginBottom: 12, fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
            {authError || "알 수 없는 오류"}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn small primary onClick={connect}>다시 연결하기</Btn>
            <Btn small onClick={() => setOfflineMode(true)}>오프라인으로 계속하기</Btn>
          </div>
        </Card>
        <CloudDiagnostics />
      </div>
    );
  }

  if (offlineMode && !user) {
    return <BrandingOfflineWorkbook onGoOnline={() => setOfflineMode(false)} onRetryConnect={connect} authError={authError} />;
  }

  const tabs = [["home", "홈"], ["workbook", "워크북"], ["profile", "프로필"], ["result", "결과"]];

  return (
    <div style={{ maxWidth: 820 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <H2>퍼스널 브랜딩</H2>
        <span onClick={() => setShowDiag(p => !p)} style={{ fontSize: 11.5, color: C.faint, cursor: "pointer", textDecoration: "underline" }}>
          {showDiag ? "연결 상태 닫기" : "연결 상태 확인"}
        </span>
      </div>
      {showDiag && <div style={{ marginBottom: 16 }}><CloudDiagnostics /></div>}
      {offlineCount > 0 && (
        <Card style={{ marginBottom: 16, background: C.accent, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12.5 }}>오프라인 상태에서 저장한 답변 {offlineCount}개가 있습니다.</span>
          <Btn small primary disabled={syncingOffline} onClick={syncOfflineToCloud}>{syncingOffline ? "업로드 중…" : "클라우드로 업로드"}</Btn>
        </Card>
      )}
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 16 }}>
        질문에 답하면 AI가 꼬리질문으로 더 캐묻고, 답변에서 프로필 항목을 뽑아 누적합니다. 몇 개만 답해도 홈의 <b>전략 브리핑</b>이 경험·지원과 묶어 방향을 잡아주고, 충분히 쌓이면 나만의 포지셔닝·슬로건까지 만듭니다.
      </div>
      <div style={{ display: "flex", gap: 2, borderBottom: `1px solid ${C.line}`, marginBottom: 18 }}>
        {tabs.map(([k, l]) => (
          <div key={k} onClick={() => setTab(k)} style={{ padding: "9px 14px", fontSize: 13.5, fontWeight: tab === k ? 700 : 500, cursor: "pointer",
            color: tab === k ? C.text : C.sub, borderBottom: tab === k ? `2px solid ${C.text}` : "2px solid transparent", marginBottom: -1 }}>{l}</div>
        ))}
      </div>

      {tab === "home" && (
        <BrandingHome progress={answersProgress} profileItems={profileItems}
          experiences={experiences} metrics={metrics} applications={applications}
          onGoWorkbook={(qid) => { setJumpTo(qid || null); setTab("workbook"); }} onGoResult={() => setTab("result")} />
      )}
      {tab === "workbook" && (
        <BrandingWorkbook supabase={supabase} userId={user.id} jumpTo={jumpTo} onConsumedJump={() => setJumpTo(null)} profileItems={profileItems}
          onProfileChange={refreshProfile} onProgressChange={refreshProgress} />
      )}
      {tab === "profile" && (
        <BrandingProfile items={profileItems} onChangeItem={async (id, patch) => { await baUpdateProfileItem(supabase, id, patch); refreshProfile(); }}
          onAddManual={async (type, content) => { await baAddManualProfileItem(supabase, user.id, { type, content }); refreshProfile(); }}
          onJumpToSource={(qid) => { setJumpTo(qid); setTab("workbook"); }} />
      )}
      {tab === "result" && (
        <BrandingResult supabase={supabase} userId={user.id} profileItems={profileItems} />
      )}
    </div>
  );
}

// 지금까지의 브랜딩 답변 + 실제 경험/지원을 종합해 '나는 어떤 사람이고 어떤 전략을 취해야 하는지'를 바로 뽑아준다.
// (12개 확정 게이트 없이 조기부터 쓸모 있게 — 브랜딩이 경험·지원과 따로 놀지 않도록 연결)
function BrandingStrategyBriefing({ profileItems = [], experiences = [], metrics = [], applications = [] }) {
  const KEY = "careeros:brandingBriefing";
  const [data, setData] = useState(() => {
    try { return JSON.parse(window.localStorage.getItem(KEY) || "null"); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const usableItems = profileItems.filter(i => i.status === "확정" || i.status === "제안");
  const analyzed = experiences.filter(e => e.status !== "draft");
  const canRun = usableItems.length >= 2 || analyzed.length >= 1;

  const run = async () => {
    setLoading(true); setError("");
    try {
      const itemLines = usableItems.map(i =>
        `- (${PROFILE_TYPE_LABEL[i.type] || i.type}${i.status === "확정" ? "·확정" : "·제안"}) ${i.content}${i.evidence ? ` — 근거: ${i.evidence}` : ""}`).join("\n") || "(아직 정리된 자기이해 항목이 적음)";
      const expLines = analyzed.map(e => {
        const ms = metrics.filter(m => m.experienceId === e.id).map(m => `${m.metricName} ${formatMetric(m, "exact")}`).join(", ");
        return `- ${e.title} (${e.organization || ""}): 역량 [${(e.competencies || []).join(", ")}]${e.coreMessage ? ` / 핵심: ${e.coreMessage}` : ""}${ms ? ` / 성과: ${ms}` : ""}`;
      }).join("\n") || "(분석된 경험 없음)";
      const appLines = applications.map(a => `- ${a.company} · ${a.position}${(a.requirements || []).length ? ` (요구역량: ${(a.requirements || []).map(r => r.requirement).join(", ")})` : ""}`).join("\n") || "(등록된 지원 없음)";

      const sys = `너는 취업 준비생을 돕는 커리어 전략가다. 아래 세 가지 자료를 종합해서, 이 사람이 "자기가 어떤 사람인지"와 "어떤 취업 전략을 취해야 하는지"를 구체적으로 짚어줘라. 두루뭉술한 미사여구(예: "열정적인 인재") 금지. 반드시 자료에 있는 근거로만 말하고, 없는 사실은 지어내지 마라.

응답은 아래 JSON만 (마크다운 백틱 없이):
{
 "strengths": [{"title":"핵심 강점 한 줄","why":"자료 어디서 반복적으로 드러나는지 근거"}],  // 2~3개
 "persona": "이 사람이 일할 때 어떻게 작동하는지(기질·패턴) 2~3문장",
 "strategy": "유리한 직무·회사 유형과, 지원에서 취해야 할 구체적 전략 3~4문장",
 "pitch": "자소서·면접에서 자신을 한 문장으로 내세운다면 (실제 문장)",
 "nextQuestions": [{"q":"지금 답하면 전략이 가장 선명해질 질문","why":"왜 도움되는지"}]  // 1~2개
}`;
      const context = `[지금까지 정리한 자기이해 (브랜딩 답변에서 추출)]\n${itemLines}\n\n[실제로 분석해 둔 경험]\n${expLines}\n\n[현재 지원 중인 곳]\n${appLines}`;
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt: sys, context, messages: [{ role: "user", content: "위 자료로 전략 브리핑을 JSON으로 작성해줘." }] }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(typeof json?.error === "string" ? json.error : "AI 호출 실패");
      const text = (json.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
      let parsed;
      try { parsed = parseAIJson(text); }
      catch { parsed = { _raw: text }; }   // JSON이 깨져도 원문이라도 보여준다
      parsed._at = new Date().toISOString().slice(0, 10);
      setData(parsed);
      try { window.localStorage.setItem(KEY, JSON.stringify(parsed)); } catch {}
    } catch (e) {
      setError(e.message || String(e));
    } finally { setLoading(false); }
  };

  return (
    <Card style={{ marginBottom: 16, background: C.accent, border: `1px solid ${C.line}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800 }}>전략 브리핑</div>
          <div style={{ fontSize: 12.5, color: C.sub, marginTop: 2, lineHeight: 1.5 }}>
            끝까지 안 채워도 됩니다. 지금까지의 답변 + 분석한 경험 + 지원 목록을 묶어 <b>나는 어떤 사람이고 어떻게 지원해야 하는지</b>를 바로 정리해줘요.
          </div>
        </div>
        <Btn small primary onClick={run} disabled={loading || !canRun} style={{ flexShrink: 0 }}>
          {loading ? "분석 중…" : data ? "다시 만들기" : "브리핑 받기"}
        </Btn>
      </div>
      {!canRun && <div style={{ fontSize: 12, color: C.faint, marginTop: 8 }}>자기이해 항목이나 분석된 경험이 조금 쌓이면 만들 수 있어요.</div>}
      {error && <div style={{ fontSize: 12, color: C.red, marginTop: 8, whiteSpace: "pre-wrap" }}>{error}</div>}
      {data && (
        <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
          {data._raw && (
            <div style={{ fontSize: 13, lineHeight: 1.65, whiteSpace: "pre-wrap", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 12px" }}>{data._raw}</div>
          )}
          {data.persona && (
            <div>
              <Label>어떤 사람인가</Label>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>{data.persona}</div>
            </div>
          )}
          {(data.strengths || []).length > 0 && (
            <div>
              <Label>핵심 강점</Label>
              <div style={{ display: "grid", gap: 6 }}>
                {data.strengths.map((s, i) => (
                  <div key={i} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "8px 12px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{s.title}</div>
                    {s.why && <div style={{ fontSize: 12, color: C.sub, marginTop: 2, lineHeight: 1.5 }}>{s.why}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.strategy && (
            <div>
              <Label>취해야 할 전략</Label>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>{data.strategy}</div>
            </div>
          )}
          {data.pitch && (
            <div>
              <Label>한 문장 피치</Label>
              <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.6, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 12px" }}>“{data.pitch}”</div>
            </div>
          )}
          {(data.nextQuestions || []).length > 0 && (
            <div>
              <Label>지금 채우면 좋은 질문</Label>
              <div style={{ display: "grid", gap: 6 }}>
                {data.nextQuestions.map((n, i) => (
                  <div key={i} style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 600 }}>· {n.q}</span>
                    {n.why && <span style={{ color: C.faint }}> — {n.why}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {data._at && <div style={{ fontSize: 11, color: C.faint, textAlign: "right" }}>{data._at} 기준</div>}
        </div>
      )}
    </Card>
  );
}

function BrandingHome({ progress, profileItems, experiences = [], metrics = [], applications = [], onGoWorkbook, onGoResult }) {
  const totalQuestions = BRANDING_QUESTIONS.length;
  const answeredIds = new Set(progress.filter(a => (a.branding_answer_entries || []).some(e => e.state === "active")).map(a => a.question_id));
  const answeredCount = answeredIds.size;
  const staleItems = profileItems.filter(i => i.stale && i.status !== "기각");
  const confirmed = profileItems.filter(i => i.status === "확정" && !i.stale);
  const proposed = profileItems.filter(i => i.status === "제안");

  const byStep = BRANDING_STEPS.map(step => {
    const qs = BRANDING_QUESTIONS.filter(q => q.step === step.id);
    const done = qs.filter(q => answeredIds.has(q.id)).length;
    return { ...step, total: qs.length, done };
  });

  const nextQuestion = BRANDING_QUESTIONS.find(q => !answeredIds.has(q.id));

  return (
    <div>
      <BrandingStrategyBriefing profileItems={profileItems} experiences={experiences} metrics={metrics} applications={applications} />

      {staleItems.length > 0 && (
        <Card style={{ marginBottom: 14, background: C.accent }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>⚠ 출처가 바뀐 항목 {staleItems.length}개</div>
          <div style={{ fontSize: 12.5, color: C.sub }}>답변을 수정하거나 보관 처리해서, 이 항목들의 근거가 예전과 달라졌습니다. 프로필 탭에서 다시 확인해주세요.</div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <Card>
          <Label>진행도</Label>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{answeredCount} / {totalQuestions}</div>
          <div style={{ fontSize: 12, color: C.faint }}>답변한 질문</div>
        </Card>
        <Card>
          <Label>프로필 항목</Label>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{confirmed.length}<span style={{ fontSize: 13, color: C.faint, fontWeight: 500 }}> 확정 · {proposed.length} 제안</span></div>
          <div style={{ fontSize: 12, color: C.faint }}>위 <b>전략 브리핑</b>은 지금 바로 쓸 수 있어요. 확정 12개+·강점 3개+·가치관 2개+ 부터는 최종 포지셔닝·슬로건까지 만들 수 있습니다.</div>
        </Card>
      </div>

      <Label>단계별 진행</Label>
      <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
        {byStep.map(s => (
          <Card key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>Step {s.id} · {s.name}</div>
              <div style={{ fontSize: 12, color: C.faint }}>{s.desc}</div>
            </div>
            <div style={{ fontSize: 13, color: C.sub }}>{s.done}/{s.total}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {nextQuestion ? <Btn primary onClick={() => onGoWorkbook(nextQuestion.id)}>이어서 하기 →</Btn> : <Btn primary onClick={onGoResult}>결과 보기 →</Btn>}
      </div>
    </div>
  );
}

function FollowupAnswerBox({ onSubmit, onSkip }) {
  const [text, setText] = useState("");
  return (
    <div style={{ marginTop: 4 }}>
      <Textarea rows={2} placeholder="답변…" value={text} onChange={e => setText(e.target.value)} style={{ fontSize: 13 }} />
      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        <Btn small primary disabled={!text.trim()} onClick={() => onSubmit(text)}>답변</Btn>
        <Btn small onClick={onSkip}>건너뛰기</Btn>
      </div>
    </div>
  );
}

const BRANDING_FLAT_QUESTIONS = [...BRANDING_QUESTIONS].sort((a, b) => a.step - b.step || a.order - b.order);

function BrandingWorkbook({ supabase, userId, jumpTo, onConsumedJump, profileItems, onProfileChange, onProgressChange }) {
  const [idx, setIdx] = useState(0);
  const question = BRANDING_FLAT_QUESTIONS[idx];
  const [answer, setAnswer] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerLabel, setComposerLabel] = useState("");
  const [composerContent, setComposerContent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [chainLoading, setChainLoading] = useState({});
  const [toast, setToast] = useState("");
  const [consolidateResult, setConsolidateResult] = useState(null);
  const [consolidating, setConsolidating] = useState(false);
  const [consolidateError, setConsolidateError] = useState("");

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(""), 4000); return () => clearTimeout(t); } }, [toast]);

  useEffect(() => {
    if (jumpTo) {
      const i = BRANDING_FLAT_QUESTIONS.findIndex(q => q.id === jumpTo);
      if (i >= 0) setIdx(i);
      onConsumedJump();
    }
    // eslint-disable-next-line
  }, [jumpTo]);

  const refreshEntries = async (answerId) => {
    setEntries(await baListEntries(supabase, answerId || answer.id));
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const a = await baGetOrCreateAnswer(supabase, userId, question);
        if (cancelled) return;
        setAnswer(a);
        setEntries(await baListEntries(supabase, a.id));
      } catch (e) { console.error(e); }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line
  }, [question.id]);

  const confirmedSummaryText = profileItems.filter(i => i.status === "확정" && !i.stale).map(i => `${i.type}:${i.content}`).join(", ") || "(없음)";

  const runExtract = async (entry, freshEntries) => {
    try {
      const list = freshEntries || await baListEntries(supabase, answer.id);
      const thisEntry = list.find(e => e.id === entry.id) || entry;
      const result = await baCallAI("/api/branding-extract", {
        question: { text: question.text },
        entry: { content: thisEntry.content },
        followups: (thisEntry.branding_followups || []).map(f => ({ question: f.question, answer: f.answer })),
        siblingEntries: list.filter(e => e.id !== entry.id).map(e => ({ content: e.content, label: e.label })),
        existingItems: profileItems.map(i => ({ id: i.id, type: i.type, content: i.content })),
      });
      const inserted = await baInsertProfileItems(supabase, userId, result.items, entry.id);
      if (inserted.length > 0) {
        setToast(`프로필에 ${inserted.length}개 항목이 제안됐어`);
        onProfileChange();
      }
    } catch (e) {
      console.error("[EXTRACT 실패 — 조용히 무시]", e); // 스펙: 사용자에게 에러 노출하지 않음
    }
  };

  const runFollowupChain = async (entry, siblings, depth, origin) => {
    setChainLoading(p => ({ ...p, [entry.id]: true }));
    try {
      const result = await baCallAI("/api/branding-followup", {
        question: { text: question.text, hint: question.hint, probe: question.probe },
        entry: { content: entry.content, label: entry.label },
        siblingEntries: siblings.map(s => ({ seq: s.seq, label: s.label, content: s.content, created_at: s.created_at })),
        depth,
        confirmedProfileSummary: confirmedSummaryText,
      });
      if (result.needs_followup && depth <= 3) {
        await baAddFollowup(supabase, userId, entry.id, { depth, origin, probeType: result.probe_type, question: result.question });
        await refreshEntries();
      } else {
        await runExtract(entry);
      }
    } catch (e) {
      console.error("[FOLLOWUP 실패 — 꼬리질문 생략, 엔트리는 정상 저장됨]", e); // 스펙: 사용자를 막지 않음
    } finally {
      setChainLoading(p => ({ ...p, [entry.id]: false }));
    }
  };

  const addEntry = async () => {
    if (!composerContent.trim()) return;
    const priorSiblings = entries;
    const entry = await baAddEntry(supabase, userId, answer.id, { label: composerLabel, content: composerContent });
    setComposerContent(""); setComposerLabel(""); setComposerOpen(false);
    await refreshEntries();
    onProgressChange();
    runFollowupChain(entry, priorSiblings, 1, "ai");
  };

  const answerFollowup = async (followup, text) => {
    await baPatchFollowup(supabase, followup.id, { answer: text });
    await refreshEntries();
    const entry = entries.find(e => e.id === followup.entry_id);
    if (followup.depth < 2) {
      runFollowupChain(entry, entries.filter(e => e.id !== entry.id), followup.depth + 1, "ai");
    } else {
      runExtract(entry);
    }
  };
  const skipFollowup = async (followup) => {
    await baPatchFollowup(supabase, followup.id, { skipped: true });
    await refreshEntries();
    const entry = entries.find(e => e.id === followup.entry_id);
    runExtract(entry);
  };
  const probeMore = (entry) => runFollowupChain(entry, entries.filter(e => e.id !== entry.id), 3, "user");

  const startEdit = (entry) => { setEditingId(entry.id); setEditContent(entry.content); };
  const saveEdit = async (entry) => {
    await baUpdateEntry(supabase, entry.id, { content: editContent });
    setEditingId(null);
    await refreshEntries();
    onProfileChange(); // stale 처리가 DB 트리거로 일어났을 수 있음
  };
  const archiveEntry = async (entry) => {
    if (!window.confirm('이 답변을 보관할까요? 이 답변이 근거였던 프로필 항목은 "출처 바뀜" 상태가 됩니다.')) return;
    await baUpdateEntry(supabase, entry.id, { state: "archived" });
    await refreshEntries();
    onProfileChange(); onProgressChange();
  };

  const skipQuestion = async () => { await baSetAnswerStatus(supabase, answer.id, "skipped"); goNext(); };
  const goNext = () => { setConsolidateResult(null); if (idx < BRANDING_FLAT_QUESTIONS.length - 1) setIdx(idx + 1); };
  const goPrev = () => { setConsolidateResult(null); if (idx > 0) setIdx(idx - 1); };

  const activeEntries = entries.filter(e => e.state === "active");
  const stepInfo = BRANDING_STEPS.find(s => s.id === question.step);

  const runConsolidate = async () => {
    setConsolidating(true); setConsolidateError(""); setConsolidateResult(null);
    try {
      const payload = activeEntries.map(e => ({
        seq: e.seq, label: e.label, content: e.content, created_at: e.created_at,
        followups: (e.branding_followups || []).map(f => ({ question: f.question, answer: f.answer })),
      }));
      const result = await baCallAI("/api/branding-consolidate", { question: { text: question.text }, entries: payload });
      setConsolidateResult(result);
    } catch (e) {
      setConsolidateError(e.message || String(e));
    } finally {
      setConsolidating(false);
    }
  };

  const saveConsolidatePatterns = async () => {
    if (!consolidateResult?.constants?.length) return;
    const inserted = await baInsertConsolidatedItems(supabase, userId, consolidateResult.constants, activeEntries);
    if (inserted.length > 0) {
      setToast(`프로필에 패턴 ${inserted.length}개가 제안됐어`);
      onProfileChange();
    }
    setConsolidateResult(null);
  };

  return (
    <div>
      {toast && (
        <div style={{ position: "fixed", bottom: 20, right: 20, background: C.text, color: "#fff", padding: "10px 16px", borderRadius: 14, fontSize: 13, zIndex: 50 }}>
          {toast}
        </div>
      )}
      <div style={{ fontSize: 12, color: C.faint, marginBottom: 6 }}>Step {question.step} · {stepInfo?.name} — {idx + 1}/{BRANDING_FLAT_QUESTIONS.length}</div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, lineHeight: 1.5 }}>{question.text}</div>
      {question.hint && <div style={{ fontSize: 12.5, color: C.sub, background: C.accent, padding: "8px 12px", borderRadius: 12, marginBottom: 16 }}>💡 {question.hint}</div>}

      {loading ? <div style={{ fontSize: 13, color: C.faint }}>불러오는 중…</div> : (
        <>
          {activeEntries.map(entry => (
            <Card key={entry.id} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: C.faint }}>답변 {entry.seq} · {(entry.created_at || "").slice(0, 10)}{entry.label ? ` · "${entry.label}"` : ""}</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <span onClick={() => startEdit(entry)} style={{ fontSize: 11.5, color: C.sub, cursor: "pointer", textDecoration: "underline" }}>수정</span>
                  <span onClick={() => archiveEntry(entry)} style={{ fontSize: 11.5, color: C.faint, cursor: "pointer", textDecoration: "underline" }}>보관</span>
                </div>
              </div>
              {editingId === entry.id ? (
                <div>
                  <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={4} />
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    <Btn small primary onClick={() => saveEdit(entry)}>저장</Btn>
                    <Btn small onClick={() => setEditingId(null)}>취소</Btn>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 13.5, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{entry.content}</div>
              )}

              {(entry.branding_followups || []).map(f => (
                <div key={f.id} style={{ marginTop: 10, paddingLeft: 14, borderLeft: `2px solid ${C.line}` }}>
                  <div style={{ fontSize: 13, color: C.text, marginBottom: 4 }}>↳ {f.question}</div>
                  {f.answer ? (
                    <div style={{ fontSize: 13, color: C.sub }}>{f.answer}</div>
                  ) : f.skipped ? (
                    <div style={{ fontSize: 12, color: C.faint }}>(건너뜀)</div>
                  ) : (
                    <FollowupAnswerBox onSubmit={(text) => answerFollowup(f, text)} onSkip={() => skipFollowup(f)} />
                  )}
                </div>
              ))}
              {chainLoading[entry.id] && <div style={{ fontSize: 12, color: C.faint, marginTop: 8 }}>꼬리질문 생각하는 중…</div>}
              {(entry.branding_followups || []).length > 0 && (entry.branding_followups || []).every(f => f.answer || f.skipped)
                && (entry.branding_followups || []).length < 3 && !chainLoading[entry.id] && (
                <div style={{ marginTop: 8 }}><Btn small onClick={() => probeMore(entry)}>+ 더 파고들기</Btn></div>
              )}
            </Card>
          ))}

          {composerOpen ? (
            <Card style={{ marginBottom: 12 }}>
              <Input placeholder='라벨 (선택, 예: "2024년 프로젝트 때")' value={composerLabel} onChange={e => setComposerLabel(e.target.value)} style={{ marginBottom: 8 }} />
              <Textarea placeholder={question.input_type === "list" ? "쉼표나 줄바꿈으로 구분해서 적어주세요" : "답변을 적어주세요"}
                value={composerContent} onChange={e => setComposerContent(e.target.value)} rows={5} />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <Btn small primary disabled={!composerContent.trim()} onClick={addEntry}>저장</Btn>
                <Btn small onClick={() => setComposerOpen(false)}>취소</Btn>
              </div>
            </Card>
          ) : (
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <Btn small onClick={() => setComposerOpen(true)}>+ 답변 추가</Btn>
              {activeEntries.length >= 3 && <Btn small onClick={runConsolidate} disabled={consolidating}>{consolidating ? "종합하는 중…" : "답변들 종합하기"}</Btn>}
            </div>
          )}

          {consolidateError && (
            <div style={{ marginTop: 10, padding: "10px 12px", background: C.accent, border: `1px solid ${C.line}`, borderRadius: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.red, marginBottom: 4 }}>오류</div>
              <div style={{ fontSize: 12, color: C.red, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>{consolidateError}</div>
            </div>
          )}

          {consolidateResult && (
            <Card style={{ marginTop: 10, background: C.accent }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <Label>{activeEntries.length}개 답변 종합 결과</Label>
                <span onClick={() => setConsolidateResult(null)} style={{ cursor: "pointer", color: C.faint, fontSize: 13 }}>✕</span>
              </div>

              {consolidateResult.constants?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.green, marginBottom: 6 }}>반복되는 패턴 (신뢰도 높음)</div>
                  {consolidateResult.constants.map((c, i) => (
                    <div key={i} style={{ fontSize: 13, padding: "6px 0", borderBottom: `1px solid ${C.lineSoft}` }}>
                      {c.content} <span style={{ fontSize: 11, color: C.faint }}>(답변 {c.seqs?.join(", ")})</span>
                    </div>
                  ))}
                </div>
              )}

              {consolidateResult.changes?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 6 }}>시간에 따라 달라진 것</div>
                  {consolidateResult.changes.map((c, i) => (
                    <div key={i} style={{ fontSize: 13, padding: "6px 0", borderBottom: `1px solid ${C.lineSoft}` }}>
                      {c.content} <span style={{ fontSize: 11, color: C.faint }}>(답변 {c.from_seq} → {c.to_seq})</span>
                    </div>
                  ))}
                </div>
              )}

              {consolidateResult.contradictions?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.red, marginBottom: 6 }}>서로 모순되는 것</div>
                  {consolidateResult.contradictions.map((c, i) => (
                    <div key={i} style={{ fontSize: 13, padding: "6px 0", borderBottom: `1px solid ${C.lineSoft}` }}>
                      {c.content} — {c.detail} <span style={{ fontSize: 11, color: C.faint }}>(답변 {c.seqs?.join(", ")})</span>
                    </div>
                  ))}
                </div>
              )}

              {consolidateResult.constants?.length === 0 && consolidateResult.changes?.length === 0 && consolidateResult.contradictions?.length === 0 && (
                <div style={{ fontSize: 13, color: C.faint, marginBottom: 12 }}>아직 뚜렷한 패턴·변화·모순이 보이지 않습니다. 답변이 더 쌓이면 다시 시도해보세요.</div>
              )}

              {consolidateResult.question_for_user && (
                <div style={{ fontSize: 13, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 12px", marginBottom: 12 }}>
                  💬 {consolidateResult.question_for_user}
                </div>
              )}

              {consolidateResult.constants?.length > 0 && (
                <Btn small primary onClick={saveConsolidatePatterns}>반복되는 패턴을 프로필에 제안하기</Btn>
              )}
            </Card>
          )}
        </>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
        <Btn onClick={goPrev} disabled={idx === 0}>← 이전</Btn>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={skipQuestion}>건너뛰기</Btn>
          <Btn primary onClick={goNext} disabled={idx >= BRANDING_FLAT_QUESTIONS.length - 1}>다음 →</Btn>
        </div>
      </div>
    </div>
  );
}

const PROFILE_TYPE_LABEL = { strength: "강점", weakness: "약점", value: "가치관", pattern: "패턴", evidence: "근거", taste: "취향", motivation: "동기" };

function BrandingProfile({ items, onChangeItem, onAddManual, onJumpToSource }) {
  const [tab, setTab] = useState("제안");
  const [manualType, setManualType] = useState("strength");
  const [manualContent, setManualContent] = useState("");

  const shown = items.filter(i => {
    if (tab === "stale") return i.stale && i.status !== "기각";
    return i.status === tab;
  });

  return (
    <div>
      <div style={{ display: "flex", gap: 2, borderBottom: `1px solid ${C.line}`, marginBottom: 16 }}>
        {["제안", "확정", "기각", "stale"].map(t => (
          <div key={t} onClick={() => setTab(t)} style={{ padding: "8px 12px", fontSize: 13, fontWeight: tab === t ? 700 : 500, cursor: "pointer",
            color: tab === t ? C.text : C.sub, borderBottom: tab === t ? `2px solid ${C.text}` : "2px solid transparent", marginBottom: -1 }}>
            {t === "stale" ? "⚠ 재확인 필요" : t}
            {t !== "stale" && ` (${items.filter(i => i.status === t).length})`}
          </div>
        ))}
      </div>

      {shown.length === 0 && <div style={{ fontSize: 13, color: C.faint, marginBottom: 16 }}>해당하는 항목이 없습니다.</div>}

      <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
        {shown.map(item => (
          <Card key={item.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <Badge label={PROFILE_TYPE_LABEL[item.type] || item.type} color={C.blue} bg={C.blueBg} />
                {item.confidence && <Badge label={item.confidence} color={C.sub} bg={C.lineSoft} />}
                {item.origin === "user" && <Badge label="직접 추가" color={C.sub} bg={C.lineSoft} />}
              </div>
              {item.stale && item.status !== "기각" && <Badge label="⚠ 출처가 바뀜" color={C.red} bg={C.redBg} />}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{item.content}</div>
            {item.evidence && <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 6 }}>근거: "{item.evidence}"</div>}
            {item.source_entry_ids && item.source_entry_ids.length > 0 && (
              <div style={{ fontSize: 11.5, color: C.faint, marginBottom: 8 }}>출처 답변 {item.source_entry_ids.length}건</div>
            )}
            <div style={{ display: "flex", gap: 6 }}>
              {item.status !== "확정" && <Btn small primary onClick={() => onChangeItem(item.id, { status: "확정", stale: false })}>확정</Btn>}
              {item.status !== "기각" && <Btn small onClick={() => onChangeItem(item.id, { status: "기각" })}>기각</Btn>}
              {item.stale && <Btn small onClick={() => onChangeItem(item.id, { stale: false })}>재확인 완료</Btn>}
              {item.status !== "제안" && <Btn small onClick={() => onChangeItem(item.id, { status: "제안" })}>제안으로 되돌리기</Btn>}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <Label>AI가 놓친 게 있다면 직접 추가</Label>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <select value={manualType} onChange={e => setManualType(e.target.value)}
            style={{ fontFamily: font, fontSize: 13, padding: "8px 10px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.panel }}>
            {Object.entries(PROFILE_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <Input placeholder="예: 복잡한 개념을 비유로 쉽게 설명" value={manualContent} onChange={e => setManualContent(e.target.value)} style={{ flex: 1 }} />
          <Btn small onClick={() => { if (manualContent.trim()) { onAddManual(manualType, manualContent.trim()); setManualContent(""); } }}>추가</Btn>
        </div>
      </Card>
    </div>
  );
}

function BrandingResult({ supabase, userId, profileItems }) {
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingCurrent, setLoadingCurrent] = useState(true);
  const [selectedPositioning, setSelectedPositioning] = useState(0);
  const [selectedHeadline, setSelectedHeadline] = useState(0);

  useEffect(() => {
    (async () => {
      const current = await baGetCurrentOutput(supabase, userId);
      if (current) {
        setOutput(current);
        setSelectedPositioning(current.selected_positioning_idx || 0);
      }
      setLoadingCurrent(false);
    })();
    // eslint-disable-next-line
  }, []);

  const confirmed = profileItems.filter(i => i.status === "확정" && !i.stale);
  const rejected = profileItems.filter(i => i.status === "기각");
  const staleCount = profileItems.filter(i => i.stale && i.status !== "기각").length;
  const strengthCnt = confirmed.filter(i => i.type === "strength").length;
  const valueCnt = confirmed.filter(i => i.type === "value").length;
  const canSynthesize = confirmed.length >= 12 && strengthCnt >= 3 && valueCnt >= 2;

  const coverage = {};
  BRANDING_CATEGORIES.forEach(c => { coverage[c.label] = confirmed.length; }); // 간단화 — 카테고리별 세분 매핑은 다음 단계에서

  const generate = async () => {
    setLoading(true); setError("");
    try {
      const result = await baCallAI("/api/branding-synthesize", {
        confirmedItems: confirmed.map(i => ({ id: i.id, type: i.type, content: i.content, evidence: i.evidence, confidence: i.confidence })),
        rejectedItems: rejected.map(i => ({ type: i.type, content: i.content })),
        staleCount,
        coverage,
      });
      const saved = await baSaveOutput(supabase, userId, result);
      setOutput(saved); setSelectedPositioning(0); setSelectedHeadline(0);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  if (loadingCurrent) return <div style={{ fontSize: 13, color: C.faint }}>불러오는 중…</div>;

  if (!canSynthesize && !output) {
    return (
      <Card>
        <Label>아직 산출물을 만들 수 없습니다</Label>
        <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.7 }}>
          확정된 프로필 항목이 <b>{confirmed.length}/12개</b>, 강점 <b>{strengthCnt}/3개</b>, 가치관 <b>{valueCnt}/2개</b> 필요합니다.
          워크북에서 질문에 답하고, 프로필 탭에서 항목을 확정해주세요.
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: C.sub }}>{output ? `v${output.version} · ${(output.created_at || "").slice(0, 10)} 생성` : "아직 생성된 산출물이 없습니다"}</div>
        <Btn primary disabled={loading} onClick={generate}>{loading ? "생성 중…" : output ? "다시 생성하기" : "산출물 생성하기"}</Btn>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: "10px 12px", background: C.accent, border: `1px solid ${C.line}`, borderRadius: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.red, marginBottom: 4 }}>오류</div>
          <div style={{ fontSize: 12, color: C.red, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>{error}</div>
        </div>
      )}

      {output && (
        <>
          <Card style={{ marginBottom: 16, background: C.greenBg, textAlign: "center", padding: "28px 20px" }}>
            <div style={{ fontSize: 11, color: C.green, fontWeight: 700, marginBottom: 8, letterSpacing: ".05em" }}>내 슬로건</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>
              {(output.headline || [])[selectedHeadline]?.text || "헤드라인 없음"}
            </div>
          </Card>

          <Label>헤드라인 후보 — 마음에 드는 것을 고르세요</Label>
          <div style={{ display: "grid", gap: 8, marginBottom: 20 }}>
            {(output.headline || []).map((h, i) => (
              <Card key={i} onClick={() => setSelectedHeadline(i)} style={{ border: i === selectedHeadline ? `1px solid ${C.green}` : `1px solid ${C.line}`, background: i === selectedHeadline ? C.greenBg : C.panel }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{h.text}</div>
              </Card>
            ))}
          </div>

          <Label>포지셔닝 3안</Label>
          <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
            {(output.positioning || []).map((p, i) => (
              <Card key={i} onClick={() => setSelectedPositioning(i)} style={{ border: i === selectedPositioning ? `1px solid ${C.green}` : `1px solid ${C.line}`, background: i === selectedPositioning ? C.greenBg : C.panel }}>
                <Badge label={p.axis} color={C.blue} bg={C.blueBg} />
                <div style={{ fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>{p.text}</div>
                {p.risk && <div style={{ fontSize: 11.5, color: C.faint, marginTop: 6 }}>주의: {p.risk}</div>}
              </Card>
            ))}
          </div>

          {output.archetype && (
            <Card style={{ marginBottom: 20 }}>
              <Label>아키타입</Label>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{output.archetype.primary} <span style={{ fontWeight: 400, color: C.sub, fontSize: 13 }}>(보조: {output.archetype.secondary})</span></div>
              <div style={{ fontSize: 12.5, color: C.sub, marginTop: 6 }}>{output.archetype.reason}</div>
              {output.archetype.tone && (
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {output.archetype.tone.map((t, i) => <Badge key={i} label={t} color={C.sub} bg={C.lineSoft} />)}
                </div>
              )}
            </Card>
          )}

          {output.pillars && (
            <>
              <Label>콘텐츠 기둥</Label>
              <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
                {output.pillars.map((p, i) => (
                  <Card key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{p.name}</div>
                      <span style={{ fontSize: 12, color: C.faint }}>{p.weight}%</span>
                    </div>
                    {p.examples && p.examples.map((ex, ei) => <div key={ei} style={{ fontSize: 12.5, color: C.sub, padding: "2px 0" }}>· {ex}</div>)}
                  </Card>
                ))}
              </div>
            </>
          )}

          {output.gaps && output.gaps.length > 0 && (
            <Card style={{ background: C.accent }}>
              <Label>보완할 점</Label>
              {output.gaps.map((g, i) => <div key={i} style={{ fontSize: 12.5, color: C.sub, padding: "2px 0" }}>· {g}</div>)}
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function Resume({ experiences, outputs, metrics, resumeProfile, setResumeProfile, skills, certs, setCerts, awards, setAwards, addTrash }) {
  const approved = outputs.filter(o => o.outputType === "resume" && o.approvalStatus === "approved");
  const patch = (k, v) => setResumeProfile(p => ({ ...p, [k]: v }));
  const autosave = useAutosave(JSON.stringify(resumeProfile));

  const [certDraft, setCertDraft] = useState({ name: "", issuer: "", certNumber: "", date: "", note: "" });
  const patchCert = (id, k, v) => setCerts(prev => prev.map(c => c.id === id ? { ...c, [k]: v } : c));
  const addCert = () => {
    if (!certDraft.name.trim()) return;
    setCerts(prev => [...prev, { id: "c_" + Date.now(), ...certDraft }]);
    setCertDraft({ name: "", issuer: "", certNumber: "", date: "", note: "" });
  };
  const removeCert = (id) => {
    const cert = certs.find(c => c.id === id);
    setCerts(prev => prev.filter(c => c.id !== id));
    addTrash("cert", cert.name, cert);
  };

  const [awardDraft, setAwardDraft] = useState({ name: "", issuer: "", date: "", note: "" });
  const patchAward = (id, k, v) => setAwards(prev => prev.map(a => a.id === id ? { ...a, [k]: v } : a));
  const addAward = () => {
    if (!awardDraft.name.trim()) return;
    setAwards(prev => [...prev, { id: "aw_" + Date.now(), ...awardDraft }]);
    setAwardDraft({ name: "", issuer: "", date: "", note: "" });
  };
  const removeAward = (id) => {
    const award = awards.find(a => a.id === id);
    setAwards(prev => prev.filter(a => a.id !== id));
    addTrash("award", award.name, award);
  };

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

  const exportWord = () => {
    const careerHtml = Object.entries(groups).map(([label, items]) => `
      <h3 style="font-size:14px;margin:14px 0 4px;">${label}</h3>
      <ul style="margin:0 0 8px 0; padding-left:18px;">
        ${items.map(o => `<li style="margin-bottom:4px;">${resolveTokenText(o.content, metrics)}</li>`).join("")}
      </ul>`).join("") || "<p>등록된 경력 문장이 없습니다.</p>";

    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>이력서</title></head>
      <body style="font-family:'맑은 고딕',sans-serif; font-size:13px; color:#222;">
        <h1 style="font-size:22px; margin-bottom:4px;">${resumeProfile.name || "이름 미입력"}</h1>
        <p style="color:#555; margin:0 0 4px;">${resumeProfile.targetRole || ""}</p>
        <p style="color:#555; margin:0 0 16px;">${[resumeProfile.email, resumeProfile.phone].filter(Boolean).join(" · ")}</p>
        <p style="margin:0 0 16px;">${resumeProfile.headline || ""}</p>
        <h2 style="font-size:16px; border-bottom:1px solid #ccc; padding-bottom:4px;">경력</h2>
        ${careerHtml}
        <h2 style="font-size:16px; border-bottom:1px solid #ccc; padding-bottom:4px; margin-top:20px;">역량</h2>
        <p>${linkedSkillBadges.join(", ") || "등록된 역량이 없습니다."}</p>
        <h2 style="font-size:16px; border-bottom:1px solid #ccc; padding-bottom:4px; margin-top:20px;">자격증 · 어학</h2>
        <ul style="padding-left:18px;">${(certs.length ? certs : [{ name: "등록된 자격증이 없습니다." }]).map(c => `<li>${c.name}${c.issuer ? ` · ${c.issuer}` : ""}${c.certNumber ? ` · 자격번호 ${c.certNumber}` : ""}${c.date ? ` · ${c.date}` : ""}</li>`).join("")}</ul>
        <h2 style="font-size:16px; border-bottom:1px solid #ccc; padding-bottom:4px; margin-top:20px;">수상기록</h2>
        <ul style="padding-left:18px;">${(awards.length ? awards : [{ name: "등록된 수상기록이 없습니다." }]).map(a => `<li>${a.name}${a.issuer ? ` · ${a.issuer}` : ""}${a.date ? ` · ${a.date}` : ""}</li>`).join("")}</ul>
      </body></html>`;

    const blob = new Blob(["\ufeff", html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `이력서_${resumeProfile.name || "career_os"}.doc`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: 700 }}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <H2>기본 이력서</H2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <AutosaveIndicator state={autosave} />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: C.sub }}>경력 문장은 직접 입력하지 않고, 경험 보관함의 <b>승인된</b> 문장만 불러옵니다.</div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <Btn small onClick={() => window.print()}>PDF로 저장 (인쇄)</Btn>
          <Btn small onClick={exportWord}>Word로 내보내기</Btn>
        </div>
      </div>
      <div className="print-area">
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
        <div style={{ marginTop: 12 }}><Btn small disabled title="준비 중인 기능입니다">+ 경험 보관함에서 문장 불러오기</Btn></div>
        <div style={{ fontSize: 12, color: C.faint, marginTop: 10 }}>미승인(AI 초안) 문장은 여기에 표시되지 않습니다.</div>
      </Card>
      <Card style={{ marginTop: 12 }}>
        <Label>역량</Label>
        <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6 }}>
          역량·스킬 탭에서 <b>경험 근거가 연결된 항목</b>만 자동으로 불러옵니다. (근거 없는 항목은 제외)
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
          {linkedSkillBadges.length === 0
            ? <div style={{ fontSize: 12.5, color: C.faint }}>근거가 연결된 역량이 아직 없습니다.</div>
            : linkedSkillBadges.map(t => <Badge key={t} label={t} color={C.sub} bg={C.lineSoft} />)}
        </div>
      </Card>

      <Card style={{ marginTop: 12 }}>
        <Label>자격증 · 어학</Label>
        {certs.map(c => (
          <div key={c.id} style={{ display: "grid", gridTemplateColumns: "1.3fr 0.9fr 1fr 100px 0.9fr 20px", gap: 10, alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.lineSoft}`, fontSize: 13.5 }}>
            <Input value={c.name} onChange={e => patchCert(c.id, "name", e.target.value)} style={{ fontWeight: 600, border: "none", padding: "2px 0" }} />
            <Input value={c.issuer || ""} placeholder="발급 기관" onChange={e => patchCert(c.id, "issuer", e.target.value)} style={{ color: C.sub, fontSize: 12.5, border: "none", padding: "2px 0" }} />
            <Input value={c.certNumber || ""} placeholder="자격번호" onChange={e => patchCert(c.id, "certNumber", e.target.value)} style={{ color: C.sub, fontSize: 12.5, border: "none", padding: "2px 0" }} />
            <Input value={c.date || ""} placeholder="취득일" onChange={e => patchCert(c.id, "date", e.target.value)} style={{ color: C.sub, fontSize: 12.5, border: "none", padding: "2px 0" }} />
            <Input value={c.note || ""} placeholder="비고" onChange={e => patchCert(c.id, "note", e.target.value)} style={{ color: C.faint, fontSize: 12, border: "none", padding: "2px 0" }} />
            <span onClick={() => removeCert(c.id)} title="삭제" style={{ cursor: "pointer", color: C.faint, fontSize: 12 }}>✕</span>
          </div>
        ))}
        {certs.length === 0 && <div style={{ fontSize: 12.5, color: C.faint, padding: "6px 0" }}>등록된 자격증·어학이 없습니다.</div>}
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <Input placeholder="자격증·어학명" value={certDraft.name} onChange={e => setCertDraft(d => ({ ...d, name: e.target.value }))} style={{ flex: "1.3 1 140px" }} />
          <Input placeholder="발급 기관" value={certDraft.issuer} onChange={e => setCertDraft(d => ({ ...d, issuer: e.target.value }))} style={{ flex: "1 1 110px" }} />
          <Input placeholder="자격번호" value={certDraft.certNumber} onChange={e => setCertDraft(d => ({ ...d, certNumber: e.target.value }))} style={{ flex: "1 1 120px" }} />
          <Input placeholder="취득일 (YYYY-MM)" value={certDraft.date} onChange={e => setCertDraft(d => ({ ...d, date: e.target.value }))} style={{ width: 130 }} />
          <Btn small onClick={addCert}>추가</Btn>
        </div>
      </Card>

      <Card style={{ marginTop: 12 }}>
        <Label>수상기록</Label>
        {awards.map(a => (
          <div key={a.id} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 110px 1fr 20px", gap: 10, alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.lineSoft}`, fontSize: 13.5 }}>
            <Input value={a.name} onChange={e => patchAward(a.id, "name", e.target.value)} style={{ fontWeight: 600, border: "none", padding: "2px 0" }} />
            <Input value={a.issuer || ""} placeholder="수여 기관" onChange={e => patchAward(a.id, "issuer", e.target.value)} style={{ color: C.sub, fontSize: 12.5, border: "none", padding: "2px 0" }} />
            <Input value={a.date || ""} placeholder="수상일" onChange={e => patchAward(a.id, "date", e.target.value)} style={{ color: C.sub, fontSize: 12.5, border: "none", padding: "2px 0" }} />
            <Input value={a.note || ""} placeholder="비고 (예: 대상, 참가팀 30개 중 1위)" onChange={e => patchAward(a.id, "note", e.target.value)} style={{ color: C.faint, fontSize: 12, border: "none", padding: "2px 0" }} />
            <span onClick={() => removeAward(a.id)} title="삭제" style={{ cursor: "pointer", color: C.faint, fontSize: 12 }}>✕</span>
          </div>
        ))}
        {awards.length === 0 && <div style={{ fontSize: 12.5, color: C.faint, padding: "6px 0" }}>등록된 수상기록이 없습니다.</div>}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <Input placeholder="수상명 (예: 전국 대학생 공모전 대상)" value={awardDraft.name} onChange={e => setAwardDraft(d => ({ ...d, name: e.target.value }))} style={{ flex: 1.3 }} />
          <Input placeholder="수여 기관" value={awardDraft.issuer} onChange={e => setAwardDraft(d => ({ ...d, issuer: e.target.value }))} style={{ flex: 1 }} />
          <Input placeholder="수상일 (YYYY-MM)" value={awardDraft.date} onChange={e => setAwardDraft(d => ({ ...d, date: e.target.value }))} style={{ width: 130 }} />
          <Btn small onClick={addAward}>추가</Btn>
        </div>
      </Card>
      </div>
    </div>
  );
}
