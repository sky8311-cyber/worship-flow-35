import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Music } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageToggle } from "@/components/LanguageToggle";

const SignUpChoice = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">{t("auth.signUpChoice.title")}</h1>
          <p className="text-muted-foreground">{t("auth.signUpChoice.subtitle")}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => navigate("/signup")}>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>{t("auth.signUpChoice.member.title")}</CardTitle>
              <CardDescription>{t("auth.signUpChoice.member.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">{t("auth.signUpChoice.member.button")}</Button>
            </CardContent>
          </Card>

          <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => navigate("/signup-worship-leader")}>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Music className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>{t("auth.signUpChoice.leader.title")}</CardTitle>
              <CardDescription>{t("auth.signUpChoice.leader.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">{t("auth.signUpChoice.leader.button")}</Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {t("auth.signUpChoice.hasAccount")}{" "}
            <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/login")}>
              {t("auth.login")}
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpChoice;
