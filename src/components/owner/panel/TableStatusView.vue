<!-- 테이블 현황 그리드 뷰: 전체 테이블 목록을 카드 형태로 표시하고, 각 테이블의 주문 요약과 합계를 보여줍니다. -->
<template>
  <div class="center-content">
    <div class="orders-header">
      <div class="orders-title-area">
        <h2 class="orders-main-title">🪑 테이블 현황</h2>
        <div class="orders-count-badge">{{ tables.length }}개</div>
      </div>
    </div>
    <div v-if="tables.length > 0" class="table-grid-full">
      <div
        v-for="table in tables"
        :key="table.number"
        class="table-card"
        @click="$emit('open-table-detail', table)"
      >
        <div class="table-number">{{ table.number }}번 테이블</div>
        <div class="table-orders">
          <div v-if="table.detailOrders.length === 0" class="table-no-order">주문 없음</div>
          <div v-for="order in table.detailOrders.slice(0, 5)" :key="order.id" class="table-order-line">
            {{ order.menu }} × {{ order.quantity }}
            <span v-if="order.option" class="table-order-option">{{ order.option }}</span>
          </div>
          <div v-if="table.detailOrders.length > 5" class="table-order-more">
            +{{ table.detailOrders.length - 5 }}건 더보기
          </div>
        </div>
        <div v-if="table.total > 0" class="table-total">{{ formatPrice(table.total) }}원</div>
      </div>
    </div>
    <div v-else class="empty-orders">
      <div class="empty-orders-icon">🍽️</div>
      <div class="empty-orders-title">등록된 테이블이 없습니다</div>
      <div class="empty-orders-desc">설정 관리에서 테이블을 추가해주세요</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  tables: { type: Array, required: true },
  formatPrice: { type: Function, required: true },
})
defineEmits(['open-table-detail'])
</script>
