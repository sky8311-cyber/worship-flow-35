import { motion } from "framer-motion";
import { revealCard, revealStaggerContainer, revealViewportOptions, revealText } from "@/lib/animations";
import { useTranslation } from "@/hooks/useTranslation";
import { Quote } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export const LandingTestimonials = () => {
  const { t } = useTranslation();

  const testimonials = [
    {
      quote: t("landing.testimonials.items.item1.quote"),
      author: t("landing.testimonials.items.item1.author"),
      role: t("landing.testimonials.items.item1.role"),
    },
    {
      quote: t("landing.testimonials.items.item2.quote"),
      author: t("landing.testimonials.items.item2.author"),
      role: t("landing.testimonials.items.item2.role"),
    },
    {
      quote: t("landing.testimonials.items.item3.quote"),
      author: t("landing.testimonials.items.item3.author"),
      role: t("landing.testimonials.items.item3.role"),
    },
  ];

  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={revealViewportOptions}
          variants={revealText}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6" style={{ wordBreak: "keep-all" }}>
            {t("landing.testimonials.title")}
          </h2>
          <p className="text-lg text-muted-foreground" style={{ wordBreak: "keep-all" }}>
            {t("landing.testimonials.subtitle")}
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={revealViewportOptions}
          variants={revealStaggerContainer}
          className="max-w-5xl mx-auto"
        >
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <motion.div
                    variants={revealCard}
                    className="h-full p-6 bg-card border border-border rounded-2xl shadow-sm hover:shadow-lg transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Quote className="w-5 h-5 text-primary" />
                    </div>
                    <blockquote className="text-foreground mb-6 leading-relaxed" style={{ wordBreak: "keep-all" }}>
                      "{testimonial.quote}"
                    </blockquote>
                    <div className="border-t border-border pt-4">
                      <p className="font-semibold text-sm">{testimonial.author}</p>
                      <p className="text-muted-foreground text-xs">{testimonial.role}</p>
                    </div>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center gap-2 mt-8">
              <CarouselPrevious className="static translate-y-0" />
              <CarouselNext className="static translate-y-0" />
            </div>
          </Carousel>
        </motion.div>
      </div>
    </section>
  );
};
