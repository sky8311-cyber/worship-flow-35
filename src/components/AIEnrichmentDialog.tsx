import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, Sparkles, Info } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BilingualTag {
  ko: string;
  en: string;
}

interface Suggestions {
  lyrics?: string;
  default_key?: string;
  category?: string;
  tags?: BilingualTag[];
  confidence?: 'high' | 'medium' | 'low';
  notes?: string;
}

interface AIEnrichmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions: Suggestions;
  currentValues: {
    lyrics?: string;
    default_key?: string;
    category?: string;
    tags?: string[];
  };
  onApply: (selectedFields: {
    lyrics?: string;
    default_key?: string;
    category?: string;
    tags?: string[];
  }) => void;
}

export const AIEnrichmentDialog = ({
  open,
  onOpenChange,
  suggestions,
  currentValues,
  onApply
}: AIEnrichmentDialogProps) => {
  const { t } = useTranslation();
  const [selectedFields, setSelectedFields] = useState({
    lyrics: !!suggestions.lyrics,
    default_key: !!suggestions.default_key,
    category: !!suggestions.category,
    tags: new Set(suggestions.tags?.map((_, index) => index) || [])
  });
  const [lyricsExpanded, setLyricsExpanded] = useState(false);

  const handleToggleField = (field: keyof typeof selectedFields) => {
    if (field === 'tags') return; // Tags handled separately
    setSelectedFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleToggleTag = (index: number) => {
    setSelectedFields(prev => {
      const newTags = new Set(prev.tags);
      if (newTags.has(index)) {
        newTags.delete(index);
      } else {
        newTags.add(index);
      }
      return { ...prev, tags: newTags };
    });
  };

  const handleApply = () => {
    const result: any = {};
    
    if (selectedFields.lyrics && suggestions.lyrics) {
      result.lyrics = suggestions.lyrics;
    }
    if (selectedFields.default_key && suggestions.default_key) {
      result.default_key = suggestions.default_key;
    }
    if (selectedFields.category && suggestions.category) {
      result.category = suggestions.category;
    }
    if (selectedFields.tags.size > 0 && suggestions.tags) {
      const selectedTagObjects = Array.from(selectedFields.tags)
        .map(index => suggestions.tags![index])
        .filter(Boolean);
      result.tags = selectedTagObjects.map(tag => `${tag.ko} (${tag.en})`);
    }

    onApply(result);
    onOpenChange(false);
  };

  const getConfidenceBadge = () => {
    const colors = {
      high: 'bg-green-100 text-green-800 border-green-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-red-100 text-red-800 border-red-300'
    };
    
    const labels = {
      high: t('aiEnrich.confidenceHigh'),
      medium: t('aiEnrich.confidenceMedium'),
      low: t('aiEnrich.confidenceLow')
    };

    const confidence = suggestions.confidence || 'medium';
    return (
      <Badge variant="outline" className={colors[confidence]}>
        {labels[confidence]}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle>{t('aiEnrich.dialogTitle')}</DialogTitle>
            {getConfidenceBadge()}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('aiEnrich.reviewNote')}
            </p>

            {suggestions.notes && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {suggestions.notes}
                </AlertDescription>
              </Alert>
            )}

            {/* Key */}
            {suggestions.default_key && (
              <div className="flex items-center space-x-2 p-3 rounded-lg border">
                <Checkbox
                  id="key"
                  checked={selectedFields.default_key}
                  onCheckedChange={() => handleToggleField('default_key')}
                />
                <label htmlFor="key" className="flex-1 cursor-pointer">
                  <span className="font-medium">{t('aiEnrich.key')}:</span> {suggestions.default_key}
                  {currentValues.default_key && (
                    <span className="text-sm text-muted-foreground ml-2">
                      ({t('aiEnrich.currentValue', { value: currentValues.default_key })})
                    </span>
                  )}
                </label>
              </div>
            )}

            {/* Category */}
            {suggestions.category && (
              <div className="flex items-center space-x-2 p-3 rounded-lg border">
                <Checkbox
                  id="category"
                  checked={selectedFields.category}
                  onCheckedChange={() => handleToggleField('category')}
                />
                <label htmlFor="category" className="flex-1 cursor-pointer">
                  <span className="font-medium">{t('aiEnrich.category')}:</span> {suggestions.category}
                  {currentValues.category && (
                    <span className="text-sm text-muted-foreground ml-2">
                      ({t('aiEnrich.currentValue', { value: currentValues.category })})
                    </span>
                  )}
                </label>
              </div>
            )}

            {/* Tags */}
            {suggestions.tags && suggestions.tags.length > 0 && (
              <div className="space-y-2 p-3 rounded-lg border">
                <div className="font-medium mb-2">{t('aiEnrich.suggestedTags')}:</div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.tags.map((tag, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Checkbox
                        id={`tag-${index}`}
                        checked={selectedFields.tags.has(index)}
                        onCheckedChange={() => handleToggleTag(index)}
                      />
                      <label
                        htmlFor={`tag-${index}`}
                        className="cursor-pointer"
                      >
                        <Badge variant="secondary">
                          {tag.ko} ({tag.en})
                        </Badge>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lyrics */}
            {suggestions.lyrics && (
              <Collapsible
                open={lyricsExpanded}
                onOpenChange={setLyricsExpanded}
                className="border rounded-lg"
              >
                <div className="flex items-center space-x-2 p-3">
                  <Checkbox
                    id="lyrics"
                    checked={selectedFields.lyrics}
                    onCheckedChange={() => handleToggleField('lyrics')}
                  />
                  <CollapsibleTrigger className="flex-1 flex items-center justify-between cursor-pointer">
                    <span className="font-medium">{t('aiEnrich.suggestedLyrics')}</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        lyricsExpanded ? 'transform rotate-180' : ''
                      }`}
                    />
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <div className="px-3 pb-3">
                    <ScrollArea className="h-48 rounded border bg-muted/30 p-3">
                      <pre className="text-sm whitespace-pre-wrap font-sans">
                        {suggestions.lyrics}
                      </pre>
                    </ScrollArea>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleApply}>
            {t('aiEnrich.applySelected')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
