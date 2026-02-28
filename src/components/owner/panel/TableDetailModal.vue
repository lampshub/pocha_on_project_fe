<!-- 테이블 상세 모달: 선택한 테이블의 주문 내역과 총 금액을 오버레이 모달로 표시합니다. -->
<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <div class="modal-title">{{ selectedTable?.number }}번 테이블</div>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      <div class="modal-body">
        <template v-if="selectedTable?.detailOrders?.length">
          <div v-for="order in selectedTable.detailOrders" :key="order.id" class="history-item-card">
            <div class="history-info">
              <div class="history-menu">{{ order.menu }}</div>
              <div class="history-detail">{{ order.option || '옵션 없음' }} · 수량: {{ order.quantity }}개</div>
            </div>
            <div class="history-price">{{ formatPrice(order.price * order.quantity) }}원</div>
          </div>
        </template>
        <div v-else class="empty-state">
          <div class="empty-icon">📋</div>
          <div>주문 내역이 없습니다</div>
        </div>
      </div>
      <div class="modal-footer">
        <!-- <button class="btn btn-primary" @click="processPayment">결제</button> -->
        <div class="total-amount">총 {{ formatPrice(selectedTable?.total || 0) }}원</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: { type: Boolean, required: true },
  selectedTable: { type: Object, default: null },
  formatPrice: { type: Function, required: true },
})
defineEmits(['close'])
</script>
