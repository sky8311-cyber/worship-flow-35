

## Seed tier_features Table

### Schema Reality Check
The `tier_features` table does NOT have a `min_tier` integer column. It uses four boolean columns: `tier_member`, `tier_worship_leader`, `tier_premium`, `tier_church`. The `useTierFeature()` hook checks the boolean matching the user's tier level — so a feature available at tier 2 (premium) means `tier_premium = true` AND `tier_church = true` (higher tiers inherit access).

Required columns per row: `feature_key`, `feature_name`, `category`, `tier_member`, `tier_worship_leader`, `tier_premium`, `tier_church`, `is_active`, `display_order`.

### Mapping (min_tier → booleans, cumulative upward)

| feature_key | min_tier | member | wl | premium | church |
|---|---|---|---|---|---|
| studio_comment | 1 | false | true | true | true |
| studio_publish | 2 | false | false | true | true |
| ai_set_builder | 2 | false | false | true | true |
| institute_browse | 1 | false | true | true | true |
| institute_enroll_free | 1 | false | true | true | true |
| institute_full_access | 2 | false | false | true | true |
| institute_ai_coach | 2 | false | false | true | true |
| institute_badge | 2 | false | false | true | true |
| team_rotation | 3 | false | false | false | true |
| community_branding | 3 | false | false | false | true |

### Verification
For `ai_set_builder`: `tier_worship_leader = false`, `tier_premium = true`. So `hasFeature('ai_set_builder')` returns `false` for a worship_leader user and `true` for a premium user. Confirmed correct.

### Implementation
Single SQL migration inserting 10 rows with appropriate `feature_name`, `category`, and `display_order` values. No code changes needed — `useTierFeature()` and `FeatureGate` will start working immediately once the data exists.

Categories will be assigned logically: `ai` for AI features, `management` for community management features, matching the `CATEGORY_CONFIG` in `AdminFeatures.tsx`.

