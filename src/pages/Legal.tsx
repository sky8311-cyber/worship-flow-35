import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Shield, Copyright, Award, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import logoDesktop from "@/assets/kworship-logo-desktop.png";
import logoMobile from "@/assets/kworship-logo-mobile.png";

type LegalDocumentType = 'terms' | 'privacy' | 'copyright' | 'trademark';

const Legal = () => {
  const { language } = useTranslation();
  const [activeTab, setActiveTab] = useState<LegalDocumentType>("terms");

  const { data: documents, isLoading } = useQuery({
    queryKey: ["legal-documents", language],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_documents")
        .select("*")
        .eq("language", language)
        .eq("is_active", true);
      
      if (error) throw error;
      return data;
    },
  });

  const getDocument = (type: LegalDocumentType) => {
    return documents?.find(doc => doc.type === type);
  };

  const getIcon = (type: LegalDocumentType) => {
    switch (type) {
      case "terms": return FileText;
      case "privacy": return Shield;
      case "copyright": return Copyright;
      case "trademark": return Award;
    }
  };

  const getTabLabel = (type: LegalDocumentType) => {
    if (language === "ko") {
      switch (type) {
        case "terms": return "이용약관";
        case "privacy": return "개인정보 처리방침";
        case "copyright": return "저작권 정책";
        case "trademark": return "상표 고지";
      }
    }
    switch (type) {
      case "terms": return "Terms of Service";
      case "privacy": return "Privacy Policy";
      case "copyright": return "Copyright Policy";
      case "trademark": return "Trademark Notice";
    }
  };

  const documentTypes: LegalDocumentType[] = ["terms", "privacy", "copyright", "trademark"];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="hidden md:block">
              <img src={logoDesktop} alt="K-Worship" className="h-16 w-auto cursor-pointer hover:opacity-80 transition-opacity object-contain" />
            </Link>
            <Link to="/" className="md:hidden">
              <img src={logoMobile} alt="K-Worship" className="h-12 w-auto cursor-pointer hover:opacity-80 transition-opacity object-contain" />
            </Link>
            <div className="flex items-center gap-4">
              <LanguageToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {language === "ko" ? "약관 및 정책" : "Legal & Policies"}
          </h1>
          <p className="text-muted-foreground">
            {language === "ko" 
              ? "Kworship 서비스 이용에 관한 법적 문서입니다."
              : "Legal documents governing your use of Kworship services."}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LegalDocumentType)}>
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
              {documentTypes.map((type) => {
                const Icon = getIcon(type);
                return (
                  <TabsTrigger key={type} value={type} className="gap-2">
                    <Icon className="h-4 w-4 hidden sm:inline" />
                    <span className="text-xs sm:text-sm">{getTabLabel(type)}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {documentTypes.map((type) => {
              const doc = getDocument(type);
              const Icon = getIcon(type);
              
              return (
                <TabsContent key={type} value={type}>
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle>{doc?.title || getTabLabel(type)}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                              {doc && (
                                <>
                                  <Badge variant="secondary">v{doc.version}</Badge>
                                  <span className="text-xs">
                                    {language === "ko" ? "시행일: " : "Effective: "}
                                    {format(new Date(doc.effective_date), "yyyy-MM-dd")}
                                  </span>
                                </>
                              )}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-6">
                      {doc ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          {doc.content.split('\n\n').map((paragraph, idx) => (
                            <p key={idx} className="mb-4 whitespace-pre-wrap leading-relaxed">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">
                          {language === "ko" ? "문서를 불러올 수 없습니다." : "Document not available."}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Goodpapa Inc. All rights reserved.</p>
          <p className="mt-1">K-Worship™ is a trademark of Goodpapa Inc.</p>
        </div>
      </main>
    </div>
  );
};

export default Legal;