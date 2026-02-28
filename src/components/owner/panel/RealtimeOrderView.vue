<!-- 실시간 주문 뷰: 직원 호출 알림 바와 실시간 주문 카드 그리드를 표시합니다. -->
<template>
  <div class="center-content">

    <!-- 직원 호출 알림 바 -->
    <div class="call-alert-bar">
      <div class="call-alert-title">
        <span class="call-alert-icon">🔔</span>
        직원 호출 <span class="call-alert-count">{{ calledTables.length }}건</span>
      </div>
      <div class="call-alert-list">
        <div v-for="table in calledTables" :key="'call-' + table.number" class="call-alert-item">
          <span class="call-alert-table">{{ table.number }}번 테이블</span>
          <button class="call-dismiss-btn" @click="$emit('dismiss-call', table)">확인</button>
        </div>
      </div>
      <!-- <div v-else class="call-alert-empty">호출 없음</div> -->
    </div>

    <!-- 실시간 주문 헤더 -->
    <div class="orders-header">
      <div class="orders-title-area">
        <h2 class="orders-main-title">실시간 주문</h2>
        <div class="orders-count-badge">{{ realtimeOrders.length }}건</div>
      </div>
    </div>

    <!-- 실시간 주문 그리드 -->
    <div v-if="realtimeOrders.length > 0" class="orders-grid">
      <div v-for="order in realtimeOrders" :key="order.id" class="order-card" :class="{ 'is-gift': order.status === '선물' }">
        <div class="order-card-header">
          <div class="order-card-table">{{ order.tableNum }}번 테이블</div>
          <div class="order-card-time">{{ order.time }}</div>
        </div>
        <div class="order-card-body">
          <div class="order-card-menu">{{ order.menu }}</div>
          <div class="order-card-detail">
            <span class="order-card-option">{{ order.option || '옵션 없음' }}</span>
            <span class="order-card-qty">{{ order.quantity }}개</span>
          </div>
          <div v-if="order.price > 0" class="order-card-price">{{ formatPrice(order.price * order.quantity) }}원</div>
        </div>
        <button class="order-complete-btn" @click="$emit('complete-order', order)">
          ✓ 조리 완료
        </button>
      </div>
    </div>

    <div v-else class="empty-orders">
      <div class="empty-orders-icon">📋</div>
      <div class="empty-orders-title">대기 중인 주문이 없습니다</div>
      <div class="empty-orders-desc">새로운 주문이 들어오면 여기에 표시됩니다</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  realtimeOrders: { type: Array, required: true },
  calledTables: { type: Array, required: true },
  formatPrice: { type: Function, required: true },
})
defineEmits(['dismiss-call', 'complete-order'])
</script>
