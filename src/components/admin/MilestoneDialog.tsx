import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

interface MilestoneData {
  id?: string;
  event_date: string;
  title_ko: string;
  title_en: string;
  description_ko?: string;
  description_en?: string;
  category: string;
  is_visible: boolean;
  sort_order: number;
}

interface MilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestone?: MilestoneData | null;
  onSave: (data: Omit<MilestoneData, "id">) => void;
  isLoading?: boolean;
}

export const MilestoneDialog = ({ 
  open, 
  onOpenChange, 
  milestone, 
  onSave, 
  isLoading 
}: MilestoneDialogProps) => {
  const { language } = useTranslation();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [titleKo, setTitleKo] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [descKo, setDescKo] = useState("");
  const [descEn, setDescEn] = useState("");
  const [category, setCategory] = useState("milestone");
  const [isVisible, setIsVisible] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);

  useEffect(() => {
    if (milestone) {
      setDate(new Date(milestone.event_date));
      setTitleKo(milestone.title_ko);
      setTitleEn(milestone.title_en);
      setDescKo(milestone.description_ko || "");
      setDescEn(milestone.description_en || "");
      setCategory(milestone.category);
      setIsVisible(milestone.is_visible);
      setSortOrder(milestone.sort_order);
    } else {
      setDate(new Date());
      setTitleKo("");
      setTitleEn("");
      setDescKo("");
      setDescEn("");
      setCategory("milestone");
      setIsVisible(true);
      setSortOrder(0);
    }
  }, [milestone, open]);

  const handleSave = () => {
    if (!date || !titleKo || !titleEn) return;
    
    onSave({
      event_date: format(date, "yyyy-MM-dd"),
      title_ko: titleKo,
      title_en: titleEn,
      description_ko: descKo || undefined,
      description_en: descEn || undefined,
      category,
      is_visible: isVisible,
      sort_order: sortOrder,
    });
  };

  const categories = [
    { value: "launch", label: language === "ko" ? "출시" : "Launch" },
    { value: "feature", label: language === "ko" ? "기능" : "Feature" },
    { value: "milestone", label: language === "ko" ? "마일스톤" : "Milestone" },
    { value: "update", label: language === "ko" ? "업데이트" : "Update" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {milestone 
              ? (language === "ko" ? "마일스톤 편집" : "Edit Milestone")
              : (language === "ko" ? "마일스톤 추가" : "Add Milestone")
            }
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label>{language === "ko" ? "날짜" : "Date"}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "yyyy-MM-dd") : (language === "ko" ? "날짜 선택" : "Pick a date")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>{language === "ko" ? "카테고리" : "Category"}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title Korean */}
          <div className="space-y-2">
            <Label>{language === "ko" ? "제목 (한국어)" : "Title (Korean)"}</Label>
            <Input
              value={titleKo}
              onChange={(e) => setTitleKo(e.target.value)}
              placeholder={language === "ko" ? "한국어 제목" : "Korean title"}
            />
          </div>

          {/* Title English */}
          <div className="space-y-2">
            <Label>{language === "ko" ? "제목 (영어)" : "Title (English)"}</Label>
            <Input
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder={language === "ko" ? "영어 제목" : "English title"}
            />
          </div>

          {/* Description Korean */}
          <div className="space-y-2">
            <Label>{language === "ko" ? "설명 (한국어, 선택)" : "Description (Korean, optional)"}</Label>
            <Textarea
              value={descKo}
              onChange={(e) => setDescKo(e.target.value)}
              placeholder={language === "ko" ? "상세 설명" : "Detailed description"}
              rows={2}
            />
          </div>

          {/* Description English */}
          <div className="space-y-2">
            <Label>{language === "ko" ? "설명 (영어, 선택)" : "Description (English, optional)"}</Label>
            <Textarea
              value={descEn}
              onChange={(e) => setDescEn(e.target.value)}
              placeholder={language === "ko" ? "상세 설명 (영어)" : "Detailed description"}
              rows={2}
            />
          </div>

          {/* Sort Order */}
          <div className="space-y-2">
            <Label>{language === "ko" ? "정렬 순서" : "Sort Order"}</Label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
            />
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{language === "ko" ? "공개 여부" : "Visibility"}</Label>
              <p className="text-sm text-muted-foreground">
                {language === "ko" ? "사용자에게 표시됩니다" : "Visible to users"}
              </p>
            </div>
            <Switch checked={isVisible} onCheckedChange={setIsVisible} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {language === "ko" ? "취소" : "Cancel"}
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || !date || !titleKo || !titleEn}
          >
            {isLoading 
              ? (language === "ko" ? "저장 중..." : "Saving...")
              : (language === "ko" ? "저장" : "Save")
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
