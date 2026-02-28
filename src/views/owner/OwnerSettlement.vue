<!-- 정산 페이지 오케스트레이터 – 컴포저블과 자식 컴포넌트를 조합 -->
<template>
  <div class="page">
    <header class="topbar">
      <h1 class="topbar-title">{{ storeInfo.storeName }} 매출 정산</h1>
      <router-link to="/owner/panel" class="topbar-back">← 메인</router-link>
    </header>

    <div class="body">
      <main class="main"
            :class="{ 'main-noscroll': activeTab === 'calendar' || activeTab === 'payment' || activeTab === 'table' }">

        <!-- 날짜 선택 바 -->
        <SettlementDatePicker
          :currentYear="currentYear" :currentMonth="currentMonth" :currentDay="currentDay"
          :yearOptions="yearOptions" :daysInCurrentMonth="daysInCurrentMonth"
          @update:currentYear="v => currentYear = v"
          @update:currentMonth="v => currentMonth = v"
          @update:currentDay="v => currentDay = v"
          @go-prev="goPrevDay" @go-next="goNextDay" @go-today="goToday"
          @date-change="onDateChange"
        />

        <!-- 달력 탭 -->
        <SettlementCalendarTab v-if="activeTab === 'calendar'"
          :currentYear="currentYear" :currentMonth="currentMonth" :currentDay="currentDay"
          :monthlyTotal="monthlyTotal" :monthlyOrderCount="monthlyOrderCount"
          :monthlyCancelCount="monthlyCancelCount" :monthlyAverage="monthlyAverage"
          :calendarDays="calendarDays" :calendarView="calendarView"
          :unifiedLineData="unifiedLineData" :unifiedLineOptions="unifiedLineOptions"
          :showDayModal="showDayModal" :modalDay="modalDay" :formatPrice="formatPrice"
          @update:calendarView="v => calendarView = v"
          @update:showDayModal="v => showDayModal = v"
          @select-day="selectDay"
        />

        <!-- 메뉴 분석 탭 -->
        <SettlementMenuTab v-if="activeTab === 'menu'"
          :loading="loading.menu" :categorySales="categorySales"
          :menuRanking="menuRanking" :visibleMenuRanking="visibleMenuRanking"
          :menuShowAll="menuShowAll" :analysisViewMode="analysisViewMode"
          :viewModeRangeLabel="viewModeRangeLabel" :formatPrice="formatPrice"
          @update:analysisViewMode="v => analysisViewMode = v"
          @update:menuShowAll="v => menuShowAll = v"
        />

        <!-- 매출 분석 탭 -->
        <SettlementSalesTab v-if="activeTab === 'sales'"
          :loading="loading.sales" :salesPeriod="salesPeriod"
          :salesPeriodLabel="salesPeriodLabel" :periodNavLabel="periodNavLabel"
          :isNextPeriodDisabled="isNextPeriodDisabled" :salesCompare="salesCompare"
          :unifiedLineData="unifiedLineData" :unifiedLineOptions="unifiedLineOptions"
          :formatPrice="formatPrice"
          :currentYear="currentYear" :currentMonth="currentMonth" :currentDay="currentDay"
          @update:salesPeriod="v => salesPeriod = v"
          @go-prev-period="goPrevPeriod" @go-next-period="goNextPeriod"
        />

        <!-- 결제 분석 탭 -->
        <SettlementPaymentTab v-if="activeTab === 'payment'"
          :loading="loading.payment" :analysisViewMode="analysisViewMode"
          :viewModeRangeLabel="viewModeRangeLabel"
          :paymentRatioChartData="paymentRatioChartData" :paymentRatioItems="paymentRatioItems"
          :paymentSummary="paymentSummary" :transactions="transactions"
          :expandedTxId="expandedTxId" :showTxPanel="showTxPanel"
          :formatPrice="formatPrice" :currentYear="currentYear" :currentMonth="currentMonth"
          @update:analysisViewMode="v => analysisViewMode = v"
          @update:showTxPanel="v => showTxPanel = v"
          @toggle-tx-detail="toggleTxDetail"
        />

        <!-- 테이블 분석 탭 -->
        <SettlementTableTab v-if="activeTab === 'table'"
          :loading="loading.table" :analysisViewMode="analysisViewMode"
          :viewModeRangeLabel="viewModeRangeLabel"
          :tableSummary="tableSummary" :tableTurnover="tableTurnover"
          :tableTurnoverBarData="tableTurnoverBarData"
          :currentDay="currentDay" :currentMonth="currentMonth" :formatPrice="formatPrice"
          @update:analysisViewMode="v => analysisViewMode = v"
        />
      </main>

      <!-- 하단 탭 네비게이션 -->
      <nav class="tabs">
        <button v-for="tab in tabs" :key="tab.id" class="tab-btn"
                :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-text">{{ tab.label }}</span>
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup>
// ── 컴포저블 ──
import { onMounted } from 'vue'
import { useStoreInfo } from '@/store/storeInfo'
import { useSettlementDate } from '@/composables/owner/useSettlementDate'
import { useSettlementApi } from '@/composables/owner/useSettlementApi'
import { useSettlementCharts } from '@/composables/owner/useSettlementCharts'

// ── 자식 컴포넌트 ──
import SettlementDatePicker from '@/components/owner/settlement/SettlementDatePicker.vue'
import SettlementCalendarTab from '@/components/owner/settlement/SettlementCalendarTab.vue'
import SettlementMenuTab from '@/components/owner/settlement/SettlementMenuTab.vue'
import SettlementSalesTab from '@/components/owner/settlement/SettlementSalesTab.vue'
import SettlementPaymentTab from '@/components/owner/settlement/SettlementPaymentTab.vue'
import SettlementTableTab from '@/components/owner/settlement/SettlementTableTab.vue'

// ── 스토어 ──
const storeInfo = useStoreInfo()

// ── 날짜 상태 (onDateChange 콜백은 아래에서 연결) ──
const dateState = useSettlementDate(async () => {
  await fetchMonthlyCalender()
  await fetchTabData(activeTab.value)
})

const {
  currentYear, currentMonth, currentDay,
  yearOptions, daysInCurrentMonth,
  analysisViewMode, viewModeRangeLabel,
  showDayModal, modalDay,
  goPrevDay, goNextDay, goToday, selectDay, onDateChange,
} = dateState

// ── API / 데이터 상태 ──
const apiState = useSettlementApi(dateState)

const {
  loading, activeTab, calendarView, tabs,
  calendarDays, monthlyTotal, monthlyOrderCount, monthlyCancelCount, monthlyAverage,
  fetchMonthlyCalender,
  categorySales, menuRanking, menuShowAll, visibleMenuRanking,
  salesPeriod, salesPeriodLabel, salesCompare,
  goPrevPeriod, goNextPeriod, isNextPeriodDisabled, periodNavLabel,
  paymentRatioItems, paymentSummary, transactions, expandedTxId, showTxPanel, toggleTxDetail,
  tableSummary, tableTurnover,
  fetchTabData,
} = apiState

// ── 차트 computed ──
const { unifiedLineData, unifiedLineOptions, paymentRatioChartData, tableTurnoverBarData } =
  useSettlementCharts(dateState, apiState)

// ── 유틸 ──
const formatPrice = (v) => (v ?? 0).toLocaleString('ko-KR')

// ── 마운트 시 초기 데이터 로드 ──
onMounted(async () => {
  await fetchMonthlyCalender()
})
</script>

<style scoped>
@import "@/assets/css/OwnerSettlement.css";
</style>
