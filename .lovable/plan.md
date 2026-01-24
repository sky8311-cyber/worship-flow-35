

# 온보딩 UI/UX 개선 전체 구현 계획

## 남은 작업 목록

이전 플랜에서 텍스트 변경만 완료되었고, 다음 항목들이 아직 구현되지 않았습니다:

---

## 1. RoleSelectionDialog 개선

**파일**: `src/components/onboarding/RoleSelectionDialog.tsx`

### 추가할 기능:
- framer-motion 애니메이션 (staggered fade-in)
- 배경 그라데이션 + 아이콘 pulse 효과
- X 닫기 버튼 추가 (우상단)
- "다시 보지 않기" 체크박스 추가
- "다시 보지 않기" 선택 시 `onboarding_role_asked_count: 99` 설정

```tsx
// 추가할 imports
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";

// 새로운 state
const [dontShowAgain, setDontShowAgain] = useState(false);

// handleLater 로직 개선
if (dontShowAgain) {
  // 영구 종료
  await supabase.from("profiles").update({ 
    onboarding_role_asked: true,
    onboarding_role_asked_count: 99 
  }).eq("id", userId);
}
```

---

## 2. WLWelcomeDialog 애니메이션 추가

**파일**: `src/components/dashboard/WLWelcomeDialog.tsx`

### 추가할 기능:
- react-confetti로 축하 효과
- framer-motion으로 staggered 애니메이션
- 아이콘 bounce/pulse 애니메이션
- 배경 그라데이션 효과

```tsx
// 추가할 imports
import { motion } from "framer-motion";
import Confetti from "react-confetti";

// Confetti 상태
const [showConfetti, setShowConfetti] = useState(true);

useEffect(() => {
  const timer = setTimeout(() => setShowConfetti(false), 3000);
  return () => clearTimeout(timer);
}, []);
```

---

## 3. InvitedUserWelcomeDialog 애니메이션 추가

**파일**: `src/components/onboarding/InvitedUserWelcomeDialog.tsx`

### 추가할 기능:
- Avatar scale-in 애니메이션
- 콘텐츠 fade-in 효과
- 버튼 hover 애니메이션

---

## 4. TeamMemberWelcomeDialog 신규 생성

**새 파일**: `src/components/onboarding/TeamMemberWelcomeDialog.tsx`

팀멤버로 선택한 유저 전용 환영 화면:

```tsx
<Dialog>
  {/* 환영 애니메이션 */}
  <motion.div>
    <Users className="h-16 w-16 text-primary" />
  </motion.div>
  
  <h2>팀멤버로 시작합니다! 🎵</h2>
  
  {/* 할 수 있는 것들 */}
  <Feature icon={Music} text="찬양 라이브러리 이용" />
  <Feature icon={Heart} text="좋아하는 곡 저장" />
  <Feature icon={Search} text="공동체 찾기" />
  
  {/* 공동체 찾기 버튼 */}
  <Button onClick={() => navigate("/community/search")}>
    공동체 찾아보기
  </Button>
  
  {/* WL 승급 안내 */}
  <p>나중에 예배인도자가 되고 싶으시면 언제든 신청 가능</p>
</Dialog>
```

---

## 5. WLOnboardingChecklist dismiss 영구 저장

**파일**: `src/components/dashboard/WLOnboardingChecklist.tsx`

현재: `useState(false)` → 세션 내에서만 dismiss
변경: `localStorage` 활용하여 영구 저장

```tsx
const [dismissed, setDismissed] = useState(() => {
  return localStorage.getItem('wl-onboarding-dismissed') === 'true';
});

const handleDismiss = () => {
  setDismissed(true);
  localStorage.setItem('wl-onboarding-dismissed', 'true');
};
```

---

## 6. Dashboard 통합

**파일**: `src/pages/Dashboard.tsx`

- TeamMemberWelcomeDialog 통합
- 팀멤버 선택 후 환영 다이얼로그 표시

---

## 7. 번역 키 추가

**파일**: `src/lib/translations.ts`

```typescript
onboarding: {
  dontShowAgain: {
    ko: "다시 보지 않기",
    en: "Don't show again"
  },
  teamMember: {
    welcome: {
      ko: "팀멤버로 시작합니다! 🎵",
      en: "Starting as a Team Member! 🎵"
    },
    searchCommunity: {
      ko: "공동체 찾아보기",
      en: "Find a Community"
    },
    // ... 기타 번역 키
  }
}
```

---

## 파일 변경 요약

| 파일 | 변경 내용 |
|------|----------|
| `RoleSelectionDialog.tsx` | framer-motion, X 버튼, "다시 보지 않기" 체크박스 |
| `WLWelcomeDialog.tsx` | Confetti, 애니메이션 아이콘, stagger 효과 |
| `InvitedUserWelcomeDialog.tsx` | scale-in 애니메이션, fade 효과 |
| `TeamMemberWelcomeDialog.tsx` (신규) | 팀멤버 전용 환영 화면 |
| `WLOnboardingChecklist.tsx` | localStorage 영구 dismiss |
| `Dashboard.tsx` | TeamMemberWelcomeDialog 통합 |
| `translations.ts` | 새 번역 키 추가 |

---

## 기술적 세부사항

### 애니메이션 variants (공통 사용)

```typescript
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
};
```

### Confetti 설정

```typescript
<Confetti 
  width={400} 
  height={500} 
  recycle={false} 
  numberOfPieces={100}
  style={{ position: 'absolute', pointerEvents: 'none' }}
/>
```

