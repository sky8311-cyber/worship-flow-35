import * as React from "react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, Check, ChevronsUpDown } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface TopicSelectorProps {
  selectedTopics: string[];
  onTopicsChange: (topics: string[]) => void;
  maxTopics?: number;
  minTopics?: number;
}

interface Topic {
  id: string;
  name_ko: string;
  name_en: string | null;
}

export const TopicSelector = ({ 
  selectedTopics, 
  onTopicsChange,
  maxTopics = 3,
  minTopics = 2 
}: TopicSelectorProps) => {
  const { t, language } = useTranslation();
  const { isAdmin } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const { data: topics = [], isLoading } = useQuery({
    queryKey: ["song-topics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("song_topics")
        .select("id, name_ko, name_en")
        .order("name_ko");
      if (error) throw error;
      return data as Topic[];
    },
  });

  const addTopicMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("song_topics")
        .insert({ name_ko: name.trim() })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (newTopic) => {
      queryClient.invalidateQueries({ queryKey: ["song-topics"] });
      handleSelect(newTopic.name_ko);
      setSearchValue("");
      toast.success(language === "ko" ? "새 주제가 추가되었습니다" : "New topic added");
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate")) {
        toast.error(language === "ko" ? "이미 존재하는 주제입니다" : "Topic already exists");
      } else {
        toast.error(language === "ko" ? "주제 추가에 실패했습니다" : "Failed to add topic");
      }
    },
  });

  const handleSelect = (topicName: string) => {
    if (selectedTopics.includes(topicName)) {
      onTopicsChange(selectedTopics.filter(t => t !== topicName));
    } else {
      if (selectedTopics.length >= maxTopics) {
        toast.error(
          language === "ko" 
            ? `주제는 최대 ${maxTopics}개까지 선택 가능합니다` 
            : `Maximum ${maxTopics} topics allowed`
        );
        return;
      }
      onTopicsChange([...selectedTopics, topicName]);
    }
  };

  const handleRemoveTopic = (topicName: string) => {
    onTopicsChange(selectedTopics.filter(t => t !== topicName));
  };

  const handleAddNew = () => {
    if (!searchValue.trim()) return;
    addTopicMutation.mutate(searchValue);
  };

  const getDisplayName = (topic: Topic) => {
    if (language === "en" && topic.name_en) {
      return topic.name_en;
    }
    return topic.name_ko;
  };

  const filteredTopics = topics.filter(topic => {
    const search = searchValue.toLowerCase();
    return (
      topic.name_ko.toLowerCase().includes(search) ||
      (topic.name_en?.toLowerCase().includes(search) ?? false)
    );
  });

  const showAddNew = isAdmin && searchValue.trim() && 
    !topics.some(t => t.name_ko.toLowerCase() === searchValue.toLowerCase().trim());

  const TriggerButton = (
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className="w-full justify-between h-auto min-h-10 py-2 text-base"
    >
      <span className="text-muted-foreground">
        {language === "ko" 
          ? `주제 선택 (${minTopics}-${maxTopics}개)` 
          : `Select topics (${minTopics}-${maxTopics})`}
      </span>
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  );

  const CommandContent = (
    <Command shouldFilter={false}>
      <CommandInput 
        placeholder={language === "ko" ? "주제 검색..." : "Search topics..."}
        value={searchValue}
        onValueChange={setSearchValue}
        className="text-base"
      />
      <CommandList>
        <CommandEmpty>
          {isLoading 
            ? (language === "ko" ? "로딩 중..." : "Loading...")
            : (language === "ko" ? "주제가 없습니다" : "No topics found")
          }
        </CommandEmpty>
        <CommandGroup>
          {filteredTopics.map((topic) => (
            <CommandItem
              key={topic.id}
              value={topic.name_ko}
              onSelect={() => {
                handleSelect(topic.name_ko);
                if (!isMobile) {
                  // Keep popover open for multi-select on desktop
                }
              }}
              className="text-base py-3"
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  selectedTopics.includes(topic.name_ko) ? "opacity-100" : "opacity-0"
                )}
              />
              {getDisplayName(topic)}
            </CommandItem>
          ))}
        </CommandGroup>
        {showAddNew && (
          <CommandGroup>
            <CommandItem
              onSelect={handleAddNew}
              className="text-base py-3 text-primary"
            >
              <Plus className="mr-2 h-4 w-4" />
              {language === "ko" 
                ? `"${searchValue}" 추가 (관리자)` 
                : `Add "${searchValue}" (admin)`}
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );

  return (
    <div className="space-y-2">
      {/* Selected topics display */}
      {selectedTopics.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-background min-h-[40px]">
          {selectedTopics.map(topicName => {
            const topic = topics.find(t => t.name_ko === topicName);
            return (
              <Badge key={topicName} variant="secondary" className="gap-1 text-sm py-1">
                {topic ? getDisplayName(topic) : topicName}
                <button
                  type="button"
                  onClick={() => handleRemoveTopic(topicName)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
      
      {/* Topic selection trigger */}
      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            {TriggerButton}
          </DrawerTrigger>
          <DrawerContent>
            <div className="mt-4 border-t">
              {CommandContent}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            {TriggerButton}
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            {CommandContent}
          </PopoverContent>
        </Popover>
      )}

      {/* Validation hint */}
      <p className="text-xs text-muted-foreground">
        {language === "ko" 
          ? `${selectedTopics.length}/${maxTopics} 선택됨 (최소 ${minTopics}개 필수)` 
          : `${selectedTopics.length}/${maxTopics} selected (minimum ${minTopics} required)`}
      </p>
    </div>
  );
};

