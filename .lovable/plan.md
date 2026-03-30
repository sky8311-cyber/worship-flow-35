

# `/studio` → `/atelier` URL 변경

## 변경 범위

모든 `/studio` 경로를 `/atelier`로 변경하고, 기존 `/studio` URL은 redirect로 유지하여 링크 깨짐 방지.

## 수정 파일 목록

### 1. `src/App.tsx` — 라우트 정의
- `/atelier`, `/atelier/:roomId`, `/atelier/canvas/:canvasId`를 primary 라우트로 설정
- 기존 `/studio`, `/studio/:roomId`, `/studio/canvas/:canvasId`는 `<Navigate to="/atelier..." replace />`로 redirect 추가
- `/admin/studio`는 관리자 내부 경로이므로 그대로 유지 (또는 `/admin/atelier`로 변경 — 어느 쪽이든 영향 없음)

### 2. `src/lib/navigationConfig.ts` — 하단 탭 네비게이션
- `to: "/studio"` → `to: "/atelier"`
- `match` 함수도 `path.includes("/atelier")` 로 변경

### 3. `src/pages/WorshipStudio.tsx` — `history.replaceState` URL
- `'/studio/${studioId}'` → `'/atelier/${studioId}'`
- `'/studio'` → `'/atelier'`

### 4. `src/pages/CanvasEditor.tsx` — 뒤로가기 navigate
- `navigate("/studio")` → `navigate("/atelier")`

### 5. `src/hooks/useCanvas.ts` — 발행 후 navigate
- `navigate("/studio")` → `navigate("/atelier")`

### 6. `src/components/admin/AdminNav.tsx` — 관리자 탭
- `to: "/admin/studio"` → 유지하거나 `/admin/atelier`로 변경

### 7. `public/_redirects` — Netlify redirect 규칙 추가
```
/studio/* /atelier/:splat 301
/studio /atelier 301
```

이 방식으로 외부에 공유된 기존 `/studio/...` 링크도 자동으로 `/atelier/...`로 리디렉션됩니다.

