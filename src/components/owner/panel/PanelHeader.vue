<!-- 점주 패널 상단 헤더: 매장명 표시 및 뷰 전환, 설정, 대시보드 이동 버튼을 포함합니다. -->
<template>
  <div class="header">
    <div class="store-name">{{ storeName }}</div>
    <div class="header-btns">
      <button class="nav-btn-header" :class="{ active: showTableView }" @click="$emit('toggle-view')">
        {{ showTableView ? '📋 실시간 주문' : '🪑 테이블 현황' }}
      </button>
      <router-link to="/owner/settlement" class="nav-btn-header">📊 매출 정산</router-link>
      <router-link to="/owner/settings" class="nav-btn-header">⚙️ 설정 관리</router-link>
      <button class="back-btn" @click="$emit('go-back')">🏠 대시보드</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  storeName: { type: String, required: true },
  showTableView: { type: Boolean, required: true },
})
defineEmits(['toggle-view', 'go-back'])
</script>
