

# 날짜/시간 입력 아이콘 겹침 수정

## 문제
날짜(`type="date"`)와 시간(`type="time"`) 입력 필드에서 네이티브 브라우저의 캘린더/시계 아이콘이 입력된 텍스트와 겹쳐 보임. 기본 Input 컴포넌트의 오른쪽 패딩(`px-3`)이 네이티브 아이콘 공간을 충분히 확보하지 못하기 때문.

## 해결 방법

**파일**: `src/pages/SetBuilder.tsx`

날짜와 시간 Input에 `pr-10` (오른쪽 패딩 40px) 클래스를 추가하여 네이티브 아이콘이 들어갈 공간을 확보.

- 날짜 Input (1812번째 줄): `className="text-sm"` → `className="text-sm pr-10"`
- 시간 Input (1824번째 줄): `className="text-sm"` → `className="text-sm pr-10"`

## 변경 범위
- 파일 1개, 라인 2개만 수정
- 다른 UI에 영향 없음

