

# 랜딩페이지 카피 및 여백 수정 계획

7개 항목을 5개 파일에 걸쳐 수정합니다.

---

## 1. Hero 소개 단락 교체 (`AtelierHero.tsx`)

Lines 167-174의 설명 텍스트를 새 카피로 교체:

```
아틀리에에서 예술가는 완성품만 만들지 않습니다.
그 공간에서 아이디어는 자라고, 과정은 쌓이며, 삶 자체가 작품이 됩니다.

Worship Atelier는 그런 공간입니다.
예배를 준비하는 곳이 아니라, 예배로 살아가는 여정을 함께하는 곳.
```

## 2. "Start Your Atelier" 위치 이동 (`AtelierHero.tsx`)

- Lines 156-163의 `Start Your Atelier`를 버튼 **위**로 이동
- `font-serif italic text-sm tracking-[0.2em] text-muted-foreground`로 스타일링

레이아웃 순서:
```
Start Your Atelier  (작고 이탤릭)
[내 공간 만들기]     (버튼)
소개 단락 텍스트
```

## 3. Pain Point 섹션 (`AtelierProblem.tsx`)

Line 20-22의 두 번째 문장을 교체:

기존: `예배는 따로 있고, 삶은 따로 있습니다`

신규:
```
주일엔 뜨겁게 예배하고,
월요일엔 다시 각자의 일상으로 흩어집니다.
```

## 4. 변환 화살표 섹션 (`AtelierSolution.tsx`)

Lines 3-7의 `rows` 데이터 변경:

```
삶 → 예배로
기록 → 창작으로
준비 → 흐름으로
```

## 5. Experience 3카드 (`AtelierExperience.tsx`)

Lines 4-23의 `steps` 배열 전면 교체:

| 아이콘 | 제목 | 영문 | 설명 |
|--------|------|------|------|
| Palette | 나만의 공간을 만들고 | Make it yours | BGM, 테마, 블록으로 나만의 예배 아틀리에를 꾸밉니다 |
| Layers | 예배 여정을 기록하고 | Build your flow | 찬양, 말씀, 묵상을 블록으로 담아 예배의 흐름을 만듭니다 |
| Heart | 이웃과 잇습니다 | Connect with neighbors | 예배하는 이웃의 아틀리에를 방문하고 함께 연결됩니다 |

## 6. 하단 CTA 섹션 (`AtelierCTA.tsx`)

- Line 27: 헤드라인 → `이제, 당신의 아틀리에를 시작하세요`
- Lines 46-50: 구분선 + K-Worship 서브텍스트 삭제

## 7. 전체 섹션 여백 축소 (모든 파일)

현재 → 변경:
- **AtelierHero**: `min-h-screen` 유지 (첫 화면이므로)
- **AtelierProblem**: `min-h-[60vh]` → `min-h-[36vh]`, `my-8` → `my-4`
- **AtelierSolution**: `min-h-[70vh]` → `min-h-[42vh]`, `space-y-10` → `space-y-6`
- **AtelierExperience**: `py-24 md:py-32` → `py-14 md:py-20`, `mb-16` → `mb-10`
- **AtelierCTA**: `py-24 md:py-32` → `py-14 md:py-20`

viewport margin 트리거 값은 유지하여 스크롤 애니메이션 타이밍 보존.

---

## 수정 파일 목록

1. `src/components/atelier-landing/AtelierHero.tsx`
2. `src/components/atelier-landing/AtelierProblem.tsx`
3. `src/components/atelier-landing/AtelierSolution.tsx`
4. `src/components/atelier-landing/AtelierExperience.tsx`
5. `src/components/atelier-landing/AtelierCTA.tsx`

