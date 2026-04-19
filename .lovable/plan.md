
## 수정 플랜: Layer 3 박스 - 중복 필드 제거

### 현재 문제
- `SongProgressionSettings.tsx`가 BPM/박자/에너지/진행설명 필드를 자체적으로 렌더링 → SetSongItem의 기존 필드와 중복 표시

### 수정 방향

**1. `SongProgressionSettings.tsx` → `ProgressionHistoryControls.tsx`로 역할 축소**
- 입력 필드(Input/Textarea/Select) 전부 제거
- 헤더 UI만 유지: `🎵 진행 설정` 라벨 + `[이력]` Popover 버튼 + `[저장]` 버튼
- Props로 현재 값(`bpm`, `timeSignature`, `energyLevel`, `notes`) 받음
- Props로 `onApplyHistory(entry)` 콜백 받음 → 이력 항목 클릭 시 부모(SetSongItem)의 onUpdate 호출
- `[저장]` 동작: 받은 props 값을 `user_song_settings_history`에 INSERT (기존 set_songs 저장 로직 건드리지 않음)
- `[이력]` 동작: on-demand 조회 → Popover 목록 → 클릭 시 `onApplyHistory` 호출

**2. `SetSongItem.tsx` 수정**
- 라인 324의 단독 `<SongProgressionSettings />` 제거
- 라인 326-369 (BPM/박자/에너지 grid + 진행설명) 전체를 시각적 박스로 감쌈:
  ```tsx
  <div className="border border-border rounded-md p-3 bg-muted/20 space-y-3">
    <ProgressionHistoryControls 
      songId={song.id}
      bpm={setSong.bpm}
      timeSignature={setSong.time_signature}
      energyLevel={setSong.energy_level}
      notes={setSong.custom_notes}
      onApplyHistory={(h) => onUpdate(index, {
        bpm: h.bpm, 
        time_signature: h.time_signature,
        energy_level: h.energy_level,
        custom_notes: h.notes,
      })}
    />
    {/* 기존 BPM/박자/에너지 grid 그대로 */}
    {/* 기존 진행설명 textarea 그대로 */}
  </div>
  ```

**3. 저장 동작 분리 보장**
- 기존 필드의 `onUpdate` → `set_songs` 저장 (기존 그대로, 변경 없음)
- 새 `[저장]` 버튼 → `user_song_settings_history` INSERT만 (이력 스냅샷 용도)

### 영향 파일
- `src/components/set-builder/SongProgressionSettings.tsx` (필드 제거, controls-only로 리팩터)
- `src/components/SetSongItem.tsx` (중복 호출 제거, 기존 필드를 박스로 감싸기)
