

# 데모 페이지 저작권 노출 위험 대응 방안

## 현재 위험 분석

데모 페이지가 다음과 같이 **최대한 SEO 노출**되도록 설계되어 있음:

```text
노출 경로:
├── sitemap.xml → /demo (priority 0.8)
├── JSON-LD → ItemList + MusicComposition (곡명, 아티스트, 키)
├── <noscript> → 100곡 전체 HTML 리스트 (크롤러용)
├── song_scores 쿼리 → 악보 이미지 URL 직접 노출
└── SongCard → 악보 미리보기 이미지 + ScorePreviewDialog
```

**핵심 문제**: 곡 제목/아티스트가 검색엔진에 인덱싱되는 것 자체는 큰 문제가 아님. **악보(score) 이미지가 로그인 없이 접근 가능**한 것이 저작권 위반 소지의 핵심.

---

## 제안 방안: 2단계 접근

### Phase 1 — 즉시 조치 (악보 노출 차단)

| 변경 | 설명 |
|---|---|
| **데모에서 악보 제거** | `song_scores` 조인 제거, `score_file_url`을 항상 `null`로 설정 |
| **SongCard 데모 모드** | 악보 미리보기/보기 버튼 숨김, 클릭 시 가입 CTA 표시 |
| **JSON-LD에서 MusicComposition 제거** | 개별 곡 스키마를 제거하고 단순 ItemList만 유지 (곡명만, 아티스트 제거) |
| **noscript 블록 제거** | 크롤러용 100곡 HTML 리스트 완전 삭제 |

### Phase 2 — SEO 재조정

| 변경 | 설명 |
|---|---|
| **sitemap에서 /demo 우선순위 하향** | `priority: 0.8` → `0.4`, `changefreq: weekly` → `monthly` |
| **SEO 메타 키워드 정리** | "worship songs", "찬양곡 검색" 등 콘텐츠 제공자처럼 보이는 키워드 제거 |
| **SEO description 변경** | "100곡 이상의 찬양곡" → "예배 준비 도구를 체험해보세요" (도구 강조) |
| **Edge Function sitemap도 동일 적용** | `supabase/functions/sitemap/index.ts`에서 demo priority 조정 |

---

## 변경 대상 파일 (6개)

| 파일 | 변경 내용 |
|---|---|
| `src/pages/Demo.tsx` | song_scores 조인 제거, JSON-LD 단순화, noscript 삭제, SEO meta 변경 |
| `src/components/SongCard.tsx` | `isDemo` prop 추가 → 악보 관련 UI 숨김 |
| `public/sitemap.xml` | /demo priority 0.4로 하향 |
| `supabase/functions/sitemap/index.ts` | demo priority 0.4로 하향 |
| `src/components/demo/DemoSignupCTA.tsx` | 악보 보기 시도 시 표시할 메시지 추가 |
| `public/robots.txt` | 변경 없음 (demo 자체는 접근 허용 유지) |

## 결과

- ✅ 곡 제목 검색은 가능 (SEO 유지, 단 도구 중심 포지셔닝)
- ✅ 악보 이미지는 **로그인 후에만** 접근 가능
- ✅ 크롤러가 개별 곡 메타데이터를 수집할 수 없음
- ✅ 데모는 "도구 체험"으로 포지셔닝

