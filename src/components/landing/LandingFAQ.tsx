import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { fadeInUp, viewportOptions } from "@/lib/animations";

export const LandingFAQ = () => {
  const faqs = [
    {
      question: "K-Worship은 어떤 예배 공동체를 위한 앱인가요?",
      answer: "K-Worship은 한국 교회의 예배 인도자, 찬양팀, 예배 공동체를 위해 설계되었습니다. 교회 크기나 형태에 관계없이, 예배 흐름과 찬양 콘티를 체계적으로 관리하고 싶은 모든 공동체에 적합합니다.",
    },
    {
      question: "팀원들도 회원가입이 필요한가요?",
      answer: "네, K-Worship은 팀 협업을 위해 모든 구성원이 계정을 만들어야 합니다. 워십리더가 예배공동체를 생성한 후, 초대 링크를 통해 팀원들이 가입하고 참여할 수 있습니다.",
    },
    {
      question: "워십리더 콘티 공유 범위는 어떻게 설정되나요?",
      answer: "워십세트는 '임시저장'(Draft)과 '게시하기'(Published) 두 단계로 관리됩니다. 임시저장은 작성자와 초대된 협력자만 볼 수 있고, 게시된 세트는 같은 예배공동체의 모든 멤버가 열람할 수 있습니다. 워십리더 커뮤니티 기능을 통해 다른 교회의 콘티도 참고할 수 있습니다.",
    },
    {
      question: "PDF 내보내기 기능은 어떤 정보까지 포함하나요?",
      answer: "PDF에는 예배 제목, 날짜, 메시지 본문, 각 곡의 제목, 아티스트, Key, BPM, 악보 이미지, 진행 설명(송폼 노트)이 포함됩니다. 한 번의 클릭으로 전체 예배 콘티를 팀원들과 공유하거나 인쇄할 수 있습니다.",
    },
    {
      question: "언제쯤 사용할 수 있게 되나요?",
      answer: "K-Worship은 현재 베타 개발 중입니다. 얼리 액세스를 신청하시면, 테스트 참여 기회와 정식 출시 소식을 가장 먼저 받아보실 수 있습니다.",
    },
    {
      question: "곡 라이브러리는 교회마다 따로 관리되나요?",
      answer: "곡 라이브러리는 전체 워십리더 커뮤니티가 함께 관리하는 글로벌 데이터베이스입니다. 모든 로그인 사용자가 곡을 열람할 수 있고, 워십리더는 곡을 추가/수정/삭제할 수 있습니다. 이를 통해 한국 예배 음악의 집단 지식을 함께 쌓아 갈 수 있습니다.",
    },
  ];

  return (
    <section id="faq" className="py-32">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOptions}
          variants={fadeInUp}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-16">FAQ</h2>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border rounded-xl px-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="text-lg font-semibold pr-4">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-6 pt-2">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};
