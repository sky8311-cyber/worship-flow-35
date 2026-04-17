
User reports `/login` is blank. Console/network show the page actually loads (page_analytics POST for `/login` succeeded, title set, session replay shows form interaction). User is already authenticated (valid JWT, daily_login reward call). Likely cause: when an authenticated user hits `/login`, the page renders but something during render throws or the redirect logic leaves a blank state.

Let me investigate Login.tsx — it doesn't currently redirect authenticated users away. But that shouldn't cause blank. Need to check actual render path.
