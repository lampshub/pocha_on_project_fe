<!-- 달력 탭 컴포넌트 (월간 요약 + 달력/그래프 뷰 + 일별 모달) -->
<template>
  <div class="tab-content tab-content-calendar">
    <!-- 월간 요약 영역 -->
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
        <button class="graph-toggle-btn" @click="$emit('update:calendarView', 'graph')">📈 그래프 보기</button>
      </div>
      <div class="calendar">
        <div v-for="d in DAY_NAMES" :key="d" class="cal-hd">{{ d }}</div>
        <div v-for="(day, i) in calendarDays" :key="i" class="cal-cell"
             :class="{ empty: !day.date, today: day.isToday, 'selected-day': currentDay === day.date }"
             @click="day.date && $emit('select-day', day)">
          <template v-if="day.date">
            <span class="cal-date">{{ day.date }}</span>
            <span class="cal-amt" :class="{ 'cal-amt-zero': day.sales === 0 }">
              {{ day.sales === 0 ? '0원' : formatPrice(day.sales) + '원' }}
            </span>
          </template>
        </div>
      </div>
    </div>

    <!-- 그래프 뷰 -->
    <div v-if="calendarView === 'graph'" class="calendar-wrap graph-wrap">
      <div class="calendar-top">
        <h2 class="calendar-title">{{ currentMonth }}월 일별 매출</h2>
        <button class="graph-toggle-btn" @click="$emit('update:calendarView', 'calendar')">📅 달력 보기</button>
      </div>
      <div class="chart-container-graph">
        <Line :key="'cal-graph-' + currentYear + '-' + currentMonth"
              :data="unifiedLineData" :options="unifiedLineOptions"/>
      </div>
    </div>

    <!-- 일별 정산 모달 -->
    <DaySettlementModal
      :visible="showDayModal"
      :year="currentYear"
      :month="currentMonth"
      :day="modalDay"
      @close="$emit('update:showDayModal', false)"
    />
  </div>
</template>

<script setup>
/**
 * 달력 탭 컴포넌트
 * - 달력 그리드 또는 일별 매출 그래프 표시
 * - DaySettlementModal 을 포함하여 일 클릭 시 상세 모달 표시
 */
import { Line } from 'vue-chartjs'
import DaySettlementModal from '@/views/owner/modal/DaySettlementModal.vue'
import { DAY_NAMES } from '@/composables/owner/useSettlementDate'

defineProps({
  currentYear: { type: Number, required: true },
  currentMonth: { type: Number, required: true },
  currentDay: { type: Number, required: true },
  /** 월간 총 매출 */
  monthlyTotal: { type: Number, required: true },
  /** 주문 건수 */
  monthlyOrderCount: { type: Number, required: true },
  /** 취소 건수 */
  monthlyCancelCount: { type: Number, required: true },
  /** 일 평균 매출 */
  monthlyAverage: { type: Number, required: true },
  /** 달력 셀 배열 */
  calendarDays: { type: Array, required: true },
  /** 'calendar' | 'graph' 뷰 모드 */
  calendarView: { type: String, required: true },
  /** Line 차트 데이터 */
  unifiedLineData: { type: Object, required: true },
  /** Line 차트 옵션 */
  unifiedLineOptions: { type: Object, required: true },
  /** 일별 모달 표시 여부 */
  showDayModal: { type: Boolean, required: true },
  /** 모달에 표시할 일 */
  modalDay: { type: Number, required: true },
  /** 가격 포맷 함수 */
  formatPrice: { type: Function, required: true },
})

defineEmits([
  'update:calendarView',
  'update:showDayModal',
  'select-day',
])
</script>
