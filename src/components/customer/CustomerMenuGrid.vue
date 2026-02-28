<!--
  CustomerMenuGrid.vue
  - 카테고리별 메뉴 카드 그리드 영역
  - 메뉴 이미지, 이름, 가격 표시
  - 빠른 담기(+) 버튼 및 메뉴 상세 클릭
-->
<template>
  <main class="main-content">
    <div class="main-top-bar">
      <span class="top-bar-time">{{ currentTime }}</span>
    </div>
    <div class="main-top-line"></div>
    <div class="main-scroll-area" ref="scrollArea" @scroll="$emit('scroll', $event)">
      <div
        v-for="cat in categories"
        :key="cat.id"
        :data-category="cat.id"
        class="menu-section"
      >
        <div class="menu-section-box">
          <div class="section-orange-line"></div>
          <div class="section-header">
            <h2 class="section-title">{{ cat.name }}</h2>
            <span class="section-meta">{{ getMenusByCategory(cat.id).length }}개 메뉴</span>
          </div>
          <div class="menu-grid">
            <div
              v-for="menu in getMenusByCategory(cat.id)"
              :key="menu.id"
              class="menu-card"
              @click="$emit('open-menu-detail', menu)"
            >
              <div class="menu-image_C">
                <img
                  v-if="menu.icon && menu.icon.startsWith('http')"
                  :src="decodeURIComponent(menu.icon)"
                />
                <span v-else style="font-size: 48px">🍽️</span>
                <button
                  class="quick-add-btn"
                  @click.stop="$emit('quick-add', menu)"
                >
                  +
                </button>
              </div>
              <div class="menu-info">
                <div class="menu-name">{{ menu.name }}</div>
                <div class="menu-description">{{ menu.description }}</div>
                <div class="menu-price">{{ formatPrice(menu.price) }}원</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, defineExpose } from 'vue'

defineProps({
  categories: { type: Array, default: () => [] },
  currentTime: { type: String, default: '' },
  getMenusByCategory: { type: Function, required: true },
  formatPrice: { type: Function, required: true },
})
defineEmits(['scroll', 'open-menu-detail', 'quick-add'])

const scrollArea = ref(null)
defineExpose({ scrollArea })
</script>
