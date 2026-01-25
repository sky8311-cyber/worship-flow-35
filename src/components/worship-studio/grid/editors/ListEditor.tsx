import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import type { WidgetContent, WidgetType } from "@/hooks/useStudioWidgets";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface ListEditorProps {
  widgetType: WidgetType;
  content: WidgetContent;
  onChange: (content: WidgetContent) => void;
}

export function ListEditor({ widgetType, content, onChange }: ListEditorProps) {
  const { language } = useTranslation();
  const [newItemText, setNewItemText] = useState("");
  
  const items = content.items || [];
  
  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    
    const newItem = {
      id: crypto.randomUUID(),
      text: newItemText.trim(),
      checked: false,
    };
    
    onChange({
      ...content,
      items: [...items, newItem],
    });
    setNewItemText("");
  };
  
  const handleRemoveItem = (id: string) => {
    onChange({
      ...content,
      items: items.filter(item => item.id !== id),
    });
  };
  
  const handleToggleItem = (id: string) => {
    if (widgetType !== "todo") return;
    
    onChange({
      ...content,
      items: items.map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
      ),
    });
  };
  
  const handleUpdateItemText = (id: string, text: string) => {
    onChange({
      ...content,
      items: items.map(item => 
        item.id === id ? { ...item, text } : item
      ),
    });
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddItem();
    }
  };
  
  const getTypeLabel = () => {
    switch (widgetType) {
      case "todo":
        return language === "ko" ? "체크리스트" : "Checklist";
      case "bullet-list":
        return language === "ko" ? "글머리 기호 목록" : "Bullet List";
      case "numbered-list":
        return language === "ko" ? "번호 목록" : "Numbered List";
      default:
        return language === "ko" ? "목록" : "List";
    }
  };
  
  return (
    <div className="space-y-4">
      <Label>{getTypeLabel()}</Label>
      
      {/* Items list */}
      <div className="space-y-2">
        {items.map((item, index) => (
          <div 
            key={item.id} 
            className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background"
          >
            {widgetType === "todo" && (
              <Checkbox
                checked={item.checked}
                onCheckedChange={() => handleToggleItem(item.id)}
              />
            )}
            {widgetType === "numbered-list" && (
              <span className="w-6 text-sm text-muted-foreground text-center">
                {index + 1}.
              </span>
            )}
            {widgetType === "bullet-list" && (
              <span className="w-6 text-center text-primary">•</span>
            )}
            <Input
              value={item.text}
              onChange={(e) => handleUpdateItemText(item.id, e.target.value)}
              className={cn(
                "flex-1 border-0 p-0 h-auto focus-visible:ring-0",
                item.checked && "line-through text-muted-foreground"
              )}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => handleRemoveItem(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      
      {/* Add new item */}
      <div className="flex items-center gap-2">
        <Input
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={language === "ko" ? "새 항목 추가..." : "Add new item..."}
          className="flex-1"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={handleAddItem}
          disabled={!newItemText.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          {language === "ko" ? "항목을 추가해주세요." : "Add some items."}
        </p>
      )}
    </div>
  );
}
