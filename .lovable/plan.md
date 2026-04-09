

# 저작권 정책 동의 흐름 추가

## 문제

`legal_documents` 테이블에 `copyright` (저작권 정책)과 `trademark` (상표 고지) 문서가 존재하지만, 동의 흐름에서 완전히 제외되어 있습니다.

- `useLegalConsent.ts`: `.in("type", ["terms", "privacy", "communications"])` — copyright 누락
- `LegalConsentModal.tsx`: type이 `"terms" | "privacy" | "communications"`만 허용
- 결과: 저작권 정책이 업데이트되어도 사용자에게 재동의를 요청하지 않음

## 변경 계획

### 1. `useLegalConsent.ts` — copyright 타입 추가
- `PendingDocument` 인터페이스의 type에 `"copyright"` 추가
- 두 쿼리의 `.in("type", [...])` 필터에 `"copyright"` 추가
- `hasPendingCopyright` 변수 추가 및 `needsCommunicationConsentOnly` 로직에 반영

### 2. `LegalConsentModal.tsx` — copyright 문서 표시
- `PendingDocument` 인터페이스에 `"copyright"` 추가
- `mandatoryDocs` 필터에 `d.type === "copyright"` 추가 (필수 동의 항목으로)
- `getIcon` 함수에 copyright용 아이콘 추가 (예: `Scale` 또는 `Copyright`)

### 3. `CommunicationConsentModal.tsx` — 타입 정의 동기화
- `CommunicationsDocument` 인터페이스에 `"copyright"` 추가 (타입 일관성)

### 4. 저작권 정책 버전 업데이트 (DB 마이그레이션)
- `legal_documents` 테이블의 copyright 문서를 version `2.0`으로 업데이트하여, 기존 사용자에게 재동의 모달이 표시되도록 함
- 최근 강화된 DMCA Safe Harbor, 중개자 면책, 반복 침해자 정책 등의 내용이 반영된 새 버전

## 변경 파일 (4개)
| 파일 | 변경 |
|---|---|
| `src/hooks/useLegalConsent.ts` | copyright 쿼리 추가 |
| `src/components/legal/LegalConsentModal.tsx` | copyright 표시 + 필수 동의 |
| `src/components/legal/CommunicationConsentModal.tsx` | 타입 동기화 |
| DB 마이그레이션 | copyright 문서 v2.0 업데이트 |

## 결과
- ✅ 저작권 정책이 약관/개인정보처리방침과 함께 필수 동의 항목으로 표시
- ✅ 기존 사용자 모두 다음 방문 시 저작권 정책 v2.0에 동의해야 계속 사용 가능
- ✅ 향후 저작권 정책 버전 변경 시 자동으로 재동의 요청

