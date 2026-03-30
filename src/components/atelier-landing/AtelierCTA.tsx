import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const AtelierCTA = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCTA = () => {
    if (user) {
      navigate("/atelier");
    } else {
      navigate("/signup");
    }
  };

  return (
    <section className="py-14 md:py-20 px-6 bg-[#F5F2ED]">
      <motion.div
        className="max-w-xl mx-auto text-center space-y-8"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
      >
        <h2 className="font-korean text-2xl md:text-3xl text-foreground">
          당신의 공간을 만들어보세요
        </h2>

        <button
          onClick={handleCTA}
          className="px-10 py-4 bg-[#1F1F1F] text-[#FAF8F5] font-korean text-lg tracking-wider rounded-none hover:bg-[#333] transition-colors duration-300"
        >
          내 공간 만들기
        </button>

        {!user && (
          <p className="font-korean text-sm text-muted-foreground">
            이미 계정이 있으신가요?{" "}
            <Link to="/login" className="text-[#B8902A] hover:underline">
              로그인
            </Link>
          </p>
        )}

        <div className="w-12 h-[1px] bg-[#CCC] mx-auto" />

        <p className="font-korean text-sm text-muted-foreground">
          K-Worship 플랫폼에서 아틀리에를 만들 수 있습니다
        </p>
      </motion.div>
    </section>
  );
};
