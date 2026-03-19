// K-Worship AI 설정 전역 규칙
// 이 프로젝트의 모든 AI 기능은 Anthropic API만 사용한다.
// Lovable AI Gateway, Gemini, OpenAI 사용 금지.
// model: 'claude-sonnet-4-20250514'
// endpoint: 'https://api.anthropic.com/v1/messages'
// auth: ANTHROPIC_API_KEY 환경변수

export const AI_CONFIG = {
  endpoint: 'https://api.anthropic.com/v1/messages',
  model: 'claude-sonnet-4-20250514',
  anthropicVersion: '2023-06-01',
} as const;
