

## 워십세트 요약 섹션 개선 + 밴드뷰 미리보기 버튼

### 변경 사항 (파일: `src/pages/SetBuilder.tsx`)

#### 1. 요약 섹션에 곡 제목 (키) 추가
현재 요약(라인 2159-2177)에는 항목 수와 키 순서만 표시됨. 곡 제목과 키를 함께 보여주는 목록 추가:

```
1. 주 하나님 독생자 예수 (G)
2. 은혜 아니면 (A → B)
3. 예수 우리 왕이여 (D)
```

- `곡제목 (연주키)` 형식. 연주키 없으면 default_key, 없으면 생략
- `key_change_to`가 있으면 `(A → B)` 형식으로 전조 표시
- 컴포넌트(순서)는 라벨만 표시 (예: "환영/인사")

#### 2. 밴드뷰 미리보기 버튼
`renderActionButtons` 영역(라인 1492 부근, 공유 버튼 옆)에 "미리보기" 버튼 추가:
- `id`가 있을 때만 표시
- 클릭 시 `window.open(`/band-view/${id}`, '_blank')` 로 새 창 오픈
- 새 창 BandView 페이지 상단에 노란색 경고 배너 표시: "⚠️ 미리보기 모드 — 아직 게시되지 않은 워십세트입니다"
- 배너는 URL에 `?preview=true` 쿼리 파라미터가 있을 때만 표시

### 수정 파일
1. **`src/pages/SetBuilder.tsx`** — 요약 섹션에 곡 목록 추가, 미리보기 버튼 추가 (`window.open` with `?preview=true`)
2. **`src/pages/BandView.tsx`** — `?preview=true` 감지 시 상단 워닝 배너 렌더링

