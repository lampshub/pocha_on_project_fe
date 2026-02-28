<!-- 결제 분석 탭 컴포넌트 (비중 차트 + 요약 + 결제 내역 패널) -->
<template>
  <div class="tab-content">
    <h2 class="section-title">결제 분석</h2>

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
      <!-- 결제 수단별 비중 차트 -->
      <div class="card">
        <h3 class="card-title">결제 수단별 비중</h3>
        <div class="payment-ratio-wrap">
          <div class="chart-container-ratio">
            <Bar :data="paymentRatioChartData" :options="PAYMENT_RATIO_OPTIONS"/>
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

      <!-- 결제 요약 통계 -->
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

      <!-- 결제 내역 미리보기 (1건) -->
      <div class="card tx-preview-card" @click="$emit('update:showTxPanel', true)">
        <div class="card-title-row">
          <h3 class="card-title">결제 내역</h3>
          <span class="tx-preview-more">전체보기 &#8250;</span>
        </div>
        <div v-if="transactions.length === 0" class="empty-msg">해당 기간 결제 내역이 없습니다</div>
        <div v-else class="tx-preview-item">
          <div class="tx-left">
            <span class="tx-method">{{ transactions[0].method }}</span>
            <span class="tx-time">{{ transactions[0].time }}</span>
          </div>
          <div class="tx-right">
            <strong>{{ formatPrice(transactions[0].amount) }}원</strong>
            <span class="tx-table">테이블 {{ transactions[0].tableNum }}</span>
          </div>
          <span class="tx-chevron">&#8250;</span>
        </div>
      </div>
    </template>

    <!-- 슬라이드업 결제 내역 패널 -->
    <transition name="slide-up">
      <div v-if="showTxPanel" class="tx-panel-overlay" @click.self="$emit('update:showTxPanel', false)">
        <div class="tx-panel">
          <div class="tx-panel-header">
            <h3 class="tx-panel-title">결제 내역</h3>
            <button class="tx-panel-close" @click="$emit('update:showTxPanel', false)">&#10005;</button>
          </div>
          <div class="tx-panel-body">
            <div v-for="tx in transactions" :key="tx.id" class="tx-item-wrap">
              <div class="tx-item" @click="$emit('toggle-tx-detail', tx.id)"
                   :class="{ 'tx-item-open': expandedTxId === tx.id }">
                <div class="tx-left">
                  <span class="tx-method">{{ tx.method }}</span>
                  <span class="tx-time">{{ tx.time }}</span>
                </div>
                <div class="tx-right">
                  <strong>{{ formatPrice(tx.amount) }}원</strong>
                  <span class="tx-table">테이블 {{ tx.tableNum }}</span>
                </div>
                <span class="tx-chevron" :class="{ open: expandedTxId === tx.id }">&#8250;</span>
              </div>
              <!-- 주문 메뉴 상세 -->
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
    </transition>
  </div>
</template>

<script setup>
/**
 * 결제 분석 탭 컴포넌트
 * - 결제 수단별 비중 가로 Bar 차트
 * - 평균 객단가 / 건수 / 총액 요약
 * - 결제 내역 미리보기 및 슬라이드업 전체 목록 패널
 */
import { Bar } from 'vue-chartjs'
import { PAYMENT_RATIO_OPTIONS } from '@/assets/js/chartTheme'

defineProps({
  /** 로딩 상태 */
  loading: { type: Boolean, required: true },
  /** 분석 보기 모드 (daily/weekly/monthly) */
  analysisViewMode: { type: String, required: true },
  /** 분석 범위 라벨 */
  viewModeRangeLabel: { type: String, required: true },
  /** 결제 비중 Bar 차트 데이터 */
  paymentRatioChartData: { type: Object, required: true },
  /** 결제 수단별 비중 항목 배열 */
  paymentRatioItems: { type: Array, required: true },
  /** 결제 요약 통계 객체 */
  paymentSummary: { type: Object, required: true },
  /** 결제 내역 배열 */
  transactions: { type: Array, required: true },
  /** 현재 펼쳐진 결제 내역 ID */
  expandedTxId: { type: [Number, String, null], default: null },
  /** 결제 내역 전체 패널 표시 여부 */
  showTxPanel: { type: Boolean, required: true },
  /** 가격 포맷 함수 */
  formatPrice: { type: Function, required: true },
  /** 통계 표시용 현재 연도 */
  currentYear: { type: Number, required: true },
  /** 통계 표시용 현재 월 */
  currentMonth: { type: Number, required: true },
})

defineEmits([
  'update:analysisViewMode',
  'update:showTxPanel',
  'toggle-tx-detail',
])
</script>
