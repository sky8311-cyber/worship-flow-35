

# Problem 섹션 상하 균등 공간 + 스크롤 인디케이터

## 현재 상태
- 섹션이 `flex justify-center`로 텍스트를 중앙 배치
- 스크롤 인디케이터가 `absolute bottom-4`로 바닥에 붙어 있음
- 위쪽 공간(Hero의 indicator → Problem 텍스트)과 아래쪽 공간(텍스트 → indicator)이 불균형

## 변경 (`AtelierProblem.tsx`)

레이아웃을 flex column으로 변경하여 상하 균등 공간 확보:

1. `justify-center` 제거, 수동으로 상하 패딩/공간 배치
2. 구조: **상단 여백 → 텍스트 → 하단 여백 + 스크롤 인디케이터**
3. `absolute` 제거하고 스크롤 인디케이터를 flow 안에 배치
4. 텍스트 위아래에 동일한 `py` 또는 `flex-1` spacer를 넣어 균등 배분

```
section (min-h-[36vh], flex flex-col items-center)
  ├── flex-1 spacer (위 공간)
  ├── 텍스트 블록
  ├── flex-1 spacer (아래 공간)
  └── 스크롤 인디케이터 (mb-4)
```

이렇게 하면 텍스트 위/아래 공간이 동일하고, 인디케이터가 자연스럽게 하단에 위치합니다.

