<template>
  <div class="page">
    <header class="topbar">
      <h1 class="topbar-title">매출 정산</h1>
      <router-link to="/owner/panel" class="topbar-back">← 메인</router-link>
    </header>

    <div class="body">
      <main class="main" :class="{ 'main-noscroll': activeTab === 'calendar' }">

        <!-- ==================== 날짜 선택 ==================== -->
        <div class="date-picker-bar">
          <button class="date-nav-btn" @click="goPrevDay">
            <span class="nav-arrow">‹</span>
          </button>
          <div class="date-selector">
            <div class="date-select-wrap">
              <select v-model="currentYear" @change="onDateChange" class="date-select">
                <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
              </select>
              <span class="date-select-label">년</span>
            </div>
            <div class="date-divider">·</div>
            <div class="date-select-wrap">
              <select v-model="currentMonth" @change="onDateChange" class="date-select">
                <option v-for="m in 12" :key="m" :value="m">{{ String(m).padStart(2, '0') }}</option>
              </select>
              <span class="date-select-label">월</span>
            </div>
            <div class="date-divider">·</div>
            <div class="date-select-wrap">
              <select v-model="currentDay" @change="onDateChange" class="date-select">
                <option :value="0">전체</option>
                <option v-for="d in daysInCurrentMonth" :key="d" :value="d">{{ String(d).padStart(2, '0') }}</option>
              </select>
              <span class="date-select-label" v-if="currentDay !== 0">일</span>
            </div>
          </div>
          <button class="date-nav-btn" @click="goNextDay">
            <span class="nav-arrow">›</span>
          </button>
          <button class="date-today-btn" @click="goToday">오늘</button>
        </div>

        <!-- ==================== 달력 탭 ==================== -->
        <div v-if="activeTab === 'calendar'" class="tab-content tab-content-calendar">
          <div class="month-summary">
            <div class="month-summary-left">
              <span class="month-summary-label">
                {{ currentYear }}년 {{ currentMonth }}월{{ currentDay ? ' ' + currentDay + '일' : '' }} 총 매출
              </span>
              <strong class="month-summary-value">{{ formatPrice(monthlyTotal) }}<small>원</small></strong>
            </div>
            <div class="month-summary-right">
              <div class="mini-stat"><span>주문</span><strong>{{ monthlyOrderCount }}건</strong></div>
              <div class="mini-stat"><span>취소</span><strong class="mini-danger">{{ monthlyCancelCount }}건</strong></div>
              <div class="mini-stat"><span>일평균</span><strong>{{ formatPrice(monthlyAverage) }}원</strong></div>
            </div>
          </div>

          <!-- 달력 뷰 -->
          <div v-if="calendarView === 'calendar'" class="calendar-wrap">
            <div class="calendar-top">
              <h2 class="calendar-title">{{ currentMonth }}월</h2>
              <button class="graph-toggle-btn" @click="calendarView = 'graph'">
                📈 그래프 보기
              </button>
            </div>
            <div class="calendar">
              <div v-for="d in DAY_NAMES" :key="d" class="cal-hd">{{ d }}</div>
              <div v-for="(day, i) in calendarDays" :key="i" class="cal-cell"
                   :class="{ empty: !day.date, today: day.isToday, 'selected-day': currentDay === day.date }"
                   @click="day.date && selectDay(day)">
                <template v-if="day.date">
                  <span class="cal-date">{{ day.date }}</span>
                  <span class="cal-amt" :class="{ 'cal-amt-zero': day.sales === 0 }">
                    {{ day.sales === 0 ? '0원' : formatPrice(day.sales) + '원' }}
                  </span>
                </template>
              </div>
            </div>
          </div>

          <!-- 그래프 뷰 (일별 매출) -->
          <div v-if="calendarView === 'graph'" class="calendar-wrap graph-wrap">
            <div class="calendar-top">
              <h2 class="calendar-title">{{ currentMonth }}월 일별 매출</h2>
              <button class="graph-toggle-btn" @click="calendarView = 'calendar'">
                📅 달력으로
              </button>
            </div>
            <div class="chart-container-graph">
              <Line :key="'cal-graph-' + currentMonth" :data="unifiedLineData" :options="unifiedLineOptions"/>
            </div>
          </div>

          <!-- 일별 상세 정산 모달 -->
          <DaySettlementModal
              :visible="showDayModal"
              :year="currentYear"
              :month="currentMonth"
              :day="modalDay"
              @close="showDayModal = false"
          />

        </div>

        <!-- ==================== 메뉴 탭 ==================== -->
        <div v-if="activeTab === 'menu'" class="tab-content">
          <h2 class="section-title">메뉴 분석</h2>

          <div v-if="loading.menu" class="loading-box">데이터를 불러오는 중...</div>
          <template v-else>
            <div class="card">
              <h3 class="card-title">카테고리별 매출</h3>
              <div v-if="categorySales.length === 0" class="empty-msg">해당 기간 데이터가 없습니다</div>
              <div v-else class="h-bar-list">
                <div v-for="cat in categorySales" :key="cat.name" class="h-bar-item">
                  <div class="h-bar-label"><span>{{ cat.name }}</span><strong>{{ formatPrice(cat.amount) }}원</strong>
                  </div>
                  <div class="h-bar-track">
                    <div class="h-bar-fill" :style="{ width: cat.rate + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="card">
              <h3 class="card-title">메뉴별 판매 순위</h3>
              <div v-if="menuRanking.length === 0" class="empty-msg">해당 기간 데이터가 없습니다</div>
              <div v-else class="rank-list">
                <div v-for="(item, idx) in menuRanking" :key="item.name" class="rank-item">
                  <span class="rank-num" :class="{ top3: idx < 3 }">{{ idx + 1 }}</span>
                  <span class="rank-dot" :style="{ background: item.color }"></span>
                  <span class="rank-name">{{ item.name }}</span>
                  <span class="rank-qty">{{ item.qty }}개</span>
                  <strong class="rank-amt">{{ formatPrice(item.amount) }}원</strong>
                  <span class="rank-rate">{{ item.rate }}%</span>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- ==================== 매출 분석 탭 ==================== -->
        <div v-if="activeTab === 'sales'" class="tab-content">
          <h2 class="section-title">매출 분석</h2>

          <div v-if="loading.sales" class="loading-box">데이터를 불러오는 중...</div>
          <template v-else>
            <div class="card">
              <div class="card-header">
                <h3 class="card-title">{{ salesPeriodLabel }}</h3>
                <div class="toggle-group">
                  <button :class="{ active: salesPeriod === 'weekly' }" @click="salesPeriod = 'weekly'">주별</button>
                  <button :class="{ active: salesPeriod === 'monthly' }" @click="salesPeriod = 'monthly'">월별</button>
                  <button :class="{ active: salesPeriod === 'hourly' }" @click="salesPeriod = 'hourly'">시간대별</button>
                  <button :class="{ active: salesPeriod === 'dow' }" @click="salesPeriod = 'dow'">요일별</button>
                </div>
              </div>
              <div v-if="salesPeriod === 'weekly' || salesPeriod === 'monthly'" class="period-nav">
                <button class="period-nav-btn" @click="goPrevPeriod">‹ 이전</button>
                <span class="period-nav-label">{{ periodNavLabel }}</span>
                <button class="period-nav-btn" @click="goNextPeriod" :disabled="isNextPeriodDisabled">다음 ›</button>
              </div>
              <div class="chart-container">
                <Line :key="salesPeriod + '_' + periodOffset" :data="unifiedLineData" :options="unifiedLineOptions"/>
              </div>
            </div>

            <div class="card">
              <h3 class="card-title">매출 비교</h3>
              <div class="compare-grid">
                <div class="compare-item">
                  <span class="compare-label">이번 달</span>
                  <strong class="compare-value">{{ formatPrice(salesCompare.thisMonth) }}원</strong>
                </div>
                <div class="compare-item">
                  <span class="compare-label">전월</span>
                  <strong class="compare-value">{{ formatPrice(salesCompare.lastMonth) }}원</strong>
                  <span class="compare-change" :class="salesCompare.momRate >= 0 ? 'up' : 'down'">
                    {{ salesCompare.momRate >= 0 ? '▲' : '▼' }} {{ Math.abs(salesCompare.momRate) }}%
                  </span>
                </div>
                <div class="compare-item">
                  <span class="compare-label">전년 동월</span>
                  <strong class="compare-value">{{ formatPrice(salesCompare.lastYear) }}원</strong>
                  <span class="compare-change" :class="salesCompare.yoyRate >= 0 ? 'up' : 'down'">
                    {{ salesCompare.yoyRate >= 0 ? '▲' : '▼' }} {{ Math.abs(salesCompare.yoyRate) }}%
                  </span>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- ==================== 결제 탭 ==================== -->
        <div v-if="activeTab === 'payment'" class="tab-content">
          <h2 class="section-title">결제 분석</h2>

          <div v-if="loading.payment" class="loading-box">데이터를 불러오는 중...</div>
          <template v-else>
            <div class="card">
              <h3 class="card-title">결제 수단별 비중</h3>
              <div class="payment-ratio-wrap">
                <div class="chart-container-ratio">
                  <Bar :data="paymentRatioChartData" :options="paymentRatioOptions"/>
                </div>
                <div class="payment-ratio-labels">
                  <div v-for="item in paymentRatioItems" :key="item.label" class="ratio-label-item">
                    <span class="ratio-dot" :style="{ background: item.color }"></span>
                    <span class="ratio-name">{{ item.label }}</span>
                    <strong class="ratio-pct" :style="{ color: item.color }">{{ item.pct }}%</strong>
                  </div>
                </div>
              </div>
            </div>

            <div class="stat-row">
              <div class="stat-box">
                <span class="stat-label">평균 객단가</span>
                <strong class="stat-val">{{ formatPrice(paymentSummary.avgAmount) }}원</strong>
              </div>
              <div class="stat-box">
                <span class="stat-label">결제 건수</span>
                <strong class="stat-val">{{ paymentSummary.totalCount }}건</strong>
              </div>
              <div class="stat-box">
                <span class="stat-label">총 결제액</span>
                <strong class="stat-val">{{ formatPrice(paymentSummary.totalAmount) }}원</strong>
                <span class="stat-sub">{{ currentYear }}년 {{ currentMonth }}월 누적<br>
                  <strong>{{ formatPrice(paymentSummary.monthlyTotal) }}원</strong>
                </span>
              </div>
            </div>

            <div class="card">
              <h3 class="card-title">결제 내역</h3>
              <div v-if="transactions.length === 0" class="empty-msg">해당 기간 결제 내역이 없습니다</div>
              <div v-else class="tx-scroll-area">
                <div class="tx-list">
                  <div v-for="tx in transactions" :key="tx.id" class="tx-item-wrap">
                    <div class="tx-item" @click="toggleTxDetail(tx.id)"
                         :class="{ 'tx-item-open': expandedTxId === tx.id }">
                      <div class="tx-left"><span class="tx-method">{{ tx.method }}</span><span
                          class="tx-time">{{ tx.time }}</span></div>
                      <div class="tx-right"><strong>{{ formatPrice(tx.amount) }}원</strong><span
                          class="tx-table">테이블 {{ tx.tableNum }}</span></div>
                      <span class="tx-chevron" :class="{ open: expandedTxId === tx.id }">›</span>
                    </div>
                    <transition name="slide">
                      <div v-if="expandedTxId === tx.id" class="tx-detail">
                        <div class="tx-detail-title">주문 메뉴</div>
                        <div v-for="menu in tx.menus" :key="menu.name" class="tx-menu-row">
                          <span class="tx-menu-name">{{ menu.name }}</span>
                          <span class="tx-menu-qty">x{{ menu.qty }}</span>
                          <strong class="tx-menu-price">{{ formatPrice(menu.price) }}원</strong>
                        </div>
                      </div>
                    </transition>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- ==================== 테이블 탭 ==================== -->
        <div v-if="activeTab === 'table'" class="tab-content">
          <h2 class="section-title">테이블 분석</h2>

          <div v-if="loading.table" class="loading-box">데이터를 불러오는 중...</div>
          <template v-else>
            <div class="stat-row">
              <div class="stat-box"><span class="stat-label">평균 회전율</span><strong
                  class="stat-val">{{ tableSummary.avgTurnover }}회<small>/일</small></strong></div>
              <div class="stat-box"><span class="stat-label">평균 이용 시간</span><strong
                  class="stat-val">{{ tableSummary.avgDuration }}분</strong></div>
              <div class="stat-box"><span class="stat-label">오늘 총 이용</span><strong
                  class="stat-val">{{ tableSummary.todayUseCount }}회</strong></div>
            </div>

            <div class="card">
              <h3 class="card-title">테이블별 회전율</h3>
              <div v-if="tableTurnover.length === 0" class="empty-msg">해당 기간 데이터가 없습니다</div>
              <div v-else class="chart-container">
                <Bar :data="tableTurnoverBarData" :options="tableTurnoverBarOptions"/>
              </div>
            </div>
          </template>
        </div>

      </main>

      <nav class="tabs">
        <button v-for="tab in tabs" :key="tab.id" class="tab-btn" :class="{ active: activeTab === tab.id }"
                @click="activeTab = tab.id">
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-text">{{ tab.label }}</span>
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup>
import DaySettlementModal from '@/views/owner/DaySettlementModal.vue'
import {ref, computed, watch, onMounted} from 'vue'
import axios from 'axios'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  PointElement, LineElement,
  BarElement, ArcElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js'
import {Line, Bar} from 'vue-chartjs'

ChartJS.register(
    CategoryScale, LinearScale,
    PointElement, LineElement,
    BarElement, ArcElement,
    Title, Tooltip, Legend, Filler
)

// ══════════════ API base URL ══════════════
// axios 인터셉터가 Authorization 헤더를 자동 부착하므로 개별 호출에서 토큰 생략
const API = process.env.VUE_APP_API_BASE_URL
const showDayModal = ref(false)
const modalDay = ref(0)
// ══════════════ Chart 커스텀 플러그인 ══════════════
const datalabelsPlugin = {
  id: 'salesDatalabels',
  afterDraw(chart) {
    const pluginOpts = chart.options?.plugins?.salesDatalabels
    if (pluginOpts === false || pluginOpts?.enabled === false) return

    const {ctx, data, chartArea, scales} = chart
    const dataset = data.datasets[0]
    if (!dataset || !scales.x || !scales.y) return

    const vals = dataset.data
    const max = Math.max(...vals, 1)
    const iw = chartArea.right - chartArea.left
    const ih = chartArea.bottom - chartArea.top
    const step = vals.length > 1 ? iw / (vals.length - 1) : 0
    const isDaily = chart.options._isDaily || false

    ctx.save()
    vals.forEach((val, i) => {
      if (!val) return
      const xPos = chartArea.left + step * i
      const yPos = chartArea.bottom - (val / max) * ih
      const label =
          val >= 100000000 ? Math.floor(val / 100000000) + '억'
              : val >= 10000 ? Math.floor(val / 10000) + '만'
                  : val.toLocaleString('ko-KR')

      const fs = isDaily ? 8 : 10
      ctx.font = `700 ${fs}px 'Noto Sans KR', sans-serif`
      const tw = ctx.measureText(label).width
      const pad = 3
      const bx = xPos - tw / 2 - pad
      const by = yPos - fs - pad * 2 - 8

      ctx.fillStyle = 'rgba(26,26,30,0.75)'
      ctx.beginPath()
      ctx.roundRect(bx, by, tw + pad * 2, fs + pad * 2, 3)
      ctx.fill()

      ctx.fillStyle = '#d0d0d8'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.fillText(label, xPos, yPos - 8)
    })
    ctx.restore()
  }
}
ChartJS.register(datalabelsPlugin)

// ══════════════ 탭 ══════════════
const tabs = [
  {id: 'calendar', icon: '📅', label: '달력'},
  {id: 'menu', icon: '🍽', label: '메뉴'},
  {id: 'sales', icon: '📊', label: '매출'},
  {id: 'payment', icon: '💳', label: '결제'},
  {id: 'table', icon: '🪑', label: '테이블'},
]
const activeTab = ref('calendar')
const calendarView = ref('calendar')

// ══════════════ 로딩 상태 ══════════════
const loading = ref({
  menu: false,
  sales: false,
  payment: false,
  table: false,
})

// ══════════════ 날짜 ══════════════
const now = new Date()
const currentYear = ref(now.getFullYear())
const currentMonth = ref(now.getMonth() + 1)
const currentDay = ref(0)

const yearOptions = computed(() => {
  const y = new Date().getFullYear()
  return Array.from({length: 7}, (_, i) => y - 5 + i)
})
const daysInCurrentMonth = computed(() =>
    new Date(currentYear.value, currentMonth.value, 0).getDate()
)

const goPrevDay = () => {
  if (currentDay.value === 0) {
    if (currentMonth.value === 1) {
      currentMonth.value = 12;
      currentYear.value--
    } else currentMonth.value--
  } else {
    if (currentDay.value === 1) {
      if (currentMonth.value === 1) {
        currentMonth.value = 12;
        currentYear.value--
      } else currentMonth.value--
      currentDay.value = daysInCurrentMonth.value
    } else {
      currentDay.value--
    }
  }
  onDateChange()
}

const goNextDay = () => {
  if (currentDay.value === 0) {
    if (currentMonth.value === 12) {
      currentMonth.value = 1;
      currentYear.value++
    } else currentMonth.value++
  } else {
    if (currentDay.value === daysInCurrentMonth.value) {
      if (currentMonth.value === 12) {
        currentMonth.value = 1;
        currentYear.value++
      } else currentMonth.value++
      currentDay.value = 1
    } else {
      currentDay.value++
    }
  }
  onDateChange()
}

const goToday = () => {
  const t = new Date()
  currentYear.value = t.getFullYear()
  currentMonth.value = t.getMonth() + 1
  currentDay.value = t.getDate()
  onDateChange()
}

const onDateChange = async () => {
  await fetchMonthlyCalender()
  // 현재 활성 탭 데이터도 같이 갱신
  await fetchTabData(activeTab.value)
}

// ══════════════ 달력 탭 데이터 ══════════════
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']
const calendarDays = ref([])
const monthlySalesMap = ref({})
const monthlyOrderCount = ref(0)
const monthlyCancelCount = ref(0)

// ✅ 하드코딩 fallback 제거
const monthlyTotal = computed(() =>
    Object.values(monthlySalesMap.value).reduce((a, b) => a + b, 0)
)
const monthlyAverage = computed(() => {
  const d = Object.keys(monthlySalesMap.value).length
  return d > 0 ? Math.round(monthlyTotal.value / d) : 0
})

const selectDay = (day) => {
  currentDay.value = day.date
  modalDay.value = day.date
  showDayModal.value = true
}

// ══════════════ 메뉴 탭 데이터 ══════════════
const categorySales = ref([])
const menuRanking = ref([])

const RANK_COLORS = [
  '#ea580c', '#60a5fa', '#22c55e', '#f59e0b', '#a78bfa',
  '#ec4899', '#14b8a6', '#f43f5e', '#8b5cf6', '#06b6d4',
]

// ══════════════ 매출 분석 탭 데이터 ══════════════
const salesAnalysisData = ref(null)
const salesPeriod = ref('weekly')
const periodOffset = ref(0)

watch(salesPeriod, () => {
  periodOffset.value = 0
})

const salesPeriodLabel = computed(() => ({
  weekly: '주별 매출',
  monthly: '월별 매출',
  hourly: '시간대별 매출',
  dow: '요일별 매출',
}[salesPeriod.value]))

const goPrevPeriod = () => {
  periodOffset.value--
}
const goNextPeriod = () => {
  if (!isNextPeriodDisabled.value) periodOffset.value++
}
const isNextPeriodDisabled = computed(() => periodOffset.value >= 0)

const periodNavLabel = computed(() => {
  const now = new Date()
  if (salesPeriod.value === 'monthly') {
    const d = new Date(now.getFullYear(), now.getMonth() + periodOffset.value, 1)
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월`
  }
  if (salesPeriod.value === 'weekly') {
    const monday = new Date(now)
    const day = monday.getDay() || 7
    monday.setDate(monday.getDate() - day + 1 + periodOffset.value * 7)
    const sunday = new Date(monday)
    sunday.setDate(sunday.getDate() + 6)
    const fmt = (d) => `${d.getMonth() + 1}/${d.getDate()}`
    return `${fmt(monday)} ~ ${fmt(sunday)}`
  }
  return ''
})

// ✅ mockCompare → computed (API 데이터 기반)
const salesCompare = computed(() =>
    salesAnalysisData.value?.compare
    || {thisMonth: 0, lastMonth: 0, momRate: 0, lastYear: 0, yoyRate: 0}
)

// ══════════════ 결제 탭 데이터 ══════════════
const paymentRatioItems = ref([
  {label: '💳 카드', pct: 0, color: 'rgba(96,165,250,0.9)'},
  {label: '📱 간편결제', pct: 0, color: 'rgba(34,197,94,0.9)'},
  {label: '🏦 계좌이체', pct: 0, color: 'rgba(245,158,11,0.9)'},
  {label: '📞 휴대폰', pct: 0, color: 'rgba(167,139,250,0.9)'},
])
const paymentSummary = ref({avgAmount: 0, totalCount: 0, totalAmount: 0, monthlyTotal: 0})
const transactions = ref([])

// ══════════════ 테이블 탭 데이터 ══════════════
const tableSummary = ref({avgTurnover: 0, avgDuration: 0, todayUseCount: 0})
const tableTurnover = ref([])

// ══════════════ 결제 펼침 ══════════════
const expandedTxId = ref(null)
const toggleTxDetail = (id) => {
  expandedTxId.value = expandedTxId.value === id ? null : id
}

// ══════════════════════════════════════════════
//  차트 데이터 (computed)
// ══════════════════════════════════════════════

// ── 통합 라인 차트 데이터 ──
const currentSalesData = computed(() => {
  // 달력 탭 그래프 뷰 → monthlySalesMap 기반 일별
  if (activeTab.value === 'calendar') {
    return Array.from({length: daysInCurrentMonth.value}, (_, i) => ({
      label: (i + 1) + '일',
      value: monthlySalesMap.value[i + 1] || 0,
    }))
  }

  // 매출 분석 탭 → salesAnalysisData API 응답 기반
  const d = salesAnalysisData.value
  if (!d) return []

  if (salesPeriod.value === 'weekly')
    return (d.weeklyBars || []).map(b => ({label: b.label, value: b.value}))
  if (salesPeriod.value === 'monthly')
    return (d.monthlyBars || []).map(b => ({label: b.label, value: b.value}))
  if (salesPeriod.value === 'hourly')
    return (d.hourlySales || []).map(h => ({label: h.hour + '시', value: h.amount || 0}))
  if (salesPeriod.value === 'dow')
    return (d.dayOfWeekSales || []).map(b => ({label: b.label, value: b.value}))
  return []
})

const tooltipBase = {
  backgroundColor: '#1a1a1e', borderColor: '#2e2e34', borderWidth: 1,
  titleColor: '#8e8e96', bodyColor: '#f0f0f2', padding: 10,
}

const palette = computed(() => {
  if (activeTab.value === 'calendar') return {line: '#ea580c', bg: 'rgba(234,88,12,0.13)'}
  if (salesPeriod.value === 'hourly') return {line: '#60a5fa', bg: 'rgba(96,165,250,0.13)'}
  if (salesPeriod.value === 'dow') return {line: '#a78bfa', bg: 'rgba(167,139,250,0.13)'}
  return {line: '#ea580c', bg: 'rgba(234,88,12,0.13)'}
})

const unifiedLineData = computed(() => {
  const data = currentSalesData.value
  const {line} = palette.value
  const isCalGraph = activeTab.value === 'calendar'
  const isDow = !isCalGraph && salesPeriod.value === 'dow'
  const isHourly = !isCalGraph && salesPeriod.value === 'hourly'
  const isDaily = isCalGraph

  // 요일별 best 플래그는 API 응답에서 가져옴
  const dowData = salesAnalysisData.value?.dayOfWeekSales || []

  return {
    labels: data.map(d => d.label),
    datasets: [{
      label: '매출',
      data: data.map(d => d.value),
      borderColor: line,
      backgroundColor: palette.value.bg,
      pointBackgroundColor: data.map((d, i) => {
        if (isDow && dowData[i]?.best) return '#f59e0b'
        if (isHourly && d.value >= 1200000) return '#f59e0b'
        return line
      }),
      pointBorderColor: '#1a1a1e',
      pointBorderWidth: 2,
      pointRadius: data.map((_, i) =>
          isDow && dowData[i]?.best ? 7 : isDaily ? 3 : 5
      ),
      pointHoverRadius: 8,
      tension: 0.35,
      fill: true,
    }]
  }
})

const unifiedLineOptions = computed(() => {
  const isCalGraph = activeTab.value === 'calendar'
  const isDaily = isCalGraph
  const isDow = !isCalGraph && salesPeriod.value === 'dow'
  const dowData = salesAnalysisData.value?.dayOfWeekSales || []

  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: {duration: 300},
    layout: {padding: {top: 28, left: 4, right: 4}},
    _isDaily: isDaily,
    plugins: {
      salesDatalabels: {},
      legend: {display: false},
      tooltip: {
        ...tooltipBase,
        callbacks: {
          label: (ctx) => {
            const d = isDow ? dowData[ctx.dataIndex] : null
            return (d?.best ? '🏆 최고  ' : '  ') + ctx.parsed.y.toLocaleString('ko-KR') + '원'
          }
        }
      }
    },
    scales: {
      x: {
        grid: {color: '#2e2e34', drawBorder: false},
        ticks: {
          color: '#8e8e96',
          font: {size: isDaily ? 9 : 11, weight: '700'},
          maxRotation: isDaily ? 45 : 0,
          maxTicksLimit: isDaily ? 16 : 24,
        }
      },
      y: {
        grid: {color: 'transparent', drawBorder: false},
        ticks: {display: false},
        border: {display: false},
      }
    }
  }
})

// ── 결제 비중 누적 막대 (reactive) ──
const paymentRatioChartData = computed(() => ({
  labels: ['결제 비중'],
  datasets: paymentRatioItems.value.map((item, i, arr) => ({
    label: item.label,
    data: [item.pct],
    backgroundColor: item.color,
    stack: 'ratio',
    borderSkipped: false,
    ...(i === arr.length - 1 ? {
      borderRadius: {topRight: 6, bottomRight: 6, topLeft: 0, bottomLeft: 0}
    } : {})
  }))
}))

const paymentRatioOptions = {
  indexAxis: 'y',
  responsive: true, maintainAspectRatio: false,
  plugins: {
    salesDatalabels: false,
    legend: {display: false},
    tooltip: {...tooltipBase, callbacks: {label: (ctx) => ' ' + ctx.dataset.label + ': ' + ctx.parsed.x + '%'}}
  },
  scales: {
    x: {stacked: true, max: 100, grid: {display: false}, ticks: {display: false}, border: {display: false}},
    y: {stacked: true, grid: {display: false}, ticks: {display: false}, border: {display: false}}
  }
}

// ── 테이블 회전율 Bar ──
const tableTurnoverBarData = computed(() => ({
  labels: tableTurnover.value.map(t => t.tableNum + '번'),
  datasets: [{
    label: '회전율',
    data: tableTurnover.value.map(t => t.turnover),
    backgroundColor: tableTurnover.value.map(t =>
        t.turnover >= 4 ? '#ea580c' : t.turnover >= 2 ? '#f59e0b' : 'rgba(245,158,11,0.35)'
    ),
    borderRadius: 6, borderSkipped: false,
  }]
}))

const tableTurnoverBarOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    salesDatalabels: false,
    legend: {display: false},
    tooltip: {...tooltipBase, callbacks: {label: (ctx) => ' ' + ctx.parsed.y + '회'}}
  },
  scales: {
    x: {grid: {display: false}, ticks: {color: '#8e8e96', font: {size: 12, weight: '700'}}},
    y: {
      grid: {color: '#2e2e34', drawBorder: false},
      ticks: {color: '#8e8e96', font: {size: 11}, callback: (v) => v + '회'}
    }
  }
}

// ══════════════════════════════════════════════
//  API 호출 함수들
//  ※ 토큰은 main.js의 axios 인터셉터가 자동 부착 → 헤더 생략
// ══════════════════════════════════════════════

// ── [1] 달력 탭: 월별 달력 ──
const fetchMonthlyCalender = async () => {
  try {
    const res = await axios.get(`${API}/store/monthlysettlement`, {
      params: {year: currentYear.value, month: currentMonth.value}
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


// ── [2] 메뉴 분석 탭 ──
const fetchMenuAnalysis = async () => {
  loading.value.menu = true
  try {
    const res = await axios.get(`${API}/store/analysis/menu`, {
      params: {year: currentYear.value, month: currentMonth.value}
    })
    const data = res.data

    categorySales.value = (data.categorySales || []).map(c => ({
      name: c.name,
      amount: c.amount,
      rate: c.rate,
    }))

    menuRanking.value = (data.menuRanking || []).map((m, i) => ({
      name: m.name,
      qty: m.qty,
      amount: m.amount,
      rate: m.rate,
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

// ── [3] 매출 분석 탭 ──
const fetchSalesAnalysis = async () => {
  loading.value.sales = true
  try {
    const res = await axios.get(`${API}/store/analysis/sales`, {
      params: {year: currentYear.value, month: currentMonth.value}
    })
    salesAnalysisData.value = res.data
  } catch (e) {
    console.error('매출 분석 로드 실패', e)
    salesAnalysisData.value = null
  } finally {
    loading.value.sales = false
  }
}

// ── [4] 결제 분석 탭 ──
const fetchPaymentAnalysis = async () => {
  loading.value.payment = true
  try {
    const res = await axios.get(`${API}/store/analysis/payment`, {
      params: {
        year: currentYear.value, month: currentMonth.value,
        day: currentDay.value
      }
    })
    const data = res.data

    // 결제 수단 비중
    const bd = data.methodBreakdown || {}
    paymentRatioItems.value = [
      {label: '💳 카드', pct: bd.cardRate || 0, color: 'rgba(96,165,250,0.9)'},
      {label: '📱 간편결제', pct: bd.easyPayRate || 0, color: 'rgba(34,197,94,0.9)'},
      {label: '🏦 계좌이체', pct: bd.transferRate || 0, color: 'rgba(245,158,11,0.9)'},
      {label: '📞 휴대폰', pct: bd.phoneRate || 0, color: 'rgba(167,139,250,0.9)'},
    ]

    // 결제 요약
    const s = data.summary || {}
    paymentSummary.value = {
      avgAmount: s.avgAmount || 0,
      totalCount: s.totalCount || 0,
      totalAmount: s.totalAmount || 0,
      monthlyTotal: s.monthlyTotal || s.totalAmount || 0,
    }

    // 최근 결제 내역 — 이모지 매핑
    const METHOD_EMOJI = {
      '카드': '💳 카드',
      '간편결제': '📱 간편결제',
      '계좌이체': '🏦 계좌이체',
      '휴대폰': '📞 휴대폰',
    }
    transactions.value = (data.recentTransactions || []).map(tx => ({
      id: tx.id,
      method: METHOD_EMOJI[tx.method] || tx.method || '기타',
      time: tx.time || '',
      amount: tx.amount || 0,
      tableNum: tx.tableNum || 0,
      menus: (tx.menus || []).map(m => ({name: m.name, qty: m.qty, price: m.price})),
    }))
  } catch (e) {
    console.error('결제 분석 로드 실패', e)
    paymentRatioItems.value = [
      {label: '💳 카드', pct: 0, color: 'rgba(96,165,250,0.9)'},
      {label: '📱 간편결제', pct: 0, color: 'rgba(34,197,94,0.9)'},
      {label: '🏦 계좌이체', pct: 0, color: 'rgba(245,158,11,0.9)'},
      {label: '📞 휴대폰', pct: 0, color: 'rgba(167,139,250,0.9)'},
    ]
    paymentSummary.value = {avgAmount: 0, totalCount: 0, totalAmount: 0, monthlyTotal: 0}
    transactions.value = []
  } finally {
    loading.value.payment = false
  }
}

// ── [5] 테이블 분석 탭 ──
const fetchTableAnalysis = async () => {
  loading.value.table = true
  try {
    const res = await axios.get(`${API}/store/analysis/table`, {
      params: {year: currentYear.value, month: currentMonth.value}
    })
    const data = res.data
    tableSummary.value = data.summary || {avgTurnover: 0, avgDuration: 0, todayUseCount: 0}
    tableTurnover.value = (data.tableTurnover || []).map(t => ({
      tableNum: t.tableNum,
      turnover: t.turnover,
    }))
  } catch (e) {
    console.error('테이블 분석 로드 실패', e)
    tableSummary.value = {avgTurnover: 0, avgDuration: 0, todayUseCount: 0}
    tableTurnover.value = []
  } finally {
    loading.value.table = false
  }
}

// ══════════════ 탭별 데이터 라우터 ══════════════
const fetchTabData = async (tab) => {
  if (tab === 'menu') await fetchMenuAnalysis()
  if (tab === 'sales') await fetchSalesAnalysis()
  if (tab === 'payment') await fetchPaymentAnalysis()
  if (tab === 'table') await fetchTableAnalysis()
}

// 탭 전환 시 해당 탭 데이터 로드
watch(activeTab, async (tab) => {
  await fetchTabData(tab)
})

// ══════════════ 달력 유틸 ══════════════
const generateCalendar = () => {
  const year = currentYear.value, month = currentMonth.value - 1
  const td = new Date(), isCur = year === td.getFullYear() && month === td.getMonth()
  const first = new Date(year, month, 1).getDay()
  const last = new Date(year, month + 1, 0).getDate()
  const days = []
  for (let i = 0; i < first; i++) days.push({date: null, sales: 0, isToday: false})
  for (let d = 1; d <= last; d++) days.push({
    date: d,
    sales: monthlySalesMap.value[d] || 0,   // ✅ 하드코딩 41418247 제거
    isToday: isCur && d === td.getDate(),
  })
  calendarDays.value = days
}

const formatPrice = (v) => (v ?? 0).toLocaleString('ko-KR')

// ══════════════ 마운트 ══════════════
onMounted(async () => {
  await fetchMonthlyCalender()
})
</script>

<style scoped>
@import "@/assets/css/OwnerSettlement.css";

/* 로딩 & 빈 상태 */
.loading-box {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: var(--text2);
  font-size: 14px;
  font-weight: 700;
}

.empty-msg {
  text-align: center;
  padding: 32px 0;
  color: var(--text2);
  font-size: 13px;
  font-weight: 700;
}
</style>