import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

interface AuditRecord {
  id: string;
  user_id: string | null;
  action: "INSERT" | "UPDATE" | "DELETE";
  changed_fields: Record<string, any> | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  created_at: string;
  // Extended fields for display
  table_type: "set" | "song" | "component";
  song_id?: string;
  song_title?: string;
  user_name?: string;
  user_avatar?: string;
}

interface GroupedAuditEntry {
  id: string;
  user_id: string | null;
  user_name: string;
  user_avatar: string | null;
  created_at: string;
  actions: {
    type: "set" | "song" | "component";
    action: "INSERT" | "UPDATE" | "DELETE";
    details: string;
    changed_fields: Record<string, any> | null;
    old_values: Record<string, any> | null;
    new_values: Record<string, any> | null;
    song_title?: string;
    component_label?: string;
  }[];
}

// Helper to safely cast Json to Record
const jsonToRecord = (json: Json | null): Record<string, any> | null => {
  if (json === null || typeof json !== 'object' || Array.isArray(json)) {
    return null;
  }
  return json as Record<string, any>;
};

// Format Korean friendly action descriptions
const formatActionDescription = (
  tableType: "set" | "song" | "component",
  action: "INSERT" | "UPDATE" | "DELETE",
  changedFields: Record<string, any> | null,
  newValues: Record<string, any> | null,
  oldValues: Record<string, any> | null
): string => {
  if (tableType === "song") {
    if (action === "INSERT") return "곡 추가";
    if (action === "DELETE") return "곡 삭제";
    if (action === "UPDATE" && changedFields) {
      const changes: string[] = [];
      if (changedFields.key) changes.push(`키 변경: ${oldValues?.key || '?'} → ${changedFields.key}`);
      if (changedFields.position !== undefined) changes.push("순서 변경");
      if (changedFields.custom_notes !== undefined) changes.push("메모 수정");
      if (changedFields.bpm !== undefined) changes.push(`BPM 변경: ${changedFields.bpm}`);
      return changes.length > 0 ? changes.join(", ") : "곡 수정";
    }
  }

  if (tableType === "component") {
    if (action === "INSERT") return "순서 추가";
    if (action === "DELETE") return "순서 삭제";
    if (action === "UPDATE" && changedFields) {
      const changes: string[] = [];
      if (changedFields.label) changes.push(`이름 변경: ${changedFields.label}`);
      if (changedFields.position !== undefined) changes.push("순서 변경");
      if (changedFields.notes !== undefined) changes.push("메모 수정");
      return changes.length > 0 ? changes.join(", ") : "순서 수정";
    }
  }

  if (tableType === "set") {
    if (action === "INSERT") return "예배 세트 생성";
    if (action === "DELETE") return "예배 세트 삭제";
    if (action === "UPDATE" && changedFields) {
      const changes: string[] = [];
      if (changedFields.status) {
        if (changedFields.status === "published") changes.push("게시됨");
        else if (changedFields.status === "draft") changes.push("임시저장으로 변경");
      }
      if (changedFields.service_name) changes.push(`제목 변경: ${changedFields.service_name}`);
      if (changedFields.date) changes.push(`날짜 변경: ${changedFields.date}`);
      if (changedFields.worship_leader) changes.push(`인도자 변경: ${changedFields.worship_leader}`);
      if (changedFields.theme) changes.push(`주제 변경: ${changedFields.theme}`);
      return changes.length > 0 ? changes.join(", ") : "예배 정보 수정";
    }
  }

  return action === "INSERT" ? "추가" : action === "DELETE" ? "삭제" : "수정";
};

interface UserInfo {
  name: string;
  avatar: string | null;
}

export const useSetAuditHistory = (setId: string | undefined) => {
  return useQuery({
    queryKey: ["set-audit-history", setId],
    enabled: !!setId,
    queryFn: async () => {
      if (!setId) return [];

      // Fetch all audit records for this set
      const [setsAudit, songsAudit, componentsAudit] = await Promise.all([
        supabase
          .from("service_sets_audit")
          .select("*")
          .eq("service_set_id", setId)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("set_songs_audit")
          .select("*")
          .eq("service_set_id", setId)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("set_components_audit")
          .select("*")
          .eq("service_set_id", setId)
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

      // Collect all unique user IDs
      const userIds = new Set<string>();
      const songIds = new Set<string>();

      setsAudit.data?.forEach((r) => r.user_id && userIds.add(r.user_id));
      songsAudit.data?.forEach((r) => {
        r.user_id && userIds.add(r.user_id);
        r.song_id && songIds.add(r.song_id);
      });
      componentsAudit.data?.forEach((r) => r.user_id && userIds.add(r.user_id));

      // Fetch user profiles and song titles
      const [profiles, songs] = await Promise.all([
        userIds.size > 0
          ? supabase
              .from("profiles")
              .select("id, full_name, avatar_url")
              .in("id", Array.from(userIds))
          : { data: [] },
        songIds.size > 0
          ? supabase.from("songs").select("id, title").in("id", Array.from(songIds))
          : { data: [] },
      ]);

      const userMap = new Map<string, UserInfo>();
      profiles.data?.forEach((p) => {
        userMap.set(p.id, { name: p.full_name || "알 수 없음", avatar: p.avatar_url });
      });
      
      const songMap = new Map<string, string>();
      songs.data?.forEach((s) => {
        songMap.set(s.id, s.title);
      });

      // Combine all records into unified format
      const allRecords: AuditRecord[] = [
        ...(setsAudit.data || []).map((r) => ({
          id: r.id,
          user_id: r.user_id,
          action: r.action as "INSERT" | "UPDATE" | "DELETE",
          changed_fields: jsonToRecord(r.changed_fields),
          old_values: jsonToRecord(r.old_values),
          new_values: jsonToRecord(r.new_values),
          created_at: r.created_at,
          table_type: "set" as const,
          user_name: userMap.get(r.user_id || "")?.name || "알 수 없음",
          user_avatar: userMap.get(r.user_id || "")?.avatar || undefined,
        })),
        ...(songsAudit.data || []).map((r) => ({
          id: r.id,
          user_id: r.user_id,
          action: r.action as "INSERT" | "UPDATE" | "DELETE",
          changed_fields: jsonToRecord(r.changed_fields),
          old_values: jsonToRecord(r.old_values),
          new_values: jsonToRecord(r.new_values),
          created_at: r.created_at,
          table_type: "song" as const,
          song_id: r.song_id || undefined,
          song_title: r.song_id ? songMap.get(r.song_id) || "알 수 없는 곡" : undefined,
          user_name: userMap.get(r.user_id || "")?.name || "알 수 없음",
          user_avatar: userMap.get(r.user_id || "")?.avatar || undefined,
        })),
        ...(componentsAudit.data || []).map((r) => ({
          id: r.id,
          user_id: r.user_id,
          action: r.action as "INSERT" | "UPDATE" | "DELETE",
          changed_fields: jsonToRecord(r.changed_fields),
          old_values: jsonToRecord(r.old_values),
          new_values: jsonToRecord(r.new_values),
          created_at: r.created_at,
          table_type: "component" as const,
          user_name: userMap.get(r.user_id || "")?.name || "알 수 없음",
          user_avatar: userMap.get(r.user_id || "")?.avatar || undefined,
        })),
      ];

      // Sort by created_at descending
      allRecords.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Group records by user and time window (within 30 seconds)
      const grouped: GroupedAuditEntry[] = [];
      let currentGroup: GroupedAuditEntry | null = null;

      allRecords.forEach((record) => {
        const recordTime = new Date(record.created_at).getTime();
        
        // Check if should be grouped with previous
        const shouldGroup =
          currentGroup &&
          currentGroup.user_id === record.user_id &&
          Math.abs(new Date(currentGroup.created_at).getTime() - recordTime) < 30000;

        if (shouldGroup && currentGroup) {
          currentGroup.actions.push({
            type: record.table_type,
            action: record.action,
            details: formatActionDescription(
              record.table_type,
              record.action,
              record.changed_fields,
              record.new_values,
              record.old_values
            ),
            changed_fields: record.changed_fields,
            old_values: record.old_values,
            new_values: record.new_values,
            song_title: record.song_title,
            component_label: record.new_values?.label || record.old_values?.label,
          });
        } else {
          currentGroup = {
            id: record.id,
            user_id: record.user_id,
            user_name: record.user_name || "알 수 없음",
            user_avatar: record.user_avatar || null,
            created_at: record.created_at,
            actions: [
              {
                type: record.table_type,
                action: record.action,
                details: formatActionDescription(
                  record.table_type,
                  record.action,
                  record.changed_fields,
                  record.new_values,
                  record.old_values
                ),
                changed_fields: record.changed_fields,
                old_values: record.old_values,
                new_values: record.new_values,
                song_title: record.song_title,
                component_label: record.new_values?.label || record.old_values?.label,
              },
            ],
          };
          grouped.push(currentGroup);
        }
      });

      return grouped;
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
};

// Helper to get a snapshot of set at a specific point in time
export const useSetSnapshot = (setId: string | undefined, snapshotTime: string | undefined) => {
  return useQuery({
    queryKey: ["set-snapshot", setId, snapshotTime],
    enabled: !!setId && !!snapshotTime,
    queryFn: async () => {
      if (!setId || !snapshotTime) return null;

      // Get all audit records before the snapshot time
      const [setsAudit, songsAudit, componentsAudit] = await Promise.all([
        supabase
          .from("service_sets_audit")
          .select("*")
          .eq("service_set_id", setId)
          .lte("created_at", snapshotTime)
          .order("created_at", { ascending: true }),
        supabase
          .from("set_songs_audit")
          .select("*")
          .eq("service_set_id", setId)
          .lte("created_at", snapshotTime)
          .order("created_at", { ascending: true }),
        supabase
          .from("set_components_audit")
          .select("*")
          .eq("service_set_id", setId)
          .lte("created_at", snapshotTime)
          .order("created_at", { ascending: true }),
      ]);

      // Reconstruct state by replaying audit log
      let setData: Record<string, any> | null = null;
      const songsMap = new Map<string, Record<string, any>>();
      const componentsMap = new Map<string, Record<string, any>>();

      // Replay set changes
      setsAudit.data?.forEach((record) => {
        const newVals = jsonToRecord(record.new_values);
        if (record.action === "INSERT" || record.action === "UPDATE") {
          setData = newVals;
        } else if (record.action === "DELETE") {
          setData = null;
        }
      });

      // Replay song changes
      songsAudit.data?.forEach((record) => {
        const newVals = jsonToRecord(record.new_values);
        if ((record.action === "INSERT" || record.action === "UPDATE") && newVals) {
          songsMap.set(record.set_song_id, newVals);
        } else if (record.action === "DELETE") {
          songsMap.delete(record.set_song_id);
        }
      });

      // Replay component changes
      componentsAudit.data?.forEach((record) => {
        const newVals = jsonToRecord(record.new_values);
        if ((record.action === "INSERT" || record.action === "UPDATE") && newVals) {
          componentsMap.set(record.set_component_id, newVals);
        } else if (record.action === "DELETE") {
          componentsMap.delete(record.set_component_id);
        }
      });

      return {
        set: setData,
        songs: Array.from(songsMap.values()),
        components: Array.from(componentsMap.values()),
      };
    },
  });
};
