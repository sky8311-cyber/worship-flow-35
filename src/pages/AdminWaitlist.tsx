import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminNav } from "@/components/admin/AdminNav";
import { WaitlistCard } from "@/components/admin/WaitlistCard";
import { useTranslation } from "@/hooks/useTranslation";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { useState, useEffect } from "react";
import { Download, LayoutGrid, List } from "lucide-react";

const AdminWaitlist = () => {
  const { t, language } = useTranslation();
  const dateLocale = language === "ko" ? ko : enUS;
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  
  useEffect(() => {
    if (window.innerWidth < 768) {
      setViewMode("card");
    }
  }, []);
  
  const { data: waitlist, isLoading } = useQuery({
    queryKey: ["admin-waitlist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("waitlist")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
  
  const filteredWaitlist = waitlist?.filter(entry => 
    entry.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.church_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const exportToCSV = () => {
    if (!waitlist) return;
    
    const headers = ["Name", "Email", "Role", "Church", "Country", "K-Spirit Meaning", "Joined"];
    const rows = waitlist.map(entry => [
      entry.name || "",
      entry.email,
      entry.role || "",
      entry.church_name || "",
      entry.country || "",
      entry.k_spirit_meaning || "",
      format(new Date(entry.created_at), "PPP", { locale: dateLocale }),
    ]);
    
    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `waitlist-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };
  
  return (
    <div className="min-h-screen bg-gradient-soft">
      <AdminNav />
      
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <CardTitle className="text-2xl">{t("admin.waitlist.title")}</CardTitle>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex-1 sm:w-72">
                  <SearchInput
                    placeholder={t("admin.waitlist.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-1">
                  <Button
                    variant={viewMode === "card" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("card")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "table" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("table")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={exportToCSV} variant="outline" size="sm">
                  <Download className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t("admin.waitlist.export")}</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading waitlist...</p>
              </div>
            ) : viewMode === "card" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredWaitlist?.map((entry) => (
                  <WaitlistCard key={entry.id} entry={entry} />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("admin.waitlist.name")}</TableHead>
                      <TableHead>{t("admin.waitlist.email")}</TableHead>
                      <TableHead>{t("admin.waitlist.role")}</TableHead>
                      <TableHead>{t("admin.waitlist.church")}</TableHead>
                      <TableHead>{t("admin.waitlist.country")}</TableHead>
                      <TableHead>{t("admin.waitlist.kSpirit")}</TableHead>
                      <TableHead>{t("admin.waitlist.joined")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWaitlist?.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.name || "-"}</TableCell>
                        <TableCell>{entry.email}</TableCell>
                        <TableCell>{entry.role || "-"}</TableCell>
                        <TableCell>{entry.church_name || "-"}</TableCell>
                        <TableCell>{entry.country || "-"}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {entry.k_spirit_meaning || "-"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(entry.created_at), "PPP", { locale: dateLocale })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminWaitlist;
