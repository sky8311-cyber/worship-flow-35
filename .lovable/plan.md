
# "Coming Soon" 뱃지 위치 변경 -- 버튼 내부 텍스트로 전환

## 문제
absolute 포지션 뱃지가 버튼 위에 겹쳐서 버튼 텍스트를 가림. overflow-visible / top 조정만으로는 근본적으로 해결이 안 됨.

## 해결 방안
뱃지를 버튼 **외부 absolute** 방식에서 버튼 **내부 inline** 방식으로 변경:

```
[Apple iOS App · Coming Soon]   [Android · Coming Soon]   [Web App 시작하기]
```

- "Coming Soon" 텍스트를 버튼 안에 작은 인라인 뱃지(`text-[9px]` + `bg-amber-500` + `rounded-full` + `px-1.5`)로 배치
- `absolute` 포지셔닝 제거 -- 더 이상 잘리거나 겹치지 않음
- 버튼 높이가 자연스럽게 콘텐츠에 맞춰짐

## 기술 변경

### 파일: `src/pages/MobileAppLanding.tsx`

iOS 버튼과 Android 버튼 2곳에서:

**Before:**
```tsx
<Button variant="outline" className="relative gap-2 opacity-70 ...">
  <span className="absolute -top-2 -right-1 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full">
    Coming Soon
  </span>
  <svg .../>
  iOS App
</Button>
```

**After:**
```tsx
<Button variant="outline" className="gap-2 opacity-70 ...">
  <svg .../>
  iOS App
  <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold bg-amber-500 text-white rounded-full leading-none">
    Coming Soon
  </span>
</Button>
```

## 변경 범위
- 파일 1개 수정, 2곳 (iOS / Android 버튼)
- 순수 CSS/레이아웃 변경, 기능 변경 없음
