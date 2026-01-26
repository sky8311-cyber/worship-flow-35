

# 생년월일 입력 방식 개선 계획

## 문제

현재 생년월일 입력이 `<Input type="date" />` (네이티브 HTML date 인풋)으로 구현되어 있습니다.

**문제점:**
- 모바일에서 달력/휠 UI가 표시됨
- 1997년처럼 오래된 연도를 선택하려면 **수십 번 스크롤/탭** 필요
- 사용자 경험이 매우 불편함

---

## 해결 방안: 연/월/일 드롭다운 선택기

달력 대신 **3개의 드롭다운**으로 변경:

```
┌─────────┐  ┌─────────┐  ┌─────────┐
│  1997  ▼│  │   3월  ▼│  │   15  ▼│
└─────────┘  └─────────┘  └─────────┘
    연도          월           일
```

**장점:**
- 연도를 바로 선택 가능 (1900~현재)
- 모바일에서도 빠르고 쉬운 선택
- 달력 스크롤 필요 없음

---

## 구현 계획

### 1단계: 재사용 가능한 컴포넌트 생성

**새 파일:** `src/components/ui/date-dropdown-picker.tsx`

```typescript
interface DateDropdownPickerProps {
  value: string;           // YYYY-MM-DD 형식
  onChange: (date: string) => void;
  minYear?: number;        // 기본값: 1900
  maxYear?: number;        // 기본값: 현재 연도
  required?: boolean;
  disabled?: boolean;
}
```

**기능:**
- 연도: 현재 연도 ~ 1900년 (내림차순, 최신 연도 먼저)
- 월: 1월 ~ 12월 (한국어/영어 지원)
- 일: 선택된 월에 따라 28~31일 동적 표시
- 윤년 자동 처리
- 출력값: `YYYY-MM-DD` 문자열 (기존 호환성 유지)

### 2단계: 회원가입 페이지 수정

**파일:** `src/pages/auth/SignUp.tsx`

```typescript
// 변경 전
<Input
  id="birthDate"
  type="date"
  required
  value={formData.birthDate}
  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
/>

// 변경 후
<DateDropdownPicker
  value={formData.birthDate}
  onChange={(date) => setFormData({ ...formData, birthDate: date })}
  required
/>
```

### 3단계: 초대 회원가입 페이지 수정

**파일:** `src/pages/InvitedSignUp.tsx`

동일한 방식으로 `<DateDropdownPicker />` 적용

### 4단계: 프로필 편집 다이얼로그 수정

**파일:** `src/components/profile/ProfileEditDialog.tsx`

동일한 방식으로 `<DateDropdownPicker />` 적용

---

## 파일 변경 요약

| 파일 | 변경 내용 |
|------|----------|
| `src/components/ui/date-dropdown-picker.tsx` | **새로 생성** - 연/월/일 드롭다운 컴포넌트 |
| `src/pages/auth/SignUp.tsx` | `<Input type="date">` → `<DateDropdownPicker>` |
| `src/pages/InvitedSignUp.tsx` | `<Input type="date">` → `<DateDropdownPicker>` |
| `src/components/profile/ProfileEditDialog.tsx` | `<Input type="date">` → `<DateDropdownPicker>` |

---

## UI 디자인

```text
생년월일 *

┌──────────────────────────────────────────────────┐
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │   1997  ▼│  │   3월   ▼│  │   15일  ▼│       │
│  └──────────┘  └──────────┘  └──────────┘       │
│      연도          월            일              │
└──────────────────────────────────────────────────┘
```

**특징:**
- 각 드롭다운은 `<Select>` 컴포넌트 사용 (shadcn/ui)
- 연도 목록: 최신 연도가 상단 (2026, 2025, 2024, ...)
- 반응형: 모바일에서 세로 배치 가능

---

## 예상 결과

수정 후:
1. **연도 선택** → 드롭다운에서 1997 바로 클릭
2. **월 선택** → 드롭다운에서 원하는 월 선택
3. **일 선택** → 드롭다운에서 원하는 일 선택
4. **총 3번 탭**으로 생년월일 입력 완료 (기존 수십 번 스크롤 → 3번 클릭)

