<!--
  CustomerPresentOverlay.vue
  - 선물 수신 시 전체 화면 오버레이 팝업
  - 폭죽(confetti) 애니메이션 캔버스
  - 보낸 테이블 번호, 선물 메뉴 이름 표시
-->
<template>
  <div class="present-overlay" :class="{ active: visible }">
    <canvas class="present-confetti-canvas" ref="canvasRef"></canvas>
    <div class="present-backdrop" @click="$emit('close')"></div>
    <div class="present-card">
      <button class="present-close-btn" @click="$emit('close')">✕</button>
      <div class="present-from-tag">
        <span>📍</span>
        <span>{{ presentData?.fromTable }}번 테이블</span>에서 선물 도착!
      </div>
      <div class="present-image-box">
        <div class="present-image-emoji">🎁</div>
        <div class="present-item-name">{{ presentData?.menuName }}</div>
      </div>
      <div class="present-footer-text">선물이 도착했어요 🎉</div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineExpose } from 'vue'

defineProps({
  visible: { type: Boolean, default: false },
  presentData: { type: Object, default: null },
})
defineEmits(['close'])

const canvasRef = ref(null)
defineExpose({ canvasRef })
</script>
