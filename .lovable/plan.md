

# `last_active_at` 세션 복원 시 업데이트 누락 수정

## 문제 요약

### 발견된 버그
| 사용자 | profiles.last_active_at | auth.users.updated_at | 상태 |
|--------|-------------------------|----------------------|------|
| 권수현 (skyksh011@gmail.com) | 43일 전 | **2일 전** | ❌ 누락 |
| Branden (brandenyoon@gmail.com) | 44일 전 | **2일 전** | ❌ 누락 |
| Sb (imssbb@gmail.com) | 32일 전 | **어제** | ❌ 누락 |

### 근본 원인
1. **`handleVisibilityChange`에서 `last_active_at` 업데이트 누락**
   - 탭이 다시 visible 될 때 `fetchProfile()`만 호출
   - `last_active_at` 업데이트 코드가 없음
   
2. **세션 복원 시 이벤트 미발생**
   - 브라우저 탭을 닫지 않고 배경에 두었다가 다시 열면
   - 기존 세션이 유효하면 `INITIAL_SESSION`, `TOKEN_REFRESHED` 이벤트가 발생하지 않음
   - 팀멤버들이 탭만 열어보고 워십히스토리를 확인하는 사용 패턴

---

## 해결 방법

### 파일: `src/contexts/AuthContext.tsx`

`handleVisibilityChange` 함수에 `last_active_at` 업데이트 추가:

```typescript
// 변경 전 (line 308-334)
const handleVisibilityChange = async () => {
  if (document.visibilityState === 'visible') {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (now - lastRefreshRef.current < fiveMinutes) {
      return;
    }
    
    lastRefreshRef.current = now;
    const startEpoch = authEpochRef.current;
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession && mounted && authEpochRef.current === startEpoch && prevUserIdRef.current === currentSession.user.id) {
        setSession(currentSession);
        setUser(currentSession.user);
        await fetchProfile(currentSession.user.id);
        await syncWorshipLeaderRole();
      }
    } catch (err) {
      console.log('Session refresh error:', err);
    }
  }
};

// 변경 후
const handleVisibilityChange = async () => {
  if (document.visibilityState === 'visible') {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (now - lastRefreshRef.current < fiveMinutes) {
      return;
    }
    
    lastRefreshRef.current = now;
    const startEpoch = authEpochRef.current;
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession && mounted && authEpochRef.current === startEpoch && prevUserIdRef.current === currentSession.user.id) {
        setSession(currentSession);
        setUser(currentSession.user);
        await fetchProfile(currentSession.user.id);
        await syncWorshipLeaderRole();
        
        // ✅ 추가: 탭 재활성화 시 last_active_at 업데이트
        supabase.from('profiles').update({ 
          last_active_at: new Date().toISOString() 
        }).eq('id', currentSession.user.id).then(() => {
          console.log('[AuthContext] Updated last_active_at on tab visibility');
        });
      }
    } catch (err) {
      console.log('Session refresh error:', err);
    }
  }
};
```

---

## 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/contexts/AuthContext.tsx` | `handleVisibilityChange`에 `last_active_at` 업데이트 추가 |

---

## 예상 결과

1. **세션 복원 활동 추적**: 탭을 다시 열 때 (5분 debounce 이후) `last_active_at` 업데이트
2. **팀멤버 활동 기록**: 로그인 없이 탭만 열어서 워십히스토리 확인해도 활동 기록
3. **자동 이메일 정확도 향상**: 실제로 최근에 접속한 사용자가 "미접속자" 명단에서 제외

---

## 참고: 기존 사용자 데이터 수정

이미 잘못된 `last_active_at`을 가진 사용자들의 경우, `auth.users.updated_at`을 기반으로 백필하는 것은 어렵습니다 (`updated_at`은 패스워드 변경 등 다른 업데이트도 포함하기 때문). 다만, 이 수정 후 사용자들이 다시 접속하면 자동으로 올바른 값이 기록됩니다.

