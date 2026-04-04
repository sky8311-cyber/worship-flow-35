

# 뉴스 섹션에 K-Mission Canada 기사 추가

## 요약
K-Mission Canada 사이트에 게시된 K-Worship 소개 기사를 `news_posts` 테이블에 새 레코드로 추가합니다.

## 추가할 데이터

| 필드 | 값 |
|------|-----|
| **title** | Where Does the Labor of Worship Preparation Go? |
| **title_ko** | 찬양을 준비하는 시간, 그 수고는 어디에 남는가? |
| **slug** | `kworship-feature-kmission-canada` |
| **category** | `press` |
| **external_url** | `https://www.kmissioncanada.ca/post/찬양을-준비하는-시간-그-수고는-어디에-남는가-2` |
| **excerpt** | K-Worship accumulates worship data from experienced worship leaders to pass on the flow and spirituality of Korean church worship to the next generation. |
| **excerpt_ko** | K-Worship은 숙달된 예배 인도자들이 실제 예배 현장에서 선택하는 찬양곡과 콘티를 데이터로 축적함으로써, 다음 세대 예배 인도자들에게 한국교회 예배의 흐름과 영성을 전수하는 것을 목표로 한다. |
| **content / content_ko** | 기사 본문 요약 |
| **is_published** | `true` |
| **published_at** | `now()` |

## 작업 내용
1. DB migration 도구로 `news_posts` 테이블에 INSERT 실행
2. 코드 변경 없음 — 기존 뉴스 컴포넌트가 자동으로 새 게시물을 표시

