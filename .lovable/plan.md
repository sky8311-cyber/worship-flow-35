

## Plan: Badge Naming System + Institute Home Page Premium Redesign

### CHANGE 1 — Badge Naming System

#### 1A. Database Migration
Add two columns to `institute_certifications`:
```sql
ALTER TABLE institute_certifications ADD COLUMN badge_name TEXT;
ALTER TABLE institute_certifications ADD COLUMN badge_description TEXT;
```
Then seed the existing pathway:
```sql
UPDATE institute_certifications SET badge_name = 'K-Worship Essential' WHERE title_ko = '워십 리더십 파운데이션';
```

#### 1B. Admin UI — `src/components/institute/AdminInstituteCertifications.tsx`
- Add `badge_name` and `badge_description` to the `Certification` type (lines 19-29)
- In the cert detail form (lines 364-399), add two new input fields after the description textarea:
  - "배지 이름" (`badge_name`) — Input with placeholder "예: K-Worship Essential"
  - "배지 설명" (`badge_description`) — Textarea
- Both use existing `updateCert` mutation with `field: "badge_name"` / `field: "badge_description"`

#### 1C. Curriculum Tree — `src/pages/InstituteCourses.tsx`
- Add `badge_name` to `CertRow` type (line 23-29)
- Update the select query (line 133) to include `badge_name`
- In the badge goal card (lines 362-400):
  - Display `cert.badge_name || cert.title_ko` as the badge title
  - Change emoji from 🎓 to 🏅
  - Update motivational text to use badge_name: `"${badgeName} 배지를 받을 수 있어요!"`
  - When all complete: show "배지 획득 완료!" with "배지 신청하기" CTA

#### 1D. Profile Badges — `src/components/institute/ProfileBadgesSection.tsx`
- Update select query (line 21) to include `badge_name` from `institute_certifications`
- Display `cert?.badge_name || cert?.title_ko` as the badge name on profile cards

---

### CHANGE 2 — Institute Home Page Premium Redesign

**File: `src/pages/Institute.tsx`**

Restructure the JSX return to add 4 new sections above the existing dashboard content. The old hero Card (lines 242-269) is removed since its content moves into the cinematic hero.

#### Section 1 — Full-bleed Cinematic Hero (outside container)
- Full-width div: `relative w-full min-h-[320px] md:min-h-[480px] overflow-hidden`
- Background `<img>` with Unsplash worship photo, `object-cover object-center w-full h-full absolute inset-0`
- Overlay: `absolute inset-0 bg-black/50`
- Centered content (white text):
  - Badge: "🎓 K-WORSHIP INSTITUTE"
  - Headline: "예배팀을 위한 온라인 훈련 아카데미"
  - Subline: "예배팀 리더, 찬양인도자, 팀원을 위한 커리큘럼 · AI 코치 · 공식 배지"
  - Stats row (text-white/80): N개 과목 / N개 배지 과정 / AI 코치
  - CTA Button: "과목 둘러보기 →" → `/institute/courses`

#### Section 2 — Social Proof Strip (outside container)
- Full-width band: `w-full bg-muted py-6`
- Content centered in container:
  - Left: "**200+** K-Worship 예배팀원들과 함께" + 5 overlapping circular avatar images (pravatar.cc, `-ml-2` overlap)
  - Right: 3 Badge pills — "2개 배지 과정" / "AI 코치 포함" / "10+ 강의 모듈"
- Mobile: stacks vertically, centered

#### Section 3 — Testimonials (inside container)
- Section title: "함께하는 예배팀들의 이야기"
- `grid grid-cols-1 md:grid-cols-3 gap-4`
- 3 Card components with: circular avatar (pravatar.cc), name, church, quote placeholder
- Team-oriented names: "홍길동 팀장" / "김예배 찬양인도자" / "이워십 팀원"

#### Section 4 — About Strip (inside container)
- `grid grid-cols-1 md:grid-cols-2 gap-0` with rounded-lg overflow-hidden
- Left: Unsplash worship/study photo, `object-cover w-full h-full`
- Right: padded content:
  - Label: "K-Worship Institute란?"
  - Heading: "예배를 단순히 진행하는 것을 넘어, 예배를 이해하는 팀으로"
  - 3 feature rows: 📖 성경적 예배 신학 커리큘럼 / 🤖 AI 예배 코치 1:1 / 🏅 공식 K-Worship 배지
  - CTA: "지금 시작하기" → `/institute/courses`

#### Section 5 — Existing Dashboard Content (preserved)
All existing sections (greeting, continue-learning, AI coach, certifications carousel, course grid) remain below, inside the container wrapper. Copy updates:
- "자격증 과정" → "배지 과정"
- "자격증 스쿨" → "예배팀 온라인 훈련"
- "자격증" → "배지" (in stats, section headers, cert carousel cards)
- Cert carousel cards: show `cert.badge_name || cert.title_ko`

---

### Files Affected

| File | Action |
|------|--------|
| Database migration | `ALTER TABLE` — add `badge_name`, `badge_description` columns |
| `src/components/institute/AdminInstituteCertifications.tsx` | Edit — add badge_name/badge_description fields to type + form |
| `src/pages/InstituteCourses.tsx` | Edit — use badge_name in goal cards |
| `src/components/institute/ProfileBadgesSection.tsx` | Edit — display badge_name |
| `src/pages/Institute.tsx` | Edit — add 4 premium sections + copy updates + remove old hero card |

