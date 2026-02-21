

# 날짜/시간 입력 아이콘 가림 수정

## 문제
SetBuilder 페이지의 "날짜"와 "시간" 입력 필드에서 캘린더/시계 아이콘이 잘려서 보이지 않음. `h-9` (36px) 높이가 너무 작아서 네이티브 브라우저 아이콘이 가려짐.

## 해결 방법

**파일**: `src/pages/SetBuilder.tsx`

- 날짜 Input: `className="text-sm h-9"` → `className="text-sm"` (기본 h-10 사용)
- 시간 Input: `className="text-sm h-9"` → `className="text-sm"` (기본 h-10 사용)

기본 Input 컴포넌트의 높이(h-10, 40px)로 되돌리면 네이티브 date/time picker 아이콘이 정상적으로 표시됨.

## 변경 범위
- 파일 1개, 라인 2개만 수정
- 다른 필드나 레이아웃에 영향 없음

