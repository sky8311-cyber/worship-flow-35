
# 푸터 사업자 정보 추가

## 목표
전자상거래법 준수를 위해 사이트 하단 푸터에 사업자 정보를 표시합니다.

## 변경 내용

### 파일: `src/components/landing/LandingFooter.tsx`

Bottom bar 영역(copyright 섹션)에 사업자 정보 블록을 추가합니다. 한국어/영어 양쪽 모두 표시:

**추가될 정보:**
- 법인명(상호): Goodpapa Inc.
- 대표자: Kwang Choi
- 사업자등록번호: 743833147
- 연락처: hello@goodpapa.org
- 소재지: #1250-329 Howe Street, Vancouver, BC V6C 3N2 Canada

**위치**: 기존 copyright 텍스트와 소셜 아이콘 사이, 또는 copyright 바로 아래에 사업자 정보 섹션을 추가합니다.

**레이아웃**:
```text
──────────────────────────────────────────
(c) 2026 Goodpapa Inc. All rights reserved.
K-Worship(TM) is a trademark of Goodpapa Inc.

법인명: Goodpapa Inc. | 대표: Kwang Choi
사업자등록번호: 743833147
소재지: #1250-329 Howe Street, Vancouver, BC V6C 3N2 Canada
연락처: hello@goodpapa.org
──────────────────────────────────────────
```

- 한국어 모드: 라벨을 한국어로 표시 (법인명, 대표자, 사업자등록번호, 소재지, 연락처)
- 영어 모드: 영어 라벨 (Company, CEO, Business Registration No., Address, Contact)
- 텍스트 스타일: 기존 copyright와 동일한 `text-sm text-primary-foreground/60`
- 연락처 이메일은 `mailto:` 링크로 처리

## 변경 범위
- 파일 1개 수정 (`LandingFooter.tsx`)
- 순수 UI 추가, 기존 기능에 영향 없음
