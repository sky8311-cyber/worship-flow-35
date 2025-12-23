import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  List, FileEdit, CircleCheck, User, CalendarDays, Filter, X 
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export type MainFilterType = "all" | "mySets" | "upcoming" | "draft" | "published";

interface WorshipSetFiltersProps {
  mainFilter: MainFilterType;
  onMainFilterChange: (filter: MainFilterType) => void;
  // Column filters
  availableYears: number[];
  availableMonths: number[];
  availableLeaders: string[];
  availableServiceNames: string[];
  selectedYears: number[];
  selectedMonths: number[];
  selectedLeaders: string[];
  selectedServiceNames: string[];
  onYearsChange: (years: number[]) => void;
  onMonthsChange: (months: number[]) => void;
  onLeadersChange: (leaders: string[]) => void;
  onServiceNamesChange: (names: string[]) => void;
}

export const WorshipSetFilters = ({
  mainFilter,
  onMainFilterChange,
  availableYears,
  availableMonths,
  availableLeaders,
  availableServiceNames,
  selectedYears,
  selectedMonths,
  selectedLeaders,
  selectedServiceNames,
  onYearsChange,
  onMonthsChange,
  onLeadersChange,
  onServiceNamesChange,
}: WorshipSetFiltersProps) => {
  const { language } = useTranslation();

  const monthNames = language === "ko" 
    ? ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"]
    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const hasColumnFilters = selectedYears.length > 0 || selectedMonths.length > 0 || 
    selectedLeaders.length > 0 || selectedServiceNames.length > 0;

  const clearAllColumnFilters = () => {
    onYearsChange([]);
    onMonthsChange([]);
    onLeadersChange([]);
    onServiceNamesChange([]);
  };

  const toggleArrayItem = <T,>(arr: T[], item: T, setter: (items: T[]) => void) => {
    if (arr.includes(item)) {
      setter(arr.filter(i => i !== item));
    } else {
      setter([...arr, item]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button 
          variant={mainFilter === "all" ? "default" : "outline"}
          onClick={() => onMainFilterChange("all")}
          size="sm"
        >
          <List className="w-4 h-4" />
          {language === "ko" ? "전체보기" : "All"}
        </Button>
        <Button 
          variant={mainFilter === "mySets" ? "default" : "outline"}
          onClick={() => onMainFilterChange("mySets")}
          size="sm"
        >
          <User className="w-4 h-4" />
          {language === "ko" ? "내 세트" : "My Sets"}
        </Button>
        <Button 
          variant={mainFilter === "upcoming" ? "default" : "outline"}
          onClick={() => onMainFilterChange("upcoming")}
          size="sm"
        >
          <CalendarDays className="w-4 h-4" />
          {language === "ko" ? "다가오는 세트" : "Upcoming"}
        </Button>
        <Button 
          variant={mainFilter === "draft" ? "default" : "outline"}
          onClick={() => onMainFilterChange("draft")}
          size="sm"
        >
          <FileEdit className="w-4 h-4" />
          {language === "ko" ? "작성중" : "Draft"}
        </Button>
        <Button 
          variant={mainFilter === "published" ? "default" : "outline"}
          onClick={() => onMainFilterChange("published")}
          size="sm"
        >
          <CircleCheck className="w-4 h-4" />
          {language === "ko" ? "게시됨" : "Published"}
        </Button>
      </div>

      {/* Column Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <Filter className="w-4 h-4 text-muted-foreground" />
        
        {/* Year Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              {language === "ko" ? "년도" : "Year"}
              {selectedYears.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1">
                  {selectedYears.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-2" align="start">
            <ScrollArea className="h-48">
              <div className="space-y-1">
                {availableYears.map(year => (
                  <label 
                    key={year} 
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedYears.includes(year)}
                      onCheckedChange={() => toggleArrayItem(selectedYears, year, onYearsChange)}
                    />
                    <span className="text-sm">{year}</span>
                  </label>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Month Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              {language === "ko" ? "월" : "Month"}
              {selectedMonths.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1">
                  {selectedMonths.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-2" align="start">
            <ScrollArea className="h-64">
              <div className="space-y-1">
                {availableMonths.map(month => (
                  <label 
                    key={month} 
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedMonths.includes(month)}
                      onCheckedChange={() => toggleArrayItem(selectedMonths, month, onMonthsChange)}
                    />
                    <span className="text-sm">{monthNames[month - 1]}</span>
                  </label>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Worship Leader Filter */}
        {availableLeaders.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                {language === "ko" ? "예배인도자" : "Leader"}
                {selectedLeaders.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1">
                    {selectedLeaders.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start">
              <ScrollArea className="h-48">
                <div className="space-y-1">
                  {availableLeaders.map(leader => (
                    <label 
                      key={leader} 
                      className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedLeaders.includes(leader)}
                        onCheckedChange={() => toggleArrayItem(selectedLeaders, leader, onLeadersChange)}
                      />
                      <span className="text-sm truncate">{leader}</span>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        )}

        {/* Service Name Filter */}
        {availableServiceNames.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                {language === "ko" ? "예배이름" : "Service"}
                {selectedServiceNames.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1">
                    {selectedServiceNames.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start">
              <ScrollArea className="h-48">
                <div className="space-y-1">
                  {availableServiceNames.map(name => (
                    <label 
                      key={name} 
                      className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedServiceNames.includes(name)}
                        onCheckedChange={() => toggleArrayItem(selectedServiceNames, name, onServiceNamesChange)}
                      />
                      <span className="text-sm truncate">{name}</span>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        )}

        {/* Clear All Filters */}
        {hasColumnFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-muted-foreground"
            onClick={clearAllColumnFilters}
          >
            <X className="w-3 h-3 mr-1" />
            {language === "ko" ? "필터 초기화" : "Clear"}
          </Button>
        )}
      </div>

      {/* Active Filter Badges */}
      {hasColumnFilters && (
        <div className="flex gap-1 flex-wrap">
          {selectedYears.map(year => (
            <Badge key={`y-${year}`} variant="secondary" className="gap-1">
              {year}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onYearsChange(selectedYears.filter(y => y !== year))}
              />
            </Badge>
          ))}
          {selectedMonths.map(month => (
            <Badge key={`m-${month}`} variant="secondary" className="gap-1">
              {monthNames[month - 1]}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onMonthsChange(selectedMonths.filter(m => m !== month))}
              />
            </Badge>
          ))}
          {selectedLeaders.map(leader => (
            <Badge key={`l-${leader}`} variant="secondary" className="gap-1">
              {leader}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onLeadersChange(selectedLeaders.filter(l => l !== leader))}
              />
            </Badge>
          ))}
          {selectedServiceNames.map(name => (
            <Badge key={`s-${name}`} variant="secondary" className="gap-1">
              {name}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onServiceNamesChange(selectedServiceNames.filter(n => n !== name))}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
