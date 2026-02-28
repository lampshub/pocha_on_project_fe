<!-- 운영 분석 섹션 — 시간대별 매출 막대 차트를 표시 -->
<template>
  <div class="ds-section">
    <SectionHeader num="03" icon="⏱" title="운영 분석" sub="시간대 · 테이블"/>

    <div class="ds-subsection">
      <div class="ds-sub-label">시간대별 매출</div>
      <div v-if="hourlyData.length === 0" class="ds-empty">시간대 데이터 없음</div>
      <DayBarChart v-else :data="hourlyData" :height="110"/>
    </div>
  </div>
</template>

<script setup>
import SectionHeader from './SectionHeader.vue'
import DayBarChart from './DayBarChart.vue'

defineProps({
  hourlyData: { type: Array, required: true },
})
</script>
