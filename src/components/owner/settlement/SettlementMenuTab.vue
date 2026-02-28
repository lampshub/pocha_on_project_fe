<!-- 메뉴 분석 탭 컴포넌트 (카테고리별 매출 + 메뉴 판매 순위) -->
<template>
  <div class="tab-content">
    <h2 class="section-title">메뉴 분석</h2>

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
      <!-- 카테고리별 매출 수평 바 -->
      <div class="card">
        <h3 class="card-title">카테고리별 매출</h3>
        <div v-if="categorySales.length === 0" class="empty-msg">해당 기간 데이터가 없습니다</div>
        <div v-else class="h-bar-list">
          <div v-for="cat in categorySales" :key="cat.name" class="h-bar-item">
            <div class="h-bar-label">
              <span>{{ cat.name }}</span>
              <strong>{{ formatPrice(cat.amount) }}원</strong>
            </div>
            <div class="h-bar-track">
              <div class="h-bar-fill" :style="{ width: cat.rate + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 메뉴별 판매 순위 -->
      <div class="card">
        <h3 class="card-title">메뉴별 판매 순위</h3>
        <div v-if="menuRanking.length === 0" class="empty-msg">해당 기간 데이터가 없습니다</div>
        <div v-else class="rank-list">
          <div v-for="(item, idx) in visibleMenuRanking" :key="item.name" class="rank-item">
            <span class="rank-num" :class="{ top3: idx < 3 }">{{ idx + 1 }}</span>
            <span class="rank-dot" :style="{ background: item.color }"></span>
            <span class="rank-name">{{ item.name }}</span>
            <span class="rank-qty">{{ item.qty }}개</span>
            <strong class="rank-amt">{{ formatPrice(item.amount) }}원</strong>
            <span class="rank-rate">{{ item.rate }}%</span>
          </div>
          <!-- 더보기/접기 버튼 -->
          <button v-if="menuRanking.length > 5" class="show-more-btn"
                  @click="$emit('update:menuShowAll', !menuShowAll)">
            {{ menuShowAll ? '접기 ▲' : `더보기 (${menuRanking.length - 5}개) ▼` }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
/**
 * 메뉴 분석 탭 컴포넌트
 * - 카테고리별 매출 비중 수평 바 표시
 * - 메뉴별 판매 순위 리스트 (기본 5개, 더보기 지원)
 */
defineProps({
  /** 로딩 상태 */
  loading: { type: Boolean, required: true },
  /** 카테고리 매출 배열 */
  categorySales: { type: Array, required: true },
  /** 전체 메뉴 순위 배열 */
  menuRanking: { type: Array, required: true },
  /** 보여줄 메뉴 순위 배열 (5개 또는 전체) */
  visibleMenuRanking: { type: Array, required: true },
  /** 전체 메뉴 표시 여부 */
  menuShowAll: { type: Boolean, required: true },
  /** 분석 보기 모드 (daily/weekly/monthly) */
  analysisViewMode: { type: String, required: true },
  /** 분석 범위 라벨 */
  viewModeRangeLabel: { type: String, required: true },
  /** 가격 포맷 함수 */
  formatPrice: { type: Function, required: true },
})

defineEmits([
  'update:analysisViewMode',
  'update:menuShowAll',
])
</script>
