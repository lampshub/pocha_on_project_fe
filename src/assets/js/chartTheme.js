// ══════════════════════════════════════════════
//  차트 테마 상수 (Chart.js는 CSS 변수를 못 읽으므로 JS에서 관리)
// ══════════════════════════════════════════════

// ── 기본 색상 (CSS --var와 동일 값 유지) ──
export const COLORS = {
    accent: '#ea580c',
    accentBg: 'rgba(234,88,12,0.13)',
    blue: '#60a5fa',
    blueBg: 'rgba(96,165,250,0.13)',
    purple: '#a78bfa',
    purpleBg: 'rgba(167,139,250,0.13)',
    gold: '#f59e0b',
    goldDim: 'rgba(245,158,11,0.35)',
    green: 'rgba(34,197,94,0.9)',
    bg: '#1a1a1e',
    border: '#2e2e34',
    textDim: '#8e8e96',
    labelText: '#d0d0d8',
    labelBg: 'rgba(26,26,30,0.75)',
}

// ── 결제수단 색상 ──
export const PAYMENT_COLORS = {
    card: 'rgba(96,165,250,0.9)',
    easyPay: 'rgba(34,197,94,0.9)',
    transfer: 'rgba(245,158,11,0.9)',
    phone: 'rgba(167,139,250,0.9)',
}

// ── 메뉴 순위 색상 ──
export const RANK_COLORS = [
    '#ea580c', '#60a5fa', '#22c55e', '#f59e0b', '#a78bfa',
    '#ec4899', '#14b8a6', '#f43f5e', '#8b5cf6', '#06b6d4',
]

// ── 공통 툴팁 스타일 ──
export const TOOLTIP_STYLE = {
    backgroundColor: COLORS.bg,
    borderColor: COLORS.border,
    borderWidth: 1,
    titleColor: COLORS.textDim,
    bodyColor: '#f0f0f2',
    padding: 10,
}

// ── 공통 축 스타일 ──
export const AXIS_STYLE = {
    x: {
        grid: {color: COLORS.border, drawBorder: false},
        ticks: {color: COLORS.textDim, font: {weight: '700'}},
    },
    yHidden: {
        grid: {color: 'transparent', drawBorder: false},
        ticks: {display: false},
        border: {display: false},
    },
}

// ── 결제 비중 차트 옵션 ──
export const PAYMENT_RATIO_OPTIONS = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        salesDatalabels: false,
        legend: {display: false},
        tooltip: {
            ...TOOLTIP_STYLE,
            callbacks: {label: (ctx) => ' ' + ctx.dataset.label + ': ' + ctx.parsed.x + '%'}
        }
    },
    scales: {
        x: {stacked: true, max: 100, grid: {display: false}, ticks: {display: false}, border: {display: false}},
        y: {stacked: true, grid: {display: false}, ticks: {display: false}, border: {display: false}}
    }
}

// ── 테이블 회전율 차트 옵션 ──
export const TABLE_TURNOVER_OPTIONS = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        salesDatalabels: false,
        legend: {display: false},
        tooltip: {
            ...TOOLTIP_STYLE,
            callbacks: {label: (ctx) => ' ' + ctx.parsed.y + '회'}
        }
    },
    scales: {
        x: {grid: {display: false}, ticks: {color: COLORS.textDim, font: {size: 12, weight: '700'}}},
        y: {
            grid: {color: COLORS.border, drawBorder: false},
            ticks: {color: COLORS.textDim, font: {size: 11}, callback: (v) => v + '회'}
        }
    }
}

// ── 테이블 회전율 바 색상 ──
export const getTurnoverColor = (turnover) => {
    if (turnover >= 4) return COLORS.accent
    if (turnover >= 2) return COLORS.gold
    return COLORS.goldDim
}

// ── 매출 팔레트 선택 ──
export const getPalette = (activeTab, salesPeriod) => {
    if (activeTab === 'calendar') return {line: COLORS.accent, bg: COLORS.accentBg}
    if (salesPeriod === 'hourly') return {line: COLORS.blue, bg: COLORS.blueBg}
    if (salesPeriod === 'dow') return {line: COLORS.purple, bg: COLORS.purpleBg}
    return {line: COLORS.accent, bg: COLORS.accentBg}
}