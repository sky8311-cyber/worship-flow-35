

# Problem 섹션 텍스트 수정 + 스크롤 인디케이터 추가

## 변경 사항

### 1. `AtelierProblem.tsx` — 텍스트 교체 + 스크롤 인디케이터 추가

기존 텍스트:
```
우리는 예배를 준비하지만
삶과는 연결되지 않습니다
```

신규 텍스트:
```
예배는 많지만,
그 리듬은 삶으로 이어지고 있나요?
```

그리고 섹션 하단에 Hero와 동일한 스크롤 인디케이터(`w-[1px] h-10 bg-[#CCC] animate-pulse`) 추가. 섹션을 `relative`로 변경하고 `absolute bottom-4`로 세로 라인 배치.

### 기술 세부

- `section`에 `relative` 추가
- `motion.div`로 스크롤 인디케이터 감싸서 `whileInView` 페이드인 적용
- Hero의 스크롤 인디케이터 스타일 그대로 복제

