<!--
  MenuEditListModal.vue
  메뉴 수정 목록 모달 - 등록된 메뉴 리스트에서 수정할 메뉴 선택
-->
<template>
  <!-- 메뉴 선택 모달 오버레이 -->
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content large">
      <!-- 모달 헤더 -->
      <div class="modal-header">
        <div class="modal-title">메뉴 선택</div>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      <div class="modal-body">
        <!-- 메뉴 목록 -->
        <div class="menu-list">
          <!-- 메뉴가 없을 때 안내 문구 -->
          <div v-if="menuList.length === 0" style="text-align:center; color:#a1a1aa; padding:40px 0;">
            등록된 메뉴가 없습니다.
          </div>
          <!-- 메뉴 항목 (클릭 시 상세 수정 모달로 이동) -->
          <div v-for="menu in menuList" :key="menu.menuId" class="menu-item" @click="$emit('select-menu', menu)">
            <img :src="menu.imageUrl || 'https://via.placeholder.com/100'" class="menu-image" />
            <div class="menu-info">
              <div class="menu-name">{{ menu.menuName }}</div>
              <div class="menu-price">{{ formatPrice(menu.menuPrice) }}원</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Props:
 * - show: 모달 표시 여부
 * - menuList: 전체 메뉴 목록 배열
 * - formatPrice: 가격 포맷팅 함수
 */
defineProps({
  show: { type: Boolean, required: true },
  menuList: { type: Array, required: true },
  formatPrice: { type: Function, required: true },
})

/**
 * Emits:
 * - close: 모달 닫기
 * - select-menu: 메뉴 선택 시 해당 메뉴 객체 전달
 */
defineEmits(['close', 'select-menu'])
</script>
