

## 문제 진단 결과

**DB 테이블 `user_curation_profiles`가 비어 있습니다.** 이전에 채팅을 했지만, AI가 `is_complete: true`를 반환하기 전에 Sheet를 닫았거나, 대화가 끝까지 완료되지 않아 프로필이 저장되지 않았습니다.

현재 저장 로직: AI 대화가 완료(`is_complete: true`)되어야만 edge function이 DB에 upsert → 대화 중간에 닫으면 모든 내용 유실

## 수정 계획

### 1. 대화 중간 저장 (Partial Save)
- Edge function에서 매 응답마다 `skills_summary`가 아직 없더라도, 대화 진행 상태를 저장할 수 있도록 `conversation_state` 컬럼 추가
- DB 마이그레이션: `user_curation_profiles`에 `conversation_messages` (jsonb, nullable) 컬럼 추가
- 매 AI 응답 후 대화 히스토리를 DB에 저장 → Sheet를 닫아도 다음에 이어서 대화 가능

### 2. 대화 이어가기 (Resume)
- `CurationProfileChat` 마운트 시, DB에서 기존 `conversation_messages`를 로드
- 저장된 대화가 있으면 히스토리를 복원하고 이어서 대화
- `skills_summary`가 이미 있으면 수정 모드로 진입 (기존 로직 유지)

### 3. Edge Function 수정
- 매 응답마다 `conversation_messages`를 upsert (대화 완료 여부와 무관)
- `is_complete: true`일 때만 `skills_summary` 저장 (기존 로직 유지)
- 대화 완료 시 `conversation_messages`를 null로 클리어 (완료된 대화는 보관 불필요)

### 4. Settings UI 개선
- 미완료 대화가 있으면 "이전 대화 이어하기" 표시
- `skills_summary`가 있으면 기존대로 요약 표시 + "수정하기" 버튼

## 기술 상세

**DB 마이그레이션:**
```sql
ALTER TABLE user_curation_profiles 
ADD COLUMN conversation_messages jsonb DEFAULT NULL;
```

**Edge Function 변경 (매 응답 후):**
```typescript
// Always save conversation state
await supabase.from("user_curation_profiles").upsert({
  user_id: user.id,
  conversation_messages: messages, // full conversation history
  ...(parsed.is_complete && parsed.skills_summary
    ? { skills_summary: parsed.skills_summary, conversation_messages: null }
    : {}),
  updated_at: new Date().toISOString(),
}, { onConflict: "user_id" });
```

**CurationProfileChat 변경:**
- Props에 `existingMessages?: ChatMessage[]` 추가
- Settings 페이지에서 DB의 `conversation_messages`를 로드해 전달
- 마운트 시 기존 메시지 복원, 마지막 AI 메시지부터 대화 재개

**수정 파일:**
- DB 마이그레이션 (1개 컬럼 추가)
- `supabase/functions/update-curation-profile/index.ts` — 매 응답 후 대화 저장
- `src/components/CurationProfileChat.tsx` — 대화 복원 로직
- `src/pages/Settings.tsx` — `conversation_messages` 로드 및 전달

