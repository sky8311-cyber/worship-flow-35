import { Helmet } from "react-helmet-async";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "워십 아틀리에가 뭔가요?",
    a: "워십 아틀리에(Worship Atelier)는 예배를 삶의 리듬으로 연결하는 공간입니다. 팀 도구와 개인 공간이 하나의 플랫폼에 공존하며, 예배자가 자신만의 아틀리에 페이지를 만들고 묵상·기록·창작을 이어갈 수 있습니다.",
    qEn: "What is Worship Atelier?",
    aEn: "Worship Atelier is a space that connects worship into the rhythm of life. Team tools and personal space coexist in one platform, where worshippers can create their own atelier pages to continue devotion, journaling, and creative work.",
  },
  {
    q: "K-Worship과 어떤 관계인가요?",
    a: "워십 아틀리에는 K-Worship 플랫폼 위에 구축된 창작·묵상 공간입니다. K-Worship의 예배팀 관리 기능과 함께, 개인의 예배 생활을 기록하고 공유할 수 있는 확장된 경험을 제공합니다.",
    qEn: "How is Worship Atelier related to K-Worship?",
    aEn: "Worship Atelier is a creative and devotional space built on top of the K-Worship platform. It extends K-Worship's team management features with personal worship journaling and sharing capabilities.",
  },
  {
    q: "누가 Worship Atelier를 사용하나요?",
    a: "찬양인도자, 싱어, 밴드 멤버, 그리고 예배를 사랑하는 모든 그리스도인이 사용합니다. 전문 사역자가 아니어도, 예배를 삶으로 기록하고 싶은 누구에게나 열려 있습니다.",
    qEn: "Who uses Worship Atelier?",
    aEn: "Worship leaders, singers, band members, and all Christians who love worship. It is open to anyone who wants to record worship as part of their life, not just professional ministers.",
  },
  {
    q: "어떤 기능이 있나요?",
    a: "아틀리에 페이지 만들기, 블록 기반 콘텐츠 편집, 예배 셋리스트 관리, BGM 설정, 이웃 연결, 방명록, 공개/비공개 설정 등 예배자의 창작과 교제를 위한 다양한 기능을 제공합니다.",
    qEn: "What features does it offer?",
    aEn: "It offers atelier page creation, block-based content editing, worship setlist management, BGM settings, neighbor connections, guestbooks, and privacy controls for worshippers' creative and fellowship needs.",
  },
  {
    q: "블록이란 무엇인가요?",
    a: "블록은 아틀리에 페이지를 구성하는 콘텐츠 단위입니다. 12가지 종류가 있으며 드래그로 배치하고 크기를 조절할 수 있습니다: 제목, 부제목, 포스트잇, 번호목록, 체크리스트, 사진, 유튜브, 음악, 예배셋, 링크, 파일, 명함.",
    qEn: "What are blocks?",
    aEn: "Blocks are content units that make up an atelier page. There are 12 types that can be arranged by drag-and-drop and resized: title, subtitle, sticky note, numbered list, checklist, photo, YouTube, music, worship set, link, file, and business card.",
  },
  {
    q: "BGM은 어떻게 설정하나요?",
    a: "아틀리에 페이지에 배경 음악을 설정할 수 있습니다. 유튜브 링크를 등록하면 방문자가 페이지를 열 때 자동으로 재생되어 예배 분위기를 만들어 줍니다.",
    qEn: "How do I set up BGM?",
    aEn: "You can set background music on your atelier page. Register a YouTube link and it will auto-play when visitors open your page, creating a worship atmosphere.",
  },
  {
    q: "이웃이란 무엇인가요?",
    a: "이웃은 서로의 아틀리에를 구독하고 새 게시물 알림을 받을 수 있는 관계입니다. 친구 요청과 달리 일방적으로 구독할 수 있어, 좋아하는 예배자의 기록을 자연스럽게 따라갈 수 있습니다.",
    qEn: "What are neighbors?",
    aEn: "Neighbors are connections that let you subscribe to each other's ateliers and receive notifications for new posts. Unlike friend requests, you can subscribe one-way, naturally following the records of worshippers you admire.",
  },
  {
    q: "페이지 공개 범위를 설정할 수 있나요?",
    a: "네, 아틀리에 페이지는 전체 공개, 이웃 공개, 비공개 중 선택할 수 있습니다. 개인 묵상은 비공개로, 나누고 싶은 기록은 공개로 설정하여 자유롭게 관리할 수 있습니다.",
    qEn: "Can I control page visibility?",
    aEn: "Yes, atelier pages can be set to public, neighbors-only, or private. You can keep personal devotions private and share records you want to open up.",
  },
  {
    q: "방명록은 어떻게 사용하나요?",
    a: "아틀리에 페이지에 방명록 기능이 있어, 방문자가 짧은 메시지를 남길 수 있습니다. 서로 격려하고 기도 제목을 나누는 따뜻한 교제의 공간입니다.",
    qEn: "How does the guestbook work?",
    aEn: "Each atelier page has a guestbook where visitors can leave short messages. It serves as a warm space for encouragement and sharing prayer topics.",
  },
  {
    q: "무료인가요?",
    a: "워십 아틀리에의 기본 기능은 무료로 제공됩니다. 아틀리에 페이지 만들기, 블록 편집, 이웃 연결 등 핵심 기능을 무료로 사용할 수 있습니다.",
    qEn: "Is it free?",
    aEn: "The core features of Worship Atelier are free. You can create atelier pages, edit blocks, and connect with neighbors at no cost.",
  },
  {
    q: "어떻게 시작하나요?",
    a: "K-Worship에 회원가입한 후, 아틀리에 메뉴에서 바로 나만의 페이지를 만들 수 있습니다. 별도의 설치 없이 웹에서 바로 시작할 수 있습니다.",
    qEn: "How do I get started?",
    aEn: "Sign up for K-Worship, then create your own page from the Atelier menu. You can start right away on the web without any installation.",
  },
  {
    q: "팀에서도 사용할 수 있나요?",
    a: "네, 워십 아틀리에는 개인 공간뿐 아니라 팀 단위로도 활용할 수 있습니다. K-Worship의 커뮤니티 기능과 연동하여 팀원들과 셋리스트, 악보, 묵상을 함께 나눌 수 있습니다.",
    qEn: "Can teams use it too?",
    aEn: "Yes, Worship Atelier can be used by teams as well as individuals. Integrated with K-Worship's community features, teams can share setlists, sheet music, and devotions together.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.a,
    },
  })),
};

export const AtelierFAQ = () => {
  return (
    <section className="py-20 px-6 bg-[#FAF8F5]">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-serif text-center mb-12 text-[#1A1A1A] tracking-tight">
          자주 묻는 질문
        </h2>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border border-[#E8E4DE] rounded-xl px-6 bg-white/60 backdrop-blur-sm transition-shadow hover:shadow-md hover:border-[#B8902A]/40"
            >
              <AccordionTrigger className="text-left hover:no-underline py-5 font-korean">
                <span className="text-base font-medium pr-4 text-[#1A1A1A]">
                  {faq.q}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-[#555] leading-relaxed pb-5 pt-1 font-korean text-sm">
                <p>{faq.a}</p>
                <p className="mt-2 text-xs text-[#999] italic">{faq.aEn}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
