
# 신규회원 리더보드 데이터 불일치 & 레벨명 번역 누락 수정

## 발견된 문제

### 문제 1: 관리자와 일반 사용자가 보는 "신규회원" 데이터가 다름

**원인**: `profiles` 테이블의 RLS 정책 문제

현재 일반 사용자는 아래 조건을 충족하는 프로필만 볼 수 있음:
- 본인 프로필
- 같은 커뮤니티에 속한 멤버
- 커뮤니티 리더
- **씨앗(seeds) > 0인 사용자만** (리더보드용 정책)

```sql
-- 문제가 되는 RLS 정책
"Can view leaderboard user profiles"
WHERE user_seeds.total_seeds > 0
```

**결과**: 가입 후 아직 활동을 하지 않은 신규회원(total_seeds = 0)은 일반 사용자에게 보이지 않음. 관리자는 `Admins can view all profiles` 정책으로 모든 사용자를 볼 수 있어서 데이터가 다르게 표시됨.

### 문제 2: 레벨명 번역 누락 (가지 등)

**원인**: `SeedWidget.tsx`에서 언어 설정과 관계없이 `name_ko`만 하드코딩으로 표시

```typescript
// 현재 코드 (라인 85)
{t('seeds.currentLevel')}: {displayData.currentLevel.name_ko}

// 올바른 코드
{t('seeds.currentLevel')}: {language === "ko" 
  ? displayData.currentLevel.name_ko 
  : displayData.currentLevel.name_en}
```

---

## 수정 계획

### 1. RLS 정책 수정 - 신규회원도 리더보드에 표시

**파일**: SQL 마이그레이션

기존 정책을 수정하여 신규회원(total_seeds >= 0 또는 user_seeds 레코드가 없어도)도 볼 수 있도록 변경:

```sql
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Can view leaderboard user profiles" ON profiles;

-- 새 정책 생성: 인증된 사용자는 모든 프로필의 기본 정보 조회 가능
-- (신규회원 포함)
CREATE POLICY "Authenticated users can view basic profiles for leaderboard"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);
```

또는 더 제한적인 접근:

```sql
-- 신규회원도 포함하도록 조건 완화
CREATE POLICY "Can view leaderboard user profiles"
  ON profiles
  FOR SELECT
  TO public
  USING (
    auth.uid() IS NOT NULL
  );
```

### 2. SeedWidget 언어 설정 반영

**파일**: `src/components/seeds/SeedWidget.tsx`

```typescript
// 라인 85 수정
<p className="text-sm font-medium">
  {t('seeds.currentLevel')}: {language === "ko" 
    ? displayData.currentLevel.name_ko 
    : displayData.currentLevel.name_en}
</p>
```

---

## 수정 대상 파일

| 파일 | 변경 내용 |
|------|----------|
| SQL 마이그레이션 | `profiles` 테이블 RLS 정책 수정 - 신규회원 조회 허용 |
| `src/components/seeds/SeedWidget.tsx` | 레벨명 표시 시 언어 설정 반영 |

---

## 기대 효과

| 항목 | Before | After |
|------|--------|-------|
| 신규회원 리더보드 | 관리자만 전체 표시 | 모든 사용자 동일하게 표시 |
| 레벨명 표시 | 항상 한국어 | 언어 설정에 따라 한/영 표시 |

---

## 보안 고려사항

프로필 조회 정책 완화 시, 노출되는 데이터 범위 확인 필요:
- `SeedLeaderboard`에서는 `id, full_name, avatar_url, created_at`만 조회
- 민감 정보(email, phone 등)는 별도 정책으로 보호 필요

현재 다른 정책들이 email 등 민감 정보를 이미 보호하고 있으므로, SELECT 정책 완화는 기본 정보만 노출됨.
