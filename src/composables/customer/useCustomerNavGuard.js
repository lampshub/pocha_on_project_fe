/**
 * useCustomerNavGuard
 * - 뒤로가기 방지 (history.pushState)
 * - 새로고침 방지 (F5, Ctrl+R)
 * - 페이지 이탈 시 테이블 해제
 * - Vue Router 라우트 가드
 */
import { onBeforeRouteLeave } from 'vue-router'

// eslint-disable-next-line no-unused-vars
export function useCustomerNavGuard(TABLE_SESSION_KEY, releaseTable, cleanupFn) {
  const preventBack = () => {
    history.pushState(history.state, '', location.href)
  }

  const preventRefresh = (e) => {
    if (
      e.key === 'F5' ||
      (e.ctrlKey && (e.key === 'r' || e.key === 'R')) ||
      (e.ctrlKey && e.shiftKey && (e.key === 'r' || e.key === 'R'))
    ) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  const setupGuards = () => {
    sessionStorage.setItem(TABLE_SESSION_KEY, 'true')
    history.pushState(null, '', location.href)
    window.addEventListener('popstate', preventBack)
    window.addEventListener('keydown', preventRefresh)
    window.addEventListener('pagehide', releaseTable)
    window.addEventListener('beforeunload', releaseTable)
  }

  const removeGuards = () => {
    window.removeEventListener('popstate', preventBack)
    window.removeEventListener('keydown', preventRefresh)
    window.removeEventListener('pagehide', releaseTable)
    window.removeEventListener('beforeunload', releaseTable)
    sessionStorage.removeItem(TABLE_SESSION_KEY)
  }

  onBeforeRouteLeave((to, from, next) => {
    if (
      to.name === 'CustomerPayment' ||
      to.path.includes('/payment') ||
      to.path.includes('/dashboard')
    ) {
      next()
      return
    }
    sessionStorage.removeItem(TABLE_SESSION_KEY)
    releaseTable(false)
    next()
  })

  return {
    setupGuards,
    removeGuards,
  }
}
