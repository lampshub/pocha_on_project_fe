<!-- 일별 정산 요약 섹션 — 순 매출, 전일 대비 변동, 통계 카드를 표시 -->
<template>
  <div class="ds-section">
    <SectionHeader num="01" icon="📊" title="요약" sub="장사 한눈에"/>

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
</template>

<script setup>
import SectionHeader from './SectionHeader.vue'

defineProps({
  stats: { type: Object, required: true },
  summaryCards: { type: Array, required: true },
  fmt: { type: Function, required: true },
})
</script>
