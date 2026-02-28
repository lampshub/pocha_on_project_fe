<!--
  CustomerOrderHistoryPanel.vue
  - 주문 내역 슬라이드 패널
  - 주문 그룹별 메뉴 목록(이름, 옵션, 수량, 가격) 표시
-->
<template>
  <div class="slide-panel" :class="{ open: show }">
    <div class="panel-header">
      <h2 class="panel-title">주문 내역</h2>
      <button class="close-btn" @click="$emit('close')">✕</button>
    </div>

    <div class="panel-content">
      <div v-if="orderHistory.length > 0">
        <div v-for="group in orderHistory" :key="group.groupId" class="order-group">
          <div class="group-header">주문# {{ group.orderNumber }}</div>
          <div v-for="item in group.items" :key="item.id" class="order-item">
            <div class="order-item-name">{{ item.name }}</div>
            <div class="order-item-option">{{ item.option || '옵션 X' }}</div>
            <div class="order-item-bottom">
              <span class="order-item-quantity">수량: {{ item.quantity }}개</span>
              <span class="order-item-price">{{ formatPrice(item.price * item.quantity) }}원</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-text">주문 내역이 없습니다</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: { type: Boolean, default: false },
  orderHistory: { type: Array, default: () => [] },
  formatPrice: { type: Function, required: true },
})
defineEmits(['close'])
</script>
