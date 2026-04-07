import { useState, useMemo, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { PublicPageHeader } from "@/components/landing/PublicPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Mail, HelpCircle, Rocket, Users, Music, Share2, UserCheck, Globe, Maximize2, LayoutList, Heart, Eye, RefreshCw, Printer, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { SEOHead } from "@/components/seo/SEOHead";

// FAQ anchor IDs mapped by index (same order for both languages)
const FAQ_ANCHORS = [
  "getting-started",
  "worship-leader",
  "community",
  "worship-set",
  "add-song",
  "share",
  "roles",
  "language",
  "fullscreen",
  "band-view",
  "favorites",
  "templates",
  "recurring-templates",
  "print",
];

const Help = () => {
  const { language } = useTranslation();
  const { user } = useAuth();
  const [showEmail, setShowEmail] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | undefined>(undefined);

  // Handle URL hash deep-linking to FAQ items
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      const anchorIndex = FAQ_ANCHORS.indexOf(hash);
      if (anchorIndex !== -1) {
        setOpenAccordion(`item-${anchorIndex}`);
        // Scroll to the item after a short delay for render
        setTimeout(() => {
          const el = document.getElementById(`faq-${hash}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 300);
      }
    }
  }, []);

  const faqItems = language === "ko" ? [
    {
      icon: Rocket,
      question: "처음 시작하려면 어떻게 하나요?",
      answer: `K-Worship에 오신 것을 환영합니다! 처음 사용하시는 분들을 위한 시작 가이드입니다.

📱 첫 단계:
1. 회원가입 후 로그인합니다
2. 프로필 설정에서 이름과 프로필 사진을 설정합니다
3. 하단 네비게이션을 통해 주요 기능에 접근합니다

🎯 주요 기능 소개:
• 곡 라이브러리: 찬양곡 검색 및 참고 자료 확인
• 워십세트: 예배 콘티(세트리스트) 작성
• 커뮤니티: 찬양팀과 소통하는 공간
• 채팅: 팀원들과 실시간 대화

💡 팁:
일반 사용자는 게시된 콘티 열람이 가능하고, 콘티를 직접 작성하려면 '워십리더' 권한이 필요합니다. 프로필 메뉴에서 워십리더 신청을 할 수 있습니다.`
    },
    {
      icon: UserCheck,
      question: "워십리더가 되려면 어떻게 하나요?",
      answer: `워십리더는 K-Worship에서 콘티(워십세트)와 커뮤니티를 생성할 수 있는 특별한 역할입니다.

📋 신청 방법:
1. 우측 상단의 프로필 아바타를 클릭합니다
2. 드롭다운 메뉴에서 '워십리더 신청'을 선택합니다
3. 신청 양식에 다음 정보를 입력합니다:
   • 교회/단체 이름 (예: ○○교회)
   • 교회 웹사이트 또는 SNS 주소
   • 사역 포지션 (예: 찬양인도자, 반주자)
   • 사역 경력 (년 단위)
   • 자기소개 (사역 경험과 열정을 간략히)
4. '신청하기' 버튼을 클릭합니다

⏱️ 승인 과정:
• 관리자가 신청 내용을 검토합니다 (보통 1-2일 소요)
• 승인되면 알림으로 안내가 옵니다
• 반려 시에도 사유와 함께 안내됩니다

✅ 승인 후 가능한 기능:
• 워십세트(콘티) 생성 및 관리
• 커뮤니티 생성 (자동으로 오너가 됩니다)
• 곡 라이브러리에 새 곡 추가
• 팀원 초대 및 관리`
    },
    {
      icon: Users,
      question: "커뮤니티는 어떻게 만드나요?",
      answer: `커뮤니티는 찬양팀이 함께 소통하고 콘티를 공유하는 그룹 공간입니다.

📋 생성 조건:
• 워십리더 권한이 필요합니다
• 권한이 없다면 먼저 '워십리더 신청'을 해주세요

🏗️ 커뮤니티 만들기:
1. 하단 네비게이션에서 '커뮤니티' 탭을 선택합니다
2. 우측 상단의 '+' 버튼을 클릭합니다
3. 커뮤니티 정보를 입력합니다:
   • 커뮤니티 이름 (예: ○○교회 청년부 찬양팀)
   • 설명 (선택사항)
   • 프로필 이미지 (선택사항)
4. '만들기' 버튼을 클릭합니다

👥 멤버 초대하기:
• 커뮤니티 설정에서 '초대 링크'를 복사합니다
• 카카오톡, 문자 등으로 팀원에게 링크를 공유합니다
• 링크를 받은 사람이 가입하면 자동으로 멤버로 추가됩니다

📊 역할 관리:
• 오너: 커뮤니티 생성자, 모든 권한 보유
• 리더: 콘티 관리, 멤버 관리 가능
• 멤버: 콘티 열람, 피드 참여 가능`
    },
    {
      icon: LayoutList,
      question: "워십세트(콘티)는 어떻게 만드나요?",
      answer: `워십세트는 예배에서 사용할 곡 목록과 순서를 정리한 콘티입니다.

📋 생성 조건:
• 워십리더 권한이 필요합니다

🎵 콘티 만들기:
1. 하단 네비게이션에서 '워십세트' 탭을 선택합니다
2. '새로 만들기' 버튼을 클릭합니다
3. 기본 정보를 입력합니다:
   • 예배 날짜
   • 예배 이름 (예: 주일 1부 예배)
   • 예배 인도자
   • 소속 커뮤니티 (선택)
4. 곡 추가: '곡 추가' 버튼을 눌러 라이브러리에서 곡을 선택합니다
5. 순서 조정: 드래그 앤 드롭으로 곡 순서를 변경합니다
6. 키 변경: 각 곡의 키를 팀에 맞게 조정할 수 있습니다

💾 저장 방식:
• '저장': 작성 중(Draft) 상태로 저장됩니다
• '게시': 팀원들이 볼 수 있도록 게시됩니다

📝 추가 기능:
• 각 곡에 메모 추가 가능
• 예배 전체 흐름 노트 작성
• 성경 구절 참조 추가`
    },
    {
      icon: Music,
      question: "곡은 어떻게 추가하나요?",
      answer: `곡 라이브러리에서 원하는 곡을 찾아 콘티에 추가할 수 있습니다.

🔍 곡 검색하기:
1. 하단 네비게이션에서 '곡' 탭을 선택합니다
2. 상단 검색창에 곡 제목이나 아티스트를 입력합니다
3. 카테고리나 태그로 필터링할 수 있습니다

🛒 장바구니 사용하기:
1. 원하는 곡을 찾았다면 장바구니 아이콘(🛒)을 클릭합니다
2. 여러 곡을 담을 수 있습니다
3. 장바구니 버튼을 클릭하면 담은 곡 목록을 볼 수 있습니다

📋 콘티에 추가하기:
1. 워십세트 편집 화면으로 이동합니다
2. '장바구니에서 추가' 버튼을 클릭합니다
3. 추가할 곡을 선택합니다
4. 곡이 콘티에 추가됩니다

💡 팁:
• 즐겨찾기(♥)를 사용해 자주 쓰는 곡을 저장하세요
• 곡 상세페이지에서 참고 자료, 가사, 유튜브 링크를 확인할 수 있습니다
• 워십리더는 새 곡을 직접 추가할 수 있습니다`
    },
    {
      icon: Share2,
      question: "밴드 멤버에게 콘티를 공유하려면?",
      answer: `완성된 콘티는 여러 방법으로 팀원들과 공유할 수 있습니다.

📤 커뮤니티 내 공유 (기본):
1. 콘티를 '게시' 상태로 변경합니다
2. 해당 커뮤니티에 소속된 모든 멤버가 볼 수 있습니다
3. 커뮤니티 피드에 자동으로 알림이 전송됩니다

🔗 외부 링크 공유:
1. 게시된 콘티에서 '공유' 버튼(🔗)을 클릭합니다
2. '공유 링크 생성'을 활성화합니다
3. 생성된 링크를 복사합니다
4. 카카오톡, 문자, 이메일 등으로 전송합니다

📱 링크로 접속하면:
• 로그인 없이도 콘티 열람 가능 (밴드뷰)
• 곡 목록, 키, 참고 자료 등 모든 정보 확인
• 참고 자료 전체화면 보기 지원

🔒 공유 관리:
• 언제든 공유 링크를 비활성화할 수 있습니다
• 비활성화하면 해당 링크로 더 이상 접근할 수 없습니다`
    },
    {
      icon: Users,
      question: "커뮤니티 역할(오너/리더/멤버)의 차이는 무엇인가요?",
      answer: `커뮤니티에는 세 가지 역할이 있으며, 각각 다른 권한을 가집니다.

👑 오너 (Owner):
• 커뮤니티 생성자에게 자동 부여
• 모든 관리 권한 보유
• 커뮤니티 삭제 가능
• 다른 멤버를 리더로 승격 가능
• 오너 권한 양도 가능

⭐ 리더 (Leader):
• 오너가 지정한 관리자
• 워십세트(콘티) 생성 및 수정
• 멤버 초대 및 관리
• 커뮤니티 설정 일부 수정
• 커뮤니티 삭제는 불가

👤 멤버 (Member):
• 초대를 통해 가입한 일반 구성원
• 게시된 콘티 열람
• 커뮤니티 피드 참여 (글/댓글)
• 채팅 참여
• 콘티 생성 및 수정은 불가

📋 권한 비교표:
| 기능 | 오너 | 리더 | 멤버 |
|------|------|------|------|
| 콘티 열람 | ✅ | ✅ | ✅ |
| 콘티 생성 | ✅ | ✅ | ❌ |
| 멤버 관리 | ✅ | ✅ | ❌ |
| 커뮤니티 삭제 | ✅ | ❌ | ❌ |`
    },
    {
      icon: Globe,
      question: "언어는 어떻게 변경하나요?",
      answer: `K-Worship은 한국어와 영어를 지원합니다.

🌐 언어 변경 방법:

방법 1 - 아바타 메뉴:
1. 우측 상단의 프로필 아바타를 클릭합니다
2. 드롭다운 메뉴에서 언어 토글(🌐)을 클릭합니다
3. 한국어 ↔ English 전환됩니다

방법 2 - 헤더 버튼 (데스크톱):
1. 데스크톱 화면에서는 헤더에 언어 버튼이 표시됩니다
2. 'KO' 또는 'EN' 버튼을 클릭합니다

🔄 변경 시 적용 범위:
• 메뉴 및 버튼 텍스트
• 안내 메시지
• 시스템 알림

📌 참고:
• 사용자가 입력한 콘텐츠(곡 제목, 메모 등)는 변경되지 않습니다
• 언어 설정은 브라우저에 저장되어 다음 접속 시에도 유지됩니다`
    },
    {
      icon: Maximize2,
      question: "전체화면 자료 보기는 어떻게 하나요?",
      answer: `밴드뷰에서 참고 자료를 전체화면으로 크게 볼 수 있습니다.

📱 전체화면 진입:
1. 게시된 콘티를 열거나 공유 링크로 접속합니다
2. '밴드뷰' 화면에서 자료 이미지를 탭/클릭합니다
3. 전체화면 뷰어가 열립니다

🎛️ 전체화면 조작:
• 좌우 스와이프: 다음/이전 페이지 이동
• 핀치 투 줌: 확대/축소 (모바일)
• 더블탭: 빠른 확대/축소
• X 버튼: 전체화면 종료

📄 여러 페이지 자료:
• 하단에 페이지 인디케이터가 표시됩니다
• 좌우로 넘기며 모든 페이지를 볼 수 있습니다

💡 실전 팁:
• 예배 중에는 화면 자동 잠금을 해제하세요
• 화면 밝기를 적절히 조절하세요
• 가로 모드로 더 크게 볼 수 있습니다`
    },
    {
      icon: Eye,
      question: "밴드뷰는 무엇인가요?",
      answer: `밴드뷰는 밴드 멤버들이 예배 중 콘티를 보기 위한 전용 화면입니다.

🎯 밴드뷰 특징:
• 깔끔하고 읽기 쉬운 레이아웃
• 곡 순서, 키, 참고 자료를 한눈에 확인
• 전체화면 자료 보기 지원
• 로그인 없이도 공유 링크로 접근 가능

📋 표시 정보:
• 예배 정보 (날짜, 예배명, 인도자)
• 곡 목록 및 순서
• 각 곡의 키 정보
• 참고 자료 이미지
• 유튜브 참고 영상 링크

📱 접근 방법:

방법 1 - 앱 내:
• 게시된 콘티를 클릭하면 밴드뷰로 이동

방법 2 - 공유 링크:
• 공유받은 링크를 브라우저에서 열기
• 별도 로그인 불필요

💡 활용 팁:
• 리허설 시 곡 순서와 키 확인
• 예배 중 자료 참조
• 새 멤버에게 곡 목록 공유`
    },
    {
      icon: Heart,
      question: "즐겨찾기는 어떻게 관리하나요?",
      answer: `자주 사용하는 곡을 즐겨찾기에 추가해 빠르게 찾을 수 있습니다.

❤️ 즐겨찾기 추가:
1. 곡 라이브러리에서 원하는 곡을 찾습니다
2. 곡 카드 또는 상세페이지에서 하트(♥) 아이콘을 클릭합니다
3. 빨간색으로 바뀌면 즐겨찾기에 추가된 것입니다

📋 즐겨찾기 목록 보기:
1. 하단 네비게이션에서 프로필/설정으로 이동합니다
2. '즐겨찾기' 메뉴를 선택합니다
3. 저장된 모든 곡을 확인할 수 있습니다

🗑️ 즐겨찾기 제거:
• 하트 아이콘을 다시 클릭하면 제거됩니다
• 즐겨찾기 목록에서도 제거 가능합니다

💡 활용 팁:
• 팀에서 자주 부르는 곡들을 즐겨찾기에 추가하세요
• 새 콘티 작성 시 즐겨찾기에서 빠르게 곡을 추가할 수 있습니다
• 시즌별, 테마별로 즐겨찾기를 관리하면 편리합니다`
    },
    {
      icon: LayoutList,
      question: "템플릿은 어떻게 사용하나요?",
      answer: `템플릿을 사용하면 반복되는 예배 구조를 빠르게 적용할 수 있습니다.

📋 템플릿이란?
• 예배 순서와 구조를 미리 저장해둔 양식
• 곡 슬롯, 기도, 말씀 등의 순서 포함
• 새 콘티 생성 시 빠르게 적용

🏗️ 템플릿 만들기:
1. 워십세트를 평소처럼 작성합니다
2. 저장할 때 '템플릿으로 저장' 옵션을 선택합니다
3. 템플릿 이름을 입력합니다 (예: 주일예배 기본형)

📝 템플릿 사용하기:
1. 새 워십세트 만들기를 시작합니다
2. '템플릿에서 시작' 옵션을 선택합니다
3. 원하는 템플릿을 선택합니다
4. 기본 구조가 적용된 상태에서 수정합니다

💡 활용 예시:
• 주일예배 1부/2부 템플릿
• 청년부 예배 템플릿
• 새벽기도회 템플릿
• 특별집회 템플릿`
    },
    {
      icon: RefreshCw,
      question: "템플릿 자동 반복은 어떻게 설정하나요?",
      answer: `템플릿 반복 일정을 설정하면 매주/격주/매월 자동으로 워십세트 초안이 생성됩니다.

📋 설정 방법:
1. 워십세트를 만들고 템플릿으로 저장합니다
2. 프로필 메뉴 → '템플릿 관리'로 이동합니다
3. 템플릿 카드에서 '반복 일정' 버튼을 클릭합니다
4. 반복 패턴을 선택합니다:
   • 매주 (요일 선택: 일요일, 수요일 등)
   • 격주 (2주마다)
   • 매월 특정일 (예: 매월 1일)
   • 매월 특정 주차 (예: 매월 첫째 주일)

⏰ 생성 시점 설정:
1. 예배일 며칠 전에 생성할지 선택합니다 (예: 5일 전)
2. 생성 시간을 선택합니다 (예: 오전 9시)
3. 시스템이 해당 시간에 자동으로 초안을 생성합니다

📌 예시:
"매주 일요일 예배, 5일 전 오전 9시 생성"
→ 매주 화요일 오전 9시에 다음 주일 콘티 초안이 생성됨

✅ 생성된 초안 확인:
• 워십세트 목록에서 '작성중' 상태로 저장됩니다
• 곡을 추가하고 편집한 후 '게시'하면 됩니다

💡 팁:
• 반복 일정은 언제든 수정하거나 비활성화할 수 있습니다
• 템플릿 관리 페이지에서 모든 반복 일정을 한눈에 확인할 수 있습니다
• 생성된 콘티가 중복되지 않도록 자동으로 관리됩니다`
    },
    {
      icon: Printer,
      question: "콘티와 자료를 인쇄하려면?",
      answer: `밴드뷰에서 콘티와 참고 자료를 간편하게 인쇄할 수 있습니다.

📱 인쇄 기능 접근:
1. 게시된 콘티를 열어 밴드뷰로 이동합니다
2. 상단의 '인쇄' 버튼(🖨️)을 클릭합니다
3. 인쇄 옵션 다이얼로그가 열립니다

🎛️ 인쇄 모드 3가지:

✨ **자료만 인쇄 (One-Click Print)** - 가장 많이 사용!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 참고 자료 이미지만 한 페이지씩 크게 출력
• 각 곡의 자료가 페이지 전체를 채우도록 확대
• 리허설이나 예배 시 자료만 필요할 때 최적
• 클릭 한 번으로 모든 자료를 한꺼번에 인쇄!
• 밴드 멤버에게 자료를 나눠줄 때 완벽

📋 순서표 인쇄:
• 곡 목록과 순서를 깔끔하게 출력
• 포함할 정보 선택 가능:
  - 예배 정보 (날짜, 인도자, 주제)
  - 곡 제목 및 아티스트
  - 키/BPM 정보
  - 연주 노트, 가사

📄 전체 인쇄:
• 화면에 보이는 그대로 인쇄
• 브라우저 인쇄 기능 사용

💡 활용 팁:
• 밴드 멤버에게 자료 나눠줄 때 → 자료만 인쇄 ✨
• 인도자용 진행표 필요할 때 → 순서표 인쇄
• 리허설 전 빠른 자료 준비 → 원클릭 자료 인쇄!`
    }
  ] : [
    {
      icon: Rocket,
      question: "How do I get started?",
      answer: `Welcome to K-Worship! Here's a quick start guide for new users.

📱 First Steps:
1. Sign up and log in to your account
2. Set up your profile with your name and photo
3. Use the bottom navigation to access main features

🎯 Main Features:
• Song Library: Search songs and view uploaded materials
• Worship Sets: Create service setlists
• Community: Connect with your worship team
• Chat: Real-time messaging with team members

💡 Tip:
Regular users can view published setlists. To create your own setlists, you need 'Worship Leader' permission. You can apply through the profile menu.`
    },
    {
      icon: UserCheck,
      question: "How do I become a Worship Leader?",
      answer: `Worship Leaders can create setlists and communities in K-Worship.

📋 How to Apply:
1. Click your profile avatar in the top right
2. Select 'Request Worship Leader' from the dropdown
3. Fill in the application form:
   • Church/Organization name
   • Church website or social media
   • Ministry position (e.g., Worship Leader, Musician)
   • Years of ministry experience
   • Brief introduction
4. Click 'Submit Application'

⏱️ Approval Process:
• An admin will review your application (usually 1-2 days)
• You'll receive a notification when approved
• If declined, you'll receive feedback

✅ After Approval:
• Create and manage worship sets
• Create communities (you become the owner)
• Add new songs to the library
• Invite and manage team members`
    },
    {
      icon: Users,
      question: "How do I create a community?",
      answer: `Communities are group spaces where worship teams collaborate and share setlists.

📋 Requirements:
• You need Worship Leader permission
• Apply through the profile menu if you don't have it

🏗️ Creating a Community:
1. Go to the 'Community' tab in bottom navigation
2. Click the '+' button in the top right
3. Enter community details:
   • Community name (e.g., First Church Youth Worship)
   • Description (optional)
   • Profile image (optional)
4. Click 'Create'

👥 Inviting Members:
• Copy the 'Invite Link' from community settings
• Share via text, email, or messaging apps
• People who join via link are automatically added as members

📊 Role Management:
• Owner: Community creator, has all permissions
• Leader: Can manage setlists and members
• Member: Can view setlists and participate in feed`
    },
    {
      icon: LayoutList,
      question: "How do I create a worship set?",
      answer: `A worship set is your service setlist with songs and order.

📋 Requirements:
• You need Worship Leader permission

🎵 Creating a Set:
1. Go to 'Worship Sets' tab in bottom navigation
2. Click 'Create New'
3. Enter basic information:
   • Service date
   • Service name (e.g., Sunday Morning Service)
   • Worship leader
   • Community (optional)
4. Add songs: Click 'Add Song' to select from library
5. Reorder: Drag and drop to change song order
6. Adjust keys: Change keys to fit your team

💾 Saving Options:
• 'Save': Saves as Draft status
• 'Publish': Makes visible to team members

📝 Additional Features:
• Add notes to each song
• Write overall service flow notes
• Add scripture references`
    },
    {
      icon: Music,
      question: "How do I add songs?",
      answer: `Find songs in the library and add them to your setlist.

🔍 Searching for Songs:
1. Go to the 'Songs' tab in bottom navigation
2. Type song title or artist in the search bar
3. Filter by category or tags

🛒 Using the Cart:
1. Click the cart icon (🛒) on desired songs
2. You can add multiple songs
3. Click the cart button to view your selections

📋 Adding to Setlist:
1. Go to your worship set editor
2. Click 'Add from Cart'
3. Select songs to add
4. Songs are added to your setlist

💡 Tips:
• Use favorites (♥) to save frequently used songs
• View uploaded materials, lyrics, and YouTube links on song detail pages
• Worship Leaders can add new songs to the library`
    },
    {
      icon: Share2,
      question: "How do I share setlists with band members?",
      answer: `Share completed setlists with your team in multiple ways.

📤 Community Sharing (Default):
1. Change setlist to 'Published' status
2. All community members can view it
3. Notification automatically appears in community feed

🔗 External Link Sharing:
1. Click the 'Share' button (🔗) on a published set
2. Enable 'Generate Share Link'
3. Copy the generated link
4. Send via text, email, or messaging apps

📱 Link Access:
• View setlist without logging in (Band View)
• See song list, keys, uploaded materials
• Fullscreen material viewing

🔒 Managing Shares:
• You can disable share links anytime
• Disabled links no longer work`
    },
    {
      icon: Users,
      question: "What's the difference between Owner, Leader, and Member roles?",
      answer: `Communities have three roles with different permissions.

👑 Owner:
• Automatically assigned to community creator
• Has all management permissions
• Can delete the community
• Can promote members to Leader
• Can transfer ownership

⭐ Leader:
• Designated by the Owner
• Create and edit worship sets
• Invite and manage members
• Modify some community settings
• Cannot delete the community

👤 Member:
• Joined via invitation
• View published setlists
• Participate in community feed (posts/comments)
• Join chats
• Cannot create or edit setlists

📋 Permission Comparison:
| Feature | Owner | Leader | Member |
|---------|-------|--------|--------|
| View Sets | ✅ | ✅ | ✅ |
| Create Sets | ✅ | ✅ | ❌ |
| Manage Members | ✅ | ✅ | ❌ |
| Delete Community | ✅ | ❌ | ❌ |`
    },
    {
      icon: Globe,
      question: "How do I change the language?",
      answer: `K-Worship supports Korean and English.

🌐 How to Change:

Method 1 - Avatar Menu:
1. Click your profile avatar in the top right
2. Click the language toggle (🌐) in the dropdown
3. Switches between 한국어 ↔ English

Method 2 - Header Button (Desktop):
1. On desktop, a language button appears in the header
2. Click 'KO' or 'EN'

🔄 What Changes:
• Menu and button text
• System messages
• Notifications

📌 Note:
• User-created content (song titles, notes) doesn't change
• Language setting is saved in your browser`
    },
    {
      icon: Maximize2,
      question: "How do I view sheet music in fullscreen?",
      answer: `View sheet music in fullscreen in Band View.

📱 Entering Fullscreen:
1. Open a published setlist or access via share link
2. In Band View, tap/click on a sheet music image
3. Fullscreen viewer opens

🎛️ Fullscreen Controls:
• Swipe left/right: Navigate pages
• Pinch to zoom: Zoom in/out (mobile)
• Double tap: Quick zoom toggle
• X button: Exit fullscreen

📄 Multi-page Scores:
• Page indicator shown at bottom
• Swipe through all pages

💡 Practical Tips:
• Disable screen auto-lock during service
• Adjust screen brightness appropriately
• Rotate to landscape for larger view`
    },
    {
      icon: Eye,
      question: "What is Band View?",
      answer: `Band View is a dedicated screen for viewing setlists during service.

🎯 Features:
• Clean, easy-to-read layout
• See song order, keys, and sheet music at a glance
• Fullscreen sheet music support
• Accessible via share link without login

📋 Displayed Information:
• Service info (date, name, leader)
• Song list and order
• Key information for each song
• Sheet music images
• YouTube reference links

📱 How to Access:

Method 1 - In App:
• Click on a published setlist to open Band View

Method 2 - Share Link:
• Open shared link in browser
• No login required

💡 Usage Tips:
• Check song order and keys during rehearsal
• Reference sheet music during service
• Share song lists with new members`
    },
    {
      icon: Heart,
      question: "How do I manage favorites?",
      answer: `Save frequently used songs to favorites for quick access.

❤️ Adding to Favorites:
1. Find a song in the library
2. Click the heart (♥) icon on the card or detail page
3. Red heart means it's favorited

📋 Viewing Favorites:
1. Go to your profile/settings in bottom navigation
2. Select 'Favorites' menu
3. View all saved songs

🗑️ Removing from Favorites:
• Click the heart icon again to remove
• Can also remove from favorites list

💡 Tips:
• Add songs your team frequently sings
• Quickly add from favorites when creating new setlists
• Organize by season or theme for convenience`
    },
    {
      icon: LayoutList,
      question: "How do I use templates?",
      answer: `Templates help you quickly apply repeating service structures.

📋 What are Templates?
• Pre-saved service order and structure
• Includes song slots, prayer, message sections
• Quickly apply when creating new setlists

🏗️ Creating a Template:
1. Create a worship set as usual
2. When saving, select 'Save as Template'
3. Enter template name (e.g., Sunday Service Standard)

📝 Using a Template:
1. Start creating a new worship set
2. Select 'Start from Template'
3. Choose desired template
4. Modify from the pre-filled structure

💡 Usage Examples:
• Sunday 1st/2nd service templates
• Youth service template
• Early morning prayer template
• Special event template`
    },
    {
      icon: RefreshCw,
      question: "How do I set up recurring templates?",
      answer: `Set up recurring schedules to automatically generate worship set drafts weekly, bi-weekly, or monthly.

📋 How to Set Up:
1. Create a worship set and save it as a template
2. Go to Profile Menu → 'Manage Templates'
3. Click 'Recurring Schedule' on the template card
4. Select a recurrence pattern:
   • Weekly (choose day: Sunday, Wednesday, etc.)
   • Bi-weekly (every 2 weeks)
   • Monthly on a specific date (e.g., 1st of each month)
   • Monthly on a specific week (e.g., first Sunday)

⏰ Set Creation Timing:
1. Choose how many days before the service to create (e.g., 5 days)
2. Choose creation time (e.g., 9:00 AM)
3. The system will automatically create a draft at that time

📌 Example:
"Weekly Sunday service, create 5 days before at 9 AM"
→ Every Tuesday at 9 AM, a draft for next Sunday is created

✅ Viewing Generated Drafts:
• Drafts appear in your worship sets list with 'Draft' status
• Add songs, edit, then 'Publish' when ready

💡 Tips:
• You can modify or disable recurring schedules anytime
• View all schedules at once in Template Management
• Automatic duplicate prevention ensures no duplicates`
    },
    {
      icon: Printer,
      question: "How do I print setlists and sheet music?",
      answer: `Print your setlists and sheet music easily from Band View.

📱 Accessing Print:
1. Open a published setlist to enter Band View
2. Click the 'Print' button (🖨️) at the top
3. The print options dialog opens

🎛️ Three Print Modes:

✨ **Sheet Music Only (One-Click Print)** - Most Popular!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Prints only sheet music images, one per page
• Each song's sheet music fills the entire page
• Perfect when you just need sheet music for rehearsal or service
• One click prints all sheet music at once!
• Ideal for handing out to band members

📋 Setlist Print:
• Neatly prints song list and order
• Choose what to include:
  - Service info (date, leader, theme)
  - Song titles and artists
  - Key/BPM info
  - Performance notes, lyrics

📄 Full Page Print:
• Prints exactly as shown on screen
• Uses browser print function

💡 Tips:
• Handing out to band members → Sheet Music Only ✨
• Need a run sheet for the leader → Setlist Print
• Quick prep before rehearsal → One-Click Sheet Music Print!`
    }
  ];

  // FAQ Page JSON-LD for rich results
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.slice(0, 10).map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer.substring(0, 500)
      }
    }))
  };

  const helpContent = (
    <>
      <SEOHead
        title="Help Center - K-Worship"
        titleKo="도움말 센터 - K-Worship"
        description="Get help with K-Worship. Find answers to frequently asked questions about song library, setlist creation, team collaboration, and more."
        descriptionKo="K-Worship 도움말 센터입니다. 곡 라이브러리, 콘티 제작, 팀 협업 등에 관한 자주 묻는 질문의 답변을 확인하세요."
        keywords="K-Worship help, FAQ, support, worship software help, church software support"
        keywordsKo="K-Worship 도움말, FAQ, 지원, 예배 소프트웨어 도움말, 교회 소프트웨어 지원, 콘티 만드는 법, 예배 순서 만들기, 피아워십"
        canonicalPath="/help"
        jsonLd={faqJsonLd}
        breadcrumbs={[
          { name: "Home", nameKo: "홈", url: "/" },
          { name: "Help Center", nameKo: "도움말", url: "/help" },
        ]}
      />
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {language === "ko" ? "도움말" : "Help Center"}
          </h1>
          <p className="text-muted-foreground">
            {language === "ko" 
              ? "K-Worship 사용에 관한 자주 묻는 질문들입니다. 각 항목을 클릭해 자세한 안내를 확인하세요." 
              : "Frequently asked questions about using K-Worship. Click each item for detailed guidance."}
          </p>
        </div>

        {/* FAQ Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">
              {language === "ko" ? "자주 묻는 질문" : "FAQ"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Accordion type="single" collapsible className="w-full" value={openAccordion} onValueChange={setOpenAccordion}>
              {faqItems.map((item, index) => {
                const Icon = item.icon;
                const anchor = FAQ_ANCHORS[index] || `item-${index}`;
                return (
                  <AccordionItem key={index} value={`item-${index}`} id={`faq-${anchor}`}>
                    <AccordionTrigger className="text-left hover:no-underline">
                      <span className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{item.question}</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pl-11">
                      <div className="whitespace-pre-line text-sm leading-relaxed">
                        {item.answer}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>

        {/* Support Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="font-semibold mb-2">
                {language === "ko" ? "더 도움이 필요하신가요?" : "Need more help?"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {language === "ko" 
                  ? "FAQ에서 답을 찾지 못하셨다면 지원팀에 문의해 주세요." 
                  : "If you couldn't find your answer in the FAQ, contact our support team."}
              </p>
              
              {!showEmail ? (
                <Button onClick={() => setShowEmail(true)} variant="outline">
                  <Mail className="w-4 h-4 mr-2" />
                  {language === "ko" ? "지원팀에 문의하기" : "Contact Support"}
                </Button>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <a 
                    href="mailto:hello@kworship.app"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    hello@kworship.app
                  </a>
                  <p className="text-xs text-muted-foreground">
                    {language === "ko" 
                      ? "일반적으로 24시간 이내에 답변 드립니다." 
                      : "We typically respond within 24 hours."}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );

  const breadcrumb = (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/dashboard"><Home className="h-4 w-4" /></Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{language === "ko" ? "도움말" : "Help"}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  // For authenticated users, wrap in AppLayout
  if (user) {
    return <AppLayout breadcrumb={breadcrumb}>{helpContent}</AppLayout>;
  }

  // For public users, show header and footer
  return (
    <div className="min-h-screen bg-background">
      <PublicPageHeader />
      <main>{helpContent}</main>
      <LandingFooter />
    </div>
  );
};

export default Help;
