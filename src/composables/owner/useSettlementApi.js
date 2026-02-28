// ══════════════════════════════════════════════
//  정산 페이지 – API 호출 및 데이터 상태 관리
// ══════════════════════════════════════════════
import { ref, computed, watch } from 'vue'
import axios from 'axios'
import {
  PAYMENT_COLORS, RANK_COLORS,
} from '@/assets/js/chartTheme'

/** API 기본 주소 */
const API = process.env.VUE_APP_API_BASE_URL

/**
 * 정산 API 호출과 관련 데이터 상태를 제공하는 컴포저블
 * @param {Object} dateState - useSettlementDate 에서 반환된 날짜 상태 객체
 *   { currentYear, currentMonth, currentDay, daysInCurrentMonth, analysisViewMode, getWeekRange }
 * @returns {Object} API 데이터 상태 및 호출 함수
 */
export function useSettlementApi(dateState) {
  const {
    currentYear, currentMonth, currentDay,
    analysisViewMode, getWeekRange,
  } = dateState

  // ══════════════ 로딩 / 탭 상태 ══════════════
  const loading = ref({ menu: false, sales: false, payment: false, table: false })
  const activeTab = ref('calendar')
  const calendarView = ref('calendar') // 'calendar' | 'graph'

  /** 탭 목록 정의 */
  const tabs = [
    { id: 'calendar', icon: '📅', label: '일별정산 리포트' },
    { id: 'menu', icon: '🍽️', label: '메뉴성과 분석' },
    { id: 'sales', icon: '📊', label: '기간별 매출비교' },
    { id: 'payment', icon: '💳', label: '결제 관리및통계' },
    { id: 'table', icon: '🪑', label: '테이블운영 분석' }
  ]

  // ══════════════ 달력 데이터 ══════════════
  const calendarDays = ref([])
  const monthlySalesMap = ref({})
  const monthlyOrderCount = ref(0)
  const monthlyCancelCount = ref(0)

  /** 현재 선택 범위의 총 매출 */
  const monthlyTotal = computed(() => {
    if (currentDay.value > 0) return monthlySalesMap.value[currentDay.value] || 0
    return Object.values(monthlySalesMap.value).reduce((a, b) => a + b, 0)
  })

  /** 일 평균 매출 */
  const monthlyAverage = computed(() => {
    const d = Object.keys(monthlySalesMap.value).length
    return d > 0 ? Math.round(monthlyTotal.value / d) : 0
  })

  /** 달력 셀 배열 생성 */
  const generateCalendar = () => {
    const year = currentYear.value
    const month = currentMonth.value - 1
    const td = new Date()
    const isCur = year === td.getFullYear() && month === td.getMonth()
    const first = new Date(year, month, 1).getDay()
    const last = new Date(year, month + 1, 0).getDate()
    const days = []
    for (let i = 0; i < first; i++) days.push({ date: null, sales: 0, isToday: false })
    for (let d = 1; d <= last; d++) {
      days.push({
        date: d,
        sales: monthlySalesMap.value[d] || 0,
        isToday: isCur && d === td.getDate(),
      })
    }
    calendarDays.value = days
  }

  /** 월별 매출 달력 데이터 조회 */
  const fetchMonthlyCalender = async () => {
    try {
      const res = await axios.get(`${API}/store/settlement/monthly`, {
        params: { year: currentYear.value, month: currentMonth.value, day: currentDay.value },
      })
      monthlySalesMap.value = res.data.dailySales || {}
      monthlyOrderCount.value = res.data.orderCount || 0
      monthlyCancelCount.value = res.data.cancelCount || 0
    } catch {
      monthlySalesMap.value = {}
      monthlyOrderCount.value = 0
      monthlyCancelCount.value = 0
    }
    generateCalendar()
  }

  // ══════════════ 메뉴 분석 데이터 ══════════════
  const categorySales = ref([])
  const menuRanking = ref([])
  const menuShowAll = ref(false)

  /** 표시할 메뉴 순위 목록 (기본 5개, 더보기 시 전체) */
  const visibleMenuRanking = computed(() =>
    menuShowAll.value ? menuRanking.value : menuRanking.value.slice(0, 5)
  )

  /** 메뉴 분석 API 호출 */
  const fetchMenuAnalysis = async () => {
    loading.value.menu = true
    try {
      const res = await axios.get(`${API}/store/settlement/menuanalysis`, {
        params: {
          year: currentYear.value,
          month: currentMonth.value,
          day: currentDay.value,
          viewMode: analysisViewMode.value,
        },
      })
      categorySales.value = (res.data.categorySales || []).map((c) => ({
        name: c.name, amount: c.amount, rate: c.rate,
      }))
      menuRanking.value = (res.data.menuRanking || []).map((m, i) => ({
        name: m.name, qty: m.qty, amount: m.amount, rate: m.rate,
        color: RANK_COLORS[i % RANK_COLORS.length],
      }))
    } catch (e) {
      console.error('메뉴 분석 로드 실패', e)
      categorySales.value = []
      menuRanking.value = []
    } finally {
      loading.value.menu = false
    }
  }

  // ══════════════ 매출 분석 데이터 ══════════════
  const salesAnalysisData = ref(null)
  const salesPeriod = ref('weekly')

  /** 매출 분석 기간 라벨 */
  const salesPeriodLabel = computed(() => ({
    weekly: '주별 매출',
    monthly: '월별 매출',
    hourly: '시간대별 매출',
    dow: '요일별 매출',
  }[salesPeriod.value]))

  /** 매출 비교 데이터 (이번달 / 전월 / 전년 동월) */
  const salesCompare = computed(() =>
    salesAnalysisData.value?.compare || {
      thisMonth: 0, lastMonth: 0, momRate: 0, lastYear: 0, yoyRate: 0,
    }
  )

  /** 매출 분석 API 호출 */
  const fetchSalesAnalysis = async () => {
    loading.value.sales = true
    try {
      const params = {
        year: currentYear.value,
        month: currentMonth.value,
        day: currentDay.value,
        period: salesPeriod.value,
      }
      const res = await axios.get(`${API}/store/settlement/salesanalysis`, { params })
      salesAnalysisData.value = res.data
    } catch (e) {
      console.error('매출 분석 로드 실패', e)
      salesAnalysisData.value = null
    } finally {
      loading.value.sales = false
    }
  }

  // ── 매출 분석 기간 네비게이션 ──

  /** 이전 기간으로 이동 */
  const goPrevPeriod = () => {
    if (salesPeriod.value === 'monthly') {
      if (currentMonth.value === 1) {
        currentMonth.value = 12
        currentYear.value--
      } else {
        currentMonth.value--
      }
      currentDay.value = 0
    } else if (salesPeriod.value === 'weekly') {
      const d = new Date(currentYear.value, currentMonth.value - 1, currentDay.value || 1)
      d.setDate(d.getDate() - 7)
      currentYear.value = d.getFullYear()
      currentMonth.value = d.getMonth() + 1
      currentDay.value = d.getDate()
    }
    dateState.onDateChange()
  }

  /** 다음 기간으로 이동 */
  const goNextPeriod = () => {
    if (isNextPeriodDisabled.value) return
    if (salesPeriod.value === 'monthly') {
      if (currentMonth.value === 12) {
        currentMonth.value = 1
        currentYear.value++
      } else {
        currentMonth.value++
      }
      currentDay.value = 0
    } else if (salesPeriod.value === 'weekly') {
      const d = new Date(currentYear.value, currentMonth.value - 1, currentDay.value || 1)
      d.setDate(d.getDate() + 7)
      currentYear.value = d.getFullYear()
      currentMonth.value = d.getMonth() + 1
      currentDay.value = d.getDate()
    }
    dateState.onDateChange()
  }

  /** 다음 기간 버튼 비활성화 여부 */
  const isNextPeriodDisabled = computed(() => {
    const now = new Date()
    if (salesPeriod.value === 'monthly') {
      return (
        currentYear.value > now.getFullYear() ||
        (currentYear.value === now.getFullYear() && currentMonth.value >= now.getMonth() + 1)
      )
    }
    if (salesPeriod.value === 'weekly') {
      const d = new Date(currentYear.value, currentMonth.value - 1, currentDay.value || 1)
      d.setDate(d.getDate() + 7)
      return d > now
    }
    return true
  })

  /** 기간 네비게이션 라벨 */
  const periodNavLabel = computed(() => {
    if (salesPeriod.value === 'monthly')
      return `${currentYear.value}년 ${currentMonth.value}월`
    if (salesPeriod.value === 'weekly') return getWeekRange()
    return ''
  })

  // ══════════════ 결제 분석 데이터 ══════════════
  const paymentRatioItems = ref([
    { label: '💳 카드', pct: 0, color: PAYMENT_COLORS.card },
    { label: '📱 간편결제', pct: 0, color: PAYMENT_COLORS.easyPay },
    { label: '🏦 계좌이체', pct: 0, color: PAYMENT_COLORS.transfer },
    { label: '📞 휴대폰', pct: 0, color: PAYMENT_COLORS.phone },
  ])
  const paymentSummary = ref({ avgAmount: 0, totalCount: 0, totalAmount: 0, monthlyTotal: 0 })
  const transactions = ref([])
  const expandedTxId = ref(null)
  const showTxPanel = ref(false)

  /** 결제 내역 상세 펼침/접기 */
  const toggleTxDetail = (id) => {
    expandedTxId.value = expandedTxId.value === id ? null : id
  }

  /** 결제 분석 API 호출 */
  const fetchPaymentAnalysis = async () => {
    loading.value.payment = true
    try {
      const res = await axios.get(`${API}/store/settlement/paymentanalysis`, {
        params: {
          year: currentYear.value,
          month: currentMonth.value,
          day: currentDay.value,
          viewMode: analysisViewMode.value,
        },
      })
      const { methodBreakdown: bd = {}, summary: s = {}, recentTransactions = [] } = res.data
      paymentRatioItems.value = [
        { label: '💳 카드', pct: bd.cardRate || 0, color: PAYMENT_COLORS.card },
        { label: '📱 간편결제', pct: bd.easyPayRate || 0, color: PAYMENT_COLORS.easyPay },
        { label: '🏦 계좌이체', pct: bd.transferRate || 0, color: PAYMENT_COLORS.transfer },
        { label: '📞 휴대폰', pct: bd.phoneRate || 0, color: PAYMENT_COLORS.phone },
      ]
      paymentSummary.value = {
        avgAmount: s.avgAmount || 0,
        totalCount: s.totalCount || 0,
        totalAmount: s.totalAmount || 0,
        monthlyTotal: s.monthlyTotal || s.totalAmount || 0,
      }
      const METHOD_EMOJI = {
        '카드': '💳 카드',
        '간편결제': '📱 간편결제',
        '계좌이체': '🏦 계좌이체',
        '휴대폰': '📞 휴대폰',
      }
      transactions.value = recentTransactions.map((tx) => ({
        id: tx.id,
        method: METHOD_EMOJI[tx.method] || tx.method || '기타',
        time: tx.time || '',
        amount: tx.amount || 0,
        tableNum: tx.tableNum || 0,
        menus: (tx.menus || []).map((m) => ({ name: m.name, qty: m.qty, price: m.price })),
      }))
    } catch (e) {
      console.error('결제 분석 로드 실패', e)
      paymentRatioItems.value = [
        { label: '💳 카드', pct: 0, color: PAYMENT_COLORS.card },
        { label: '📱 간편결제', pct: 0, color: PAYMENT_COLORS.easyPay },
        { label: '🏦 계좌이체', pct: 0, color: PAYMENT_COLORS.transfer },
        { label: '📞 휴대폰', pct: 0, color: PAYMENT_COLORS.phone },
      ]
      paymentSummary.value = { avgAmount: 0, totalCount: 0, totalAmount: 0, monthlyTotal: 0 }
      transactions.value = []
    } finally {
      loading.value.payment = false
    }
  }

  // ══════════════ 테이블 분석 데이터 ══════════════
  const tableSummary = ref({ avgTurnover: 0, avgDuration: 0, todayUseCount: 0 })
  const tableTurnover = ref([])

  /** 테이블 분석 API 호출 */
  const fetchTableAnalysis = async () => {
    loading.value.table = true
    try {
      const res = await axios.get(`${API}/store/settlement/tableanalysis`, {
        params: {
          year: currentYear.value,
          month: currentMonth.value,
          day: currentDay.value,
          viewMode: analysisViewMode.value,
        },
      })
      tableSummary.value = res.data.summary || { avgTurnover: 0, avgDuration: 0, todayUseCount: 0 }
      tableTurnover.value = (res.data.tableTurnover || []).map((t) => ({
        tableNum: t.tableNum,
        turnover: t.turnover,
      }))
    } catch (e) {
      console.error('테이블 분석 로드 실패', e)
      tableSummary.value = { avgTurnover: 0, avgDuration: 0, todayUseCount: 0 }
      tableTurnover.value = []
    } finally {
      loading.value.table = false
    }
  }

  // ══════════════ 탭 전환 시 데이터 로드 ══════════════

  /** 탭 종류에 따라 적절한 API 호출 */
  const fetchTabData = async (tab) => {
    if (tab === 'menu') await fetchMenuAnalysis()
    if (tab === 'sales') await fetchSalesAnalysis()
    if (tab === 'payment') await fetchPaymentAnalysis()
    if (tab === 'table') await fetchTableAnalysis()
  }

  // ── 탭 변경 감시 ──
  watch(activeTab, async (tab) => {
    await fetchTabData(tab)
  })

  // ── 매출 분석 기간 변경 감시 ──
  watch(salesPeriod, () => {
    fetchSalesAnalysis()
  })

  return {
    // 상태
    loading,
    activeTab,
    calendarView,
    tabs,
    // 달력
    calendarDays,
    monthlySalesMap,
    monthlyOrderCount,
    monthlyCancelCount,
    monthlyTotal,
    monthlyAverage,
    generateCalendar,
    fetchMonthlyCalender,
    // 메뉴
    categorySales,
    menuRanking,
    menuShowAll,
    visibleMenuRanking,
    fetchMenuAnalysis,
    // 매출
    salesAnalysisData,
    salesPeriod,
    salesPeriodLabel,
    salesCompare,
    fetchSalesAnalysis,
    goPrevPeriod,
    goNextPeriod,
    isNextPeriodDisabled,
    periodNavLabel,
    // 결제
    paymentRatioItems,
    paymentSummary,
    transactions,
    expandedTxId,
    showTxPanel,
    toggleTxDetail,
    fetchPaymentAnalysis,
    // 테이블
    tableSummary,
    tableTurnover,
    fetchTableAnalysis,
    // 공통
    fetchTabData,
  }
}
