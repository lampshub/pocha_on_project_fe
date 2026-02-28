<!--
  CustomerSidebar.vue
  - 고객 주문 페이지의 좌측 사이드바 컴포넌트
  - 테이블 번호 표시, 카테고리 목록, 직원 호출, 결제 버튼
-->
<template>
  <aside class="sidebar">
    <div
      class="table-info"
      @click="$emit('handle-hidden-admin-trigger')"
      style="cursor: default"
    >
      <span class="table-live-dot"></span>
      <div class="table-number">{{ tableNum }}</div>
      <div class="table-label">TABLE</div>
    </div>

    <div class="category-list">
      <div
        v-for="cat in categories"
        :key="cat.id"
        :class="['category-item', { active: currentCategory === cat.id }]"
        @click="$emit('select-category', cat.id)"
      >
        {{ cat.name }}
        <span class="category-count">{{ getMenusByCategory(cat.id).length }}</span>
      </div>
      <div class="staff-divider"></div>
      <div class="category-item call-staff" @click="$emit('call-staff')">
        👋 직원호출
      </div>
    </div>
    <div class="sidebar-bottom">
      <div class="category-item payment-btn" @click="$emit('handle-payment')">
        💳 결제하기
      </div>
    </div>
  </aside>
</template>

<script setup>
defineProps({
  tableNum: { type: Number, default: 0 },
  categories: { type: Array, default: () => [] },
  currentCategory: { type: String, default: '' },
  getMenusByCategory: { type: Function, required: true },
})
defineEmits(['handle-hidden-admin-trigger', 'select-category', 'call-staff', 'handle-payment'])
</script>
