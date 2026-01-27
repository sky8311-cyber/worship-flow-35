import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Shield, Copyright, Award, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { AppLayout } from "@/components/layout/AppLayout";
import { PublicPageHeader } from "@/components/landing/PublicPageHeader";

type LegalDocumentType = 'terms' | 'privacy' | 'copyright' | 'trademark';

const Legal = () => {
  const { language } = useTranslation();
  const { user } = useAuth();
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
        case "privacy": return "개인정보";
        case "copyright": return "저작권";
        case "trademark": return "상표";
      }
    }
    switch (type) {
      case "terms": return "Terms";
      case "privacy": return "Privacy";
      case "copyright": return "Copyright";
      case "trademark": return "Trademark";
    }
  };

  const documentTypes: LegalDocumentType[] = ["terms", "privacy", "copyright", "trademark"];

  const LegalContent = () => (
    <>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          {language === "ko" ? "약관 및 정책" : "Legal & Policies"}
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
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
          <TabsList className="flex h-auto gap-1 p-1 mb-6 w-full">
            {documentTypes.map((type) => {
              const Icon = getIcon(type);
              return (
                <TabsTrigger 
                  key={type} 
                  value={type} 
                  className="flex-1 gap-1.5 py-2 px-2 md:px-3 text-xs md:text-sm"
                >
                  <Icon className="h-4 w-4 shrink-0 hidden sm:block" />
                  <span className="truncate">{getTabLabel(type)}</span>
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
                          <CardTitle className="text-lg md:text-xl">{doc?.title || getTabLabel(type)}</CardTitle>
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
    </>
  );

  // Authenticated users get the full app layout with navigation
  if (user) {
    return (
      <AppLayout>
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <LegalContent />
        </main>
      </AppLayout>
    );
  }

  // Public users get minimal header
  return (
    <div className="min-h-screen bg-background">
      <PublicPageHeader />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <LegalContent />
      </main>
    </div>
  );
};

export default Legal;