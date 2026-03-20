

## 전체 플랫폼 툴팁 & 도움말 audit + 개선 계획

### 현황 분석

**현재 툴팁 있는 곳**: SongLibrary (Cross-Community 토글, 뷰모드), SetSongItem (일부 아이콘), CommunityManagement (역할 관리 버튼), LandingNav (앱스토어 버튼)

**툴팁 없는 곳 (문제)**:
- SongLibrary: CSV Import, Export, 중복검사, 선택모드 — `title` 속성만 사용 (모바일에서 안 보임)
- WorshipSets: 뷰모드 토글, Import/Export 버튼에 `title`만
- SetBuilder: 미리보기, 공유, 템플릿 버튼, 자동저장 상태 아이콘, Draft/Published 배지
- WorshipSetCard: Eye/Share/Edit/Publish/Delete 아이콘 — 텍스트 있긴 하지만 모바일에서 작음
- SongCartPopover: 장바구니 아이콘에 설명 없음
- ShareLinkDialog: 팀링크 vs 공유링크 차이 설명 없음
- SongDialog: 다수 아이콘 버튼 (악보 업로드, AI 보강, 유튜브 등)
- Help 페이지: FAQ에 ID 앵커 없어서 딥링크 불가

---

### 변경 계획

#### 1. 공통 HelpTooltip 컴포넌트 생성 (`src/components/ui/help-tooltip.tsx`)
- `HelpCircle` 아이콘 + Tooltip 조합을 재사용 가능한 컴포넌트로 만듦
- Props: `text` (툴팁 내용), `helpLink?` (FAQ 딥링크), `side?`
- helpLink이 있으면 아이콘 클릭 시 해당 FAQ로 이동

#### 2. Help 페이지 FAQ 딥링크 지원 (`src/pages/Help.tsx`)
- 각 FAQ 항목에 고유 ID 부여: `getting-started`, `worship-leader`, `community`, `worship-set`, `add-song`, `share`, `roles`, `language`, `fullscreen`, `favorites`, `print`
- URL 해시로 자동 스크롤 + 해당 아코디언 열기 (예: `/help#add-song`)

#### 3. SongLibrary 툴팁 추가 (`src/pages/SongLibrary.tsx`)
- CSV Import 아이콘: "CSV 파일로 곡 일괄 가져오기" + `/help#add-song` 링크
- Export 아이콘: "곡 목록 Excel 내보내기"
- 중복검사 아이콘: "중복 곡 자동 검색"
- 장바구니 아이콘 (FloatingCartIndicator): "선택한 곡을 워십세트에 추가" + `/help#add-song`
- 선택모드 버튼: "여러 곡을 선택하여 일괄 작업"

#### 4. WorshipSets 페이지 (`src/pages/WorshipSets.tsx`)
- 뷰모드 토글: 카드/테이블에 Tooltip 추가
- "새로 만들기" 옆 HelpTooltip: "예배 콘티를 작성합니다" + `/help#worship-set`
- Import/Export 버튼에 Tooltip

#### 5. SetBuilder 워크플로우 도움말 (`src/pages/SetBuilder.tsx`)
- "예배 정보" 카드 제목 옆 HelpTooltip: "워십세트 기본 정보를 입력하세요" + `/help#worship-set`
- 템플릿 버튼들에 Tooltip: "이전에 저장한 예배 형식을 불러옵니다" / "현재 세트를 템플릿으로 저장"
- Draft/Published 배지에 Tooltip: "임시저장: 본인만 볼 수 있음" / "게시됨: 커뮤니티 멤버가 볼 수 있음"
- 자동저장 상태 아이콘에 Tooltip: "변경사항이 자동으로 저장됩니다"
- 미리보기 버튼: "밴드뷰로 미리보기"
- 공유 버튼: "링크를 생성하여 팀원에게 공유" + `/help#share`
- 커뮤니티 선택 옆 HelpTooltip: "이 콘티가 공유될 그룹을 선택하세요"

#### 6. ShareLinkDialog 안내 개선 (`src/components/ShareLinkDialog.tsx`)
- 팀링크 레이블 옆 HelpTooltip: "로그인한 팀원만 접근 가능한 내부 링크"
- 공유링크 레이블 옆 HelpTooltip: "로그인 없이 누구나 볼 수 있는 외부 공유 링크"

#### 7. SongDialog 아이콘 설명 (`src/components/SongDialog.tsx`)
- 악보 업로드, AI 보강, 유튜브 검색 등 아이콘 버튼에 Tooltip 추가

#### 8. SongCartPopover 안내 (`src/components/SongCartPopover.tsx`)
-