import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Mail, HelpCircle, ChevronRight } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

const Help = () => {
  const { t, language } = useTranslation();
  const [showEmail, setShowEmail] = useState(false);

  const faqItems = language === "ko" ? [
    {
      question: "워십리더가 되려면 어떻게 하나요?",
      answer: "프로필 메뉴에서 '워십리더 신청'을 클릭하세요. 교회 정보와 사역 경력을 입력하면 관리자 승인 후 콘티 생성, 커뮤니티 생성 등의 기능을 사용할 수 있습니다."
    },
    {
      question: "커뮤니티는 어떻게 만드나요?",
      answer: "워십리더로 승인된 후, 하단 네비게이션의 '커뮤니티' 탭에서 '+' 버튼을 눌러 새 커뮤니티를 생성할 수 있습니다. 커뮤니티 이름과 설명을 입력하면 바로 팀원을 초대할 수 있습니다."
    },
    {
      question: "워십세트(콘티)는 어떻게 만드나요?",
      answer: "하단 네비게이션에서 '워십세트' 탭을 선택하고 '새로 만들기' 버튼을 클릭하세요. 예배 날짜, 제목을 입력하고 곡을 추가하여 콘티를 구성할 수 있습니다."
    },
    {
      question: "곡은 어떻게 추가하나요?",
      answer: "곡 라이브러리에서 원하는 곡을 검색하고, 장바구니 아이콘(🛒)을 클릭하여 담으세요. 그 다음 워십세트 편집 화면에서 장바구니의 곡들을 콘티에 추가할 수 있습니다."
    },
    {
      question: "밴드 멤버에게 콘티를 공유하려면?",
      answer: "워십세트를 '게시' 상태로 변경하면 커뮤니티 멤버들이 볼 수 있습니다. 또는 공유 버튼을 눌러 링크를 복사하여 외부에 공유할 수도 있습니다."
    },
    {
      question: "커뮤니티 역할(오너/리더/멤버)의 차이는 무엇인가요?",
      answer: "오너: 커뮤니티 삭제 및 모든 관리 권한을 가집니다. 커뮤니티 리더: 콘티 수정, 멤버 관리가 가능합니다. 멤버: 게시된 콘티 열람, 피드 참여가 가능합니다."
    },
    {
      question: "언어는 어떻게 변경하나요?",
      answer: "우측 상단의 아바타 메뉴를 열고 언어 토글을 클릭하거나, 데스크톱에서는 헤더의 언어 버튼을 클릭하여 한국어/영어를 전환할 수 있습니다."
    },
    {
      question: "전체화면 악보 보기는 어떻게 하나요?",
      answer: "밴드뷰(Band View)에서 악보 이미지를 클릭하면 전체화면으로 볼 수 있습니다. 스와이프하여 다음 페이지로 넘기거나, 확대/축소가 가능합니다."
    }
  ] : [
    {
      question: "How do I become a Worship Leader?",
      answer: "Click 'Request Worship Leader' from the profile menu. Fill in your church information and ministry experience. After admin approval, you can create worship sets and communities."
    },
    {
      question: "How do I create a community?",
      answer: "After being approved as a Worship Leader, go to the 'Community' tab in the bottom navigation and click the '+' button. Enter the community name and description to start inviting team members."
    },
    {
      question: "How do I create a worship set?",
      answer: "Select the 'Worship Sets' tab from the bottom navigation and click 'Create New'. Enter the service date, title, and add songs to build your setlist."
    },
    {
      question: "How do I add songs?",
      answer: "Search for songs in the Song Library and click the cart icon (🛒) to add them. Then in the worship set editor, you can add songs from the cart to your setlist."
    },
    {
      question: "How do I share a setlist with band members?",
      answer: "Change your worship set status to 'Published' to make it visible to community members. You can also click the share button to copy a link for external sharing."
    },
    {
      question: "What's the difference between Owner, Leader, and Member roles?",
      answer: "Owner: Has full management rights including community deletion. Community Leader: Can edit setlists and manage members. Member: Can view published setlists and participate in the feed."
    },
    {
      question: "How do I change the language?",
      answer: "Open the avatar menu in the top right and click the language toggle, or on desktop, click the language button in the header to switch between Korean and English."
    },
    {
      question: "How do I view scores in fullscreen?",
      answer: "In Band View, click on a score image to view it in fullscreen. You can swipe to navigate pages and pinch to zoom in/out."
    }
  ];

  return (
    <AppLayout>
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
              ? "K-Worship 사용에 관한 자주 묻는 질문들입니다." 
              : "Frequently asked questions about using K-Worship."}
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
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-sm hover:no-underline">
                    <span className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-primary shrink-0" />
                      {item.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pl-6">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
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
    </AppLayout>
  );
};

export default Help;
