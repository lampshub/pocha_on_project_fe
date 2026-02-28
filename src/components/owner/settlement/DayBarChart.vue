<!-- 시간대별 매출을 수평 막대 차트로 표시하는 컴포넌트 -->
<template>
  <div class="ds-bar-chart" :style="{ height: height + 'px' }">
    <div v-for="(d, i) in data" :key="i" class="ds-bar-col">
      <span class="ds-bar-val">{{ d.value > 0 ? fmt(d.value) : '' }}</span>
      <div
        class="ds-bar"
        :class="{ highlight: d.highlight }"
        :style="{
          height: Math.max((d.value / max) * (height - 24), d.value > 0 ? 4 : 0) + 'px',
          opacity: d.value > 0 ? 1 : 0.15,
        }"
      ></div>
      <span class="ds-bar-label" :class="{ highlight: d.highlight }">{{ d.label }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: { type: Array, required: true },
  height: { type: Number, default: 120 },
})

const max = computed(() => Math.max(...props.data.map(d => d.value), 1))
const fmt = (n) => (n ?? 0).toLocaleString('ko-KR')
</script>
