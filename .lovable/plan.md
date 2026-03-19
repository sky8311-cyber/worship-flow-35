## AI Set Builder v2 — Korean Worship Curation Overhaul

### Completed
1. **New table**: `user_curation_profiles` (user_id PK, skills_summary, congregation_notes) with RLS
2. **Edge function rewrite**: New SKILLS_MD with Korean worship arc philosophy, fetches user profile + recent community patterns from `service_sets`/`set_songs`, includes truncated lyrics, outputs role/tempo fields
3. **UI update**: Result cards show role badges (마음열기/선포/고백/경배) and tempo badges (느림/보통/빠름) with color coding
