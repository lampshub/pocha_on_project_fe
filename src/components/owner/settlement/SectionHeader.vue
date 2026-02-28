<!-- 일별 정산 모달의 섹션 헤더 컴포넌트 — 번호, 아이콘, 제목, 부제목을 표시 -->
<template>
  <div class="ds-sh">
    <div class="ds-sh-icon">{{ icon }}</div>
    <div>
      <div class="ds-sh-title">
        <span class="ds-sh-num">{{ num }}</span>
        {{ title }}
      </div>
      <div v-if="sub" class="ds-sh-sub">{{ sub }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  num: { type: String, required: true },
  icon: { type: String, required: true },
  title: { type: String, required: true },
  sub: { type: String, default: '' },
})
</script>
