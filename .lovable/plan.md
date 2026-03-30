

# "스튜디오" → "아틀리에" 전격 교체

## 범위

17개 파일, 약 167건의 한국어 "스튜디오" + 대응되는 영어 "Studio" 문자열을 "아틀리에" / "Atelier"로 교체.

## 교체 규칙

| 기존 (KO) | 변경 (KO) | 기존 (EN) | 변경 (EN) |
|---|---|---|---|
| 내 스튜디오 | 내 아틀리에 | My Studio | My Atelier |
| 나의 스튜디오 | 나의 아틀리에 | - | - |
| 스튜디오 설정 | 아틀리에 설정 | Studio Settings | Atelier Settings |
| 스튜디오 방문하기 | 아틀리에 방문하기 | Visit Studio | Visit Atelier |
| 스튜디오 탐색 | 아틀리에 탐색 | Discover Studios | Discover Ateliers |
| 공개 스튜디오 | 공개 아틀리에 | Public Studios | Public Ateliers |
| 스튜디오 검색 | 아틀리에 검색 | Search studios | Search ateliers |
| 활성 스튜디오 | 활성 아틀리에 | Active Studios | Active Ateliers |
| 스튜디오 그리드 | 아틀리에 그리드 | studio grid | atelier grid |
| 스튜디오 이름 | 아틀리에 이름 | Studio name | Atelier name |
| 스튜디오의 분위기 | 아틀리에의 분위기 | your Studio | your Atelier |
| 스튜디오당 | 아틀리에당 | per studio | per atelier |
| 앰버서더 스튜디오 | 앰버서더 아틀리에 | Ambassador studios | Ambassador ateliers |
| 스튜디오 피드 | 아틀리에 피드 | studio feeds | atelier feeds |

**예외 — 변경하지 않는 것:**
- `translations.ts`의 "스튜디오 버전" (음악 녹음 맥락의 studio version → 이건 음악 용어)
- 파일명/컴포넌트명/변수명 (`Studio*.tsx`, `useStudio*`, `myStudio` 등) — 코드 내부 식별자는 유지
- `StudioPostEditor.tsx`의 "이 스튜디오는 그 여정이…" → "이 아틀리에는 그 여정이…" (교체 대상)

## 변경 파일 목록

1. `src/components/worship-rooms/RoomCustomizeDialog.tsx` — 1건
2. `src/components/worship-studio/StudioDraftsTab.tsx` — 1건
3. `src/components/worship-studio/StoryCard.tsx` — 2건
4. `src/components/worship-studio/StudioDiscover.tsx` — 6건
5. `src/components/worship-studio/StudioCoverEditor.tsx` — 2건
6. `src/components/worship-studio/StudioSettingsDialog.tsx` — 3건
7. `src/components/worship-studio/StudioPostEditor.tsx` — 1건
8. `src/components/worship-studio/StudioSidePanel.tsx` — 1건
9. `src/components/worship-studio/StudioEmptyState.tsx` — 1건
10. `src/components/worship-studio/StudioFeedCard.tsx` — 1건
11. `src/components/worship-studio/CollapsibleSidebar.tsx` — 2건
12. `src/pages/AdminStudio.tsx` — 5건+
13. 나머지 파일들 (검색 결과에서 truncated된 파일들도 포함)

단순 문자열 치환 작업이므로 로직 변경 없음.

