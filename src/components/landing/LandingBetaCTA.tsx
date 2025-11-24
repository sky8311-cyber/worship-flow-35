import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { fadeInUp, viewportOptions } from "@/lib/animations";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export const LandingBetaCTA = () => {
  return (
    <section id="beta-cta" className="py-32 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOptions}
          variants={fadeInUp}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Beta badge */}
          <div className="flex justify-center mb-6">
            <Badge className="bg-accent/10 text-accent border-accent/20 px-4 py-2 text-sm">
              Beta Version
            </Badge>
          </div>

          {/* Headline */}
          <h2 
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight" 
            style={{ wordBreak: "keep-all", overflowWrap: "break-word" }}
          >
            워십리더를 기다립니다
          </h2>

          {/* Subtext */}
          <p 
            className="text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto" 
            style={{ wordBreak: "keep-all", overflowWrap: "break-word" }}
          >
            K-Worship은 실제 예배 현장에서 사역하는 워십리더들과 함께 만들어 가고 있습니다. 
            베타에 가입하시고, 가장 먼저 변화된 예배 준비를 경험해 보세요.
          </p>

          {/* CTA button */}
          <Button 
            asChild 
            size="lg" 
            className="text-base px-12 py-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
          >
            <Link to="/signup">
              베타 가입하기
            </Link>
          </Button>

          {/* Supporting text */}
          <p className="text-xs md:text-sm text-muted-foreground mt-6">
            이미 계정이 있으신가요?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              로그인
            </Link>
          </p>
        </motion.div>
      </div>
    </section>
  );
};
