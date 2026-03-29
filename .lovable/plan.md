

# StudioHeader 로고 SVG 교체 + 2x 사이즈

## 변경 사항

1. **SVG 로고 복사**: `user-uploads://worship_atelier_horizontal_logo.svg` → `src/assets/worship-atelier-logo.svg`
2. **StudioHeader.tsx 수정**:
   - import를 `.png` → `.svg`로 변경
   - `h-7` (28px) → `h-14` (56px) — 현재 대비 2배

## 파일
| 파일 | 작업 |
|------|------|
| `src/assets/worship-atelier-logo.svg` | 새 SVG 복사 |
| `src/components/worship-studio/StudioHeader.tsx` | import 경로 + 높이 클래스 변경 |

