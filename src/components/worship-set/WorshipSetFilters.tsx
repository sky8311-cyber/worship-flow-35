import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  List, FileEdit, CircleCheck, User, CalendarDays, Filter, X, SlidersHorizontal
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
  isMobile?: boolean;
}

export const WorshipSetFilters = ({
  mainFilter,
  onMainFilterChange,
  availableYears,
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
  isMobile = false,
}: WorshipSetFiltersProps) => {
  const { language } = useTranslation();
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Always show all 12 months
  const allMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const monthNames = language === "ko" 
    ? ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"]
    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const mainFilterOptions: { value: MainFilterType; label: string; icon: React.ReactNode }[] = [
    { value: "all", label: language === "ko" ? "전체보기" : "All", icon: <List className="w-4 h-4" /> },
    { value: "mySets", label: language === "ko" ? "내 세트" : "My Sets", icon: <User className="w-4 h-4" /> },
    { value: "upcoming", label: language === "ko" ? "다가오는 세트" : "Upcoming", icon: <CalendarDays className="w-4 h-4" /> },
    { value: "draft", label: language === "ko" ? "작성중" : "Draft", icon: <FileEdit className="w-4 h-4" /> },
    { value: "published", label: language === "ko" ? "게시됨" : "Published", icon: <CircleCheck className="w-4 h-4" /> },
  ];

  const hasColumnFilters = selectedYears.length > 0 || selectedMonths.length > 0 || 
    selectedLeaders.length > 0 || selectedServiceNames.length > 0;

  const totalColumnFilters = selectedYears.length + selectedMonths.length + 
    selectedLeaders.length + selectedServiceNames.length;

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

  // Select all / Deselect all helpers
  const selectAllYears = () => onYearsChange([...availableYears]);
  const deselectAllYears = () => onYearsChange([]);
  const selectAllMonths = () => onMonthsChange([...allMonths]);
  const deselectAllMonths = () => onMonthsChange([]);
  const selectAllLeaders = () => onLeadersChange([...availableLeaders]);
  const deselectAllLeaders = () => onLeadersChange([]);
  const selectAllServiceNames = () => onServiceNamesChange([...availableServiceNames]);
  const deselectAllServiceNames = () => onServiceNamesChange([]);

  const currentMainFilter = mainFilterOptions.find(opt => opt.value === mainFilter);

  // Mobile UI
  if (isMobile) {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          {/* Main Filter Select - Fixed: removed duplicate icon */}
          <Select value={mainFilter} onValueChange={(value) => onMainFilterChange(value as MainFilterType)}>
            <SelectTrigger className="flex-1 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mainFilterOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    {option.icon}
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Column Filters Sheet Trigger */}
          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-10 px-3 gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                {language === "ko" ? "필터" : "Filter"}
                {totalColumnFilters > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {totalColumnFilters}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto max-h-[80vh]">
              <SheetHeader className="pb-4">
                <SheetTitle className="flex items-center justify-between">
                  <span>{language === "ko" ? "상세 필터" : "Filters"}</span>
                  {hasColumnFilters && (
                    <Button variant="ghost" size="sm" onClick={clearAllColumnFilters}>
                      <X className="w-4 h-4 mr-1" />
                      {language === "ko" ? "초기화" : "Clear"}
                    </Button>
                  )}
                </SheetTitle>
              </SheetHeader>
              
              <Accordion type="single" collapsible className="w-full">
                {/* Year Filter */}
                <AccordionItem value="year">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{language === "ko" ? "연도" : "Year"}</span>
                      {selectedYears.length > 0 && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                          {selectedYears.length}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex gap-1 mb-2">
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={selectAllYears}>
                        {language === "ko" ? "전체선택" : "All"}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={deselectAllYears}>
                        {language === "ko" ? "전체해제" : "Clear"}
                      </Button>
                    </div>
                    <ScrollArea className="h-[180px]">
                      <div className="space-y-1 pr-4">
                        {availableYears.map(year => (
                          <label 
                            key={year} 
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer"
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
                  </AccordionContent>
                </AccordionItem>

                {/* Month Filter */}
                <AccordionItem value="month">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{language === "ko" ? "월" : "Month"}</span>
                      {selectedMonths.length > 0 && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                          {selectedMonths.length}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex gap-1 mb-2">
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={selectAllMonths}>
                        {language === "ko" ? "전체선택" : "All"}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={deselectAllMonths}>
                        {language === "ko" ? "전체해제" : "Clear"}
                      </Button>
                    </div>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-1 pr-4">
                        {allMonths.map(month => (
                          <label 
                            key={month} 
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer"
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
                  </AccordionContent>
                </AccordionItem>

                {/* Leader Filter */}
                {availableLeaders.length > 0 && (
                  <AccordionItem value="leader">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{language === "ko" ? "예배인도자" : "Leader"}</span>
                        {selectedLeaders.length > 0 && (
                          <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                            {selectedLeaders.length}
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex gap-1 mb-2">
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={selectAllLeaders}>
                          {language === "ko" ? "전체선택" : "All"}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={deselectAllLeaders}>
                          {language === "ko" ? "전체해제" : "Clear"}
                        </Button>
                      </div>
                      <ScrollArea className="h-[180px]">
                        <div className="space-y-1 pr-4">
                          {availableLeaders.map(leader => (
                            <label 
                              key={leader} 
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer"
                            >
                              <Checkbox
                                checked={selectedLeaders.includes(leader)}
                                onCheckedChange={() => toggleArrayItem(selectedLeaders, leader, onLeadersChange)}
                              />
                              <span className="text-sm">{leader}</span>
                            </label>
                          ))}
                        </div>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Service Name Filter */}
                {availableServiceNames.length > 0 && (
                  <AccordionItem value="serviceName">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{language === "ko" ? "예배이름" : "Service"}</span>
                        {selectedServiceNames.length > 0 && (
                          <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                            {selectedServiceNames.length}
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex gap-1 mb-2">
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={selectAllServiceNames}>
                          {language === "ko" ? "전체선택" : "All"}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={deselectAllServiceNames}>
                          {language === "ko" ? "전체해제" : "Clear"}
                        </Button>
                      </div>
                      <ScrollArea className="h-[180px]">
                        <div className="space-y-1 pr-4">
                          {availableServiceNames.map(name => (
                            <label 
                              key={name} 
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer"
                            >
                              <Checkbox
                                checked={selectedServiceNames.includes(name)}
                                onCheckedChange={() => toggleArrayItem(selectedServiceNames, name, onServiceNamesChange)}
                              />
                              <span className="text-sm">{name}</span>
                            </label>
                          ))}
                        </div>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>

              <div className="pt-4 border-t mt-4">
                <Button 
                  className="w-full" 
                  onClick={() => setFilterSheetOpen(false)}
                >
                  {language === "ko" ? "적용" : "Apply"}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Active Filter Badges (Mobile) */}
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
              <Badge key={`l-${leader}`} variant="secondary" className="gap-1 max-w-[120px]">
                <span className="truncate">{leader}</span>
                <X 
                  className="w-3 h-3 cursor-pointer flex-shrink-0" 
                  onClick={() => onLeadersChange(selectedLeaders.filter(l => l !== leader))}
                />
              </Badge>
            ))}
            {selectedServiceNames.map(name => (
              <Badge key={`s-${name}`} variant="secondary" className="gap-1 max-w-[120px]">
                <span className="truncate">{name}</span>
                <X 
                  className="w-3 h-3 cursor-pointer flex-shrink-0" 
                  onClick={() => onServiceNamesChange(selectedServiceNames.filter(n => n !== name))}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Desktop UI
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
              {language === "ko" ? "연도" : "Year"}
              {selectedYears.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1">
                  {selectedYears.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            <div className="flex gap-1 mb-2 border-b pb-2">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs flex-1" onClick={selectAllYears}>
                {language === "ko" ? "전체선택" : "Select All"}
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs flex-1" onClick={deselectAllYears}>
                {language === "ko" ? "전체해제" : "Clear"}
              </Button>
            </div>
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

        {/* Month Filter - Now shows all 12 months */}
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
          <PopoverContent className="w-48 p-2" align="start">
            <div className="flex gap-1 mb-2 border-b pb-2">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs flex-1" onClick={selectAllMonths}>
                {language === "ko" ? "전체선택" : "Select All"}
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs flex-1" onClick={deselectAllMonths}>
                {language === "ko" ? "전체해제" : "Clear"}
              </Button>
            </div>
            <ScrollArea className="h-64">
              <div className="space-y-1">
                {allMonths.map(month => (
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
              <div className="flex gap-1 mb-2 border-b pb-2">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs flex-1" onClick={selectAllLeaders}>
                  {language === "ko" ? "전체선택" : "Select All"}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs flex-1" onClick={deselectAllLeaders}>
                  {language === "ko" ? "전체해제" : "Clear"}
                </Button>
              </div>
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
              <div className="flex gap-1 mb-2 border-b pb-2">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs flex-1" onClick={selectAllServiceNames}>
                  {language === "ko" ? "전체선택" : "Select All"}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs flex-1" onClick={deselectAllServiceNames}>
                  {language === "ko" ? "전체해제" : "Clear"}
                </Button>
              </div>
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
