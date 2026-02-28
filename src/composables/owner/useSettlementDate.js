// ══════════════════════════════════════════════
//  정산 페이지 – 날짜 관련 상태 및 함수
// ══════════════════════════════════════════════
import { ref, computed, watch } from 'vue'

/** 요일 한글 이름 (달력 헤더용) */
export const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

/**
 * 날짜 선택·탐색 관련 상태와 함수를 제공하는 컴포저블
 * @param {Function} onDateChange - 날짜가 변경될 때 호출할 콜백 (fetchMonthlyCalender + fetchTabData)
 * @returns {Object} 날짜 관련 반응형 상태 및 함수
 */
export function useSettlementDate(onDateChange) {
  // ── 현재 날짜 기준 초기값 ──
  const now = new Date()
  const currentYear = ref(now.getFullYear())
  const currentMonth = ref(now.getMonth() + 1)
  const currentDay = ref(0) // 0 = 월 전체

  /** 연도 선택 옵션 (현재 기준 ±5년) */
  const yearOptions = computed(() => {
    const y = new Date().getFullYear()
    return Array.from({ length: 7 }, (_, i) => y - 5 + i)
  })

  /** 현재 선택된 월의 일수 */
  const daysInCurrentMonth = computed(
    () => new Date(currentYear.value, currentMonth.value, 0).getDate()
  )

  // ── 분석 보기 모드 (일별/주별/월별) ──
  const analysisViewMode = ref('daily')

  /** 주간 범위 문자열 반환 (예: "2/17 ~ 2/23") */
  const getWeekRange = () => {
    const d = new Date(currentYear.value, currentMonth.value - 1, currentDay.value || 1)
    const day = d.getDay() || 7
    const monday = new Date(d)
    monday.setDate(d.getDate() - day + 1)
    const sunday = new Date(monday)
    sunday.setDate(sunday.getDate() + 6)
    const fmt = (dt) => `${dt.getMonth() + 1}/${dt.getDate()}`
    return `${fmt(monday)} ~ ${fmt(sunday)}`
  }

  /** 분석 모드에 따른 범위 라벨 */
  const viewModeRangeLabel = computed(() => {
    if (analysisViewMode.value === 'monthly')
      return `${currentYear.value}년 ${currentMonth.value}월 전체`
    if (analysisViewMode.value === 'weekly') return getWeekRange()
    if (currentDay.value > 0)
      return `${currentMonth.value}/${currentDay.value}`
    return `${currentYear.value}년 ${currentMonth.value}월 전체`
  })

  // ── 일별 모달 ──
  const showDayModal = ref(false)
  const modalDay = ref(0)

  // ── 날짜 이동 함수 ──

  /** 이전 날짜(또는 월)로 이동 */
  const goPrevDay = () => {
    if (currentDay.value === 0) {
      // 월 전체 모드 → 이전 달
      if (currentMonth.value === 1) {
        currentMonth.value = 12
        currentYear.value--
      } else {
        currentMonth.value--
      }
    } else {
      // 일 모드 → 이전 일
      if (currentDay.value === 1) {
        if (currentMonth.value === 1) {
          currentMonth.value = 12
          currentYear.value--
        } else {
          currentMonth.value--
        }
        currentDay.value = daysInCurrentMonth.value
      } else {
        currentDay.value--
      }
    }
    onDateChange()
  }

  /** 다음 날짜(또는 월)로 이동 */
  const goNextDay = () => {
    if (currentDay.value === 0) {
      if (currentMonth.value === 12) {
        currentMonth.value = 1
        currentYear.value++
      } else {
        currentMonth.value++
      }
    } else {
      if (currentDay.value === daysInCurrentMonth.value) {
        if (currentMonth.value === 12) {
          currentMonth.value = 1
          currentYear.value++
        } else {
          currentMonth.value++
        }
        currentDay.value = 1
      } else {
        currentDay.value++
      }
    }
    onDateChange()
  }

  /** 오늘 날짜로 이동 */
  const goToday = () => {
    const t = new Date()
    currentYear.value = t.getFullYear()
    currentMonth.value = t.getMonth() + 1
    currentDay.value = t.getDate()
    onDateChange()
  }

  /** 달력에서 일 클릭 시 모달 표시 */
  const selectDay = (day) => {
    currentDay.value = day.date
    modalDay.value = day.date
    showDayModal.value = true
  }

  // ── 분석 보기 모드 변경 감시 ──
  watch(analysisViewMode, (mode) => {
    if (mode === 'weekly' && currentDay.value === 0) {
      const t = new Date()
      if (
        currentYear.value === t.getFullYear() &&
        currentMonth.value === t.getMonth() + 1
      ) {
        currentDay.value = t.getDate()
      } else {
        currentDay.value = 1
      }
    }
    if (mode === 'monthly') currentDay.value = 0
    onDateChange()
  })

  return {
    currentYear,
    currentMonth,
    currentDay,
    yearOptions,
    daysInCurrentMonth,
    analysisViewMode,
    viewModeRangeLabel,
    getWeekRange,
    showDayModal,
    modalDay,
    goPrevDay,
    goNextDay,
    goToday,
    selectDay,
    onDateChange,
  }
}
