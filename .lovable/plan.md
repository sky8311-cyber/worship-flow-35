

# 곡 추가시 프리즈 현상 수정 계획

## 문제 분석

### 근본 원인: 무한 렌더 루프 (Infinite Render Loop)

`SongDialog.tsx`의 136-142 라인에서 **두 상태 간의 순환 동기화**가 발생합니다:

```typescript
// Line 137-142 - 문제의 useEffect
useEffect(() => {
  const firstUrl = youtubeLinks[0]?.url || "";
  if (formData.youtube_url !== firstUrl) {
    setFormData(prev => ({ ...prev, youtube_url: firstUrl }));  // ← formData 변경
  }
}, [youtubeLinks]);  // ← youtubeLinks 의존
```

### 프리즈 발생 시나리오

```text
1. 사용자가 YouTube URL 입력 필드에 텍스트 입력
   ↓
2. updateYoutubeLink() 호출 → setYoutubeLinks() 실행
   ↓
3. youtubeLinks 변경 → useEffect 트리거
   ↓
4. formData.youtube_url !== firstUrl 조건 충족
   ↓
5. setFormData() 실행 → 컴포넌트 리렌더
   ↓
6. 리렌더 중 youtubeLinks[0]?.url 참조 재계산
   ↓
7. 새 객체 참조로 인해 조건 재충족 → 반복
```

### 추가 문제: ESLint 의존성 경고 무시

```typescript
useEffect(() => {
  ...
}, [youtubeLinks]);  // formData도 읽지만 의존성에 없음
```

`formData.youtube_url`을 읽지만 의존성 배열에 포함하지 않아 React가 정상적인 클로저 동작을 하지 못합니다.

---

## 해결 방안

### 수정 1: useEffect 내 비교 로직 안정화

**Before (문제):**
```typescript
useEffect(() => {
  const firstUrl = youtubeLinks[0]?.url || "";
  if (formData.youtube_url !== firstUrl) {
    setFormData(prev => ({ ...prev, youtube_url: firstUrl }));
  }
}, [youtubeLinks]);
```

**After (해결):**
```typescript
useEffect(() => {
  const firstUrl = youtubeLinks[0]?.url || "";
  // 함수형 업데이트 + 조건 확인을 setter 내부로 이동
  setFormData(prev => {
    if (prev.youtube_url === firstUrl) {
      return prev;  // 변경 없음 → 리렌더 방지
    }
    return { ...prev, youtube_url: firstUrl };
  });
}, [youtubeLinks]);
```

**왜 이렇게 수정하는가:**
- `setFormData` 내부에서 `prev`를 비교하면 React가 상태 변경 여부를 정확히 판단
- 동일한 값이면 **동일 객체 반환** → 리렌더 없음
- 외부에서 `formData`를 읽지 않으므로 의존성 문제 해결

---

### 수정 2: updateYoutubeLink 함수 최적화

현재 문제:
```typescript
const updateYoutubeLink = (index: number, field: "label" | "url", value: string) => {
  const updated = [...youtubeLinks];  // 새 배열 생성
  updated[index][field] = value;       // 원본 객체 직접 변경 (mutation!)
  setYoutubeLinks(updated);
};
```

**문제점:**
1. 스프레드 연산자로 새 배열 생성
2. 그러나 내부 객체는 동일 참조 유지
3. 객체 직접 변경(mutation)으로 React 비교 로직 혼란

**After (해결):**
```typescript
const updateYoutubeLink = (index: number, field: "label" | "url", value: string) => {
  setYoutubeLinks(prev => prev.map((link, i) => 
    i === index ? { ...link, [field]: value } : link
  ));
};
```

**왜 이렇게 수정하는가:**
- 함수형 업데이트 패턴 사용
- 변경되는 객체만 새로 생성 (불변성 유지)
- 나머지 객체는 참조 유지 → 최소한의 리렌더

---

## 수정 파일

| 파일 | 라인 | 변경 내용 |
|------|------|----------|
| `src/components/SongDialog.tsx` | 137-142 | useEffect 로직 안정화 |
| `src/components/SongDialog.tsx` | 529-533 | updateYoutubeLink 불변성 패턴 적용 |

---

## 기대 결과

| 증상 | Before | After |
|-----|--------|-------|
| YouTube URL 입력 시 프리즈 | 발생 | 해결 |
| 다이얼로그 응답성 | 느림/멈춤 | 즉각 반응 |
| 입력 후 나갔다 다시 들어와야 함 | 필요함 | 불필요 |

---

## 테스트 체크리스트

1. 새 곡 추가 다이얼로그 열기
2. YouTube URL 입력 필드에 직접 URL 붙여넣기
3. YouTube 검색 후 영상 선택
4. 라벨 입력 후 저장 버튼 클릭
5. 위 모든 단계에서 프리즈 없이 동작 확인

