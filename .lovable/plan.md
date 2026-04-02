

# 공동체 인라인 검색 잘림 수정

## 문제
스크린샷에서 검색 결과의 오른쪽이 잘림. 원인:
1. 멤버 상태 버튼("이미 이 예배공동체의 멤버입니다")이 길어서 `shrink-0`으로 인해 줄지 않고 부모를 넘침
2. 결과 행이 `overflow-hidden` 없이 Card 밖으로 삐져나옴

## 변경

### `src/components/dashboard/InlineCommunitySearch.tsx`
1. **결과 행 컨테이너** (L156): `overflow-hidden` 추가
2. **상태 버튼 영역** (L167): `shrink-0` 제거 → `shrink min-w-0` 적용하여 버튼이 줄어들 수 있게 함
3. **멤버 상태 버튼 텍스트** (L175): 긴 텍스트 대신 짧은 라벨 사용 — `t("community.alreadyMember")`가 길면 "멤버" / "Member"로 축약, 또는 버튼에 `truncate max-w-[80px]` 적용
4. **전체 리스트 컨테이너** (L154): `overflow-hidden` 추가

### `src/components/dashboard/QuickActionsCard.tsx`
- Card의 `CardContent`에 `overflow-hidden` 추가하여 자식 요소가 카드 밖으로 나가지 않도록 방어

### 기술 요약
- 핵심: 버튼 텍스트가 flex 컨테이너에서 줄어들지 못해서 발생한 오버플로우
- `shrink-0` → `shrink` + `truncate`로 변경하면 좁은 화면에서도 잘림 없이 표시됨

