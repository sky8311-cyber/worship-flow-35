import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { fadeInUp, viewportOptions } from "@/lib/animations";
const formSchema = z.object({
  email: z.string().email("올바른 이메일 주소를 입력해주세요"),
  name: z.string().optional(),
  role: z.string().optional(),
  church_name: z.string().optional(),
  country: z.string().optional(),
  k_spirit_meaning: z.string().optional()
});
type FormValues = z.infer<typeof formSchema>;
export const LandingWaitlist = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const {
    toast
  } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      name: "",
      role: "",
      church_name: "",
      country: "",
      k_spirit_meaning: ""
    }
  });
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const {
        error
      } = await supabase.from("waitlist").insert([{
        email: values.email,
        name: values.name || null,
        role: values.role || null,
        church_name: values.church_name || null,
        country: values.country || null,
        k_spirit_meaning: values.k_spirit_meaning || null
      }]);
      if (error) {
        if (error.code === "23505") {
          toast({
            title: "이미 신청하셨습니다",
            description: "이 이메일로 이미 얼리 액세스를 신청하셨습니다.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
      } else {
        setIsSuccess(true);
        form.reset();
      }
    } catch (error) {
      console.error("Waitlist submission error:", error);
      toast({
        title: "오류",
        description: "신청 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return <section id="waitlist" className="py-32 bg-accent/5">
      <div className="container mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOptions} variants={fadeInUp} className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight lg:text-5xl">
              K-Worship을 함께 만들어 갈
워십리더를 기다립니다.
              <br />
              워십리더를 기다립니다.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed md:text-lg">
              K-Worship은 실제 예배 현장에서 사역하는 워십리더들과 함께 만들어 가고 있습니다. 지금 얼리 액세스를 신청하시면, 개발 소식과 테스트 기회를 가장 먼저 
받아보실 수 있습니다.
            </p>
          </div>

          {isSuccess ? <motion.div initial={{
          opacity: 0,
          scale: 0.95
        }} animate={{
          opacity: 1,
          scale: 1
        }} className="p-8 bg-card border border-border rounded-2xl shadow-xl text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-2">신청해 주셔서 감사합니다!</h3>
              <p className="text-muted-foreground">
                K-Worship 소식과 테스트 모집을 가장 먼저 보내 드릴게요.
              </p>
            </motion.div> : <div className="p-8 md:p-10 bg-card border border-border rounded-2xl shadow-xl">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField control={form.control} name="email" render={({
                field
              }) => <FormItem>
                        <FormLabel>이메일 *</FormLabel>
                        <FormControl>
                          <Input placeholder="your@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                  <FormField control={form.control} name="name" render={({
                field
              }) => <FormItem>
                        <FormLabel>이름</FormLabel>
                        <FormControl>
                          <Input placeholder="홍길동" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                  <FormField control={form.control} name="role" render={({
                field
              }) => <FormItem>
                        <FormLabel>역할 선택</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="역할을 선택해주세요" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="워십리더">워십리더</SelectItem>
                            <SelectItem value="담임/부목사">담임/부목사</SelectItem>
                            <SelectItem value="찬양팀원">찬양팀원</SelectItem>
                            <SelectItem value="예배 담당자">예배 담당자</SelectItem>
                            <SelectItem value="기타">기타</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>} />

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="church_name" render={({
                  field
                }) => <FormItem>
                          <FormLabel>교회 이름</FormLabel>
                          <FormControl>
                            <Input placeholder="서울한빛교회" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />

                    <FormField control={form.control} name="country" render={({
                  field
                }) => <FormItem>
                          <FormLabel>지역/국가</FormLabel>
                          <FormControl>
                            <Input placeholder="서울, 대한민국" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                  </div>

                  <FormField control={form.control} name="k_spirit_meaning" render={({
                field
              }) => <FormItem>
                        <FormLabel>당신에게 '좋은 찬양 콘티'는 무엇인가요?</FormLabel>
                        <FormControl>
                          <Textarea placeholder="당신에게 '좋은 찬양 콘티'는 무엇인가요?" className="min-h-[120px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                  <Button type="submit" size="lg" className="w-full text-base py-6" disabled={isSubmitting}>
                    {isSubmitting ? "신청 중..." : "얼리 액세스 신청하기"}
                  </Button>
                </form>
              </Form>
            </div>}
        </motion.div>
      </div>
    </section>;
};