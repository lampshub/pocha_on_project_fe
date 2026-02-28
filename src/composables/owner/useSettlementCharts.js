// ══════════════════════════════════════════════
//  정산 페이지 – Chart.js 등록 및 차트 데이터 computed
// ══════════════════════════════════════════════
import { computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  PointElement, LineElement, BarElement, ArcElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js'
import {
  COLORS, TOOLTIP_STYLE, AXIS_STYLE,
  getTurnoverColor, getPalette,
} from '@/assets/js/chartTheme'

// ── Chart.js 전역 등록 (한 번만 실행) ──
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
)

// ── 매출 데이터 라벨 커스텀 플러그인 ──
const datalabelsPlugin = {
  id: 'salesDatalabels',
  afterDraw(chart) {
    const pluginOpts = chart.options?.plugins?.salesDatalabels
    if (pluginOpts === false || pluginOpts?.enabled === false) return
    const { ctx, data, chartArea, scales } = chart
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
        val >= 100000000
          ? Math.floor(val / 100000000) + '억'
          : val >= 10000
            ? Math.floor(val / 10000) + '만'
            : val.toLocaleString('ko-KR')

      const fs = isDaily ? 8 : 10
      ctx.font = `700 ${fs}px 'Noto Sans KR', sans-serif`
      const tw = ctx.measureText(label).width
      const pad = 3

      ctx.fillStyle = COLORS.labelBg
      ctx.beginPath()
      ctx.roundRect(xPos - tw / 2 - pad, yPos - fs - pad * 2 - 8, tw + pad * 2, fs + pad * 2, 3)
      ctx.fill()

      ctx.fillStyle = COLORS.labelText
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.fillText(label, xPos, yPos - 8)
    })
    ctx.restore()
  },
}
ChartJS.register(datalabelsPlugin)

/**
 * 차트 computed 값들을 제공하는 컴포저블
 * @param {Object} dateState - useSettlementDate 반환 객체
 *   { currentYear, currentMonth, currentDay, daysInCurrentMonth }
 * @param {Object} apiState - useSettlementApi 반환 객체
 *   { activeTab, monthlySalesMap, salesAnalysisData, salesPeriod,
 *     paymentRatioItems, tableTurnover }
 * @returns {Object} 차트 데이터 computed 객체들
 */
export function useSettlementCharts(dateState, apiState) {
  const { daysInCurrentMonth } = dateState
  const {
    activeTab, monthlySalesMap, salesAnalysisData, salesPeriod,
    paymentRatioItems, tableTurnover,
  } = apiState

  // ── 현재 탭/기간에 맞는 매출 데이터 배열 ──
  const currentSalesData = computed(() => {
    if (activeTab.value === 'calendar') {
      return Array.from({ length: daysInCurrentMonth.value }, (_, i) => ({
        label: (i + 1) + '일',
        value: monthlySalesMap.value[i + 1] || 0,
      }))
    }
    const d = salesAnalysisData.value
    if (!d) return []
    if (salesPeriod.value === 'weekly')
      return (d.weeklyBars || []).map((b) => ({ label: b.label, value: b.value }))
    if (salesPeriod.value === 'monthly')
      return (d.monthlyBars || []).map((b) => ({ label: b.label, value: b.value }))
    if (salesPeriod.value === 'hourly')
      return (d.hourlySales || []).map((h) => ({ label: h.hour + '시', value: h.amount || 0 }))
    if (salesPeriod.value === 'dow')
      return (d.dayOfWeekSales || []).map((b) => ({ label: b.label, value: b.value }))
    return []
  })

  /** 현재 탭/기간에 맞는 색상 팔레트 */
  const palette = computed(() => getPalette(activeTab.value, salesPeriod.value))

  // ── 통합 Line 차트 데이터 ──
  const unifiedLineData = computed(() => {
    const data = currentSalesData.value
    const { line } = palette.value
    const isCalGraph = activeTab.value === 'calendar'
    const isDow = !isCalGraph && salesPeriod.value === 'dow'
    const isHourly = !isCalGraph && salesPeriod.value === 'hourly'
    const dowData = salesAnalysisData.value?.dayOfWeekSales || []

    return {
      labels: data.map((d) => d.label),
      datasets: [
        {
          label: '매출',
          data: data.map((d) => d.value),
          borderColor: line,
          backgroundColor: palette.value.bg,
          pointBackgroundColor: data.map((d, i) => {
            if (isDow && dowData[i]?.best) return COLORS.gold
            if (isHourly && d.value >= 1200000) return COLORS.gold
            return line
          }),
          pointBorderColor: COLORS.bg,
          pointBorderWidth: 2,
          pointRadius: data.map((_, i) =>
            isDow && dowData[i]?.best ? 7 : isCalGraph ? 3 : 5
          ),
          pointHoverRadius: 8,
          tension: 0.35,
          fill: true,
        },
      ],
    }
  })

  // ── 통합 Line 차트 옵션 ──
  const unifiedLineOptions = computed(() => {
    const isCalGraph = activeTab.value === 'calendar'
    const isDow = !isCalGraph && salesPeriod.value === 'dow'
    const dowData = salesAnalysisData.value?.dayOfWeekSales || []

    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300 },
      layout: { padding: { top: 28, left: 4, right: 4 } },
      _isDaily: isCalGraph,
      plugins: {
        salesDatalabels: {},
        legend: { display: false },
        tooltip: {
          ...TOOLTIP_STYLE,
          callbacks: {
            label: (ctx) => {
              const d = isDow ? dowData[ctx.dataIndex] : null
              return (d?.best ? '🏆 최고  ' : '  ') + ctx.parsed.y.toLocaleString('ko-KR') + '원'
            },
          },
        },
      },
      scales: {
        x: {
          ...AXIS_STYLE.x,
          ticks: {
            ...AXIS_STYLE.x.ticks,
            font: { size: isCalGraph ? 9 : 11, weight: '700' },
            maxRotation: isCalGraph ? 45 : 0,
            maxTicksLimit: isCalGraph ? 16 : 24,
          },
        },
        y: AXIS_STYLE.yHidden,
      },
    }
  })

  // ── 결제 비중 가로 Bar 차트 데이터 ──
  const paymentRatioChartData = computed(() => ({
    labels: ['결제 비중'],
    datasets: paymentRatioItems.value.map((item, i, arr) => ({
      label: item.label,
      data: [item.pct],
      backgroundColor: item.color,
      stack: 'ratio',
      borderSkipped: false,
      ...(i === arr.length - 1
        ? { borderRadius: { topRight: 6, bottomRight: 6, topLeft: 0, bottomLeft: 0 } }
        : {}),
    })),
  }))

  // ── 테이블 회전율 Bar 차트 데이터 ──
  const tableTurnoverBarData = computed(() => ({
    labels: tableTurnover.value.map((t) => t.tableNum + '번'),
    datasets: [
      {
        label: '회전율',
        data: tableTurnover.value.map((t) => t.turnover),
        backgroundColor: tableTurnover.value.map((t) => getTurnoverColor(t.turnover)),
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  }))

  return {
    currentSalesData,
    palette,
    unifiedLineData,
    unifiedLineOptions,
    paymentRatioChartData,
    tableTurnoverBarData,
  }
}
