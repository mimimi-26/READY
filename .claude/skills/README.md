# 디자인 검수용 에이전트 스킬

이 디렉터리의 스킬은 외부 저장소에서 가져와 이 프로젝트에 직접 포함시킨 것입니다.
`.claude/skills/` 에 있으므로 Claude Code 로컬 세션·웹 세션 모두에서 자동으로 로드됩니다.

## 포함된 스킬

| 스킬 | 출처 | 기준 커밋 | 용도 |
|---|---|---|---|
| `ui-ux-pro-max` | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | `de5f12b` (2026-09-19) | 접근성·터치·반응형·타이포그래피 검수, 디자인 시스템 추천 |
| `design-taste-frontend` | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) (`skills/taste-skill/`) | `e79ca9e` (2026-09-16) | 랜딩/포트폴리오용 안티-슬롭 프론트엔드 규칙 |
| `redesign-existing-projects` | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) (`skills/redesign-skill/`) | `e79ca9e` (2026-09-16) | 기존 프로젝트 감사(audit) 후 단계적 리디자인 |

두 taste-skill 항목은 원본 폴더명과 설치명(SKILL.md frontmatter의 `name`)이 다릅니다.
여기서는 설치명 기준으로 디렉터리를 만들었습니다.

## ui-ux-pro-max 사용법

검색 스크립트는 Python 3만 있으면 동작합니다(외부 의존성 없음). 프로젝트 루트에서 실행하세요.

```bash
# 도메인별 규칙 검색
python3 ".claude/skills/ui-ux-pro-max/scripts/search.py" "<query>" --domain ux

# 디자인 시스템 추천
python3 ".claude/skills/ui-ux-pro-max/scripts/search.py" "<제품 설명>" --design-system -p "READY"

# 스택별 가이드
python3 ".claude/skills/ui-ux-pro-max/scripts/search.py" "<query>" --stack react
```

`--domain` 값: `ux`, `style`, `color`, `typography`, `product`, `chart`, `gsap`, `icon`, `landing`, `app`

## 적용 범위 주의

`design-taste-frontend` 는 SKILL.md에 랜딩 페이지/포트폴리오/리디자인 전용이며
대시보드·데이터 테이블·멀티스텝 제품 UI에는 적용하지 말라고 명시되어 있습니다.
이 프로젝트는 CoreUI 기반 대시보드형이므로, 검수에는 `ui-ux-pro-max` 와
`redesign-existing-projects` 를 우선 사용하세요.

## 업데이트 방법

업스트림을 다시 받아 덮어쓰고, 기준 커밋을 위 표에 갱신하면 됩니다.

```bash
git clone --depth 1 https://github.com/nextlevelbuilder/ui-ux-pro-max-skill /tmp/uiux
rm -rf .claude/skills/ui-ux-pro-max
cp -r /tmp/uiux/.claude/skills/ui-ux-pro-max .claude/skills/
rm -rf .claude/skills/ui-ux-pro-max/scripts/tests

git clone --depth 1 https://github.com/Leonxlnx/taste-skill /tmp/taste
cp /tmp/taste/skills/taste-skill/SKILL.md .claude/skills/design-taste-frontend/SKILL.md
cp /tmp/taste/skills/redesign-skill/SKILL.md .claude/skills/redesign-existing-projects/SKILL.md
```

### 로컬 수정 사항

`ui-ux-pro-max/SKILL.md` 의 스크립트 경로만 프로젝트 설치에 맞게 고쳤습니다.
업스트림은 플러그인 설치 기준인 `${CLAUDE_PLUGIN_ROOT}/.claude/skills/...` 형태를 쓰는데,
이 프로젝트는 플러그인이 아니라 저장소에 직접 포함하는 방식이라
프로젝트 루트 기준 상대 경로 `.claude/skills/ui-ux-pro-max/scripts/search.py` 로 바꿨습니다.
업데이트할 때마다 이 치환을 다시 적용해야 합니다.

```bash
sed -i 's|\${CLAUDE_PLUGIN_ROOT}/\.claude/skills/ui-ux-pro-max/scripts/search\.py|.claude/skills/ui-ux-pro-max/scripts/search.py|g' \
  .claude/skills/ui-ux-pro-max/SKILL.md
```

## 라이선스

세 스킬 모두 MIT 입니다. 각 저장소의 LICENSE를 참고하세요.
