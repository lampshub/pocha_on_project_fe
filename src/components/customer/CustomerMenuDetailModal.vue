<!--
  CustomerMenuDetailModal.vue
  - 메뉴 상세 정보 모달
  - 메뉴 이미지, 이름, 가격, 설명 표시
  - 수량 선택 및 옵션 선택 (라디오 버튼)
  - 장바구니 담기 / 선물하기 모드 전환
-->
<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content menu-detail-modal">
      <div class="menu-detail-image">
        <img
          v-if="menu?.icon && menu.icon.startsWith('http')"
          :src="decodeURIComponent(menu.icon)"
          style="width: 100%; height: 100%; object-fit: cover; border-radius: 16px;"
        />
        <span v-else style="font-size: 120px">🍽️</span>
      </div>
      <h2 class="menu-detail-name">{{ menu?.name }}</h2>
      <div class="menu-detail-price-row">
        <div class="menu-detail-price">{{ formatPrice(menu?.price ?? 0) }}원</div>
        <div class="quantity-controls">
          <button class="quantity-btn" @click="$emit('update:quantity', Math.max(1, quantity - 1))">-</button>
          <span class="quantity-value">{{ quantity }}</span>
          <button class="quantity-btn" @click="$emit('update:quantity', Math.min(99, quantity + 1))">+</button>
        </div>
      </div>
      <div v-if="menu?.description" class="menu-detail-description">{{ menu?.description }}</div>

      <div v-if="menu?.options?.length && !isPresentMode" class="menu-options">
        <div v-for="(opt, idx) in menu.options" :key="idx" class="option-group">
          <h3 class="options-title">{{ opt.optionName }}</h3>
          <div class="options-list">
            <label
              v-for="detail in opt.mappingOptionDetailList"
              :key="detail.optionDetailId"
              class="option-item"
            >
              <input
                type="radio"
                :name="'option-' + opt.optionId"
                :value="detail"
                :checked="selectedOptions[opt.optionId] === detail"
                @change="$emit('select-option', opt.optionId, detail)"
              />
              <span class="option-label">
                {{ detail.optionDetailName }}
                <span v-if="detail.optionDetailPrice > 0">
                  (+{{ formatPrice(detail.optionDetailPrice) }}원)
                </span>
              </span>
            </label>
          </div>
        </div>
      </div>

      <div class="menu-detail-footer">
        <button class="cancel-detail-btn" @click="$emit('close')">취소</button>
        <button v-if="!isPresentMode" class="add-cart-btn" @click="$emit('add-to-cart')">🛒 장바구니 담기</button>
        <button v-else class="add-cart-btn" @click="$emit('send-present')">🎁 메뉴 선물하기</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: { type: Boolean, default: false },
  menu: { type: Object, default: null },
  quantity: { type: Number, default: 1 },
  selectedOptions: { type: Object, default: () => ({}) },
  isPresentMode: { type: Boolean, default: false },
  formatPrice: { type: Function, required: true },
})
defineEmits(['close', 'add-to-cart', 'send-present', 'update:quantity', 'select-option'])
</script>
