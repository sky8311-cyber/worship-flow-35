import { TutorialStep } from "./useTutorial";

export const SET_BUILDER_STEPS: TutorialStep[] = [
  {
    targetSelector: "set-worship-info",
    title: "1. 예배 정보 입력",
    description: "날짜, 시간, 예배 이름, 예배공동체, 인도자를 입력하세요. 필수 항목을 모두 채우면 자동 저장이 시작됩니다.",
  },
  {
    targetSelector: "set-add-song",
    title: "2. 곡 추가",
    description: "곡 라이브러리에서 찬양곡을 검색하여 추가하세요. 키 변경도 가능합니다.",
  },
  {
    targetSelector: "set-add-component",
    title: "3. 예배 순서 추가",
    description: "기도, 봉독, 환영 인사 등 예배 순서 요소를 추가할 수 있습니다.",
  },
  {
    targetSelector: "set-items-list",
    title: "4. 순서 변경",
    description: "드래그앤드롭으로 곡과 순서의 위치를 자유롭게 바꿀 수 있습니다.",
  },
  {
    targetSelector: "set-save-buttons",
    title: "5. 저장 & 게시",
    description: "저장 버튼으로 워십세트를 저장하세요. 준비가 되면 게시하여 팀원과 공유할 수 있습니다.",
  },
];

export const SONG_LIBRARY_STEPS: TutorialStep[] = [
  {
    targetSelector: "song-youtube-btn",
    title: "1. YouTube 영상",
    description: "YouTube 버튼을 누르면 해당 곡의 영상이 바로 열립니다.",
  },
  {
    targetSelector: "song-score-btn",
    title: "2. 악보 미리보기",
    description: "악보 버튼으로 등록된 악보를 바로 확인할 수 있습니다.",
  },
  {
    targetSelector: "song-cart-btn",
    title: "3. 카트에 담기",
    description: "카트 버튼으로 여러 곡을 담은 뒤, 한번에 워십세트에 추가할 수 있습니다.",
  },
  {
    targetSelector: "song-usage-btn",
    title: "4. 사용 내역",
    description: "사용 내역 버튼으로 이 곡이 포함된 다른 워십세트를 열람할 수 있습니다.",
  },
  {
    targetSelector: "song-favorite-btn",
    title: "5. 즐겨찾기",
    description: "하트 버튼으로 즐겨찾기에 추가하세요. 상단 네비게이션의 하트 아이콘을 눌러 즐겨찾기 목록을 확인할 수 있습니다.",
  },
  {
    targetSelector: "song-edit-btn",
    title: "6. 곡 수정",
    description: "수정 버튼으로 곡 정보를 편집할 수 있습니다.",
  },
];
