

# 소셜 미디어 섹션 업데이트

## 변경 사항

1. **YouTube 주소 변경**: `@kworship.app` → `@kworship_app`
2. **소셜 아이콘 애니메이션 추가**: 정적인 아이콘을 생동감 있는 애니메이션 버전으로 개선

---

## 수정 파일

| 파일 | 작업 |
|------|------|
| `src/pages/KWorshipInfo.tsx` | YouTube URL 변경 + 애니메이션 소셜 아이콘 |
| `src/components/landing/LandingFooter.tsx` | YouTube URL 변경 |

---

## 상세 구현

### 1. YouTube URL 업데이트

**변경 전:**
```
https://youtube.com/@kworship.app
```

**변경 후:**
```
https://www.youtube.com/@kworship_app
```

### 2. 소셜 미디어 섹션 디자인 개선

**현재 (지루함):**
- 단순한 회색 원형 배경
- 호버 시 배경색만 살짝 변경
- 정적인 아이콘

**개선안 (생동감):**
- 각 플랫폼별 브랜드 컬러 적용 (호버 시)
- 스케일 + 회전 애니메이션
- 그라데이션 배경 효과
- 스태거 입장 애니메이션 (framer-motion)

### 3. 애니메이션 소셜 아이콘 구현

```tsx
import { motion } from "framer-motion";

const socialLinks = [
  {
    href: "https://www.instagram.com/kworship.app",
    icon: Instagram,
    label: "Instagram",
    color: "hover:bg-gradient-to-br hover:from-purple-500 hover:via-pink-500 hover:to-orange-400",
  },
  {
    href: "https://www.threads.net/@kworship.app",
    icon: AtSign,
    label: "Threads",
    color: "hover:bg-black dark:hover:bg-white",
  },
  {
    href: "https://www.youtube.com/@kworship_app",  // 업데이트된 URL
    icon: Youtube,
    label: "YouTube",
    color: "hover:bg-red-600",
  },
  {
    href: "mailto:hello@kworship.app",
    icon: Mail,
    label: "Email",
    color: "hover:bg-blue-500",
  },
];

// 렌더링
<motion.div 
  className="flex items-center gap-4"
  initial="hidden"
  animate="visible"
  variants={{
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  }}
>
  {socialLinks.map((social, index) => {
    const Icon = social.icon;
    return (
      <motion.a
        key={social.label}
        href={social.href}
        target={social.href.startsWith("mailto:") ? undefined : "_blank"}
        rel={social.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
        className={`
          flex items-center justify-center w-12 h-12 rounded-full 
          bg-muted transition-all duration-300
          hover:text-white hover:scale-110 hover:-rotate-6
          hover:shadow-lg
          ${social.color}
        `}
        aria-label={social.label}
        variants={{
          hidden: { opacity: 0, y: 20, scale: 0.8 },
          visible: { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: { type: "spring", stiffness: 200, damping: 15 }
          }
        }}
        whileHover={{ 
          scale: 1.15, 
          rotate: -8,
          transition: { type: "spring", stiffness: 400, damping: 10 }
        }}
        whileTap={{ scale: 0.95 }}
      >
        <Icon className="h-5 w-5" />
      </motion.a>
    );
  })}
</motion.div>
```

---

## 시각적 비교

### 변경 전
```text
┌─────────────────────────────────────┐
│ 팔로우하기                           │
│ [○] [○] [○] [○]  ← 모두 회색, 정적   │
└─────────────────────────────────────┘
```

### 변경 후
```text
┌─────────────────────────────────────┐
│ 팔로우하기                           │
│ [🟣] [⚫] [🔴] [🔵]  ← 입장 애니메이션  │
│                                     │
│ 호버 시:                             │
│ - 스케일 업 (1.15x)                  │
│ - 살짝 회전 (-8도)                   │
│ - 브랜드 컬러 배경                    │
│ - 그림자 효과                        │
│ - 아이콘 흰색 전환                    │
└─────────────────────────────────────┘
```

---

## 플랫폼별 호버 컬러

| 플랫폼 | 호버 배경색 |
|--------|------------|
| Instagram | 그라데이션 (보라→핑크→오렌지) |
| Threads | 블랙 (다크모드: 화이트) |
| YouTube | 빨강 (#DC2626) |
| Email | 파랑 (#3B82F6) |

---

## 예상 결과

- 페이지 로드 시 소셜 아이콘이 순차적으로 튀어오르며 등장
- 각 아이콘에 마우스를 올리면 해당 플랫폼 브랜드 컬러로 변환
- 약간의 회전과 스케일 효과로 인터랙티브한 느낌 제공
- 전체적으로 더 현대적이고 생동감 있는 UI

