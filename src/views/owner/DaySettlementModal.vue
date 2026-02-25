<template>
  <transition name="modal-fade">
    <div v-if="visible" class="ds-overlay" @click.self="$emit('close')">
      <div class="ds-modal">

        <!-- Sticky Header -->
        <div class="ds-header">
          <div class="ds-header-inner">
            <div class="ds-header-left">
              <button class="ds-back-btn" @click="$emit('close')">←</button>
              <div>
                <div class="ds-header-date">
                  {{ month }}월 {{ day }}일
                  <span class="ds-header-dow">{{ dayOfWeekLabel }}</span>
                </div>
                <div class="ds-header-sub">포차온 · 영업 정산</div>
              </div>
            </div>
            <div class="ds-status-badge">
              <div class="ds-status-dot"></div>
              <span>마감 전</span>
            </div>
          </div>
        </div>

        <!-- Scrollable Body -->
        <div class="ds-body">

          <!-- ── 1. 요약 ── -->
          <div class="ds-section">
            <SectionHeader num="01" icon="📊" title="요약" sub="장사 한눈에" />

            <div class="ds-big-number-wrap">
              <div class="ds-big-label">순 매출</div>
              <div class="ds-big-number">
                {{ fmt(stats.netRevenue) }}<span class="ds-big-unit">원</span>
              </div>
              <div class="ds-diff-badge" :class="parseFloat(stats.diffPrev) >= 0 ? 'up' : 'down'">
                {{ parseFloat(stats.diffPrev) >= 0 ? '▲' : '▼' }}
                전일 대비 {{ Math.abs(parseFloat(stats.diffPrev)) }}%
              </div>
            </div>

            <div class="ds-stat-grid">
              <div class="ds-card" v-for="(k, i) in summaryCards" :key="i">
                <div class="ds-card-label">{{ k.l }}</div>
                <div class="ds-card-value" :class="{ warn: k.warn }">{{ k.v }}</div>
              </div>
            </div>
          </div>

          <!-- ── 2. 매출 구조 ── -->
          <div class="ds-section">
            <SectionHeader num="02" icon="💰" title="매출 구조" sub="결제수단별 분석" />

            <div class="ds-method-wrap">
              <DonutChart :segments="donutSegments" :size="120" />
              <div class="ds-method-list">
                <div v-for="(m, i) in methodList" :key="i" class="ds-method-item"
                     :class="{ 'no-border': i === methodList.length - 1 }">
                  <div class="ds-method-left">
                    <div class="ds-method-dot" :style="{ background: m.color }"></div>
                    <span class="ds-method-name">{{ m.label }}</span>
                  </div>
                  <div class="ds-method-right">
                    <div class="ds-method-amount">{{ fmt(m.amount) }}원</div>
                    <div class="ds-method-sub">{{ m.count }}건 · {{ m.pct }}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── 3. 운영 분석 ── -->
          <div class="ds-section">
            <SectionHeader num="03" icon="⏱" title="운영 분석" sub="시간대 · 테이블" />

            <div class="ds-subsection">
              <div class="ds-sub-label">시간대별 매출</div>
              <BarChart :data="hourlyData" :height="110" />
            </div>

            <div class="ds-subsection">
              <div class="ds-sub-label">테이블별 실적</div>
              <div class="ds-table-grid">
                <div v-for="(t, i) in tableEntries" :key="t[0]" class="ds-card ds-table-card"
                     :class="{ 'ds-table-top': i === 0 }">
                  <div class="ds-table-head">
                    <span class="ds-table-name">{{ t[0] }}</span>
                    <span v-if="i === 0" class="ds-top-badge">TOP</span>
                  </div>
                  <div class="ds-table-revenue">{{ fmt(t[1].revenue) }}원</div>
                  <div class="ds-table-sub">{{ t[1].visits }}회전 · 평균 {{ fmt(Math.round(t[1].revenue / t[1].visits)) }}원</div>
                </div>
              </div>
              <div class="ds-card ds-table-summary">
                <div class="ds-summary-col">
                  <div class="ds-summary-label">테이블 평균 매출</div>
                  <div class="ds-summary-value">{{ fmt(tableAvgRevenue) }}원</div>
                </div>
                <div class="ds-summary-divider"></div>
                <div class="ds-summary-col">
                  <div class="ds-summary-label">평균 회전수</div>
                  <div class="ds-summary-value">{{ tableAvgTurnover }}회</div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── 4. 메뉴 분석 ── -->
          <div class="ds-section">
            <SectionHeader num="04" icon="🍽" title="메뉴 분석" sub="수량 · 매출 기준 Top 5" />

            <div class="ds-menu-grid">
              <div>
                <div class="ds-sub-label">🔥 수량 TOP</div>
                <div v-for="([name, data], i) in stats.topByQty" :key="'q'+i" class="ds-rank-item">
                  <div class="ds-rank-head">
                    <span class="ds-rank-label">
                      <span class="ds-rank-num" :class="{ first: i === 0 }">{{ i + 1 }}</span>
                      {{ name }}
                    </span>
                    <span class="ds-rank-val">{{ data.qty }}개</span>
                  </div>
                  <div class="ds-rank-bar-track">
                    <div class="ds-rank-bar-fill"
                         :class="{ first: i === 0 }"
                         :style="{ width: (data.qty / stats.topByQty[0][1].qty * 100) + '%' }"></div>
                  </div>
                </div>
              </div>
              <div>
                <div class="ds-sub-label">💰 매출 TOP</div>
                <div v-for="([name, data], i) in stats.topByRevenue" :key="'r'+i" class="ds-rank-item">
                  <div class="ds-rank-head">
                    <span class="ds-rank-label">
                      <span class="ds-rank-num" :class="{ first: i === 0 }">{{ i + 1 }}</span>
                      {{ name }}
                    </span>
                    <span class="ds-rank-val ds-rank-val-sm">{{ fmt(data.revenue) }}</span>
                  </div>
                  <div class="ds-rank-bar-track">
                    <div class="ds-rank-bar-fill"
                         :class="{ first: i === 0 }"
                         :style="{ width: (data.revenue / stats.topByRevenue[0][1].revenue * 100) + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── 5. 정산 ── -->
          <div class="ds-section ds-section-settlement">
            <SectionHeader num="05" icon="🧾" title="정산" sub="카드수수료 · 실입금 · VAT" />

            <div class="ds-settle-total-wrap">
              <div class="ds-settle-total-label">총 정산 금액</div>
              <div class="ds-settle-total-value">
                {{ fmt(totalSettlement) }}<span class="ds-big-unit">원</span>
              </div>
            </div>

            <div class="ds-settle-rows">
              <div v-for="(row, i) in settlementRows" :key="i"
                   class="ds-settle-row" :class="{ bold: row.bold, 'border-top': i === 2 }">
                <span class="ds-settle-row-label" :class="{ bold: row.bold }">{{ row.l }}</span>
                <span class="ds-settle-row-value"
                      :style="{ color: row.v < 0 ? '#EF4444' : row.c, fontSize: row.bold ? '15px' : '13px', fontWeight: row.bold ? 800 : 600 }">
                  {{ row.v < 0 ? '-' : '' }}{{ fmt(Math.abs(row.v)) }}원
                </span>
              </div>
            </div>

            <div class="ds-stat-grid" style="margin-top: 16px">
              <div class="ds-card">
                <div class="ds-card-label">공급가액</div>
                <div class="ds-card-value">{{ fmt(stats.netRevenue - vatAmount) }}원</div>
              </div>
              <div class="ds-card">
                <div class="ds-card-label">부가세 (VAT)</div>
                <div class="ds-card-value">{{ fmt(vatAmount) }}원</div>
              </div>
            </div>

            <button class="ds-confirm-btn">🔒 정산 마감 확정</button>
          </div>

          <!-- ── 6. 주문 내역 ── -->
          <div class="ds-section">
            <SectionHeader num="06" icon="📋" title="주문 상세" sub="필터 · 클릭 시 상세 펼침" />

            <!-- Filters -->
            <div class="ds-filter-wrap">
              <button v-for="f in methodFilters" :key="f.v"
                      class="ds-filter-btn" :class="{ active: orderFilter === f.v }"
                      @click="orderFilter = f.v">{{ f.l }}</button>
              <div class="ds-filter-divider"></div>
              <button v-for="f in statusFilters" :key="f.v"
                      class="ds-filter-btn ds-filter-status" :class="{ active: statusFilter === f.v }"
                      @click="statusFilter = f.v">{{ f.l }}</button>
            </div>

            <div class="ds-order-count">
              {{ filteredOrders.length }}건
              <template v-if="!showAllOrders && filteredOrders.length > 5">
                (5건 표시 중)
              </template>
            </div>

            <!-- Order list -->
            <div class="ds-order-list">
              <div v-for="o in displayOrders" :key="o.id"
                   class="ds-card ds-order-item" :class="{ expanded: expandedOrder === o.id }"
                   @click="expandedOrder = expandedOrder === o.id ? null : o.id">
                <div class="ds-order-head">
                  <div class="ds-order-left">
                    <span class="ds-order-table">{{ o.table }}</span>
                    <div>
                      <div class="ds-order-amount">{{ fmt(o.amount) }}원</div>
                      <div class="ds-order-meta">{{ o.id }} · {{ o.time }}</div>
                    </div>
                  </div>
                  <div class="ds-order-badges">
                    <span class="ds-badge" :class="'method-' + o.method">{{ methodLabel(o.method) }}</span>
                    <span class="ds-badge" :class="o.status === '취소' ? 'status-cancel' : 'status-ok'">{{ o.status }}</span>
                  </div>
                </div>
                <transition name="slide-down">
                  <div v-if="expandedOrder === o.id" class="ds-order-detail" @click.stop>
                    <div v-for="(item, idx) in o.items" :key="idx" class="ds-order-menu-row">
                      <span class="ds-menu-name">{{ item.name }} × {{ item.qty }}</span>
                      <span class="ds-menu-price">{{ fmt(item.price * item.qty) }}원</span>
                    </div>
                  </div>
                </transition>
              </div>
            </div>

            <button v-if="filteredOrders.length > 5" class="ds-show-all-btn" @click="showAllOrders = !showAllOrders">
              {{ showAllOrders ? '접기 ▲' : `전체 ${filteredOrders.length}건 보기 ▼` }}
            </button>
          </div>

        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import axios from 'axios'

const API = process.env.VUE_APP_API_BASE_URL

// ── Props & Emits ──
const props = defineProps({
  visible: { type: Boolean, default: false },
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  day: { type: Number, required: true },
})
defineEmits(['close'])

// ── 상태 ──
const orderFilter = ref('all')
const statusFilter = ref('all')
const expandedOrder = ref(null)
const showAllOrders = ref(false)

// ── 주문 데이터 (API에서 가져올 예정, 현재 mock) ──
const orders = ref([])
const prevDayTotal = ref(0)
const dailyDetail = ref(null)

// ── 모달이 열릴 때 데이터 로드 ──
watch(() => props.visible, async (v) => {
  if (v) {
    orderFilter.value = 'all'
    statusFilter.value = 'all'
    expandedOrder.value = null
    showAllOrders.value = false
    await fetchData()
  }
})

const fetchData = async () => {
  // 일별 상세 정산
  try {
    const res = await axios.get(`${API}/store/dailysettlement`, {
      params: { year: props.year, month: props.month, day: props.day }
    })
    dailyDetail.value = res.data
  } catch { dailyDetail.value = null }

  // 주문 내역 (API 엔드포인트가 있다면 교체)
  try {
    const res = await axios.get(`${API}/store/dailyorders`, {
      params: { year: props.year, month: props.month, day: props.day }
    })
    orders.value = res.data.orders || []
    prevDayTotal.value = res.data.prevDayTotal || 0
  } catch {
    // API 없으면 mock 데이터로 폴백
    orders.value = getMockOrders()
    prevDayTotal.value = 892000
  }
}

// ── 요일 ──
const dayOfWeekLabel = computed(() => {
  const d = new Date(props.year, props.month - 1, props.day)
  return ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'][d.getDay()]
})

// ── 통계 계산 ──
const stats = computed(() => {
  const all = orders.value
  const completed = all.filter(o => o.status === '완료')
  const cancelled = all.filter(o => o.status === '취소')
  const totalRevenue = all.reduce((s, o) => s + o.amount, 0)
  const netRevenue = completed.reduce((s, o) => s + o.amount, 0)
  const avgPerOrder = completed.length ? Math.round(netRevenue / completed.length) : 0
  const prev = prevDayTotal.value || 1
  const diffPrev = ((netRevenue - prev) / prev * 100).toFixed(1)

  const byMethod = { card: { amount: 0, count: 0 }, cash: { amount: 0, count: 0 }, transfer: { amount: 0, count: 0 } }
  completed.forEach(o => {
    const m = byMethod[o.method] || byMethod.card
    m.amount += o.amount; m.count += 1
  })

  const hourly = {}
  all.forEach(o => {
    const h = o.time.split(':')[0]
    if (!hourly[h]) hourly[h] = { revenue: 0, count: 0 }
    if (o.status === '완료') hourly[h].revenue += o.amount
    hourly[h].count += 1
  })

  const menuSales = {}
  completed.forEach(o => {
    (o.items || []).forEach(item => {
      if (!menuSales[item.name]) menuSales[item.name] = { qty: 0, revenue: 0 }
      menuSales[item.name].qty += item.qty
      menuSales[item.name].revenue += item.price * item.qty
    })
  })
  const topByQty = Object.entries(menuSales).sort((a, b) => b[1].qty - a[1].qty).slice(0, 5)
  const topByRevenue = Object.entries(menuSales).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5)

  const tableData = {}
  completed.forEach(o => {
    if (!tableData[o.table]) tableData[o.table] = { visits: 0, revenue: 0 }
    tableData[o.table].visits += 1
    tableData[o.table].revenue += o.amount
  })

  return {
    totalRevenue, netRevenue, totalOrders: all.length,
    cancelCount: cancelled.length,
    cancelAmount: cancelled.reduce((s, o) => s + o.amount, 0),
    avgPerOrder, diffPrev, byMethod, hourly,
    topByQty, topByRevenue, tableData,
    completedCount: completed.length,
  }
})

// ── 요약 카드 ──
const summaryCards = computed(() => [
  { l: '총 매출', v: `${fmt(stats.value.totalRevenue)}원` },
  { l: '총 주문', v: `${stats.value.totalOrders}건` },
  { l: '취소/환불', v: `${stats.value.cancelCount}건 · ${fmt(stats.value.cancelAmount)}원`, warn: true },
  { l: '평균 객단가', v: `${fmt(stats.value.avgPerOrder)}원` },
])

// ── 결제수단 ──
const donutSegments = computed(() => [
  { value: stats.value.byMethod.card.amount || 1, color: '#818CF8' },
  { value: stats.value.byMethod.cash.amount || 0, color: '#22C55E' },
  { value: stats.value.byMethod.transfer.amount || 0, color: '#FBBF24' },
])

const methodList = computed(() => {
  const net = stats.value.netRevenue || 1
  return [
    { label: '카드', color: '#818CF8', ...stats.value.byMethod.card, pct: ((stats.value.byMethod.card.amount / net) * 100).toFixed(1) },
    { label: '현금', color: '#22C55E', ...stats.value.byMethod.cash, pct: ((stats.value.byMethod.cash.amount / net) * 100).toFixed(1) },
    { label: '이체', color: '#FBBF24', ...stats.value.byMethod.transfer, pct: ((stats.value.byMethod.transfer.amount / net) * 100).toFixed(1) },
  ]
})

// ── 시간대별 ──
const hourlyData = computed(() => {
  const entries = Object.entries(stats.value.hourly)
      .sort((a, b) => {
        const ha = parseInt(a[0]), hb = parseInt(b[0])
        return (ha < 6 ? ha + 24 : ha) - (hb < 6 ? hb + 24 : hb)
      })
      .map(([h, d]) => ({ label: `${h}시`, value: d.revenue, highlight: false }))
  if (entries.length > 0) {
    const peak = entries.reduce((m, d) => d.value > m.value ? d : m, entries[0])
    peak.highlight = true
  }
  return entries
})

// ── 테이블 ──
const tableEntries = computed(() =>
    Object.entries(stats.value.tableData).sort((a, b) => b[1].revenue - a[1].revenue)
)
const tableAvgRevenue = computed(() => {
  const keys = Object.keys(stats.value.tableData)
  return keys.length > 0 ? Math.round(stats.value.netRevenue / keys.length) : 0
})
const tableAvgTurnover = computed(() => {
  const vals = Object.values(stats.value.tableData)
  const keys = Object.keys(stats.value.tableData)
  if (keys.length === 0) return '0.0'
  return (vals.reduce((s, d) => s + d.visits, 0) / keys.length).toFixed(1)
})

// ── 정산 ──
const cardFeeRate = 0.022
const cardTotal = computed(() => stats.value.byMethod.card.amount)
const cardFee = computed(() => Math.round(cardTotal.value * cardFeeRate))
const expectedDeposit = computed(() => cardTotal.value - cardFee.value)
const cashTotal = computed(() => stats.value.byMethod.cash.amount)
const transferTotal = computed(() => stats.value.byMethod.transfer.amount)
const totalSettlement = computed(() => expectedDeposit.value + cashTotal.value + transferTotal.value)
const vatAmount = computed(() => Math.round(stats.value.netRevenue / 11))

const settlementRows = computed(() => [
  { l: '카드 승인 총액', v: cardTotal.value, c: '#818CF8' },
  { l: '카드 수수료 (2.2%)', v: -cardFee.value, c: '#EF4444' },
  { l: '카드 실 입금 예상', v: expectedDeposit.value, c: '#818CF8', bold: true },
  { l: '현금 보유액', v: cashTotal.value, c: '#22C55E' },
  { l: '이체 입금액', v: transferTotal.value, c: '#FBBF24' },
])

// ── 필터 ──
const methodFilters = [
  { l: '전체', v: 'all' }, { l: '카드', v: 'card' }, { l: '현금', v: 'cash' }, { l: '이체', v: 'transfer' },
]
const statusFilters = [
  { l: '전체', v: 'all' }, { l: '완료', v: '완료' }, { l: '취소', v: '취소' },
]

const filteredOrders = computed(() =>
    orders.value.filter(o => {
      if (orderFilter.value !== 'all' && o.method !== orderFilter.value) return false
      if (statusFilter.value !== 'all' && o.status !== statusFilter.value) return false
      return true
    })
)
const displayOrders = computed(() =>
    showAllOrders.value ? filteredOrders.value : filteredOrders.value.slice(0, 5)
)

// ── 유틸 ──
const fmt = (n) => (n ?? 0).toLocaleString('ko-KR')
const methodLabel = (m) => ({ card: '카드', cash: '현금', transfer: '이체' }[m] || m)

// ── Mock 데이터 (API가 준비되면 제거) ──
function getMockOrders() {
  return [
    { id: 'ORD-0225-001', table: 'T1', method: 'card', amount: 47000, status: '완료', time: '17:12', items: [{ name: '소맥 세트', qty: 2, price: 12000 }, { name: '닭발', qty: 1, price: 15000 }, { name: '소주', qty: 1, price: 5000 }, { name: '맥주', qty: 1, price: 5000 }] },
    { id: 'ORD-0225-002', table: 'T3', method: 'card', amount: 62000, status: '완료', time: '17:45', items: [{ name: '곱창전골', qty: 1, price: 32000 }, { name: '소주', qty: 3, price: 5000 }, { name: '계란말이', qty: 1, price: 15000 }] },
    { id: 'ORD-0225-003', table: 'T2', method: 'cash', amount: 28000, status: '완료', time: '18:03', items: [{ name: '오뎅탕', qty: 1, price: 18000 }, { name: '맥주', qty: 2, price: 5000 }] },
    { id: 'ORD-0225-004', table: 'T5', method: 'card', amount: 89000, status: '완료', time: '18:30', items: [{ name: '모듬전', qty: 1, price: 25000 }, { name: '닭발', qty: 2, price: 15000 }, { name: '소주', qty: 2, price: 5000 }, { name: '하이볼', qty: 2, price: 9000 }] },
    { id: 'ORD-0225-005', table: 'T1', method: 'transfer', amount: 35000, status: '완료', time: '19:10', items: [{ name: '떡볶이', qty: 1, price: 13000 }, { name: '순대', qty: 1, price: 14000 }, { name: '맥주', qty: 1, price: 5000 }, { name: '콜라', qty: 1, price: 3000 }] },
    { id: 'ORD-0225-006', table: 'T4', method: 'card', amount: 54000, status: '취소', time: '19:25', items: [{ name: '곱창전골', qty: 1, price: 32000 }, { name: '소주', qty: 2, price: 5000 }, { name: '계란말이', qty: 1, price: 12000 }] },
    { id: 'ORD-0225-007', table: 'T6', method: 'card', amount: 73000, status: '완료', time: '19:50', items: [{ name: '닭발', qty: 1, price: 15000 }, { name: '곱창전골', qty: 1, price: 32000 }, { name: '소주', qty: 2, price: 5000 }, { name: '하이볼', qty: 2, price: 8000 }] },
    { id: 'ORD-0225-008', table: 'T2', method: 'cash', amount: 41000, status: '완료', time: '20:15', items: [{ name: '모듬전', qty: 1, price: 25000 }, { name: '맥주', qty: 2, price: 5000 }, { name: '콜라', qty: 2, price: 3000 }] },
    { id: 'ORD-0225-009', table: 'T3', method: 'card', amount: 96000, status: '완료', time: '20:40', items: [{ name: '곱창전골', qty: 2, price: 32000 }, { name: '소주', qty: 4, price: 5000 }, { name: '계란말이', qty: 1, price: 12000 }] },
    { id: 'ORD-0225-010', table: 'T7', method: 'card', amount: 52000, status: '완료', time: '21:05', items: [{ name: '닭발', qty: 2, price: 15000 }, { name: '소맥 세트', qty: 1, price: 12000 }, { name: '떡볶이', qty: 1, price: 10000 }] },
    { id: 'ORD-0225-011', table: 'T5', method: 'transfer', amount: 38000, status: '완료', time: '21:30', items: [{ name: '오뎅탕', qty: 1, price: 18000 }, { name: '소주', qty: 2, price: 5000 }, { name: '순대', qty: 1, price: 10000 }] },
    { id: 'ORD-0225-012', table: 'T1', method: 'card', amount: 67000, status: '완료', time: '21:55', items: [{ name: '곱창전골', qty: 1, price: 32000 }, { name: '모듬전', qty: 1, price: 25000 }, { name: '맥주', qty: 2, price: 5000 }] },
    { id: 'ORD-0225-013', table: 'T8', method: 'card', amount: 44000, status: '취소', time: '22:10', items: [{ name: '닭발', qty: 1, price: 15000 }, { name: '떡볶이', qty: 1, price: 13000 }, { name: '소주', qty: 2, price: 5000 }, { name: '콜라', qty: 2, price: 3000 }] },
    { id: 'ORD-0225-014', table: 'T4', method: 'cash', amount: 58000, status: '완료', time: '22:35', items: [{ name: '곱창전골', qty: 1, price: 32000 }, { name: '계란말이', qty: 1, price: 12000 }, { name: '하이볼', qty: 2, price: 7000 }] },
    { id: 'ORD-0225-015', table: 'T6', method: 'card', amount: 83000, status: '완료', time: '23:00', items: [{ name: '모듬전', qty: 2, price: 25000 }, { name: '닭발', qty: 1, price: 15000 }, { name: '소주', qty: 2, price: 5000 }, { name: '맥주', qty: 1, price: 5000 }, { name: '콜라', qty: 1, price: 3000 }] },
    { id: 'ORD-0225-016', table: 'T2', method: 'card', amount: 71000, status: '완료', time: '23:20', items: [{ name: '곱창전골', qty: 1, price: 32000 }, { name: '소맥 세트', qty: 2, price: 12000 }, { name: '순대', qty: 1, price: 15000 }] },
    { id: 'ORD-0225-017', table: 'T3', method: 'card', amount: 49000, status: '완료', time: '23:45', items: [{ name: '오뎅탕', qty: 1, price: 18000 }, { name: '닭발', qty: 1, price: 15000 }, { name: '맥주', qty: 2, price: 5000 }, { name: '콜라', qty: 2, price: 3000 }] },
    { id: 'ORD-0225-018', table: 'T7', method: 'transfer', amount: 32000, status: '완료', time: '00:05', items: [{ name: '떡볶이', qty: 1, price: 13000 }, { name: '계란말이', qty: 1, price: 12000 }, { name: '맥주', qty: 1, price: 5000 }, { name: '콜라', qty: 1, price: 3000 }] },
  ]
}

// ── 하위 컴포넌트들 (인라인) ──
// SectionHeader
const SectionHeader = {
  props: ['num', 'icon', 'title', 'sub'],
  template: `
    <div class="ds-sh">
      <div class="ds-sh-icon">{{ icon }}</div>
      <div>
        <div class="ds-sh-title"><span class="ds-sh-num">{{ num }}</span>{{ title }}</div>
        <div v-if="sub" class="ds-sh-sub">{{ sub }}</div>
      </div>
    </div>
  `
}

// BarChart
const BarChart = {
  props: { data: Array, height: { type: Number, default: 120 } },
  setup(props) {
    const max = computed(() => Math.max(...props.data.map(d => d.value), 1))
    return { max, fmt }
  },
  template: `
    <div class="ds-bar-chart" :style="{ height: height + 'px' }">
      <div v-for="(d, i) in data" :key="i" class="ds-bar-col">
        <span class="ds-bar-val">{{ d.value > 0 ? fmt(d.value) : '' }}</span>
        <div class="ds-bar"
             :class="{ highlight: d.highlight }"
             :style="{
               height: Math.max((d.value / max) * (height - 24), d.value > 0 ? 4 : 0) + 'px',
               opacity: d.value > 0 ? 1 : 0.15,
             }"></div>
        <span class="ds-bar-label" :class="{ highlight: d.highlight }">{{ d.label }}</span>
      </div>
    </div>
  `
}

// DonutChart
const DonutChart = {
  props: { segments: Array, size: { type: Number, default: 130 } },
  setup(props) {
    const paths = computed(() => {
      const total = props.segments.reduce((s, seg) => s + seg.value, 0)
      let cum = 0
      const r = 44, cx = props.size / 2, cy = props.size / 2
      return props.segments.map(seg => {
        const sa = (cum / total) * 360 - 90
        cum += seg.value
        const ea = (cum / total) * 360 - 90
        const la = ea - sa > 180 ? 1 : 0
        const x1 = cx + r * Math.cos((sa * Math.PI) / 180)
        const y1 = cy + r * Math.sin((sa * Math.PI) / 180)
        const x2 = cx + r * Math.cos((ea * Math.PI) / 180)
        const y2 = cy + r * Math.sin((ea * Math.PI) / 180)
        return { d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${la} 1 ${x2} ${y2} Z`, color: seg.color }
      })
    })
    const centerPct = computed(() => {
      const total = props.segments.reduce((s, seg) => s + seg.value, 0)
      return total > 0 ? ((props.segments[0].value / total) * 100).toFixed(0) : '0'
    })
    return { paths, centerPct }
  },
  template: `
    <svg :width="size" :height="size" :viewBox="'0 0 ' + size + ' ' + size">
      <path v-for="(p, i) in paths" :key="i" :d="p.d" :fill="p.color" stroke="#1A1A2E" stroke-width="2" />
      <circle :cx="size/2" :cy="size/2" r="24" fill="#1A1A2E" />
      <text :x="size/2" :y="size/2 + 1" text-anchor="middle" fill="#F8FAFC" font-size="11" font-weight="700">{{ centerPct }}%</text>
      <text :x="size/2" :y="size/2 + 13" text-anchor="middle" fill="#64748B" font-size="8">카드</text>
    </svg>
  `
}
</script>

<style scoped>
@import "@/assets/css/DaySettlementModal.css";
</style>