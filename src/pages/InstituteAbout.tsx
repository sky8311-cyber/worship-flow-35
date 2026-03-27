import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { InstituteLayout } from "@/layouts/InstituteLayout";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// Counter hook
function useCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const triggered = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true;
          let start = 0;
          const step = target / (duration / 16);
          const timer = setInterval(() => {
            start += step;
            if (start >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { ref, count };
}

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1 },
};

const InstituteAbout = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const { ref: counterRef, count } = useCounter(200);

  const { data: randomAvatars } = useQuery({
    queryKey: ['random-profile-avatars', Date.now()],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .not('avatar_url', 'is', null)
        .limit(10);
      return (data ?? []).sort(() => Math.random() - 0.5);
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const audience = [
    { icon: "🎤", title: "찬양인도자", desc: "예배를 더 깊이 이해하고 팀을 이끌고 싶은" },
    { icon: "🎵", title: "보컬·악기 주자", desc: "내가 왜 여기 서는지 알고 싶은" },
    { icon: "🎚️", title: "음향·미디어팀", desc: "예배 흐름 안에 내 역할을 찾고 싶은" },
    { icon: "⛪", title: "담당 교역자", desc: "팀 전체를 체계적으로 훈련하고 싶은" },
  ];

  const features = [
    { title: "예배팀 전체를 위한 커리큘럼", desc: "역할별로 다른 입장에서 같은 예배 신학을 배웁니다" },
    { title: "AI 예배 코치", desc: "언제든 선곡, 신학, 팀 리더십에 대해 질문하세요" },
    { title: "팀과 함께 수료", desc: "같은 과정을 함께 달리고, 함께 배지를 받습니다" },
    { title: "K-Worship 수료 배지", desc: "카카오톡·인스타로 공유 가능한 디지털 배지" },
  ];

  const badges = [
    { icon: "🏅", name: "K-Worship Essential", pathway: "워십 리더십 파운데이션", audience: "예배팀 입문 전체", status: "모집 중", active: true },
    { icon: "🏅", name: "K-Worship Core", pathway: "심화 훈련 과정", audience: "중급 예배팀", status: "준비 중", active: false },
    { icon: "🏅", name: "K-Worship Practitioner", pathway: "실전 사역 과정", audience: "실전 사역자", status: "준비 중", active: false },
  ];

  const testimonials = [
    { img: "https://i.pravatar.cc/80?img=10", name: "김예배", role: "보컬 · 새빛교회", quote: "보컬이라 신학은 몰라도 된다고 생각했는데, 이 과정을 통해 내가 왜 예배에 서는지 처음으로 이해하게 됐어요." },
    { img: "https://i.pravatar.cc/80?img=22", name: "이찬양", role: "드럼 · 열방교회", quote: "악기 주자도 예배팀의 신학이 있어야 한다는 걸 배웠어요. 팀 전체가 같은 언어를 갖게 됐습니다." },
    { img: "https://i.pravatar.cc/80?img=33", name: "박워십", role: "찬양인도자 · 은혜교회", quote: "팀원들과 같이 수강하면서 K-Worship Essential 배지를 목표로 함께 달렸어요. 리허설이 완전히 달라졌습니다." },
  ];

  const whyLines = [
    "많은 예배팀이 함께 서지만,\n함께 배운 적이 없습니다.",
    "인도자는 신학을 배우고,\n보컬은 기술을 배우고,\n악기 주자는 그냥 따라갑니다.",
    "K-Worship Institute는\n그 간격을 좁히기 위해 만들어졌습니다.",
  ];

  const visionLines = [
    "K-Worship Institute를 통해 훈련된 예배팀이",
    "한국과 한인 디아스포라 교회 곳곳에 세워지는 것.",
    "같은 신학, 같은 언어, 같은 마음으로 예배를 드리는 팀들의 네트워크.",
  ];

  return (
    <InstituteLayout>
      <div className="overflow-x-hidden">
        {/* SECTION 1 — Hero */}
        <section className="relative h-[85vh] min-h-[500px] flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url(https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600&q=80)",
              transform: `translate3d(0, ${scrollY * 0.4}px, 0)`,
            }}
          />
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="text-xs tracking-[0.3em] text-white/70 mb-4 font-medium"
            >
              K-WORSHIP INSTITUTE
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-3xl sm:text-5xl font-bold text-white leading-tight mb-6"
            >
              예배팀을 함께 세우는
              <br />
              온라인 훈련
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="text-base sm:text-lg text-white/80"
            >
              찬양인도자부터 보컬, 악기, 음향팀까지
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 1 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
              <ChevronDown className="h-6 w-6 text-white/50 animate-bounce" />
            </motion.div>
          </div>
        </section>

        {/* SECTION 2 — Why */}
        <section className="py-24 sm:py-32 px-6">
          <div className="max-w-2xl mx-auto space-y-16">
            {whyLines.map((line, i) => (
              <motion.p
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="text-xl sm:text-2xl font-semibold text-foreground text-center whitespace-pre-line leading-relaxed"
              >
                {line}
              </motion.p>
            ))}
          </div>
        </section>

        {/* SECTION 3 — Who */}
        <section className="py-20 sm:py-28 px-6 bg-muted/30">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-2xl sm:text-3xl font-bold text-center text-foreground mb-12"
          >
            이런 분들을 위해
          </motion.h2>
          <div className="max-w-4xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {audience.map((a, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-card rounded-2xl p-6 text-center border border-border/50 shadow-sm"
              >
                <div className="text-4xl mb-3">{a.icon}</div>
                <h3 className="font-semibold text-foreground mb-1">{a.title}</h3>
                <p className="text-sm text-muted-foreground">{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* SECTION 4 — What */}
        <section className="py-20 sm:py-28 px-6">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              variants={scaleIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="rounded-2xl overflow-hidden aspect-[4/3]"
            >
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80"
                alt="Worship team training"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </motion.div>
            <div className="space-y-6">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className="flex gap-4"
                >
                  <span className="text-primary text-lg mt-0.5">✦</span>
                  <div>
                    <h3 className="font-semibold text-foreground">{f.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 5 — Badges */}
        <section className="py-20 sm:py-28 px-6 bg-muted/30">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <motion.h2
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-2xl sm:text-3xl font-bold text-foreground mb-4"
            >
              K-Worship 수료 배지
            </motion.h2>
            <motion.p
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-muted-foreground"
            >
              배지는 자격증이 아닙니다. "나는 이것을 배웠고, 우리 팀은 함께 성장했다"는 디지털 증명입니다.
            </motion.p>
          </div>
          <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-4 sm:gap-6">
            {badges.map((b, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`rounded-2xl p-6 text-center border shadow-sm ${
                  b.active
                    ? "bg-card border-primary/30"
                    : "bg-card/50 border-border/30 opacity-60"
                }`}
              >
                <div className="text-4xl mb-3">{b.icon}</div>
                <h3 className="font-bold text-foreground">{b.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{b.pathway}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{b.audience}</p>
                <span
                  className={`inline-block mt-3 text-xs font-medium px-3 py-1 rounded-full ${
                    b.active
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {b.status}
                </span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* SECTION 6 — Dream (counter + vision) */}
        <section className="py-24 sm:py-32 px-6 text-center">
          <div ref={counterRef}>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-6xl sm:text-8xl font-bold text-primary mb-2"
            >
              {count}+
            </motion.div>
            {randomAvatars && randomAvatars.length > 0 && (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="flex justify-center items-center mb-6"
              >
                {randomAvatars.slice(0, 8).map((profile, i) => (
                  <Avatar
                    key={i}
                    className={`w-10 h-10 sm:w-12 sm:h-12 border-2 border-background ${i > 0 ? '-ml-3' : ''}`}
                  >
                    <AvatarImage src={profile.avatar_url!} alt="Member" />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">♪</AvatarFallback>
                  </Avatar>
                ))}
              </motion.div>
            )}
            <p className="text-lg text-muted-foreground mb-12">
              K-Worship 예배팀원들이 함께하고 있습니다
            </p>
          </div>
          <div className="max-w-2xl mx-auto space-y-6">
            {visionLines.map((line, i) => (
              <motion.p
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="text-lg sm:text-xl text-foreground/80 leading-relaxed"
              >
                {line}
              </motion.p>
            ))}
          </div>
        </section>

        {/* SECTION 7 — Testimonials */}
        <section className="py-20 sm:py-28 px-6 bg-muted/30">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-2xl sm:text-3xl font-bold text-center text-foreground mb-12"
          >
            함께 성장하는 예배팀들의 이야기
          </motion.h2>
          <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={t.img}
                    alt={t.name}
                    className="w-10 h-10 rounded-full object-cover"
                    loading="lazy"
                  />
                  <div>
                    <p className="font-semibold text-sm text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">"{t.quote}"</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* SECTION 8 — CTA */}
        <section className="py-24 sm:py-32 px-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-xl mx-auto text-center"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              우리 팀, 지금 함께 시작해요.
            </h2>
            <p className="text-muted-foreground mb-8">
              첫 번째 과정은 무료로 체험할 수 있습니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={() => navigate("/institute/courses")}>
                훈련 과정 보기
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/institute/ai-coach")}>
                AI 코치에게 질문하기
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Bottom spacing for nav */}
        <div className="pb-24" />
      </div>
    </InstituteLayout>
  );
};

export default InstituteAbout;
