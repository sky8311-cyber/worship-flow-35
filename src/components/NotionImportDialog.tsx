import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { parseNotionMarkdown, matchImageFile, ParsedNotionSet } from "@/lib/notionParser";
import { findOrCreateSong } from "@/lib/songMatcher";
import { useTranslation } from "@/hooks/useTranslation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, FileText, Image as ImageIcon, CheckCircle, AlertCircle, AlertTriangle, Youtube, FileImage } from "lucide-react";

interface NotionImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

interface ValidationIssue {
  setIndex: number;
  serviceName: string;
  type: 'count_mismatch' | 'missing_images';
  expectedCount?: number;
  foundCount?: number;
  expectedSongs?: string[];
  foundSongs?: string[];
  unmatchedImages?: string[];
}

export function NotionImportDialog({
  open,
  onOpenChange,
  onImportComplete,
}: NotionImportDialogProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'upload' | 'validate' | 'preview' | 'importing' | 'complete'>('upload');
  const [uploadType, setUploadType] = useState<'folder' | 'files'>('folder');
  const [allFiles, setAllFiles] = useState<File[]>([]);
  const [mdFiles, setMdFiles] = useState<File[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [parsedSets, setParsedSets] = useState<ParsedNotionSet[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<string>('');
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResults, setImportResults] = useState({
    setsCreated: 0,
    songsCreated: 0,
    songsUpdated: 0,
    errors: [] as string[],
    imageErrors: [] as string[],
  });

  // Fetch user's communities
  const { data: communities = [] } = useQuery({
    queryKey: ['user-communities'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Fetch communities where user is leader
      const { data: leaderCommunities } = await supabase
        .from('worship_communities')
        .select('id, name')
        .eq('leader_id', user.id);

      // Fetch communities where user is member
      const { data: memberCommunities } = await supabase
        .from('community_members')
        .select('community_id, worship_communities(id, name)')
        .eq('user_id', user.id);

      const allCommunities = [
        ...(leaderCommunities || []),
        ...(memberCommunities?.map(m => m.worship_communities).filter(Boolean) || []),
      ];

      // Deduplicate by id
      return Array.from(new Map(allCommunities.map((c: any) => [c.id, c])).values());
    },
    enabled: open,
  });

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
  };

  const handleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
  };

  const validateParsedSets = (sets: ParsedNotionSet[], images: File[]): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];
    
    sets.forEach((set, idx) => {
      // Check song count mismatch
      if (set.songsList && set.songsList.length !== set.songs.length) {
        issues.push({
          setIndex: idx,
          serviceName: set.serviceName,
          type: 'count_mismatch',
          expectedCount: set.songsList.length,
          foundCount: set.songs.length,
          expectedSongs: set.songsList,
          foundSongs: set.songs.map(s => s.title),
        });
      }
      
      // Check unmatched images
      const unmatchedRefs = set.songs
        .filter(s => s.scoreImageRef && !matchImageFile(s.scoreImageRef, images))
        .map(s => s.scoreImageRef!);
        
      if (unmatchedRefs.length > 0) {
        issues.push({
          setIndex: idx,
          serviceName: set.serviceName,
          type: 'missing_images',
          unmatchedImages: unmatchedRefs,
        });
      }
    });
    
    return issues;
  };

  const processFiles = async (files: File[]) => {
    setAllFiles(files);

    // Separate MD files and image files
    const md = files.filter(f => f.name.endsWith('.md'));
    const images = files.filter(f => 
      /\.(jpg|jpeg|png|gif|webp|pdf)$/i.test(f.name)
    );

    setMdFiles(md);
    setImageFiles(images);

    if (md.length === 0) {
      toast.error("No .md files found");
      return;
    }

    // Parse all MD files
    const parsed: ParsedNotionSet[] = [];
    for (const file of md) {
      try {
        const content = await file.text();
        const result = parseNotionMarkdown(content, file.name);
        if (result) {
          parsed.push(result);
        }
      } catch (error) {
        console.error(`Failed to parse ${file.name}:`, error);
        toast.error(`Failed to parse ${file.name}`);
      }
    }

    if (parsed.length === 0) {
      toast.error("No valid worship sets found");
      return;
    }

    setParsedSets(parsed);
    
    // Validate parsed sets
    const issues = validateParsedSets(parsed, images);
    setValidationIssues(issues);
    
    if (issues.length > 0) {
      setStep('validate'); // Go to validation step first
    } else {
      setStep('preview'); // Skip validation if no issues
    }
    
    toast.success(t("songLibrary.notionImport.parseSuccess", { count: parsed.length }));
  };

  const handleImport = async () => {
    if (!selectedCommunity) {
      toast.error(t("songLibrary.notionImport.selectCommunity"));
      return;
    }

    setStep('importing');
    setImportProgress({ current: 0, total: parsedSets.length });

    const results = {
      setsCreated: 0,
      songsCreated: 0,
      songsUpdated: 0,
      errors: [] as string[],
      imageErrors: [] as string[],
    };

    for (let i = 0; i < parsedSets.length; i++) {
      const set = parsedSets[i];
      try {
        await importSingleSet(set, imageFiles, selectedCommunity, results);
        results.setsCreated++;
      } catch (error: any) {
        results.errors.push(`${set.serviceName}: ${error.message}`);
      }
      setImportProgress({ current: i + 1, total: parsedSets.length });
    }

    setImportResults(results);
    setStep('complete');
    onImportComplete?.();
  };

  const importSingleSet = async (
    set: ParsedNotionSet,
    imageFiles: File[],
    communityId: string,
    results: any
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // 1. Upload matched score images with detailed error tracking
    const scoreUrls: Record<string, string> = {};
    for (const song of set.songs) {
      if (song.scoreImageRef) {
        const imageFile = matchImageFile(song.scoreImageRef, imageFiles);
        
        if (!imageFile) {
          // Image file not found
          const errorMsg = `${song.title}: 이미지 파일 "${song.scoreImageRef}"를 찾을 수 없습니다`;
          results.imageErrors.push(errorMsg);
          console.warn(`⚠️ ${errorMsg}`);
          continue;
        }
        
        try {
          const url = await uploadScoreImage(imageFile, song.title);
          scoreUrls[song.scoreImageRef] = url;
          console.log(`✅ Image uploaded for ${song.title}: ${url}`);
        } catch (error: any) {
          // Upload failed - record detailed error
          const errorMsg = `${song.title}: 이미지 업로드 실패 - ${error.message}`;
          results.imageErrors.push(errorMsg);
          console.error(`❌ ${errorMsg}`, error);
        }
      }
    }

    // 2. Find or create songs
    const songIds: string[] = [];
    for (const song of set.songs) {
      const scoreUrl = song.scoreImageRef ? scoreUrls[song.scoreImageRef] : undefined;
      const { id, created, updated } = await findOrCreateSong(song, scoreUrl);
      songIds.push(id);
      if (created) results.songsCreated++;
      if (updated) results.songsUpdated++;
    }

    // 3. Create service set
    const { data: serviceSet, error: setError } = await supabase
      .from('service_sets')
      .insert({
        date: set.date,
        service_name: set.serviceName,
        theme: set.area,
        created_by: user.id,
        community_id: communityId,
        status: 'published',
        is_public: false,
      })
      .select('id')
      .single();

    if (setError) throw setError;

    // 4. Link songs to set
    const setSongs = set.songs.map((song, idx) => ({
      service_set_id: serviceSet.id,
      song_id: songIds[idx],
      position: song.position,
      key: song.key || null,
      override_youtube_url: song.youtubeUrl || null,
      override_score_file_url: song.scoreImageRef ? scoreUrls[song.scoreImageRef] : null,
    }));

    const { error: songsError } = await supabase.from('set_songs').insert(setSongs);
    if (songsError) throw songsError;
  };

  const uploadScoreImage = async (file: File, songTitle: string): Promise<string> => {
    console.log(`📤 Uploading image for "${songTitle}":`, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    const sanitized = songTitle.replace(/[^a-zA-Z0-9가-힣]/g, '_');
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${sanitized}.${fileExt}`;

    const { error } = await supabase.storage
      .from('scores')
      .upload(fileName, file);

    if (error) {
      console.error(`❌ Upload failed for "${songTitle}":`, error);
      throw error;
    }

    const { data } = supabase.storage.from('scores').getPublicUrl(fileName);
    console.log(`✅ Upload success for "${songTitle}": ${data.publicUrl}`);
    
    return data.publicUrl;
  };

  const getMatchedImagesCount = () => {
    let count = 0;
    for (const set of parsedSets) {
      for (const song of set.songs) {
        if (song.scoreImageRef && matchImageFile(song.scoreImageRef, imageFiles)) {
          count++;
        }
      }
    }
    return count;
  };

  const getTotalImageRefsCount = () => {
    return parsedSets.reduce((sum, set) => 
      sum + set.songs.filter(s => s.scoreImageRef).length, 0
    );
  };

  const renderValidation = () => (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertTriangle className="w-4 h-4" />
        <AlertTitle>{t("songLibrary.notionImport.validationRequired")}</AlertTitle>
        <AlertDescription>
          {t("songLibrary.notionImport.validationIssues", { count: validationIssues.length })}
        </AlertDescription>
      </Alert>
      
      <ScrollArea className="h-[400px]">
        {validationIssues.map((issue, idx) => (
          <Card key={idx} className="p-4 mb-3">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-sm">{issue.serviceName}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {issue.type === 'count_mismatch' && (
                <div className="space-y-2">
                  <div className="text-sm text-destructive">
                    ⚠️ {t("songLibrary.notionImport.countMismatch")}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="font-semibold">
                        {t("songLibrary.notionImport.expected", { count: issue.expectedCount })}
                      </div>
                      <ul className="list-disc list-inside">
                        {issue.expectedSongs?.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="font-semibold">
                        {t("songLibrary.notionImport.found", { count: issue.foundCount })}
                      </div>
                      <ul className="list-disc list-inside">
                        {issue.foundSongs?.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              {issue.type === 'missing_images' && (
                <div className="space-y-2">
                  <div className="text-sm text-amber-600">
                    ⚠️ {t("songLibrary.notionImport.missingImages", { count: issue.unmatchedImages?.length })}
                  </div>
                  <ul className="list-disc list-inside text-xs">
                    {issue.unmatchedImages?.map((ref, i) => (
                      <li key={i}>{ref}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </ScrollArea>
      
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setStep('upload')}>
          {t("songLibrary.notionImport.backToEdit")}
        </Button>
        <Button onClick={() => setStep('preview')} className="flex-1">
          {t("songLibrary.notionImport.continueAnyway")}
        </Button>
      </div>
    </div>
  );

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex gap-4">
          <Button
            variant={uploadType === 'folder' ? 'default' : 'outline'}
            onClick={() => setUploadType('folder')}
            className="flex-1"
          >
            <Upload className="w-4 h-4 mr-2" />
            {t("songLibrary.notionImport.uploadFolder")}
          </Button>
          <Button
            variant={uploadType === 'files' ? 'default' : 'outline'}
            onClick={() => setUploadType('files')}
            className="flex-1"
          >
            <FileText className="w-4 h-4 mr-2" />
            {t("songLibrary.notionImport.uploadFiles")}
          </Button>
        </div>

        {uploadType === 'folder' ? (
          <div>
            <Label htmlFor="folder-upload">
              {t("songLibrary.notionImport.selectFolder")}
            </Label>
            <Input
              id="folder-upload"
              type="file"
              // @ts-ignore - webkitdirectory is not in types
              webkitdirectory=""
              directory=""
              multiple
              onChange={handleFolderUpload}
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-2">
              {t("songLibrary.notionImport.folderHint")}
            </p>
          </div>
        ) : (
          <div>
            <Label htmlFor="files-upload">
              {t("songLibrary.notionImport.uploadFiles")}
            </Label>
            <Input
              id="files-upload"
              type="file"
              multiple
              accept=".md,.jpg,.jpeg,.png,.gif,.webp,.pdf"
              onChange={handleFilesUpload}
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-2">
              {t("songLibrary.notionImport.filesHint")}
            </p>
          </div>
        )}
      </div>

      {allFiles.length > 0 && (
        <Alert>
          <FileText className="w-4 h-4" />
          <AlertTitle>
            {mdFiles.length} MD files, {imageFiles.length} images
          </AlertTitle>
          <AlertDescription>
            Ready to parse and preview
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderPreview = () => {
    const matchedCount = getMatchedImagesCount();
    const totalRefs = getTotalImageRefsCount();
    const unmatchedRefs = totalRefs - matchedCount;

    return (
      <div className="space-y-4">
        <Alert variant={unmatchedRefs > 0 ? "default" : "default"}>
          <ImageIcon className="w-4 h-4" />
          <AlertTitle>이미지 매칭 상태</AlertTitle>
          <AlertDescription>
            <div className="space-y-1 text-sm">
              <div>✅ 매칭됨: {matchedCount}개</div>
              {unmatchedRefs > 0 && (
                <div>⚠️ 매칭 안됨: {unmatchedRefs}개</div>
              )}
              <div className="text-xs text-muted-foreground mt-2">
                {totalRefs > 0 ? (
                  unmatchedRefs > 0 
                    ? "매칭되지 않은 이미지는 업로드되지 않습니다. 파일명이 Notion MD 파일의 이미지 참조와 일치하는지 확인하세요." 
                    : "모든 이미지가 매칭되었습니다!"
                ) : "이미지 참조가 없습니다."}
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <div className="font-semibold">
              {t("songLibrary.notionImport.filesFound", { count: parsedSets.length })}
            </div>
          </div>
        </div>

        <ScrollArea className="h-[300px] border rounded-md p-4">
          <div className="space-y-3">
            {parsedSets.map((set, idx) => (
              <Card key={idx} className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{set.serviceName}</h3>
                    <p className="text-xs text-muted-foreground">{set.date}</p>
                    {set.area && (
                      <p className="text-xs text-muted-foreground">{set.area}</p>
                    )}
                  </div>
                  <Badge variant="outline">{set.songs.length} songs</Badge>
                </div>
                <div className="mt-2 space-y-1">
                  {set.songs.slice(0, 3).map((song, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span>{song.title}</span>
                      {song.key && <Badge variant="secondary" className="text-xs">{song.key}</Badge>}
                      {song.youtubeUrl && <Youtube className="w-3 h-3 text-muted-foreground" />}
                      {song.scoreImageRef && matchImageFile(song.scoreImageRef, imageFiles) && (
                        <FileImage className="w-3 h-3 text-green-500" />
                      )}
                      {song.scoreImageRef && !matchImageFile(song.scoreImageRef, imageFiles) && (
                        <FileImage className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                  {set.songs.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{set.songs.length - 3} more songs
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>

        <div className="space-y-2">
          <Label>{t("songLibrary.notionImport.selectCommunity")}</Label>
          <Select value={selectedCommunity} onValueChange={setSelectedCommunity}>
            <SelectTrigger>
              <SelectValue placeholder={t("songLibrary.notionImport.selectCommunity")} />
            </SelectTrigger>
            <SelectContent>
              {communities.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep('upload')}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleImport} disabled={!selectedCommunity} className="flex-1">
            {t("songLibrary.notionImport.import")}
          </Button>
        </div>
      </div>
    );
  };

  const renderImporting = () => {
    const progress = importProgress.total > 0
      ? (importProgress.current / importProgress.total) * 100
      : 0;

    return (
      <div className="space-y-4 py-8">
        <div className="text-center">
          <Upload className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <h3 className="font-semibold">
            {t("songLibrary.notionImport.importing", {
              current: importProgress.current,
              total: importProgress.total,
            })}
          </h3>
        </div>
        <Progress value={progress} className="w-full" />
      </div>
    );
  };

  const renderComplete = () => (
    <div className="space-y-4 py-4">
      <div className="text-center">
        <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
        <h3 className="font-semibold text-lg">{t("songLibrary.notionImport.success")}</h3>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between p-2 bg-muted rounded">
          <span>✅ {t("songLibrary.notionImport.setsCreated")}</span>
          <Badge>{importResults.setsCreated}</Badge>
        </div>
        <div className="flex items-center justify-between p-2 bg-muted rounded">
          <span>🎵 {t("songLibrary.notionImport.songsCreated")}</span>
          <Badge>{importResults.songsCreated}</Badge>
        </div>
        <div className="flex items-center justify-between p-2 bg-muted rounded">
          <span>🔄 {t("songLibrary.notionImport.songsUpdated")}</span>
          <Badge>{importResults.songsUpdated}</Badge>
        </div>
      </div>

      {importResults.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>예배세트 생성 실패</AlertTitle>
          <AlertDescription>
            <ScrollArea className="h-[100px] mt-2">
              {importResults.errors.map((err, i) => (
                <div key={i} className="text-xs">{err}</div>
              ))}
            </ScrollArea>
          </AlertDescription>
        </Alert>
      )}

      {importResults.imageErrors && importResults.imageErrors.length > 0 && (
        <Alert variant="default">
          <ImageIcon className="w-4 h-4" />
          <AlertTitle>⚠️ 이미지 업로드 실패 ({importResults.imageErrors.length}개)</AlertTitle>
          <AlertDescription>
            <ScrollArea className="h-[120px] mt-2">
              {importResults.imageErrors.map((err, i) => (
                <div key={i} className="text-xs mb-1">{err}</div>
              ))}
            </ScrollArea>
            <p className="text-xs mt-2 text-muted-foreground">
              💡 악보 이미지는 나중에 Song Library에서 수동으로 업로드할 수 있습니다.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <Button onClick={() => onOpenChange(false)} className="w-full">
        {t("common.close")}
      </Button>
    </div>
  );

  const handleClose = () => {
    setStep('upload');
    setUploadType('folder');
    setAllFiles([]);
    setMdFiles([]);
    setImageFiles([]);
    setParsedSets([]);
    setSelectedCommunity('');
    setImportProgress({ current: 0, total: 0 });
    setImportResults({
      setsCreated: 0,
      songsCreated: 0,
      songsUpdated: 0,
      errors: [],
      imageErrors: [],
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{t("songLibrary.notionImport.title")}</DialogTitle>
        </DialogHeader>

        {step === 'upload' && renderUploadStep()}
        {step === 'validate' && renderValidation()}
        {step === 'preview' && renderPreview()}
        {step === 'importing' && renderImporting()}
        {step === 'complete' && renderComplete()}
      </DialogContent>
    </Dialog>
  );
}
