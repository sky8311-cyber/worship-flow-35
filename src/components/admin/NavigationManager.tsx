import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Navigation, Smartphone, Monitor, Plus, GripVertical, Trash2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useNavigationItems, useNavigationMutations, iconMap, NavigationItem, NavigationLocation } from "@/hooks/useNavigationItems";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableItemProps {
  item: NavigationItem;
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
  isUpdating: boolean;
  language: string;
}

function SortableItem({ item, onToggle, onDelete, isUpdating, language }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = iconMap[item.icon] || Navigation;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 bg-background rounded-lg border"
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="p-2 rounded-md bg-muted">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="font-medium text-sm flex items-center gap-2">
            {item.label_key}
            {item.is_system && (
              <Badge variant="secondary" className="text-[10px]">
                {language === "ko" ? "시스템" : "System"}
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {item.path || (language === "ko" ? "특수 동작" : "Special Action")}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!item.is_system && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        <Switch
          checked={item.enabled}
          onCheckedChange={(checked) => onToggle(item.id, checked)}
          disabled={isUpdating}
        />
      </div>
    </div>
  );
}

interface NavigationSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  location: NavigationLocation;
  items: NavigationItem[];
  isLoading: boolean;
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
  onReorder: (items: NavigationItem[]) => void;
  isUpdating: boolean;
  language: string;
}

function NavigationSection({
  title,
  description,
  icon,
  location,
  items,
  isLoading,
  onToggle,
  onDelete,
  onReorder,
  isUpdating,
  language,
}: NavigationSectionProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      onReorder(newItems);
    }
  };

  const filteredItems = items.filter(item => item.location === location);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {language === "ko" ? "네비게이션 항목이 없습니다" : "No navigation items"}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={filteredItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <SortableItem
                  key={item.id}
                  item={item}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  isUpdating={isUpdating}
                  language={language}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

export function NavigationManager() {
  const { language } = useTranslation();
  const { data: items, isLoading } = useNavigationItems();
  const { toggleEnabled, updateOrder, createItem, deleteItem } = useNavigationMutations();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    key: "",
    label_key: "",
    icon: "Star",
    path: "",
    location: "bottom" as NavigationLocation,
  });

  const handleToggle = (id: string, enabled: boolean) => {
    toggleEnabled.mutate({ id, enabled }, {
      onSuccess: () => {
        toast.success(language === "ko" ? "설정이 저장되었습니다" : "Settings saved");
      },
      onError: () => {
        toast.error(language === "ko" ? "저장에 실패했습니다" : "Failed to save");
      },
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm(language === "ko" ? "이 메뉴를 삭제하시겠습니까?" : "Delete this menu item?")) {
      return;
    }
    deleteItem.mutate(id, {
      onSuccess: () => {
        toast.success(language === "ko" ? "삭제되었습니다" : "Deleted");
      },
      onError: () => {
        toast.error(language === "ko" ? "삭제에 실패했습니다" : "Failed to delete");
      },
    });
  };

  const handleReorder = (location: NavigationLocation) => (reorderedItems: NavigationItem[]) => {
    const updates = reorderedItems.map((item, index) => ({
      id: item.id,
      order_index: index + 1,
    }));
    updateOrder.mutate(updates, {
      onError: () => {
        toast.error(language === "ko" ? "순서 변경에 실패했습니다" : "Failed to reorder");
      },
    });
  };

  const handleAddItem = () => {
    if (!newItem.key || !newItem.label_key) {
      toast.error(language === "ko" ? "필수 항목을 입력해주세요" : "Please fill required fields");
      return;
    }

    const maxOrder = items?.filter(i => i.location === newItem.location)
      .reduce((max, i) => Math.max(max, i.order_index), 0) || 0;

    createItem.mutate({
      key: newItem.key,
      label_key: newItem.label_key,
      icon: newItem.icon,
      path: newItem.path || null,
      match_pattern: newItem.path || null,
      location: newItem.location,
      enabled: true,
      order_index: maxOrder + 1,
      role_required: null,
      is_system: false,
    }, {
      onSuccess: () => {
        toast.success(language === "ko" ? "메뉴가 추가되었습니다" : "Menu item added");
        setAddDialogOpen(false);
        setNewItem({ key: "", label_key: "", icon: "Star", path: "", location: "bottom" });
      },
      onError: () => {
        toast.error(language === "ko" ? "추가에 실패했습니다" : "Failed to add");
      },
    });
  };

  const bottomItems = items?.filter(i => i.location === "bottom") || [];

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-blue-500" />
            <CardTitle>
              {language === "ko" ? "네비게이션 관리" : "Navigation Management"}
            </CardTitle>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                {language === "ko" ? "메뉴 추가" : "Add Menu"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {language === "ko" ? "새 메뉴 추가" : "Add New Menu"}
                </DialogTitle>
                <DialogDescription>
                  {language === "ko" 
                    ? "새로운 네비게이션 메뉴를 추가합니다" 
                    : "Add a new navigation menu item"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>{language === "ko" ? "키 (고유 식별자)" : "Key (Unique ID)"}</Label>
                  <Input
                    value={newItem.key}
                    onChange={(e) => setNewItem({ ...newItem, key: e.target.value })}
                    placeholder="my-menu"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === "ko" ? "번역 키" : "Translation Key"}</Label>
                  <Input
                    value={newItem.label_key}
                    onChange={(e) => setNewItem({ ...newItem, label_key: e.target.value })}
                    placeholder="navigation.myMenu"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === "ko" ? "경로" : "Path"}</Label>
                  <Input
                    value={newItem.path}
                    onChange={(e) => setNewItem({ ...newItem, path: e.target.value })}
                    placeholder="/my-page"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === "ko" ? "아이콘" : "Icon"}</Label>
                  <Select
                    value={newItem.icon}
                    onValueChange={(value) => setNewItem({ ...newItem, icon: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(iconMap).map((iconName) => (
                        <SelectItem key={iconName} value={iconName}>
                          {iconName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{language === "ko" ? "위치" : "Location"}</Label>
                  <Select
                    value={newItem.location}
                    onValueChange={(value) => setNewItem({ ...newItem, location: value as NavigationLocation })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom">
                        {language === "ko" ? "하단 네비게이션" : "Bottom Navigation"}
                      </SelectItem>
                      <SelectItem value="top">
                        {language === "ko" ? "상단 아이콘바" : "Top Icon Bar"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  {language === "ko" ? "취소" : "Cancel"}
                </Button>
                <Button onClick={handleAddItem} disabled={createItem.isPending}>
                  {language === "ko" ? "추가" : "Add"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>
          {language === "ko" 
            ? "앱의 네비게이션 메뉴를 관리합니다. 드래그하여 순서를 변경하고, 스위치로 활성/비활성 상태를 제어할 수 있습니다."
            : "Manage app navigation menus. Drag to reorder, toggle to enable/disable."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <NavigationSection
          title={language === "ko" ? "📱 하단 네비게이션" : "📱 Bottom Navigation"}
          description={language === "ko" 
            ? "모바일/태블릿 하단에 표시되는 메뉴입니다"
            : "Menus shown at the bottom on mobile/tablet"}
          icon={<Smartphone className="h-4 w-4 text-muted-foreground" />}
          location="bottom"
          items={items || []}
          isLoading={isLoading}
          onToggle={handleToggle}
          onDelete={handleDelete}
          onReorder={handleReorder("bottom")}
          isUpdating={toggleEnabled.isPending || updateOrder.isPending}
          language={language}
        />
      </CardContent>
    </Card>
  );
}
