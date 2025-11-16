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
  email: z.string().email("Invalid email address"),
  name: z.string().optional(),
  role: z.string().optional(),
  church_name: z.string().optional(),
  country: z.string().optional(),
  k_spirit_meaning: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export const LandingWaitlist = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      name: "",
      role: "",
      church_name: "",
      country: "",
      k_spirit_meaning: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.from("waitlist").insert([{
        email: values.email,
        name: values.name || null,
        role: values.role || null,
        church_name: values.church_name || null,
        country: values.country || null,
        k_spirit_meaning: values.k_spirit_meaning || null,
      }]);

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already signed up",
            description: "This email is already on the waitlist.",
            variant: "destructive",
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
        title: "Error",
        description: "Failed to join waitlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="waitlist" className="py-24 bg-accent/5">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOptions}
          variants={fadeInUp}
          className="max-w-2xl mx-auto"
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Help shape K-Worship.</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              K-Worship is being built with worship leaders who love K-Spirit and value order.
              Join the early access list to get updates, give feedback, and be first to try it.
            </p>
          </div>

          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 bg-card border border-border rounded-xl shadow-lg text-center"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-2">감사합니다!</h3>
              <p className="text-muted-foreground">
                We'll email you as K-Worship gets closer to launch.
              </p>
            </motion.div>
          ) : (
            <div className="p-8 bg-card border border-border rounded-xl shadow-lg">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input placeholder="your@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Worship Leader">Worship Leader</SelectItem>
                            <SelectItem value="Pastor">Pastor</SelectItem>
                            <SelectItem value="Music Director">Music Director</SelectItem>
                            <SelectItem value="Musician/Vocalist">Musician/Vocalist</SelectItem>
                            <SelectItem value="Tech">Tech</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="church_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Church Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your church" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="Your country" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="k_spirit_meaning"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What does K-Spirit mean to you?</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Share your thoughts..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Joining..." : "Join early access"}
                  </Button>
                </form>
              </Form>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};
