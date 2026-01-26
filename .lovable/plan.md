

# 자동 발송 기록 페이지네이션 및 전체 표시 개선

## 현재 문제점

1. **데이터 조회 제한**: `automated_email_log` 쿼리에서 100개만 가져옴
2. **날짜별 10개 제한**: 각 날짜 그룹에서 `dateLogs.slice(0, 10)`으로 10개만 표시
3. **페이지네이션 없음**: 전체 기록을 볼 수 없음

## 수정 계획

### 1. 페이지네이션 구현

| 항목 | 현재 | 변경 |
|------|------|------|
| 조회 제한 | `.limit(100)` | 페이지당 50개 + 페이지네이션 |
| 날짜별 제한 | `slice(0, 10)` | 전체 표시 + "더보기" 버튼 |
| 총 개수 표시 | 없음 | 상단에 총 발송 건수 표시 |

### 2. UI 변경

```text
┌──────────────────────────────────────────────────────────┐
│  자동 발송 기록                        [전체 ▼] 총 52건 │
├──────────────────────────────────────────────────────────┤
│  2026년 1월 26일 (42건)                                  │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 시간      유형         수신자              상태    │  │
│  │ 06:49:52  워십세트     김양우              ✓       │  │
│  │ 06:49:51  워십세트     신예지              ✓       │  │
│  │ ...                                                │  │
│  │ 06:49:23  워십세트     Sb                  ✓       │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│              [ ◀ ] 1 / 2 [ ▶ ]                           │
└──────────────────────────────────────────────────────────┘
```

### 3. 코드 변경

```typescript
// 1. 페이지네이션 상태 추가
const [automatedPage, setAutomatedPage] = useState(1);
const ITEMS_PER_PAGE = 50;

// 2. 총 개수 조회 쿼리 추가
const { data: automatedLogsCount } = useQuery({
  queryKey: ["automated-email-log-count"],
  queryFn: async () => {
    const { count, error } = await supabase
      .from("automated_email_log")
      .select("*", { count: "exact", head: true });
    if (error) throw error;
    return count || 0;
  },
});

// 3. 페이지네이션 적용 쿼리
const { data: automatedLogs = [] } = useQuery({
  queryKey: ["automated-email-log", automatedPage],
  queryFn: async () => {
    const from = (automatedPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
    
    const { data, error } = await supabase
      .from("automated_email_log")
      .select("*")
      .order("sent_at", { ascending: false })
      .range(from, to);
    if (error) throw error;
    return data;
  },
});

// 4. 날짜별 전체 표시 (slice 제거)
{dateLogs.map((log) => { ... })}

// 5. 페이지네이션 UI 추가
<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious 
        onClick={() => setAutomatedPage(p => Math.max(1, p - 1))}
        className={automatedPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
      />
    </PaginationItem>
    <PaginationItem>
      <span className="px-4">{automatedPage} / {totalPages}</span>
    </PaginationItem>
    <PaginationItem>
      <PaginationNext 
        onClick={() => setAutomatedPage(p => Math.min(totalPages, p + 1))}
        className={automatedPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
      />
    </PaginationItem>
  </PaginationContent>
</Pagination>
```

---

## 파일 변경 목록

| 파일 | 변경 내용 |
|------|----------|
| `src/components/admin/email/EmailLogs.tsx` | 페이지네이션 상태/쿼리 추가, slice 제거, 총 개수 표시, 페이지 네비게이션 UI |

---

## 예상 결과

1. **전체 기록 조회 가능**: 페이지 이동으로 모든 발송 기록 확인
2. **날짜별 전체 표시**: 각 날짜의 모든 발송 내역 표시
3. **총 개수 표시**: 상단에 "총 52건" 등 전체 발송 건수 확인
4. **페이지당 50건**: 적절한 데이터 로딩으로 성능 유지

