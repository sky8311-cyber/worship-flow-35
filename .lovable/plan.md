
# K-Worship Favicon 문제 해결 - Web App Manifest 추가

## 문제 분석

스크린샷에서 K-Worship 바로가기 아이콘이 실제 아이콘 대신 빨간 배경의 "K" 글자로 표시되고 있습니다.

### 원인
Chrome/Android는 홈 화면 바로가기나 북마크 아이콘을 표시할 때 **Web App Manifest (`manifest.json`)**를 우선적으로 확인합니다. 현재 프로젝트에는:

- ✅ `kworship-icon.png` 파일 존재
- ✅ `index.html`에 favicon 링크 설정됨
- ✅ Apple touch icon 설정됨
- ❌ **`manifest.json` 파일 없음** ← 핵심 문제

manifest가 없으면 Chrome은 자동으로 사이트 이름의 첫 글자와 테마 색상을 사용해 아이콘을 생성합니다.

## 해결 방안

### 1. Web App Manifest 파일 생성

**파일:** `public/manifest.json`

```json
{
  "name": "K-Worship",
  "short_name": "K-Worship",
  "description": "예배팀을 위한 통합 플랫폼",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#8B5CF6",
  "icons": [
    {
      "src": "/kworship-icon.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/kworship-icon.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 2. index.html에 manifest 링크 추가

```html
<!-- Web App Manifest -->
<link rel="manifest" href="/manifest.json">
```

## 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `public/manifest.json` | 새 파일 생성 - Web App Manifest with icons 정의 |
| `index.html` | `<link rel="manifest">` 태그 추가 |

## 참고 사항

- manifest.json이 추가되면 Chrome은 지정된 아이콘을 사용합니다
- 기존 바로가기는 캐시로 인해 즉시 변경되지 않을 수 있음 - 바로가기를 삭제 후 다시 추가하면 새 아이콘이 표시됩니다
- 최적의 결과를 위해 192x192 및 512x512 크기의 별도 아이콘 파일을 사용하는 것이 권장되지만, 현재 `kworship-icon.png`로도 동작합니다

## 예상 결과

```text
수정 전:
┌─────────────┐
│      K      │ ← 자동 생성된 글자 아이콘
│  K-Worship  │
└─────────────┘

수정 후:
┌─────────────┐
│    🎵📱     │ ← 실제 kworship-icon.png 표시
│  K-Worship  │
└─────────────┘
```
