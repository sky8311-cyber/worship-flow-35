-- Insert missing milestones with is_visible = false
INSERT INTO public.platform_milestones (event_date, title_ko, title_en, description_ko, description_en, category, is_visible, sort_order)
VALUES
  ('2025-11-20', '곡 라이브러리 시스템', 'Song Library System', '찬양곡 관리를 위한 라이브러리 시스템 구축', 'Built library system for worship song management', 'feature', false, 100),
  ('2025-11-25', '예배세트 빌더', 'Worship Set Builder', '예배 순서를 구성하는 세트 빌더 기능 개발', 'Developed set builder for worship service planning', 'feature', false, 99),
  ('2025-12-01', '베타 테스트 시작', 'Beta Test Launch', '초기 사용자들과 함께 베타 테스트 시작', 'Started beta testing with early users', 'launch', false, 98),
  ('2025-12-10', '멀티 공동체 지원', 'Multi-Community Support', '여러 공동체 참여 및 관리 기능', 'Support for joining and managing multiple communities', 'feature', false, 97),
  ('2025-12-15', '협업자 초대 시스템', 'Collaborator Invitation System', '예배세트에 협업자 초대 기능 구현', 'Implemented collaborator invitation for worship sets', 'feature', false, 96),
  ('2025-12-20', '악보/참조시트 업로드', 'Score & Reference Sheet Upload', '곡별 악보 및 참조 시트 업로드 기능', 'Upload scores and reference sheets for songs', 'feature', false, 95),
  ('2025-12-26', '플랫폼 기능 플래그', 'Platform Feature Flags', '관리자용 기능 플래그 시스템 도입', 'Introduced feature flag system for admins', 'feature', false, 94),
  ('2025-12-29', '소셜 피드 & 뉴스피드', 'Social Feed & Newsfeed', '공동체 소셜 피드 및 뉴스피드 기능', 'Community social feed and newsfeed features', 'feature', false, 93),
  ('2025-12-30', '알림 시스템', 'Notification System', '실시간 알림 시스템 구현', 'Implemented real-time notification system', 'feature', false, 92),
  ('2026-01-02', '다국어 지원 (한/영)', 'Bilingual Support (KO/EN)', '한국어와 영어 다국어 지원', 'Korean and English bilingual support', 'feature', false, 91),
  ('2026-01-05', 'CSV 가져오기', 'CSV Import', '예배세트 CSV 가져오기 기능', 'CSV import for worship sets', 'feature', false, 90);