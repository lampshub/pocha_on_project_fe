<!--
  CustomerFloatingButtons.vue
  - 채팅/선물, 주문내역, 장바구니 플로팅 버튼 그룹
  - 각 버튼에 알림 배지(읽지 않은 수) 표시
-->
<template>
  <div class="floating-buttons" :class="{ hidden: isPanelOpen }">
    <button class="floating-btn" @click="$emit('open-chat')" title="채팅/선물">
      {{ presentUnread ? '🎁' : '💬' }}
      <span v-if="presentUnread" class="badge" style="background: #7c3aed">!</span>
      <span v-else-if="unreadChatCount > 0" class="badge">{{ unreadChatCount }}</span>
    </button>

    <button class="floating-btn" @click="$emit('open-order-history')" title="주문내역">
      📋
      <span v-if="newOrderCount > 0" class="badge">{{ newOrderCount }}</span>
    </button>

    <button class="floating-btn" @click="$emit('open-cart')" title="장바구니">
      🛒
      <span v-if="cartCount > 0" class="badge">{{ cartCount }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  isPanelOpen: { type: Boolean, default: false },
  presentUnread: { type: Boolean, default: false },
  unreadChatCount: { type: Number, default: 0 },
  newOrderCount: { type: Number, default: 0 },
  cartCount: { type: Number, default: 0 },
})
defineEmits(['open-chat', 'open-order-history', 'open-cart'])
</script>
