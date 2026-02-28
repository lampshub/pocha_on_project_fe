<!-- 메뉴 분석 섹션 — 수량 및 매출 기준 상위 5개 메뉴를 표시 -->
<template>
  <div class="ds-section">
    <SectionHeader num="04" icon="🍽" title="메뉴 분석" sub="수량 · 매출 기준 Top 5"/>

    <div v-if="stats.topByQty.length === 0" class="ds-empty">메뉴 데이터 없음</div>
    <div v-else class="ds-menu-grid">
      <div>
        <div class="ds-sub-label">🔥 수량 TOP</div>
        <div v-for="([name, data], i) in stats.topByQty" :key="'q'+i" class="ds-rank-item">
          <div class="ds-rank-head">
            <span class="ds-rank-label">
              <span class="ds-rank-num" :class="{ first: i === 0 }">{{ i + 1 }}</span>
              {{ name }}
            </span>
            <span class="ds-rank-val">{{ data.qty }}개</span>
          </div>
          <div class="ds-rank-bar-track">
            <div class="ds-rank-bar-fill"
                 :class="{ first: i === 0 }"
                 :style="{ width: (data.qty / stats.topByQty[0][1].qty * 100) + '%' }"></div>
          </div>
        </div>
      </div>
      <div>
        <div class="ds-sub-label">💰 매출 TOP</div>
        <div v-for="([name, data], i) in stats.topByRevenue" :key="'r'+i" class="ds-rank-item">
          <div class="ds-rank-head">
            <span class="ds-rank-label">
              <span class="ds-rank-num" :class="{ first: i === 0 }">{{ i + 1 }}</span>
              {{ name }}
            </span>
            <span class="ds-rank-val ds-rank-val-sm">{{ fmt(data.revenue) }}</span>
          </div>
          <div class="ds-rank-bar-track">
            <div class="ds-rank-bar-fill"
                 :class="{ first: i === 0 }"
                 :style="{ width: (data.revenue / stats.topByRevenue[0][1].revenue * 100) + '%' }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import SectionHeader from './SectionHeader.vue'

defineProps({
  stats: { type: Object, required: true },
  fmt: { type: Function, required: true },
})
</script>
