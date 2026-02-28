<!-- 결제수단별 비율을 SVG 도넛 차트로 표시하는 컴포넌트 -->
<template>
  <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
    <path
      v-for="(p, i) in paths"
      :key="i"
      :d="p.d"
      :fill="p.color"
      stroke="#1A1A2E"
      stroke-width="2"
    />
    <circle :cx="size / 2" :cy="size / 2" :r="24" fill="#1A1A2E" />
    <text
      :x="size / 2"
      :y="size / 2 + 1"
      text-anchor="middle"
      fill="#F8FAFC"
      font-size="11"
      font-weight="700"
    >{{ centerPct }}%</text>
    <text
      :x="size / 2"
      :y="size / 2 + 13"
      text-anchor="middle"
      fill="#64748B"
      font-size="8"
    >카드</text>
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  segments: { type: Array, required: true },
  size: { type: Number, default: 130 },
})

const paths = computed(() => {
  const total = props.segments.reduce((s, seg) => s + seg.value, 0)
  let cum = 0
  const r = 44, cx = props.size / 2, cy = props.size / 2
  return props.segments.map(seg => {
    const sa = (cum / total) * 360 - 90
    cum += seg.value
    const ea = (cum / total) * 360 - 90
    const la = ea - sa > 180 ? 1 : 0
    const x1 = cx + r * Math.cos((sa * Math.PI) / 180)
    const y1 = cy + r * Math.sin((sa * Math.PI) / 180)
    const x2 = cx + r * Math.cos((ea * Math.PI) / 180)
    const y2 = cy + r * Math.sin((ea * Math.PI) / 180)
    return { d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${la} 1 ${x2} ${y2} Z`, color: seg.color }
  })
})

const centerPct = computed(() => {
  const total = props.segments.reduce((s, seg) => s + seg.value, 0)
  return total > 0 ? ((props.segments[0].value / total) * 100).toFixed(0) : '0'
})
</script>
