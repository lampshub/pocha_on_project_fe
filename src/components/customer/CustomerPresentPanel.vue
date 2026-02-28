<!--
  CustomerPresentPanel.vue
  - 선물하기 슬라이드 패널
  - 선택한 테이블에 보낼 메뉴를 카테고리별로 탐색
  - 메뉴 클릭 시 선물 메뉴 상세 모달로 이동
-->
<template>
  <div class="slide-panel" :class="{ open: show }">
    <div class="panel-header">
      <h2 class="panel-title">{{ selectedTable }}번 테이블에 선물하기</h2>
      <button class="close-btn" @click="$emit('close')">✕</button>
    </div>
    <div class="panel-content">
      <div v-for="cat in categories" :key="cat.id" class="menu-section-small">
        <h3 class="section-title-small">{{ cat.name }}</h3>
        <div class="menu-list-small">
          <div
            v-for="menu in getMenusByCategory(cat.id)"
            :key="menu.id"
            class="menu-item-small"
            @click="$emit('open-present-detail', menu)"
          >
            <div class="menu-icon-small">
              <img
                v-if="menu.icon && menu.icon.startsWith('http')"
                :src="menu.icon"
                style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;"
              />
              <span v-else style="font-size: 36px">🍽️</span>
            </div>
            <div class="menu-info-small">
              <div class="menu-name-small">{{ menu.name }}</div>
              <div class="menu-price-small">{{ formatPrice(menu.price) }}원</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: { type: Boolean, default: false },
  selectedTable: { type: Number, default: null },
  categories: { type: Array, default: () => [] },
  getMenusByCategory: { type: Function, required: true },
  formatPrice: { type: Function, required: true },
})
defineEmits(['close', 'open-present-detail'])
</script>
