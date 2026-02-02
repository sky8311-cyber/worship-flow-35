

# Add 세계투데이 Press Article to News Page

## Article Details

**Source**: 세계투데이 (Segye Today)
**URL**: https://segyetoday.com/news/newsview.php?ncode=1065585660860632
**Published**: January 15, 2026
**Author**: 노승빈 기자

---

## Content Summary

**Korean Title**: 찬양 준비의 영성, 데이터로 남다… 예배 인도자 플랫폼 'K-Worship' 공식 런칭

**English Title**: K-Worship Platform Officially Launches: Preserving the Spirituality of Worship Preparation Through Data

**Key Points**:
- Transforms worship preparation into lasting ministry assets
- Preserves Korean church's unique worship flow and spirituality
- Korean-English bilingual support optimized for Korean diaspora and multicultural ministry
- Web service officially open, mobile app coming soon

---

## Implementation

Insert a new record into the `news_posts` table with:

| Field | Value |
|-------|-------|
| `title` | K-Worship Platform Officially Launches |
| `title_ko` | 찬양 준비의 영성, 데이터로 남다… 예배 인도자 플랫폼 'K-Worship' 공식 런칭 |
| `slug` | kworship-launch-segye-today |
| `content` | Full article summary (for RSS feed) |
| `content_ko` | Full Korean article text |
| `excerpt` | Worship leader platform K-Worship launches, preserving the spirituality of worship preparation through data |
| `excerpt_ko` | 흩어지는 예배 고민을 사역의 자산으로, 한국 교회 특유의 예배 흐름과 영성 보존 |
| `category` | press |
| `external_url` | https://segyetoday.com/news/newsview.php?ncode=1065585660860632 |
| `is_published` | true |
| `published_at` | 2026-01-15 13:01:21 |

---

## Database Action

Execute an INSERT statement to add this press article to the news system. The article will:
- Appear on the /news page with "보도자료" (Press) badge
- Link externally to the original 세계투데이 article when clicked
- Be included in the RSS feed
- Display in the LandingNews section if among the latest 3 posts

