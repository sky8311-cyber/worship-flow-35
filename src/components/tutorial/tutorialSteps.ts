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

export const SONG_ADD_STEPS: TutorialStep[] = [
  {
    targetSelector: "song-title-input",
    title: "1. 곡 제목 입력",
    description: "찬양곡의 제목을 입력하세요. AI 자동완성으로 가사, 키, 태그를 자동으로 채울 수 있습니다.",
  },
  {
    targetSelector: "song-youtube-section",
    title: "2. YouTube 영상 연결",
    description: "곡에 맞는 YouTube 영상을 검색하여 연결하세요. 여러 버전을 추가할 수 있습니다.",
  },
  {
    targetSelector: "song-score-section",
    title: "3. 악보 업로드",
    description: "키별로 악보 이미지를 업로드하세요. 여러 키의 악보를 등록할 수 있습니다.",
  },
  {
    targetSelector: "song-lyrics-section",
    title: "4. 가사 입력",
    description: "가사를 직접 입력하거나 AI 자동완성을 사용하세요.",
  },
  {
    targetSelector: "song-save-button",
    title: "5. 저장",
    description: "모든 정보를 입력한 후 저장 버튼을 눌러 곡을 라이브러리에 등록하세요.",
  },
];
