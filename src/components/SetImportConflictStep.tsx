import { useState, useEffect } from "react";
import { ParsedWorshipSet } from "@/lib/csvSetParser";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/hooks/useTranslation";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Conflict {
  set: ParsedWorshipSet;
  existingSetId: string;
  resolution: "skip" | "overwrite" | "duplicate";
}

interface SetImportConflictStepProps {
  parsedSets: ParsedWorshipSet[];
  communityId: string;
  onConflictsResolved: (resolutions: Map<number, "skip" | "overwrite" | "duplicate">) => void;
}

export const SetImportConflictStep = ({
  parsedSets,
  communityId,
  onConflictsResolved,
}: SetImportConflictStepProps) => {
  const { t } = useTranslation();
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [resolutions, setResolutions] = useState<Map<number, "skip" | "overwrite" | "duplicate">>(
    new Map()
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConflicts();
  }, [parsedSets, communityId]);

  useEffect(() => {
    onConflictsResolved(resolutions);
  }, [resolutions]);

  const checkConflicts = async () => {
    setLoading(true);
    const foundConflicts: Conflict[] = [];

    for (const set of parsedSets) {
      const { data: existingSets } = await supabase
        .from("service_sets")
        .select("id, service_name")
        .eq("community_id", communityId)
        .eq("date", set.date)
        .eq("service_name", set.title);

      if (existingSets && existingSets.length > 0) {
        foundConflicts.push({
          set,
          existingSetId: existingSets[0].id,
          resolution: "skip",
        });
      }
    }

    setConflicts(foundConflicts);
    
    // Initialize resolutions
    const initialResolutions = new Map<number, "skip" | "overwrite" | "duplicate">();
    foundConflicts.forEach((conflict) => {
      initialResolutions.set(conflict.set.rowIndex, "skip");
    });
    setResolutions(initialResolutions);
    
    setLoading(false);
  };

  const handleResolutionChange = (rowIndex: number, resolution: "skip" | "overwrite" | "duplicate") => {
    setResolutions((prev) => {
      const newResolutions = new Map(prev);
      newResolutions.set(rowIndex, resolution);
      return newResolutions;
    });
  };

  const successCount = parsedSets.length - conflicts.length;
  const totalSongs = parsedSets.reduce((sum, set) => sum + set.parsedSongs.length, 0);

  if (loading) {
    return <div className="text-center py-8">{t("setImport.checkingConflicts")}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">{t("setImport.conflictStep")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("setImport.conflictDescription")}
        </p>
      </div>

      {conflicts.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-orange-900 dark:text-orange-100">
                {t("setImport.conflictsFound")}
              </h4>
              <p className="text-sm text-orange-800 dark:text-orange-200">
                {conflicts.length} {t("setImport.conflictsFoundDescription")}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {conflicts.map((conflict) => (
              <div key={conflict.set.rowIndex} className="bg-background rounded-lg p-4 space-y-3">
                <div>
                  <p className="font-medium">{conflict.set.title}</p>
                  <p className="text-sm text-muted-foreground">{conflict.set.date}</p>
                </div>

                <RadioGroup
                  value={resolutions.get(conflict.set.rowIndex) || "skip"}
                  onValueChange={(v) =>
                    handleResolutionChange(conflict.set.rowIndex, v as any)
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="skip" id={`skip-${conflict.set.rowIndex}`} />
                    <Label htmlFor={`skip-${conflict.set.rowIndex}`} className="font-normal cursor-pointer">
                      {t("setImport.resolutionSkip")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="overwrite" id={`overwrite-${conflict.set.rowIndex}`} />
                    <Label htmlFor={`overwrite-${conflict.set.rowIndex}`} className="font-normal cursor-pointer">
                      {t("setImport.resolutionOverwrite")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="duplicate" id={`duplicate-${conflict.set.rowIndex}`} />
                    <Label htmlFor={`duplicate-${conflict.set.rowIndex}`} className="font-normal cursor-pointer">
                      {t("setImport.resolutionDuplicate")}
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <h4 className="font-semibold">{t("setImport.finalReview")}</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">{t("setImport.setsToImport")}</p>
            <p className="text-2xl font-bold text-green-600">{successCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t("setImport.totalSongsToImport")}</p>
            <p className="text-2xl font-bold">{totalSongs}</p>
          </div>
        </div>
        {conflicts.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {conflicts.filter((c) => resolutions.get(c.set.rowIndex) === "skip").length}{" "}
            {t("setImport.setsWillBeSkipped")}
          </p>
        )}
      </div>
    </div>
  );
};
