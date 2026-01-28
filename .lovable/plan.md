
# 멤버십 상품 관리 시스템 계획 (Admin Dashboard)

## 개요

Admin Dashboard에서 **Full Membership**과 **Community Account**의 상품 세부 정보를 쉽게 변경할 수 있는 관리 시스템을 구축합니다.

### 관리 가능한 항목
- 가격 (USD 및 KRW)
- 결제 주기 (월간/연간)
- 체험 기간 (7일, 14일, 30일 등)
- 표시 문구 (멤버십 친화적 용어)

### 용어 정책 (한국 교회 문화 고려)
| 사용 금지 | 사용 권장 |
|-----------|-----------|
| Subscription (구독) | Membership (멤버십) |
| Purchase (구매) | Join (가입) |
| Subscribe (구독하다) | Become a Member (멤버 되기) |
| Payment (결제) | Contribution (후원) / 참여비 |

---

## 현재 상태 분석

### 기존 인프라
- `platform_feature_flags` 테이블: 토글 스위치 설정 (ON/OFF만 지원)
- Admin Dashboard: 토글만 있고 숫자/텍스트 입력 필드 없음
- `PremiumBillingCard.tsx`: 가격이 하드코딩됨 (`$99/year`, `₩99,000/년`)
- Edge Functions: 가격 ID가 하드코딩됨 (`price_premium_monthly`)

### 해결해야 할 문제
1. 가격 변경 시 코드 수정 필요 → **DB 기반 설정**으로 전환
2. 체험 기간 변경 불가 → **설정 테이블**에서 관리
3. 용어가 곳곳에 하드코딩 → **번역 키 통일** + 설정 가능

---

## 기술 아키텍처

### 새 데이터베이스 테이블: `membership_products`

```sql
CREATE TABLE public.membership_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_key TEXT UNIQUE NOT NULL,  -- 'full_membership' | 'community_account'
  
  -- Display Info
  display_name_en TEXT NOT NULL,
  display_name_ko TEXT NOT NULL,
  description_en TEXT,
  description_ko TEXT,
  
  -- Pricing (stored in cents/won)
  price_usd INTEGER NOT NULL,        -- e.g., 4999 = $49.99
  price_krw INTEGER NOT NULL,        -- e.g., 59000 = ₩59,000
  
  -- Billing Cycle
  billing_cycle TEXT NOT NULL,       -- 'monthly' | 'yearly'
  billing_cycle_label_en TEXT,       -- "per year" | "per month"
  billing_cycle_label_ko TEXT,       -- "연간" | "월간"
  
  -- Trial Period
  trial_days INTEGER DEFAULT 7,
  
  -- Stripe Integration
  stripe_price_id_usd TEXT,
  stripe_price_id_krw TEXT,
  stripe_product_id TEXT,
  
  -- Toss Integration (Future)
  toss_plan_id TEXT,
  
  -- Feature Gating
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Initial Data
INSERT INTO membership_products (product_key, display_name_en, display_name_ko, price_usd, price_krw, billing_cycle, trial_days)
VALUES 
  ('full_membership', 'Full Membership', '정식 멤버십', 4999, 59000, 'yearly', 7),
  ('community_account', 'Community Account', '공동체 계정', 3999, 39900, 'monthly', 30);
```

### Admin UI 구조

```text
┌────────────────────────────────────────────────────────────────────┐
│  Admin Dashboard                                                   │
│  └── Membership Account Settings 카드 (기존)                       │
│       └── [멤버십 상품 관리] 버튼 → AdminMembershipProducts 페이지  │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  /admin/membership-products (새 페이지)                            │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │  Full Membership (정식 멤버십)                          │      │
│  │  ─────────────────────────────────────────────────────  │      │
│  │  가격 (USD):     [$49.99     ]  per year ▼              │      │
│  │  가격 (KRW):     [₩59,000    ]  연간     ▼              │      │
│  │  체험 기간:      [7] 일                                 │      │
│  │  Stripe Price ID: [price_xxx...]                        │      │
│  │  ───────────────────────────────────────────────────── │      │
│  │  [저장] [미리보기]                      [활성] ON       │      │
│  └─────────────────────────────────────────────────────────┘      │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │  Community Account (공동체 계정)                        │      │
│  │  ─────────────────────────────────────────────────────  │      │
│  │  가격 (USD):     [$39.99     ]  per month ▼             │      │
│  │  가격 (KRW):     [₩39,900    ]  월간      ▼             │      │
│  │  체험 기간:      [30] 일                                │      │
│  │  Stripe Price ID: [price_1SZ...]                        │      │
│  │  ───────────────────────────────────────────────────── │      │
│  │  [저장] [미리보기]                      [활성] ON       │      │
│  └─────────────────────────────────────────────────────────┘      │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 구현 단계

### Phase 1: 데이터베이스 설정

1. **`membership_products` 테이블 생성**
   - 위 스키마 적용
   - RLS 정책: Admin만 수정 가능, 읽기는 public

2. **초기 데이터 삽입**
   - Full Membership: $49.99/년, 7일 체험
   - Community Account: $39.99/월, 30일 체험

### Phase 2: Admin UI 구현

1. **새 페이지: `src/pages/AdminMembershipProducts.tsx`**
   - 상품 목록 표시
   - 인라인 편집 또는 다이얼로그 편집
   - 저장 시 DB 업데이트

2. **Admin 네비게이션에 추가**
   - `AdminNav.tsx`의 More 메뉴에 "Membership Products" 링크 추가

3. **AdminDashboard에 바로가기 추가**
   - Membership Account Settings 카드에 "상품 관리" 버튼

### Phase 3: 프론트엔드 연동

1. **새 Hook: `src/hooks/useMembershipProducts.ts`**
   ```typescript
   export function useMembershipProducts() {
     return useQuery({
       queryKey: ["membership-products"],
       queryFn: async () => {
         const { data } = await supabase
           .from("membership_products")
           .select("*")
           .eq("is_active", true);
         return data;
       },
       staleTime: 5 * 60 * 1000, // 5분 캐시
     });
   }
   ```

2. **PremiumBillingCard 수정**
   - 하드코딩된 가격 제거
   - `useMembershipProducts`에서 동적으로 가져오기

3. **ChurchBillingTab 수정**
   - 동일하게 DB에서 가격 정보 가져오기

### Phase 4: Edge Functions 연동

1. **create-premium-checkout 수정**
   - DB에서 `stripe_price_id_usd` 조회
   - DB에서 `trial_days` 조회

2. **create-church-checkout 수정**
   - 동일하게 DB 기반으로 변경

---

## 파일 변경 목록

| 파일 | 변경 내용 |
|------|----------|
| **Phase 1: Database** | |
| `supabase/migrations/...` | `membership_products` 테이블 생성 |
| **Phase 2: Admin UI** | |
| `src/pages/AdminMembershipProducts.tsx` | **새 파일** - 상품 관리 페이지 |
| `src/components/admin/MembershipProductCard.tsx` | **새 파일** - 상품 편집 카드 |
| `src/components/admin/AdminNav.tsx` | More 메뉴에 링크 추가 |
| `src/pages/AdminDashboard.tsx` | 상품 관리 바로가기 추가 |
| `src/App.tsx` | 새 라우트 추가 |
| **Phase 3: Frontend** | |
| `src/hooks/useMembershipProducts.ts` | **새 파일** - 상품 정보 조회 Hook |
| `src/components/premium/PremiumBillingCard.tsx` | DB 기반 가격 표시 |
| `src/components/church/ChurchBillingTab.tsx` | DB 기반 가격 표시 |
| **Phase 4: Edge Functions** | |
| `supabase/functions/create-premium-checkout/index.ts` | DB에서 설정 조회 |
| `supabase/functions/create-church-checkout/index.ts` | DB에서 설정 조회 |

---

## 용어 정책 적용

### 번역 키 업데이트 (`translations.ts`)

```typescript
// 변경 전
"subscribeNow": "Subscribe Now",
"subscription": "Subscription",

// 변경 후
"joinMembership": "Join Membership",
"membership": "Membership",
"becomeFullMember": "Become a Full Member",
"joinCommunity": "Join Community",
```

### UI 텍스트 변경 예시

| 위치 | 변경 전 | 변경 후 (EN) | 변경 후 (KO) |
|------|---------|--------------|--------------|
| Button | Subscribe Now | Join Membership | 멤버 가입하기 |
| Title | Subscription & Billing | Membership | 멤버십 |
| Trial | Start Free Trial | Start Free Membership | 무료 체험 시작 |
| Badge | Subscriber | Full Member | 정식 멤버 |

---

## 보안 고려사항

1. **RLS 정책**
   ```sql
   -- Admin만 수정 가능
   CREATE POLICY "Admin can manage products" ON membership_products
     FOR ALL USING (
       EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
     );
   
   -- 모든 사용자 읽기 가능 (가격 표시용)
   CREATE POLICY "Anyone can read active products" ON membership_products
     FOR SELECT USING (is_active = true);
   ```

2. **Edge Function 검증**
   - DB에서 조회한 가격과 Stripe 가격 일치 검증
   - 잘못된 price_id 방지

---

## 테스트 체크리스트

- [ ] Admin 페이지에서 가격 변경 → 저장 확인
- [ ] 가격 변경 후 PremiumBillingCard에 반영 확인
- [ ] 체험 기간 7일 → 14일 변경 후 Checkout에서 확인
- [ ] Community Account 가격 변경 후 ChurchBillingTab 반영 확인
- [ ] Stripe Price ID 변경 후 결제 정상 작동 확인
- [ ] "멤버십" 용어가 일관되게 적용되었는지 확인

---

## 사전 확인 사항

승인 전 결정이 필요합니다:

1. **Stripe 상품**: Full Membership ($49.99/년) 상품을 새로 생성해야 할까요?
2. **한국 원화 가격**: $49.99 = 약 ₩59,000로 설정해도 될까요?
3. **Monthly 옵션**: Full Membership은 연간만 지원하므로 월간 옵션을 비활성화하면 될까요?
