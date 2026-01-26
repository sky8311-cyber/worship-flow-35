

# 티어/역할 시스템 정립 및 CRM/이메일 수신자 재구성 계획

## 현재 상황 분석

### 데이터 현황
| 분류 | 수치 | 설명 |
|------|------|------|
| 전체 가입자 | 196명 | 모두 `user` 역할 보유 |
| 예배인도자 | 95명 | `worship_leader` 역할 추가 보유 |
| 정회원 | 0명 | 프리미엄 구독자 없음 |
| 공동체 어카운트 | 1개 | church_accounts |
| 커뮤니티 참여자 | 78명 | community_members 테이블에 존재 |
| 미참여자 | 118명 | 가입 후 커뮤니티 미가입 |

### 문제점 발견
1. **CRM "15명 일반 멤버"의 정체**: `community_members.role = 'member'`인 사용자 (커뮤니티 내 역할)
   - 이 중 4명은 플랫폼 tier가 `worship_leader`
   - 11명은 플랫폼 tier가 `user` (팀멤버)
2. **용어 혼란**: "일반 멤버"가 플랫폼 티어인지 커뮤니티 역할인지 불명확
3. **118명 미활동 사용자**: 가입만 하고 커뮤니티 미가입

---

## 1단계: 명확한 역할/티어 체계 정립

### 플랫폼 티어 (Primary Authorization - user_roles 테이블)

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                         플랫폼 티어 계층 구조                               │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  TIER 4: 공동체 어카운트 (Worship Community Account)                  │  │
│  │  ─────────────────────────────────────────────────────────────────   │  │
│  │  • DB: church_accounts + church_account_members 테이블               │  │
│  │  • 모든 기능 사용 가능 (관리자 제외)                                  │  │
│  │  • 팀멤버도 결제 시 바로 이용 가능                                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                               ▲                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  TIER 3: 정회원 (Full Member)                                         │  │
│  │  ─────────────────────────────────────────────────────────────────   │  │
│  │  • DB: user_roles.role = 'worship_leader' + premium_subscriptions    │  │
│  │  • 프리미엄 기능 사용 가능                                            │  │
│  │  • 예배인도자 + 프리미엄 구독                                         │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                               ▲                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  TIER 2: 예배인도자 (Basic Member / Worship Leader)                   │  │
│  │  ─────────────────────────────────────────────────────────────────   │  │
│  │  • DB: user_roles.role = 'worship_leader'                            │  │
│  │  • 승급 신청 + 프로필 작성 후 자동 승인                               │  │
│  │  • 커뮤니티 생성/관리, 팀원 초대 가능                                 │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                               ▲                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  TIER 1: 팀멤버 (Team Member)                                         │  │
│  │  ─────────────────────────────────────────────────────────────────   │  │
│  │  • DB: user_roles.role = 'user'                                      │  │
│  │  • 모든 신규 가입자의 기본 역할                                       │  │
│  │  • 커뮤니티 초대/가입 가능, 예배 세트 열람                            │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 커뮤니티 역할 (Secondary Authorization - community_members 테이블)

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                      커뮤니티 내 역할 (2차 권한)                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  community_members.role 값:                                                │
│                                                                            │
│  ┌─────────────┐   ┌─────────────────┐   ┌─────────────┐                  │
│  │   owner     │ > │ community_leader │ > │   member    │                  │
│  │  (오너)     │   │   (리더)         │   │  (멤버)     │                  │
│  └─────────────┘   └─────────────────┘   └─────────────┘                  │
│        │                   │                    │                          │
│        ▼                   ▼                    ▼                          │
│  • 커뮤니티 삭제   • 세트 편집/삭제     • 피드 글 작성                     │
│  • 오너 권한 이전  • 멤버 관리          • 예배 세트 열람                   │
│  • 리더 지정      • 피드 글 작성       • RSVP 참여                         │
│  • 모든 리더 권한  • 일정 관리                                             │
│                                                                            │
│  ⚠️ 이 역할은 플랫폼 티어와 독립적!                                        │
│     팀멤버도 커뮤니티 리더가 될 수 있음                                    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 2단계: 승급 워크플로우 도표 (새 관리자 페이지)

### 새 페이지: `/admin/tier-workflow` (AdminTierWorkflow.tsx)

```text
┌────────────────────────────────────────────────────────────────────────────┐
│  🎯 사용자 승급 워크플로우                                                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│                      ┌─────────────────┐                                   │
│                      │   회원 가입     │                                   │
│                      │  (모든 사용자)  │                                   │
│                      └────────┬────────┘                                   │
│                               │                                            │
│                               ▼                                            │
│                      ┌─────────────────┐                                   │
│                      │    팀 멤버      │◄─────────────────┐                │
│                      │  (user role)    │                   │                │
│                      └────────┬────────┘                   │                │
│                               │                             │                │
│               ┌───────────────┼───────────────┐             │                │
│               │               │               │             │                │
│               ▼               │               ▼             │                │
│     ┌─────────────────┐       │      ┌─────────────────┐    │                │
│     │ 커뮤니티 초대    │       │      │  가입 신청      │    │                │
│     │ 링크 클릭       │       │      │ (검색 → 신청)   │    │                │
│     └────────┬────────┘       │      └────────┬────────┘    │                │
│              │                │               │             │                │
│              ▼                │               ▼             │                │
│     ┌─────────────────┐       │      ┌─────────────────┐    │                │
│     │   자동 가입      │       │      │  리더 승인 대기  │    │                │
│     └────────┬────────┘       │      └────────┬────────┘    │                │
│              │                │               │             │                │
│              └───────────────►│◄──────────────┘             │                │
│                               │                             │                │
│                               ▼                             │                │
│                      ┌─────────────────┐                    │                │
│                      │ 커뮤니티 멤버   │                    │                │
│                      │ (member 역할)   │                    │                │
│                      └────────┬────────┘                    │                │
│                               │                             │                │
│            ┌──────────────────┴──────────────────┐          │                │
│            │                                      │          │                │
│            ▼                                      ▼          │                │
│   ┌─────────────────┐                   ┌─────────────────┐  │                │
│   │ 예배인도자 승급  │                   │ 공동체 어카운트 │  │                │
│   │ 신청 (프로필 작성)│                   │ 결제           │  │                │
│   └────────┬────────┘                   └────────┬────────┘  │                │
│            │                                      │          │                │
│            ▼                                      ▼          │                │
│   ┌─────────────────┐                   ┌─────────────────┐  │                │
│   │   자동 승인      │                   │   최상위 티어   │  │                │
│   │ (worship_leader) │                   │   (church)      │──┘                │
│   └────────┬────────┘                   └─────────────────┘                  │
│            │                                                                 │
│            ├─────────────────────────────┐                                   │
│            │                             │                                   │
│            ▼                             ▼                                   │
│   ┌─────────────────┐           ┌─────────────────┐                          │
│   │ 커뮤니티 생성    │           │ 프리미엄 결제   │                          │
│   │ (오너 자동 부여) │           │ (정회원 전환)   │                          │
│   └─────────────────┘           └─────────────────┘                          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3단계: CRM 통계 수정

### 현재 문제점
- "Members (15명)"이 community_members.role='member'를 카운트
- 플랫폼 티어 기반 통계가 아님

### 수정 방안

**AdminCRM.tsx Stats Cards 재구성:**

| 기존 | 수정 후 | 설명 |
|------|---------|------|
| Worship Community Accounts | 공동체 어카운트 | 유지 (church_accounts) |
| Basic Members (95) | 예배인도자 (95) | user_roles.worship_leader |
| Communities | 커뮤니티 | 유지 |
| Team Members (15) | 팀멤버 (101) | user_roles.user - worship_leader 제외 |

**추가 통계:**
- 활성 팀멤버: 커뮤니티 가입한 팀멤버 (11명)
- 비활성 팀멤버: 커뮤니티 미가입 (90명)
- 커뮤니티 오너: 63명
- 커뮤니티 리더: 1명

---

## 4단계: 이메일 수신자 리스트 재구성

### 새로운 수신자 그룹 체계

```text
📋 수신자 선택
├── 👥 전체 사용자
│   └── 모든 가입자 (196명)
│
├── 🎫 플랫폼 티어별
│   ├── 팀멤버 (101명) - user role만 있는 사용자
│   ├── 예배인도자 (95명) - worship_leader role
│   ├── 정회원 (0명) - premium 구독 active
│   └── 공동체 어카운트 (1명) - church_account 소속
│
├── 📈 활동 상태별
│   ├── 활성 사용자 (7일 내 접속)
│   ├── 준활성 (7-30일 미접속)
│   ├── 비활성 (30일+ 미접속)
│   └── 신규 가입자 (7일 내 가입)
│
├── 🏠 커뮤니티 참여 상태별
│   ├── 커뮤니티 참여중 (78명)
│   ├── 커뮤니티 미참여 (118명) ← 중요 타겟!
│   ├── 커뮤니티 오너 (63명)
│   ├── 커뮤니티 리더 (1명)
│   └── 커뮤니티 일반 멤버 (15명)
│
├── 🎯 특정 활동별
│   ├── 예배 세트 생성자 (44명)
│   ├── 예배 세트 미생성자
│   ├── 게시글 작성자
│   └── 승급 신청 대기자 (6명)
│
└── 🏢 특정 커뮤니티
    └── [커뮤니티 선택 드롭다운]
```

---

## 5단계: 데이터베이스 변경

### RPC 함수 생성

```sql
-- 플랫폼 티어별 사용자 조회 함수
CREATE OR REPLACE FUNCTION get_users_by_platform_tier(tier_type TEXT)
RETURNS TABLE (user_id UUID, email TEXT, full_name TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  CASE tier_type
    -- 팀멤버: user role만 있고 worship_leader role이 없는 사용자
    WHEN 'team_member' THEN
      RETURN QUERY 
      SELECT p.id, p.email, p.full_name FROM profiles p
      JOIN user_roles ur ON ur.user_id = p.id AND ur.role = 'user'
      WHERE NOT EXISTS (
        SELECT 1 FROM user_roles ur2 
        WHERE ur2.user_id = p.id AND ur2.role = 'worship_leader'
      ) AND p.email IS NOT NULL;
    
    -- 예배인도자: worship_leader role 있는 사용자
    WHEN 'worship_leader' THEN
      RETURN QUERY 
      SELECT p.id, p.email, p.full_name FROM profiles p
      JOIN user_roles ur ON ur.user_id = p.id AND ur.role = 'worship_leader'
      WHERE p.email IS NOT NULL;
    
    -- 정회원: worship_leader + premium subscription active
    WHEN 'full_member' THEN
      RETURN QUERY 
      SELECT p.id, p.email, p.full_name FROM profiles p
      JOIN user_roles ur ON ur.user_id = p.id AND ur.role = 'worship_leader'
      JOIN premium_subscriptions ps ON ps.user_id = p.id 
        AND ps.subscription_status = 'active'
      WHERE p.email IS NOT NULL;
    
    -- 공동체 어카운트 멤버
    WHEN 'church_account' THEN
      RETURN QUERY 
      SELECT DISTINCT p.id, p.email, p.full_name FROM profiles p
      JOIN church_account_members cam ON cam.user_id = p.id
      WHERE p.email IS NOT NULL;
  END CASE;
END;
$$;

-- 커뮤니티 참여 상태별 사용자 조회
CREATE OR REPLACE FUNCTION get_users_by_community_status(status_type TEXT)
RETURNS TABLE (user_id UUID, email TEXT, full_name TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  CASE status_type
    -- 커뮤니티 참여중
    WHEN 'in_community' THEN
      RETURN QUERY 
      SELECT DISTINCT p.id, p.email, p.full_name FROM profiles p
      JOIN community_members cm ON cm.user_id = p.id
      WHERE p.email IS NOT NULL;
    
    -- 커뮤니티 미참여
    WHEN 'not_in_community' THEN
      RETURN QUERY 
      SELECT p.id, p.email, p.full_name FROM profiles p
      WHERE NOT EXISTS (
        SELECT 1 FROM community_members cm WHERE cm.user_id = p.id
      ) AND p.email IS NOT NULL;
    
    -- 커뮤니티 오너
    WHEN 'community_owner' THEN
      RETURN QUERY 
      SELECT DISTINCT p.id, p.email, p.full_name FROM profiles p
      JOIN community_members cm ON cm.user_id = p.id AND cm.role = 'owner'
      WHERE p.email IS NOT NULL;
    
    -- 커뮤니티 리더
    WHEN 'community_leader' THEN
      RETURN QUERY 
      SELECT DISTINCT p.id, p.email, p.full_name FROM profiles p
      JOIN community_members cm ON cm.user_id = p.id AND cm.role = 'community_leader'
      WHERE p.email IS NOT NULL;
  END CASE;
END;
$$;
```

---

## 6단계: 파일 변경 목록

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `src/pages/AdminTierWorkflow.tsx` | **새로 생성** | 티어/역할 워크플로우 시각화 페이지 |
| `src/pages/AdminTierGuide.tsx` | 수정 | 워크플로우 페이지 링크 추가, 용어 정리 |
| `src/pages/AdminCRM.tsx` | 수정 | 통계 카드 재구성 (플랫폼 티어 기반) |
| `src/components/admin/email/EmailComposer.tsx` | 수정 | 수신자 그룹 계층 UI 재구성 |
| `src/hooks/useTierFeature.ts` | 수정 | 명확한 tier 설명 추가 |
| `src/lib/navigationConfig.ts` | 수정 | 관리자 메뉴에 워크플로우 페이지 추가 |
| `src/App.tsx` | 수정 | 새 라우트 추가 |
| DB 마이그레이션 | **새로 생성** | RPC 함수 + email_sender_settings 테이블 |

---

## 7단계: UI 개선 - 워크플로우 페이지 디자인

### AdminTierWorkflow.tsx 구성

1. **상단 개요 카드**: 현재 티어별 사용자 수 실시간 표시
2. **인터랙티브 다이어그램**: 승급 흐름을 클릭 가능한 노드로 표현
3. **권한 매트릭스 테이블**: 각 티어/역할별 사용 가능 기능 체크리스트
4. **용어 사전**: 혼란스러운 용어에 대한 명확한 정의

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  👑 티어 & 역할 워크플로우                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   팀멤버    │ │  예배인도자  │ │   정회원    │ │ 공동체계정  │           │
│  │    101      │ │     95      │ │     0       │ │     1       │           │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    [Interactive Workflow Diagram]                      │  │
│  │                                                                        │  │
│  │   회원가입 ──► 팀멤버 ──► 예배인도자 신청 ──► 자동승인               │  │
│  │                 │              │                   │                   │  │
│  │                 ▼              │                   ▼                   │  │
│  │         커뮤니티 가입          │            커뮤니티 생성              │  │
│  │                 │              │                   │                   │  │
│  │                 ▼              │                   ▼                   │  │
│  │           멤버 역할            │       오너 역할 (자동 부여)           │  │
│  │                                │                                       │  │
│  │                                ▼                                       │  │
│  │                         프리미엄 결제 ──► 정회원                      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  📊 권한 매트릭스                                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 기능                   │ 팀멤버 │ 예배인도자 │ 정회원 │ 공동체계정     │  │
│  ├───────────────────────────────────────────────────────────────────────┤  │
│  │ 예배 세트 열람          │   ✓   │     ✓      │   ✓   │      ✓       │  │
│  │ 커뮤니티 생성           │   ✗   │     ✓      │   ✓   │      ✓       │  │
│  │ 곡 추가/편집            │   ✗   │     ✓      │   ✓   │      ✓       │  │
│  │ AI 기능                │   ✗   │     ✗      │   ✓   │      ✓       │  │
│  │ 팀 관리                │   ✗   │     ✗      │   ✗   │      ✓       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 예상 결과

1. **명확한 용어 체계**: 플랫폼 티어 vs 커뮤니티 역할 구분
2. **정확한 CRM 통계**: 101명 팀멤버, 95명 예배인도자로 수정
3. **타겟팅 이메일**: 118명 커뮤니티 미가입자에게 리마인더 가능
4. **관리자 가이드**: 워크플로우 페이지로 온보딩 이해도 향상

