import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTranslation } from "@/hooks/useTranslation";

interface Community {
  id: string;
  name: string;
}

interface SetImportConfigStepProps {
  communities: Community[];
  selectedCommunityId?: string;
  onCommunityChange: (communityId: string) => void;
  defaultWorshipLeader: string;
  onWorshipLeaderChange: (leader: string) => void;
  status: "draft" | "published";
  onStatusChange: (status: "draft" | "published") => void;
}

export const SetImportConfigStep = ({
  communities,
  selectedCommunityId,
  onCommunityChange,
  defaultWorshipLeader,
  onWorshipLeaderChange,
  status,
  onStatusChange,
}: SetImportConfigStepProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">{t("setImport.configStep")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("setImport.configDescription")}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="community">{t("setImport.selectCommunity")} *</Label>
          <Select value={selectedCommunityId} onValueChange={onCommunityChange}>
            <SelectTrigger id="community">
              <SelectValue placeholder={t("setImport.chooseCommunity")} />
            </SelectTrigger>
            <SelectContent>
              {communities.map((community) => (
                <SelectItem key={community.id} value={community.id}>
                  {community.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {t("setImport.communityAppliedToAll")}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="worshipLeader">{t("setImport.defaultWorshipLeader")}</Label>
          <Input
            id="worshipLeader"
            value={defaultWorshipLeader}
            onChange={(e) => onWorshipLeaderChange(e.target.value)}
            placeholder={t("setImport.worshipLeaderPlaceholder")}
          />
          <p className="text-xs text-muted-foreground">
            {t("setImport.optionalField")}
          </p>
        </div>

        <div className="space-y-2">
          <Label>{t("setImport.defaultStatus")}</Label>
          <RadioGroup value={status} onValueChange={(v) => onStatusChange(v as "draft" | "published")}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="draft" id="draft" />
              <Label htmlFor="draft" className="font-normal cursor-pointer">
                {t("setImport.statusDraft")}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="published" id="published" />
              <Label htmlFor="published" className="font-normal cursor-pointer">
                {t("setImport.statusPublished")}
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </div>
  );
};
