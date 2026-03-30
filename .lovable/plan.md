

# Atelier 온보딩 플로우 구현

## 개요
현재 모든 신규 유저에게 자동으로 worship_room이 생성되는 트리거를 제거하고, 사용자가 직접 동의 + 온보딩 과정을 거쳐야만 아틀리에가 생성되도록 변경합니다.

## 1. DB 마이그레이션

### 1-1. 자동 생성 트리거 제거
```sql
DROP TRIGGER IF EXISTS on_profile_created_create_room ON public.profiles;
DROP FUNCTION IF EXISTS public.create_default_worship_room();
```

### 1-2. 빈 worship_room 삭제
게시물(room_posts)이나 공간(studio_spaces)이 없는 빈 방을 정리:
```sql
DELETE FROM public.worship_rooms wr
WHERE NOT EXISTS (SELECT 1 FROM public.room_posts rp WHERE rp.room_id = wr.id)
  AND NOT EXISTS (SELECT 1 FROM public.studio_spaces ss WHERE ss.room_id = wr.id);
```

### 1-3. worship_rooms에 온보딩 완료 컬럼 추가
```sql
ALTER TABLE public.worship_rooms
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;
```
기존 room이 남아있는 유저는 이미 콘텐츠가 있으므로 `UPDATE ... SET onboarding_completed = true`로 처리.

## 2. 온보딩 플로우 UI (새 컴포넌트)

### `src/components/worship-studio/onboarding/StudioOnboarding.tsx`
스텝 기반 위저드 (총 4단계, 3-4는 스킵 가능):

**Step 1 — 동의 & 이름 설정**
- 아틀리에 소개 문구 (기존 StudioContractPrompt의 내용 재활용)
- "아틀리에 이름" 입력 필드 (기본값: "{유저이름}의 아틀리에")
- "오픈합니다" 버튼 → worship_room INSERT 실행

**Step 2 — 기본 설정**
- BGM 설정 (기존 `StudioBGMSelector` 재활용)
- 방명록 on/off 토글
- 공개 범위 선택 (비공개/이웃/공개)
- "다음" / "스킵" 버튼

**Step 3 — 첫 공간 추가 (스킵 가능)**
- 공간 이름, 아이콘, 색상 선택 (기존 ICON_CATEGORIES, COLOR_SWATCHES 재활용)
- "추가" / "나중에" 버튼

**Step 4 — 첫 블록 추가 (스킵 가능)**
- 기존 `BlockTypeSelector`의 블록 타입 6종 표시
- 하나 선택 시 간단한 블록 생성 후 완료
- "나중에" 버튼으로 스킵 가능

**완료** → `onboarding_completed = true` 업데이트 → 아틀리에 메인 화면으로 전환

## 3. 기존 코드 수정

### `src/components/worship-studio/StudioView.tsx`
- `!room && isOwnRoom` → `StudioOnboarding` 컴포넌트로 변경 (기존 `StudioContractPrompt` 대체)
- `room && !room.onboarding_completed` → 온보딩 위저드 표시

### `src/hooks/useCreateStudio.ts`
- `studio_name` 파라미터 추가 (온보딩에서 입력받은 이름)
- `onboarding_completed: false`로 초기 생성

### `src/components/worship-studio/StudioContractPrompt.tsx`
- 더 이상 사용하지 않으므로 삭제 (온보딩 Step 1로 통합)

## 4. 파일 목록

| 파일 | 작업 |
|---|---|
| DB 마이그레이션 | 트리거 제거 + 빈 room 삭제 + onboarding_completed 컬럼 |
| `src/components/worship-studio/onboarding/StudioOnboarding.tsx` | 신규 — 4단계 온보딩 위저드 |
| `src/components/worship-studio/StudioView.tsx` | 수정 — 온보딩 분기 |
| `src/hooks/useCreateStudio.ts` | 수정 — studio_name 파라미터 |
| `src/components/worship-studio/StudioContractPrompt.tsx` | 삭제 |

> **랜딩페이지 및 외부 접속(worshipatelier.com) 구현은 별도 후속 작업으로 진행합니다.**

