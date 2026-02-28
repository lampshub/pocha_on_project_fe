<!--
  CustomerCartPanel.vue
  - 장바구니 슬라이드 패널
  - 장바구니 아이템 목록 (수량 조절, 삭제)
  - 총 금액 표시 및 주문하기 버튼
-->
<template>
  <div class="slide-panel" :class="{ open: show }">
    <div class="panel-header">
      <h2 class="panel-title">장바구니</h2>
      <button class="close-btn" @click="$emit('close')">✕</button>
    </div>
    <div class="panel-content">
      <div v-if="cartItems.length > 0">
        <div v-for="(item, idx) in cartItems" :key="idx" class="cart-item">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div class="cart-item-name">{{ item.name }}</div>
            <button
              @click="$emit('delete-line', idx)"
              style="background: none; border: none; color: var(--text-secondary); font-size: 16px; cursor: pointer; padding: 0;"
            >✕</button>
          </div>
          <div class="cart-item-option">{{ item.option || '옵션 X' }}</div>
          <div class="cart-item-controls">
            <div class="quantity-controls">
              <button class="quantity-btn" @click="$emit('decrease', idx)" :disabled="item.quantity <= 1">-</button>
              <span class="quantity-value">{{ item.quantity }}</span>
              <button class="quantity-btn" @click="$emit('increase', idx)">+</button>
            </div>
            <div class="cart-item-price">{{ formatPrice(item.price) }}원</div>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">🛒</div>
        <div class="empty-text">장바구니가 비어있습니다</div>
      </div>
    </div>
    <div v-if="cartItems.length > 0" class="panel-footer">
      <div class="total-price">
        <span class="total-label">총 금액 </span>
        <span class="total-amount">{{ formatPrice(totalPrice) }}원</span>
      </div>
      <div style="display: flex; gap: 12px; width: 100%">
        <button class="order-btn" @click="$emit('place-order')">주문하기</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: { type: Boolean, default: false },
  cartItems: { type: Array, default: () => [] },
  totalPrice: { type: Number, default: 0 },
  formatPrice: { type: Function, required: true },
})
defineEmits(['close', 'increase', 'decrease', 'delete-line', 'place-order'])
</script>
