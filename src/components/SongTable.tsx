import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Youtube, Edit, Trash2, Filter, ArrowUp, ArrowDown, Plus, BarChart3, Check, Lock } from "lucide-react";
import { FileMusic } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScorePreviewDialog } from "./ScorePreviewDialog";
import { SongUsageHistoryDialog } from "./SongUsageHistoryDialog";
import { FavoriteButton } from "./FavoriteButton";

// Helper function to check if song is new (within 14 days)
const isNewSong = (createdAt: string | null) => {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  return created > fourteenDaysAgo;
};

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
  isInCart?: (songId: string) => boolean;
  onToggleCart?: (song: any) => void;
  favoriteIds?: Set<string>;
  favoriteCounts?: Map<string, number>;
  usageCounts?: Map<string, number>;
  // Selector mode props - for use in SongSelector dialog
  selectorMode?: boolean;
  selectedForSet?: Set<string>;
  onSelectForSet?: (song: any, selectedKey?: string, selectedScoreUrl?: string) => void;
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
  onColumnSort,
  isInCart,
  onToggleCart,
  favoriteIds = new Set(),
  favoriteCounts = new Map(),
  usageCounts = new Map(),
  selectorMode = false,
  selectedForSet = new Set(),
  onSelectForSet,
}: SongTableProps) => {
  const { t } = useTranslation();
  const { isAdmin, isWorshipLeader } = useAuth();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [songToDelete, setSongToDelete] = useState<any>(null);
  const [scorePreviewOpen, setScorePreviewOpen] = useState(false);
  const [usageHistoryOpen, setUsageHistoryOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [filterInputs, setFilterInputs] = useState<Record<string, string>>({});
  
  // Song usage history is available only to Basic Members and above (worship leaders, admins)
  // Regular team members cannot access this feature
  const canViewUsageHistory = isAdmin || isWorshipLeader;

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

  // Category removed - now using topics

  const getLanguageTranslation = (language: string | null) => {
    if (!language) return "-";
    const languageMap: Record<string, string> = {
      "KO": t("songLibrary.languages.ko"),
      "EN": t("songLibrary.languages.en"),
      "KO/EN": t("songLibrary.languages.koen"),
    };
    return languageMap[language] || language;
  };

const handleDelete = async (song: any) => {
    try {
      // Check if song is used in any worship sets
      const { count } = await supabase
        .from("set_songs")
        .select("*", { count: "exact", head: true })
        .eq("song_id", song.id);
      
      if (count && count > 0) {
        toast.error(
          t("songCard.cannotDeleteUsedSong").replace("{count}", String(count))
        );
        setDeleteDialogOpen(false);
        setSongToDelete(null);
        return;
      }

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
            <TableHead>{renderColumnHeader('language', t("songLibrary.tableHeaders.language"))}</TableHead>
            <TableHead>{renderColumnHeader('language', t("songLibrary.tableHeaders.language"))}</TableHead>
            <TableHead>{renderColumnHeader('key', t("songLibrary.tableHeaders.key"), false)}</TableHead>
            <TableHead>{renderColumnHeader('tags', t("songLibrary.tableHeaders.tags"), false)}</TableHead>
            <TableHead>{t("songLibrary.tableHeaders.actions")}</TableHead>
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
                        <div className="flex items-baseline gap-1.5">
                          <span 
                            onClick={() => onEdit?.(song)}
                            className="cursor-pointer hover:underline hover:text-primary transition-colors"
                          >
                            {song.title}
                          </span>
                          {isNewSong(song.created_at) && (
                            <sup className="ml-0.5 bg-green-500 text-white text-[8px] font-bold px-1 py-0 rounded leading-none">
                              N
                            </sup>
                          )}
                          {song.is_private && (
                            <Badge variant="secondary" className="text-xs gap-0.5 shrink-0">
                              <Lock className="w-3 h-3" />
                              {t("songDialog.private")}
                            </Badge>
                          )}
                        </div>
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
                   <TableCell>
                     {!bulkEditMode && (
                       <div className="flex items-center gap-1">
                          {selectorMode && onSelectForSet && (
                           <Button
                             variant={selectedForSet.has(song.id) ? "default" : "ghost"}
                             size="sm"
                             onClick={() => onSelectForSet(song, song.default_key, song.score_file_url)}
                             className="h-8"
                           >
                             {selectedForSet.has(song.id) ? (
                               <><Check className="h-4 w-4 mr-1" />{t("songSelector.selected")}</>
                             ) : (
                               <>
                                 <Plus className="h-4 w-4 mr-1" />
                                 {song.is_private && <Lock className="h-4 w-4 mr-1" />}
                                 {t("songSelector.addToSet")}
                               </>
                             )}
                           </Button>
                         )}
                         {!selectorMode && onToggleCart && (
                           <Button
                             variant={isInCart?.(song.id) ? "default" : "ghost"}
                             size="icon"
                             onClick={() => onToggleCart(song)}
                             className="h-8 w-8"
                             title={isInCart?.(song.id) ? t("songLibrary.inCart") : t("songLibrary.addToCart")}
                           >
                             <Plus className="h-4 w-4" />
                           </Button>
                         )}
                         {canViewUsageHistory && (
                           <Button
                             variant="ghost"
                             size="icon"
                             onClick={() => {
                               setSelectedSong(song);
                               setUsageHistoryOpen(true);
                             }}
                             className="h-8 w-8 relative"
                             title={t("songUsage.viewUsageHistory")}
                           >
                             <BarChart3 className="h-4 w-4" />
                              {(usageCounts.get(song.id) || 0) > 0 && (
                                <span className="absolute -top-1 -right-1.5 bg-primary text-primary-foreground text-[10px] rounded-full h-4 min-w-4 flex items-center justify-center font-bold px-1">
                                  {(usageCounts.get(song.id) || 0) > 99 ? "99+" : usageCounts.get(song.id)}
                                </span>
                              )}
                           </Button>
                         )}
                          <FavoriteButton 
                            songId={song.id} 
                            isFavorite={favoriteIds.has(song.id)}
                            favoriteCount={favoriteCounts.get(song.id) || 0}
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8" 
                          />
                         {song.youtube_url && (
                           <Button
                             variant="ghost"
                             size="icon"
                             onClick={() => handleYoutubeClick(song.youtube_url)}
                             className="h-8 w-8"
                             title={t("songCard.viewYouTube")}
                           >
                             <Youtube className="h-4 w-4 text-red-500" />
                           </Button>
                         )}
                         {song.score_file_url && (
                           <Button
                             variant="ghost"
                             size="icon"
                             onClick={() => handlePreviewScore(song)}
                             className="h-8 w-8"
                             title={t("songCard.viewScore")}
                           >
                             <FileMusic className="h-4 w-4 text-blue-500" />
                           </Button>
                         )}
                         {onEdit && (
                           <Button
                             variant="ghost"
                             size="icon"
                             onClick={() => onEdit(song)}
                             className="h-8 w-8"
                             title={t("common.edit")}
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
                             title={t("common.delete")}
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
            <AlertDialogTitle>{t("common.confirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("songCard.deleteConfirm")} ({songToDelete?.title})
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSongToDelete(null)}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(songToDelete)}>
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
      
      <SongUsageHistoryDialog
        open={usageHistoryOpen}
        onOpenChange={setUsageHistoryOpen}
        songId={selectedSong?.id || ""}
        songTitle={selectedSong?.title || ""}
      />
    </>
  );
};
