// 일별 정산 모달의 상태 관리, API 호출, 데이터 가공 로직을 담당하는 컴포저블
import { ref, computed, watch } from 'vue'
import axios from 'axios'

const API = process.env.VUE_APP_API_BASE_URL

export function useDaySettlement(props) {
  // ── 상태 ──
  const orderFilter = ref('all')
  const statusFilter = ref('all')
  const expandedOrder = ref(null)
  const showAllOrders = ref(false)
  const isLoading = ref(false)

  // ── API 응답 데이터 ──
  const dailyDetail = ref(null)
  const orders = ref([])

  // ── 모달 열릴 때 데이터 로드 ──
  watch(() => props.visible, async (v) => {
    if (v) {
      orderFilter.value = 'all'
      statusFilter.value = 'all'
      expandedOrder.value = null
      showAllOrders.value = false
      await fetchData()
    }
  })

  // ── 결제수단 매핑 헬퍼 ──
  const mapPaymentMethod = (method) => {
    if (!method) return 'card'
    const m = String(method)
    if (m.includes('카드') || m === 'CARD') return 'card'
    if (m.includes('간편') || m === 'EASY_PAY') return 'easypay'
    if (m.includes('이체') || m === 'TRANSFER') return 'transfer'
    if (m.includes('휴대폰') || m === 'PHONE') return 'phone'
    return 'card'
  }

  // ── 시간 포맷 헬퍼 ──
  const formatTime = (dateTimeStr) => {
    if (!dateTimeStr) return ''
    try {
      const d = new Date(dateTimeStr)
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    } catch {
      return ''
    }
  }

  // ── 단일 API 호출 ──
  const fetchData = async () => {
    isLoading.value = true
    dailyDetail.value = null
    orders.value = []

    try {
      const res = await axios.get(`${API}/store/settlement/daily`, {
        params: { year: props.year, month: props.month, day: props.day }
      })
      const data = res.data

      // dailyDetail 매핑 (백엔드 DailySettlementResDto → 프론트 필드)
      dailyDetail.value = {
        dayTotal: data.totalAmount ?? 0,
        netSales: data.netSales ?? data.totalAmount ?? 0,
        refundAmount: data.refundAmount ?? 0,
        cancelCount: data.cancelCount ?? 0,
        orderCount: data.orderCount ?? 0,
        averageOrderAmount: data.averageOrderAmount ?? 0,
        cardAmount: data.cardAmount ?? 0,
        easyPayAmount: data.easyPayAmount ?? 0,
        transferAmount: data.transferAmount ?? 0,
        phoneAmount: data.phoneAmount ?? 0,
        prevDayTotal: data.prevDayTotal ?? 0,
      }

      // orders 매핑 (백엔드 OrderItem → 프론트 order 형식)
      orders.value = (data.orders ?? []).map(o => ({
        id: o.orderingId ?? o.id,
        table: (o.tableNum ?? 0) + '번',
        amount: o.totalPrice ?? 0,
        status: o.orderStatus === 'DONE' ? '완료' : o.orderStatus === 'CANCELLED' ? '취소' : (o.orderStatus ?? '완료'),
        method: mapPaymentMethod(o.paymentMethod),
        time: o.orderedAt ? formatTime(o.orderedAt) : '',
        items: (o.menus ?? []).map(m => ({
          name: m.menuName ?? m.name,
          qty: m.quantity ?? m.qty ?? 1,
          price: m.price ?? 0,
        })),
      }))
    } catch (e) {
      console.error('[DaySettlement] daily 조회 실패:', e?.response?.status)
      dailyDetail.value = null
      orders.value = []
    }

    isLoading.value = false
  }

  // ── 요일 ──
  const dayOfWeekLabel = computed(() => {
    const d = new Date(props.year, props.month - 1, props.day)
    return ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'][d.getDay()]
  })

  // ── 통합 stats computed ──
  const stats = computed(() => {
    const detail = dailyDetail.value
    const all = orders.value
    const completed = all.filter(o => o.status === '완료')
    const cancelled = all.filter(o => o.status === '취소')

    // ── dailyDetail API가 있으면 요약 수치는 API 값 사용 ──
    if (detail) {
      const totalRevenue = detail.dayTotal ?? 0
      const netRevenue = detail.netSales ?? totalRevenue
      const cancelAmount = detail.refundAmount ?? 0
      const cancelCount = detail.cancelCount ?? 0
      const orderCount = detail.orderCount ?? 0
      const avgPerOrder = detail.averageOrderAmount ?? (orderCount > 0 ? Math.round(netRevenue / orderCount) : 0)
      const prev = detail.prevDayTotal || 1
      const diffPrev = prev > 0 ? ((netRevenue - prev) / prev * 100).toFixed(1) : '0.0'

      // 결제수단별 — API 값
      const byMethod = {
        card: { amount: detail.cardAmount ?? 0, count: 0 },
        easypay: { amount: detail.easyPayAmount ?? 0, count: 0 },
        transfer: { amount: detail.transferAmount ?? 0, count: 0 },
        phone: { amount: detail.phoneAmount ?? 0, count: 0 },
      }

      // orders가 있으면 count, hourly, menu, table 보강
      completed.forEach(o => {
        const m = byMethod[o.method] || byMethod.card
        m.count += 1
      })

      const hourly = {}
      all.forEach(o => {
        if (!o.time) return
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

      const tableData = {}
      completed.forEach(o => {
        if (!tableData[o.table]) tableData[o.table] = { visits: 0, revenue: 0 }
        tableData[o.table].visits += 1
        tableData[o.table].revenue += o.amount
      })

      return {
        totalRevenue, netRevenue,
        totalOrders: orderCount || all.length,
        cancelCount, cancelAmount,
        avgPerOrder, diffPrev,
        byMethod, hourly,
        topByQty: Object.entries(menuSales).sort((a, b) => b[1].qty - a[1].qty).slice(0, 5),
        topByRevenue: Object.entries(menuSales).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5),
        tableData,
        completedCount: orderCount - cancelCount,
      }
    }

    // ── dailyDetail 없으면 orders에서 계산 (fallback) ──
    const totalRevenue = all.reduce((s, o) => s + o.amount, 0)
    const netRevenue = completed.reduce((s, o) => s + o.amount, 0)
    const avgPerOrder = completed.length ? Math.round(netRevenue / completed.length) : 0
    const diffPrev = '0.0'

    const byMethod = {
      card: { amount: 0, count: 0 },
      easypay: { amount: 0, count: 0 },
      transfer: { amount: 0, count: 0 },
      phone: { amount: 0, count: 0 }
    }
    completed.forEach(o => {
      const m = byMethod[o.method] || byMethod.card
      m.amount += o.amount
      m.count += 1
    })

    const hourly = {}
    all.forEach(o => {
      if (!o.time) return
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
      topByQty: Object.entries(menuSales).sort((a, b) => b[1].qty - a[1].qty).slice(0, 5),
      topByRevenue: Object.entries(menuSales).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5),
      tableData,
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

  // ── 결제수단 (donut + list) ──
  const donutSegments = computed(() => {
    const bm = stats.value.byMethod
    return [
      { value: bm.card.amount || 1, color: '#818CF8' },
      { value: bm.easypay.amount || 0, color: '#22C55E' },
      { value: bm.transfer.amount || 0, color: '#FBBF24' },
      { value: bm.phone.amount || 0, color: '#A78BFA' },
    ]
  })

  const methodList = computed(() => {
    const net = stats.value.netRevenue || 1
    const bm = stats.value.byMethod
    return [
      { label: '카드', color: '#818CF8', ...bm.card, pct: ((bm.card.amount / net) * 100).toFixed(1) },
      { label: '간편결제', color: '#22C55E', ...bm.easypay, pct: ((bm.easypay.amount / net) * 100).toFixed(1) },
      { label: '이체', color: '#FBBF24', ...bm.transfer, pct: ((bm.transfer.amount / net) * 100).toFixed(1) },
      { label: '휴대폰', color: '#A78BFA', ...bm.phone, pct: ((bm.phone.amount / net) * 100).toFixed(1) },
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

  // ── 필터 ──
  const methodFilters = [
    { l: '전체', v: 'all' }, { l: '카드', v: 'card' }, { l: '간편결제', v: 'easypay' }, { l: '이체', v: 'transfer' }, {
      l: '휴대폰',
      v: 'phone'
    },
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
  const methodLabel = (m) => ({ card: '카드', easypay: '간편결제', transfer: '이체', phone: '휴대폰' }[m] || m)

  return {
    // 상태
    orderFilter,
    statusFilter,
    expandedOrder,
    showAllOrders,
    isLoading,
    dailyDetail,
    orders,
    // computed
    dayOfWeekLabel,
    stats,
    summaryCards,
    donutSegments,
    methodList,
    hourlyData,
    filteredOrders,
    displayOrders,
    // 필터 상수
    methodFilters,
    statusFilters,
    // 함수
    fmt,
    methodLabel,
    fetchData,
  }
}
