<!--
  CustomerAdminAuthModal.vue
  - 관리자(점주) 인증 모달
  - 테이블 번호 5번 연속 클릭 시 표시
  - 점주 비밀번호 입력 후 대시보드로 이동
-->
<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content admin-auth-modal">
      <h2 class="modal-title">관리자 인증</h2>
      <p class="modal-subtitle">매장 설정을 위해 점주 비밀번호를 입력해주세요.</p>
      <input
        type="password"
        :value="password"
        @input="$emit('update:password', $event.target.value)"
        class="admin-password-input"
        placeholder="비밀번호 입력"
        @keyup.enter="$emit('verify')"
      />
      <div class="modal-action-buttons">
        <button class="action-btn action-btn-primary" @click="$emit('verify')">확인</button>
        <button class="action-btn action-btn-secondary" @click="$emit('close')">취소</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: { type: Boolean, default: false },
  password: { type: String, default: '' },
})
defineEmits(['close', 'verify', 'update:password'])
</script>
