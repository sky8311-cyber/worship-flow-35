import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Eye, Youtube, Edit, Trash2, Filter, ArrowUp, ArrowDown, Plus } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScorePreviewDialog } from "./ScorePreviewDialog";
import { FavoriteButton } from "./FavoriteButton";
import { AddToSetDialog } from "./AddToSetDialog";
import { format } from "date-fns";

interface SongTableProps {
  songs: any[];
  onEdit?: (song: any) => void;
  onDelete?: () => void;
  selectionMode?: boolean;
  selectedSongs?: Set<string>;
  onToggleSelection?: (songId: string) => void;
  onSelectAll?: () => void;
  bulkEditMode?: boolean;
  editedSongs?: Record<string, any>;
  onUpdateEditedSong?: (songId: string, field: string, value: any) => void;
  columnFilters?: Record<string, string>;
  onColumnFilter?: (column: string, value: string) => void;
  columnSort?: { column: string | null; direction: 'asc' | 'desc' | null };
  onColumnSort?: (column: string, direction: 'asc' | 'desc') => void;
}

export const SongTable = ({ 
  songs, 
  onEdit, 
  onDelete,
  selectionMode = false,
  selectedSongs = new Set(),
  onToggleSelection,
  onSelectAll,
  bulkEditMode = false,
  editedSongs = {},
  onUpdateEditedSong,
  columnFilters = {},
  onColumnFilter,
  columnSort = { column: null, direction: null },
  onColumnSort
}: SongTableProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [songToDelete, setSongToDelete] = useState<any>(null);
  const [scorePreviewOpen, setScorePreviewOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [filterInputs, setFilterInputs] = useState<Record<string, string>>({});
  const [addToSetSong, setAddToSetSong] = useState<any>(null);
  const [addToSetOpen, setAddToSetOpen] = useState(false);

  const renderColumnHeader = (
    columnKey: string,
    label: string,
    sortable: boolean = true,
    filterable: boolean = true
  ) => {
    const hasActiveFilter = columnFilters[columnKey]?.trim();
    const isActiveSortColumn = columnSort.column === columnKey;

    return (
      <div className="flex items-center gap-2">
        <span>{label}</span>
        {(sortable || filterable) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`h-6 w-6 p-0 ${hasActiveFilter || isActiveSortColumn ? 'text-primary' : ''}`}
              >
                <Filter className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {sortable && (
                <>
                  <DropdownMenuItem onClick={() => onColumnSort?.(columnKey, 'asc')}>
                    <ArrowUp className="h-4 w-4 mr-2" />
                    {t("songLibrary.sortAsc")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onColumnSort?.(columnKey, 'desc')}>
                    <ArrowDown className="h-4 w-4 mr-2" />
                    {t("songLibrary.sortDesc")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {filterable && (
                <div className="p-2">
                  <Input
                    placeholder={t("songLibrary.filterPlaceholder")}
                    value={filterInputs[columnKey] || ''}
                    onChange={(e) => {
                      setFilterInputs({ ...filterInputs, [columnKey]: e.target.value });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onColumnFilter?.(columnKey, filterInputs[columnKey] || '');
                      }
                    }}
                    className="h-8"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="h-7 flex-1"
                      onClick={() => {
                        onColumnFilter?.(columnKey, filterInputs[columnKey] || '');
                      }}
                    >
                      {t("songLibrary.applyFilter")}
                    </Button>
                    {hasActiveFilter && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 flex-1"
                        onClick={() => {
                          setFilterInputs({ ...filterInputs, [columnKey]: '' });
                          onColumnFilter?.(columnKey, '');
                        }}
                      >
                        {t("songLibrary.clearFilter")}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  };

  const { data: serviceSets } = useQuery({
    queryKey: ["service-sets-for-songs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_sets")
        .select("id, date, set_songs(song_id)")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const getCategoryTranslation = (category: string | null) => {
    if (!category) return t("songLibrary.categories.uncategorized");
    const categoryMap: Record<string, string> = {
      "찬송가": t("songLibrary.categories.hymn"),
      "모던워십 (한국)": t("songLibrary.categories.modernKorean"),
      "모던워십 (서양)": t("songLibrary.categories.modernWestern"),
      "모던워십 (기타)": t("songLibrary.categories.modernOther"),
      "한국 복음성가": t("songLibrary.categories.koreanGospel"),
    };
    return categoryMap[category] || category;
  };

  const getLanguageTranslation = (language: string | null) => {
    if (!language) return "-";
    const languageMap: Record<string, string> = {
      "KO": t("songLibrary.languages.ko"),
      "EN": t("songLibrary.languages.en"),
      "KO/EN": t("songLibrary.languages.koen"),
    };
    return languageMap[language] || language;
  };

  const getLastUsedDate = (songId: string) => {
    if (!serviceSets) return t("songCard.never");
    
    const setsWithSong = serviceSets.filter(set => 
      set.set_songs?.some((ss: any) => ss.song_id === songId)
    );
    
    if (setsWithSong.length === 0) return t("songCard.never");
    
    const latestSet = setsWithSong[0];
    return format(new Date(latestSet.date), "yyyy-MM-dd");
  };

  const handleDelete = async (song: any) => {
    try {
      const { error } = await supabase.from("songs").delete().eq("id", song.id);
      if (error) throw error;
      
      // Invalidate queries for real-time UI update
      await queryClient.invalidateQueries({ queryKey: ["songs"] });
      
      toast.success(t("songCard.songDeleted"));
      setDeleteDialogOpen(false);
      setSongToDelete(null);
      if (onDelete) onDelete();
    } catch (error) {
      console.error("Error deleting song:", error);
      toast.error(t("songCard.deleteError"));
    }
  };

  const handlePreviewScore = (song: any) => {
    setSelectedSong(song);
    setScorePreviewOpen(true);
  };

  const handleYoutubeClick = (url: string | null) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
          <TableRow>
            {selectionMode && (
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedSongs.size === songs.length && songs.length > 0}
                  onCheckedChange={onSelectAll}
                />
              </TableHead>
            )}
            <TableHead>{renderColumnHeader('title', t("songLibrary.tableHeaders.title"))}</TableHead>
            <TableHead>{renderColumnHeader('artist', t("songLibrary.tableHeaders.artist"))}</TableHead>
            <TableHead>{renderColumnHeader('category', t("songLibrary.tableHeaders.category"))}</TableHead>
            <TableHead>{renderColumnHeader('language', t("songLibrary.tableHeaders.language"))}</TableHead>
            <TableHead>{renderColumnHeader('key', t("songLibrary.tableHeaders.key"), false)}</TableHead>
            <TableHead>{renderColumnHeader('tags', t("songLibrary.tableHeaders.tags"), false)}</TableHead>
            <TableHead>{t("songLibrary.tableHeaders.lastUsed")}</TableHead>
            <TableHead className="text-right">{t("songLibrary.tableHeaders.actions")}</TableHead>
          </TableRow>
          </TableHeader>
          <TableBody>
            {songs.map((song) => {
              const isEditable = bulkEditMode && selectedSongs.has(song.id);
              const displaySong = isEditable && editedSongs[song.id] ? editedSongs[song.id] : song;

              return (
                <TableRow key={song.id} className={selectionMode && selectedSongs.has(song.id) ? "bg-accent/50" : ""}>
                  {selectionMode && (
                    <TableCell>
                      <Checkbox
                        checked={selectedSongs.has(song.id)}
                        onCheckedChange={() => onToggleSelection?.(song.id)}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">
                    {isEditable ? (
                      <Input
                        value={displaySong.title}
                        onChange={(e) => onUpdateEditedSong?.(song.id, 'title', e.target.value)}
                        className="h-8 text-sm"
                      />
                    ) : (
                      <div>
                        <div>{song.title}</div>
                        {song.subtitle && (
                          <div className="text-xs text-muted-foreground">{song.subtitle}</div>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditable ? (
                      <Input
                        value={displaySong.artist || ''}
                        onChange={(e) => onUpdateEditedSong?.(song.id, 'artist', e.target.value)}
                        className="h-8 text-sm"
                      />
                    ) : (
                      <span>{song.artist || "-"}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditable ? (
                      <Select
                        value={displaySong.category || 'uncategorized'}
                        onValueChange={(value) => 
                          onUpdateEditedSong?.(song.id, 'category', value === 'uncategorized' ? null : value)
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="uncategorized">{t("songLibrary.categories.uncategorized")}</SelectItem>
                          <SelectItem value="찬송가">{t("songLibrary.categories.hymn")}</SelectItem>
                          <SelectItem value="모던워십 (한국)">{t("songLibrary.categories.modernKorean")}</SelectItem>
                          <SelectItem value="모던워십 (서양)">{t("songLibrary.categories.modernWestern")}</SelectItem>
                          <SelectItem value="모던워십 (기타)">{t("songLibrary.categories.modernOther")}</SelectItem>
                          <SelectItem value="한국 복음성가">{t("songLibrary.categories.koreanGospel")}</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        {getCategoryTranslation(song.category)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditable ? (
                      <Select
                        value={displaySong.language || ''}
                        onValueChange={(value) => onUpdateEditedSong?.(song.id, 'language', value)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="KO">{t("songLibrary.languages.ko")}</SelectItem>
                          <SelectItem value="EN">{t("songLibrary.languages.en")}</SelectItem>
                          <SelectItem value="KO/EN">{t("songLibrary.languages.koen")}</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        {getLanguageTranslation(song.language)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditable ? (
                      <Input
                        value={displaySong.default_key || ''}
                        onChange={(e) => onUpdateEditedSong?.(song.id, 'default_key', e.target.value)}
                        className="h-8 text-sm w-16"
                      />
                    ) : (
                      <span>{song.default_key || "-"}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditable ? (
                      <Input
                        value={displaySong.tags || ''}
                        onChange={(e) => onUpdateEditedSong?.(song.id, 'tags', e.target.value)}
                        className="h-8 text-sm"
                        placeholder="tag1, tag2"
                      />
                    ) : (
                      song.tags ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {song.tags.split(',').slice(0, 2).map((tag: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag.trim()}
                            </Badge>
                          ))}
                          {song.tags.split(',').length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{song.tags.split(',').length - 2}
                            </span>
                          )}
                        </div>
                      ) : "-"
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getLastUsedDate(song.id)}
                  </TableCell>
                  <TableCell>
                    {!bulkEditMode && (
                      <div className="flex items-center justify-end gap-1">
                        <FavoriteButton songId={song.id} size="icon" variant="ghost" />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setAddToSetSong(song);
                            setAddToSetOpen(true);
                          }}
                          title="워십세트에 추가"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleYoutubeClick(song.youtube_url)}
                          disabled={!song.youtube_url}
                          title={song.youtube_url ? t("songCard.viewYouTube") : "No YouTube link"}
                        >
                          <Youtube className={`h-4 w-4 ${!song.youtube_url ? 'opacity-50' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handlePreviewScore(song)}
                          disabled={!song.score_file_url}
                          title={song.score_file_url ? t("songLibrary.previewScore") : "No score file"}
                        >
                          <Eye className={`h-4 w-4 ${!song.score_file_url ? 'opacity-50' : ''}`} />
                        </Button>
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onEdit(song)}
                            title={t("songCard.edit")}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => {
                              setSongToDelete(song);
                              setDeleteDialogOpen(true);
                            }}
                            title={t("songCard.delete")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("songCard.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>{t("songCard.confirmDeleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => songToDelete && handleDelete(songToDelete)}>
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ScorePreviewDialog
        open={scorePreviewOpen}
        onOpenChange={setScorePreviewOpen}
        scoreUrl={selectedSong?.score_file_url}
        songTitle={selectedSong?.title || ""}
        songId={selectedSong?.id}
      />
      <AddToSetDialog 
        open={addToSetOpen}
        onOpenChange={setAddToSetOpen}
        song={addToSetSong}
      />
    </>
  );
};
