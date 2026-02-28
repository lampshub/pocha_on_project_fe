<!-- 매출 구조 섹션 — 결제수단별 도넛 차트와 상세 목록을 표시 -->
<template>
  <div class="ds-section">
    <SectionHeader num="02" icon="💰" title="매출 구조" sub="결제수단별 분석"/>

    <div class="ds-method-wrap">
      <DayDonutChart :segments="donutSegments" :size="120"/>
      <div class="ds-method-list">
        <div v-for="(m, i) in methodList" :key="i" class="ds-method-item"
             :class="{ 'no-border': i === methodList.length - 1 }">
          <div class="ds-method-left">
            <div class="ds-method-dot" :style="{ background: m.color }"></div>
            <span class="ds-method-name">{{ m.label }}</span>
          </div>
          <div class="ds-method-right">
            <div class="ds-method-amount">{{ fmt(m.amount) }}원</div>
            <div class="ds-method-sub">{{ m.count }}건 · {{ m.pct }}%</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import SectionHeader from './SectionHeader.vue'
import DayDonutChart from './DayDonutChart.vue'

defineProps({
  donutSegments: { type: Array, required: true },
  methodList: { type: Array, required: true },
  fmt: { type: Function, required: true },
})
</script>
