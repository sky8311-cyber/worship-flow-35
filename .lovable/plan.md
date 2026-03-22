

## 상단 네비게이션 아이콘 툴팁 추가

### 대상 아이콘 (AppHeader.tsx, line 106~170)

| 아이콘 | 위치 | 툴팁 (ko / en) |
|--------|------|----------------|
| `Menu` | 좌측 (모바일) | "메뉴" / "Menu" |
| `Home` | 좌측 (데스크탑) | "홈" / "Home" |
| `Heart` | 우측 | "즐겨찾기" / "Favorites" |
| `Music2` | 우측 | "내 곡" / "My Songs" |
| `Share2` | 우측 | "공유" / "Share" |
| `Bell` | 우측 | "알림" / "Notifications" |
| `Profile Avatar` | 우측 | "프로필" / "Profile" |

### 구현
**파일:** `src/components/layout/AppHeader.tsx`

- 각 `<Button variant="ghost" size="icon">` 을 `<Tooltip>` + `<TooltipTrigger asChild>` + `<TooltipContent>` 로 감싸기
- Bell은 Popover 안에 있으므로, PopoverTrigger 내부의 Button을 Tooltip으로 한 번 더 감쌈
- Profile DropdownMenu의 trigger도 동일하게 Tooltip 추가
- 언어에 따라 ko/en 문구 분기 (`language === "ko" ? "..." : "..."`)

### 수정 파일
1. `src/components/layout/AppHeader.tsx` — 7개 아이콘 버튼에 Tooltip 추가

