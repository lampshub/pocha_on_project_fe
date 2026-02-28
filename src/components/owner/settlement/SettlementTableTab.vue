<!-- 테이블 분석 탭 컴포넌트 (회전율/이용시간 요약 + 회전율 Bar 차트) -->
<template>
  <div class="tab-content">
    <h2 class="section-title">테이블 분석</h2>

    <!-- 분석 기간 토글 (일별/주별/월별) -->
    <div class="view-mode-bar">
      <div class="toggle-group">
        <button :class="{ active: analysisViewMode === 'daily' }"
                @click="$emit('update:analysisViewMode', 'daily')">일별</button>
        <button :class="{ active: analysisViewMode === 'weekly' }"
                @click="$emit('update:analysisViewMode', 'weekly')">주별</button>
        <button :class="{ active: analysisViewMode === 'monthly' }"
                @click="$emit('update:analysisViewMode', 'monthly')">월별</button>
      </div>
      <span class="view-mode-range">{{ viewModeRangeLabel }}</span>
    </div>

    <!-- 로딩 표시 -->
    <div v-if="loading" class="loading-box">데이터를 불러오는 중...</div>

    <template v-else>
      <!-- 요약 통계 (평균 회전율 / 평균 이용 시간 / 총 이용) -->
      <div class="stat-row">
        <div class="stat-box">
          <span class="stat-label">평균 회전율</span>
          <strong class="stat-val">{{ tableSummary.avgTurnover }}회<small>/일</small></strong>
        </div>
        <div class="stat-box">
          <span class="stat-label">평균 이용 시간</span>
          <strong class="stat-val">{{ tableSummary.avgDuration }}분</strong>
        </div>
        <div class="stat-box">
          <span class="stat-label">{{
            currentDay > 0 ? currentDay + '일 총 이용' : currentMonth + '월 총 이용'
          }}</span>
          <strong class="stat-val">{{ tableSummary.todayUseCount }}회</strong>
        </div>
      </div>

      <!-- 테이블별 회전율 Bar 차트 -->
      <div class="card">
        <h3 class="card-title">테이블별 회전율</h3>
        <div v-if="tableTurnover.length === 0" class="empty-msg">해당 기간 데이터가 없습니다</div>
        <div v-else class="chart-container">
          <Bar :data="tableTurnoverBarData" :options="TABLE_TURNOVER_OPTIONS"/>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
/**
 * 테이블 분석 탭 컴포넌트
 * - 평균 회전율 / 이용 시간 / 총 이용 통계
 * - 테이블별 회전율 세로 Bar 차트
 */
import { Bar } from 'vue-chartjs'
import { TABLE_TURNOVER_OPTIONS } from '@/assets/js/chartTheme'

defineProps({
  /** 로딩 상태 */
  loading: { type: Boolean, required: true },
  /** 분석 보기 모드 (daily/weekly/monthly) */
  analysisViewMode: { type: String, required: true },
  /** 분석 범위 라벨 */
  viewModeRangeLabel: { type: String, required: true },
  /** 테이블 요약 통계 */
  tableSummary: { type: Object, required: true },
  /** 테이블별 회전율 데이터 배열 */
  tableTurnover: { type: Array, required: true },
  /** Bar 차트 데이터 */
  tableTurnoverBarData: { type: Object, required: true },
  /** 라벨 표시용 현재 일 */
  currentDay: { type: Number, required: true },
  /** 라벨 표시용 현재 월 */
  currentMonth: { type: Number, required: true },
  /** 가격 포맷 함수 */
  formatPrice: { type: Function, required: true },
})

defineEmits([
  'update:analysisViewMode',
])
</script>
