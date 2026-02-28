<!-- 매출 분석 탭 컴포넌트 (기간별 차트 + 매출 비교 그리드) -->
<template>
  <div class="tab-content">
    <h2 class="section-title">매출 분석</h2>

    <!-- 로딩 표시 -->
    <div v-if="loading" class="loading-box">데이터를 불러오는 중...</div>

    <template v-else>
      <!-- 기간별 매출 차트 카드 -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">{{ salesPeriodLabel }}</h3>
          <!-- 기간 토글 (주별/월별/시간대별/요일별) -->
          <div class="toggle-group">
            <button :class="{ active: salesPeriod === 'weekly' }"
                    @click="$emit('update:salesPeriod', 'weekly')">주별</button>
            <button :class="{ active: salesPeriod === 'monthly' }"
                    @click="$emit('update:salesPeriod', 'monthly')">월별</button>
            <button :class="{ active: salesPeriod === 'hourly' }"
                    @click="$emit('update:salesPeriod', 'hourly')">시간대별</button>
            <button :class="{ active: salesPeriod === 'dow' }"
                    @click="$emit('update:salesPeriod', 'dow')">요일별</button>
          </div>
        </div>

        <!-- 주별/월별일 때 기간 네비게이션 -->
        <div v-if="salesPeriod === 'weekly' || salesPeriod === 'monthly'" class="period-nav">
          <button class="period-nav-btn" @click="$emit('go-prev-period')">&#8249; 이전</button>
          <span class="period-nav-label">{{ periodNavLabel }}</span>
          <button class="period-nav-btn" @click="$emit('go-next-period')"
                  :disabled="isNextPeriodDisabled">다음 &#8250;</button>
        </div>

        <!-- Line 차트 -->
        <div class="chart-container">
          <Line :key="salesPeriod + '_' + currentYear + '_' + currentMonth + '_' + currentDay"
                :data="unifiedLineData" :options="unifiedLineOptions"/>
        </div>
      </div>

      <!-- 매출 비교 그리드 (이번달 / 전월 / 전년 동월) -->
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
</template>

<script setup>
/**
 * 매출 분석 탭 컴포넌트
 * - 기간별(주/월/시간/요일) 매출 Line 차트
 * - 이번달/전월/전년 동월 매출 비교
 */
import { Line } from 'vue-chartjs'

defineProps({
  /** 로딩 상태 */
  loading: { type: Boolean, required: true },
  /** 현재 매출 분석 기간 (weekly/monthly/hourly/dow) */
  salesPeriod: { type: String, required: true },
  /** 기간 라벨 (예: "주별 매출") */
  salesPeriodLabel: { type: String, required: true },
  /** 기간 네비게이션 라벨 */
  periodNavLabel: { type: String, required: true },
  /** 다음 기간 비활성화 여부 */
  isNextPeriodDisabled: { type: Boolean, required: true },
  /** 매출 비교 데이터 */
  salesCompare: { type: Object, required: true },
  /** Line 차트 데이터 */
  unifiedLineData: { type: Object, required: true },
  /** Line 차트 옵션 */
  unifiedLineOptions: { type: Object, required: true },
  /** 가격 포맷 함수 */
  formatPrice: { type: Function, required: true },
  /** 차트 key 생성용 현재 연도 */
  currentYear: { type: Number, required: true },
  /** 차트 key 생성용 현재 월 */
  currentMonth: { type: Number, required: true },
  /** 차트 key 생성용 현재 일 */
  currentDay: { type: Number, required: true },
})

defineEmits([
  'update:salesPeriod',
  'go-prev-period',
  'go-next-period',
])
</script>
