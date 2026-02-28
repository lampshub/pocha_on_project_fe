<!--
  CustomerPresentToast.vue
  - 선물 도착 토스트 알림
  - 다른 테이블에서 선물이 도착했을 때 화면 하단에 표시
  - 클릭하면 선물 상세 팝업으로 이동
-->
<template>
  <div v-if="show" class="present-toast" @click="$emit('click')">
    <div class="present-toast-icon">🎁</div>
    <div class="present-toast-content">
      <div class="present-toast-title">선물이 도착했습니다!</div>
      <div class="present-toast-desc">
        {{ notification?.fromTable }}번 테이블에서
        {{ notification?.menuName }}을(를) 선물했어요
      </div>
    </div>
    <div class="present-toast-timer">탭하여 확인</div>
  </div>
</template>

<script setup>
defineProps({
  show: { type: Boolean, default: false },
  notification: { type: Object, default: null },
})
defineEmits(['click'])
</script>
