import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { fadeInUp, viewportOptions } from "@/lib/animations";

export const LandingFAQ = () => {
  const faqs = [
    {
      question: "What is K-Worship exactly?",
      answer: "K-Worship is a worship set builder that combines Korean worship DNA (K-Spirit) with a structured song database. It helps worship leaders design intentional worship flows using data like keys, tags, usage history, and themes—not just random song lists.",
    },
    {
      question: "Is K-Worship only for Korean churches?",
      answer: "No! While K-Worship honors Korean worship's depth and passion, it's designed for any church—Korean, bilingual, immigrant, or global congregations. You can mix Korean and English songs, tag by language, and adapt K-Spirit principles to your context.",
    },
    {
      question: "How does the database help my worship planning?",
      answer: "The database tracks each song's key, tempo, themes, last-used date, and frequency. This helps you avoid song repetition, plan key transitions, filter by energy or theme, and design worship sets that align with your sermon or season—all backed by data, not guesswork.",
    },
    {
      question: "When will K-Worship be available?",
      answer: "K-Worship is currently in active development. Join the early access list to get updates, provide feedback, and be among the first to try it when it launches.",
    },
    {
      question: "Will my team need separate accounts?",
      answer: "Yes, K-Worship will support team collaboration with different roles and permissions. Your team will be able to view sets, access charts and keys, and see shared notes—all aligned in one place.",
    },
    {
      question: "How much will K-Worship cost?",
      answer: "Pricing details are still being finalized. Early access members will receive special introductory pricing and be the first to know about plans when they're announced.",
    },
  ];

  return (
    <section id="faq" className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOptions}
          variants={fadeInUp}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">FAQ</h2>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border rounded-lg px-6"
              >
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="text-lg font-semibold">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
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
