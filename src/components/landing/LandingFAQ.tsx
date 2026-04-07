import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { fadeInUp, viewportOptions } from "@/lib/animations";
import { useTranslation } from "@/hooks/useTranslation";
import { Helmet } from "react-helmet-async";

const faqs = [
  {
    q: "K-Worship이 뭔가요?",
    a: "K-Worship은 예배팀을 위한 올인원 관리 플랫폼입니다. 곡 라이브러리, 셋리스트(콘티) 제작, 참고 자료 관리, 팀 협업 기능을 하나의 서비스에서 제공합니다.",
    qEn: "What is K-Worship?",
    aEn: "K-Worship is an all-in-one worship team management platform offering a song library, setlist (conti) builder, reference material management, and team collaboration — all in one place.",
  },
  {
    q: "누가 사용하나요?",
    a: "찬양인도자, 밴드 멤버, 음향 담당자, 교회 미디어팀 등 예배에 관련된 모든 봉사자가 사용합니다.",
    qEn: "Who uses K-Worship?",
    aEn: "Worship leaders, band members, sound engineers, church media teams — anyone involved in worship ministry.",
  },
  {
    q: "어떤 기능이 있나요?",
    a: "곡 라이브러리, AI 셋리스트 생성(Worship Arc™), 유튜브 스마트 매칭, 참고 자료 관리, 팀 채팅, 뉴스피드 등 예배 준비에 필요한 모든 기능을 제공합니다.",
    qEn: "What features does K-Worship offer?",
    aEn: "Song library, AI setlist generation (Worship Arc™), YouTube smart matching, reference material management, team chat, and a news feed — everything you need for worship preparation.",
  },
  {
    q: "AI 셋리스트 생성이란?",
    a: "예배 흐름(경배→찬양→응답)에 맞춰 AI가 자동으로 셋리스트를 추천하는 Worship Arc™ 기능입니다. 예배의 흐름과 분위기를 고려해 최적의 곡 순서를 제안합니다.",
    qEn: "What is AI setlist generation?",
    aEn: "Worship Arc™ automatically recommends setlists following the worship flow (adoration → praise → response), suggesting the optimal song order based on mood and progression.",
  },
  {
    q: "태블릿/iPad에서 사용 가능한가요?",
    a: "네, 터치 제스처 최적화, 가로모드 자료 뷰, 원클릭 인쇄를 지원합니다. 예배 현장에서 태블릿으로 바로 사용할 수 있습니다.",
    qEn: "Can I use it on a tablet or iPad?",
    aEn: "Yes — with touch-optimized gestures, landscape reference material view, and one-click printing, it's ready for live worship on any tablet.",
  },
  {
    q: "여러 팀/교회를 관리할 수 있나요?",
    a: "네, 멀티 커뮤니티 기능으로 여러 예배팀을 하나의 계정에서 관리할 수 있습니다. 각 팀별로 곡 라이브러리와 셋리스트를 독립적으로 운영합니다.",
    qEn: "Can I manage multiple teams or churches?",
    aEn: "Yes — the multi-community feature lets you manage multiple worship teams from a single account, each with its own library and setlists.",
  },
  {
    q: "워십 아틀리에란?",
    a: "K-Worship 위에 구축된 개인 창작·묵상 공간입니다. 블록 기반 페이지로 예배를 삶의 리듬으로 기록하고, 묵상·기도·찬양 노트를 나만의 방식으로 정리할 수 있습니다.",
    qEn: "What is Worship Atelier?",
    aEn: "A personal creative and devotional space built on K-Worship. Use block-based pages to journal worship as a rhythm of life — organize devotions, prayers, and praise notes your way.",
  },
  {
    q: "무료인가요?",
    a: "기본 기능은 무료로 제공됩니다. 곡 라이브러리, 셋리스트, 팀 협업 등 핵심 기능을 무료로 사용할 수 있습니다.",
    qEn: "Is K-Worship free?",
    aEn: "Core features are free — song library, setlist builder, and team collaboration are all available at no cost.",
  },
  {
    q: "어떻게 시작하나요?",
    a: "회원가입 후 바로 시작할 수 있습니다. 별도의 앱 설치 없이 웹 브라우저에서 바로 사용 가능합니다.",
    qEn: "How do I get started?",
    aEn: "Sign up and start right away — no app installation needed, just open your web browser.",
  },
  {
    q: "마커스워십, 피아워십 등의 곡도 관리할 수 있나요?",
    a: "네, 다양한 한국 CCM 및 워십 곡을 라이브러리에서 관리할 수 있습니다. 유튜브 자동 매칭 기능으로 곡을 바로 재생하고 확인할 수 있습니다.",
    qEn: "Can I manage songs from Markers Worship, P.I.A Worship, etc.?",
    aEn: "Yes — manage a wide range of Korean CCM and worship songs in your library, with YouTube auto-matching to play and preview tracks instantly.",
  },
];

export const LandingFAQ = () => {
  const { language } = useTranslation();
  const isKo = language === "ko";

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <section id="faq" className="py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOptions}
            variants={fadeInUp}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-16">
              {isKo ? "자주 묻는 질문" : "FAQ"}
            </h2>

            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-card border border-border rounded-xl px-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-6">
                    <span className="text-lg font-semibold pr-4">
                      {isKo ? faq.q : faq.qEn}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-6 pt-2">
                    <p>{isKo ? faq.a : faq.aEn}</p>
                    {isKo && (
                      <p className="mt-2 text-xs italic text-muted-foreground/70">
                        {faq.aEn}
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>
    </>
  );
};
