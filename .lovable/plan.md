

# K-Worship OG 이미지 생성 (1200x630)

## 목표
소셜 미디어 공유용 1200x630 OG 이미지를 K-Worship 브랜드 컬러와 아이덴티티로 생성

## 디자인 방향
- **배경**: Brand Blue (#2b4b8a) → Coral (#d16265) 그라데이션
- **로고/아이콘**: 기존 `kworship-icon.png` 활용
- **텍스트**: "K-Worship" 타이틀 + "예배팀을 위한 통합 플랫폼" 서브타이틀
- **크기**: 1200x630px (OG 표준)

## 구현
1. Python (Pillow)으로 그라데이션 배경 + 텍스트 + 아이콘 합성
2. `/mnt/documents/og-image.png`로 저장
3. QA 검수 후 전달

## 변경 파일
코드베이스 변경 없음 — 이미지 파일만 생성

