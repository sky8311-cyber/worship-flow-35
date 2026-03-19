import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Search } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

type Instructor = {
  id: string;
  user_id: string;
  display_name: string | null;
  bio: string | null;
  bio_ko: string | null;
  avatar_url: string | null;
  created_at: string;
};

type ProfileResult = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

export const AdminInstituteInstructors = () => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProfileResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<ProfileResult | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bioKo, setBioKo] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const { data: instructors = [], isLoading } = useQuery({
    queryKey: ["admin-institute-instructors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_instructors")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Instructor[];
    },
  });

  // Fetch linked profile emails for display
  const { data: profileMap = {} } = useQuery({
    queryKey: ["instructor-profiles", instructors.map(i => i.user_id)],
    queryFn: async () => {
      if (instructors.length === 0) return {};
      const { data } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", instructors.map(i => i.user_id));
      const map: Record<string, { email: string | null; full_name: string | null }> = {};
      data?.forEach(p => { map[p.id] = { email: p.email, full_name: p.full_name }; });
      return map;
    },
    enabled: instructors.length > 0,
  });

  const searchProfiles = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(10);
      setSearchResults(data || []);
    } finally {
      setIsSearching(false);
    }
  };

  const addInstructor = useMutation({
    mutationFn: async () => {
      if (!selectedUser) throw new Error("No user selected");
      const { error } = await supabase.from("institute_instructors").insert({
        user_id: selectedUser.id,
        display_name: displayName || selectedUser.full_name,
        bio_ko: bioKo || null,
        avatar_url: selectedUser.avatar_url,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-institute-instructors"] });
      toast({ title: language === "ko" ? "강사가 추가되었습니다" : "Instructor added" });
      resetDialog();
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteInstructor = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("institute_instructors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-institute-instructors"] });
      toast({ title: language === "ko" ? "강사가 삭제되었습니다" : "Instructor removed" });
    },
  });

  const resetDialog = () => {
    setShowAddDialog(false);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedUser(null);
    setDisplayName("");
    setBioKo("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {language === "ko" ? "강사 목록" : "Instructor List"} ({instructors.length})
        </h2>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-1" />
          {language === "ko" ? "강사 추가" : "Add Instructor"}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : instructors.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          {language === "ko" ? "등록된 강사가 없습니다" : "No instructors yet"}
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{language === "ko" ? "표시 이름" : "Display Name"}</TableHead>
              <TableHead>{language === "ko" ? "소개 (KO)" : "Bio (KO)"}</TableHead>
              <TableHead>{language === "ko" ? "연결 유저" : "Linked User"}</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {instructors.map((inst) => (
              <TableRow key={inst.id}>
                <TableCell className="font-medium">{inst.display_name || "-"}</TableCell>
                <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                  {inst.bio_ko || "-"}
                </TableCell>
                <TableCell className="text-sm">
                  {profileMap[inst.user_id]?.email || profileMap[inst.user_id]?.full_name || inst.user_id.slice(0, 8)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm(language === "ko" ? "이 강사를 삭제하시겠습니까?" : "Remove this instructor?")) {
                        deleteInstructor.mutate(inst.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Add Instructor Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) resetDialog(); else setShowAddDialog(true); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{language === "ko" ? "강사 추가" : "Add Instructor"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!selectedUser ? (
              <>
                <div className="flex gap-2">
                  <Input
                    placeholder={language === "ko" ? "이름 또는 이메일로 검색..." : "Search by name or email..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchProfiles()}
                  />
                  <Button variant="outline" size="icon" onClick={searchProfiles} disabled={isSearching}>
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
                {searchResults.length > 0 && (
                  <div className="border rounded-md max-h-48 overflow-y-auto">
                    {searchResults.map((profile) => (
                      <button
                        key={profile.id}
                        className="w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm flex items-center gap-2"
                        onClick={() => {
                          setSelectedUser(profile);
                          setDisplayName(profile.full_name || "");
                        }}
                      >
                        <span className="font-medium">{profile.full_name}</span>
                        <span className="text-muted-foreground">{profile.email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="bg-muted rounded-md p-3 text-sm">
                  <span className="font-medium">{selectedUser.full_name}</span>
                  <span className="text-muted-foreground ml-2">{selectedUser.email}</span>
                  <Button variant="link" size="sm" className="ml-2 h-auto p-0" onClick={() => setSelectedUser(null)}>
                    {language === "ko" ? "변경" : "Change"}
                  </Button>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    {language === "ko" ? "표시 이름" : "Display Name"}
                  </label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    {language === "ko" ? "소개 (KO)" : "Bio (KO)"}
                  </label>
                  <Input value={bioKo} onChange={(e) => setBioKo(e.target.value)} />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetDialog}>
              {language === "ko" ? "취소" : "Cancel"}
            </Button>
            <Button onClick={() => addInstructor.mutate()} disabled={!selectedUser || addInstructor.isPending}>
              {language === "ko" ? "추가" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
