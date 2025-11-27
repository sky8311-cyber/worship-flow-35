import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { fadeInUp, viewportOptions } from "@/lib/animations";
import { useTranslation } from "@/hooks/useTranslation";

export const LandingFAQ = () => {
  const { t } = useTranslation();

  const faqs = [
    {
      question: t("landing.faq.items.q1.question"),
      answer: t("landing.faq.items.q1.answer"),
    },
    {
      question: t("landing.faq.items.q2.question"),
      answer: t("landing.faq.items.q2.answer"),
    },
    {
      question: t("landing.faq.items.q3.question"),
      answer: t("landing.faq.items.q3.answer"),
    },
    {
      question: t("landing.faq.items.q4.question"),
      answer: t("landing.faq.items.q4.answer"),
    },
    {
      question: t("landing.faq.items.q5.question"),
      answer: t("landing.faq.items.q5.answer"),
    },
    {
      question: t("landing.faq.items.q6.question"),
      answer: t("landing.faq.items.q6.answer"),
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
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-16">
            {t("landing.faq.title")}
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
                    {faq.question}
                  </span>
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
