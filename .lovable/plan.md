

# 다른 커뮤니티 세트 배너 스타일 개선

## 현재 상태

현재 배너는 간단한 스타일로 구성되어 있습니다:

```text
┌──────────────────────────────────────────────┐
│ 🔒 다른 예배공동체의 공개된 예배세트 (읽기 전용) │
│    👁 조회수: 12회                              │
└──────────────────────────────────────────────┘

스타일: bg-accent/10, border-accent/30, rounded-lg
```

---

## 개선 방향

브랜드 그라디언트와 더 눈에 띄는 디자인으로 개선:

```text
┌─────────────────────────────────────────────────────────────────┐
│ ┌─────┐                                                         │
│ │ 🏛️ │  🌐 다른 예배공동체의 공개된 워십세트                     │
│ └─────┘  이 세트는 참고용으로 읽기 전용입니다                    │
│                                                                 │
│          ┌────────────────┐                                     │
│          │  👁 조회 12회   │                                     │
│          └────────────────┘                                     │
└─────────────────────────────────────────────────────────────────┘

스타일: 
- 그라디언트 배경 (primary → accent 방향)
- 아이콘 영역 분리
- 더 명확한 계층 구조
```

---

## 수정 파일

### src/pages/BandView.tsx

**변경 내용:**
- Lock 아이콘을 Globe 아이콘으로 변경 (더 친근한 느낌)
- 그라디언트 배경과 개선된 레이아웃 적용
- 서브텍스트 추가로 명확한 안내
- 조회수 뱃지 스타일 개선

**수정 전 (lines 558-574):**
```tsx
{isCrossCommunity && serviceSet?.status === 'published' && (
  <div className="mb-6 p-4 bg-accent/10 border border-accent/30 rounded-lg flex items-center gap-3">
    <Lock className="w-5 h-5 text-accent flex-shrink-0" />
    <div className="flex-1" style={{ wordBreak: "keep-all", overflowWrap: "break-word" }}>
      <p className="text-sm font-medium text-foreground">
        {t("songUsage.crossCommunityReadOnly")}
      </p>
      {serviceSet.view_count > 0 && (
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5" />
          {t("songUsage.viewCount")}: {serviceSet.view_count}{t("songUsage.times")}
        </p>
      )}
    </div>
  </div>
)}
```

**수정 후:**
```tsx
{isCrossCommunity && serviceSet?.status === 'published' && (
  <div className="mb-6 overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10">
    <div className="flex items-start gap-4 p-4">
      {/* 아이콘 영역 - 둥근 배경 */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
        <Globe className="w-5 h-5 text-primary" />
      </div>
      
      {/* 텍스트 영역 */}
      <div className="flex-1 min-w-0" style={{ wordBreak: "keep-all", overflowWrap: "break-word" }}>
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-foreground">
            {t("songUsage.crossCommunityTitle")}
          </h3>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary/30 text-primary">
            {t("songUsage.readOnly")}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("songUsage.crossCommunitySubtext")}
        </p>
        
        {/* 조회수 뱃지 */}
        {serviceSet.view_count > 0 && (
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/80 text-xs text-muted-foreground border border-border/50">
            <Eye className="w-3 h-3" />
            <span>{t("songUsage.viewCount")} {serviceSet.view_count}{t("songUsage.times")}</span>
          </div>
        )}
      </div>
    </div>
  </div>
)}
```

---

### src/lib/translations.ts

**추가할 번역 키:**

```typescript
// Korean
songUsage: {
  // 기존 키...
  crossCommunityReadOnly: "다른 예배공동체의 공개된 예배세트 (읽기 전용)",  // 기존
  crossCommunityTitle: "다른 예배공동체의 워십세트",  // 신규
  crossCommunitySubtext: "이 세트는 참고용으로만 열람할 수 있습니다",  // 신규
  readOnly: "읽기 전용",  // 신규
  viewCount: "조회",  // 수정 ("조회수" → "조회")
  // ...
}

// English
songUsage: {
  crossCommunityTitle: "Worship Set from Another Community",
  crossCommunitySubtext: "This set is available for reference only",
  readOnly: "Read-only",
  viewCount: "Views",
  // ...
}
```

---

## 추가 Import

```tsx
import { Globe } from "lucide-react";  // Lock 대신 Globe 추가
```

---

## 디자인 개선 포인트

| 요소 | 기존 | 개선 |
|------|------|------|
| 배경 | 단색 `bg-accent/10` | 그라디언트 `from-primary/10 to-accent/10` |
| 아이콘 | Lock (제한적 느낌) | Globe (열린 공유 느낌) |
| 레이아웃 | 수평 정렬 | 아이콘 원형 배경 + 계층적 텍스트 |
| 텍스트 | 단일 라인 | 제목 + 부제목 + 뱃지 |
| 조회수 | 일반 텍스트 | pill 형태 뱃지 |
| 테두리 | accent 색상 | primary 색상 (브랜드 통일) |

---

## 파일 변경 요약

| 파일 | 변경 내용 |
|------|----------|
| `src/pages/BandView.tsx` | 배너 UI 개선, Globe 아이콘 import |
| `src/lib/translations.ts` | 새 번역 키 추가 (crossCommunityTitle, crossCommunitySubtext, readOnly) |

