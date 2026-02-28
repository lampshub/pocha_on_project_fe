<!-- 비밀번호 찾기 모달 컴포넌트: 이메일 인증을 통해 비밀번호를 재설정하는 4단계 모달 (이메일 입력 → 인증코드 확인 → 새 비밀번호 입력 → 완료) -->
<template>
  <div v-if="show" class="modal-overlay" @click.self="closeFindPasswordModal">
    <div class="modal-content">
      <div class="modal-header">
        <div class="modal-title">비밀번호 찾기</div>
        <button class="close-btn" @click="closeFindPasswordModal">×</button>
      </div>

      <!-- 완료 단계 -->
      <div v-if="passwordResetComplete">
        <div class="complete-icon">✅</div>
        <div class="complete-message">비밀번호 변경 완료!</div>
        <div class="complete-submessage">새로운 비밀번호로 로그인해주세요.</div>
        <button class="btn-primary full-width" @click="closeFindPasswordModal">확인</button>
      </div>

      <!-- 새 비밀번호 입력 단계 -->
      <div v-else-if="findPassword.verified">
        <div class="form-group">
          <label class="form-label">새 비밀번호</label>
          <input
              type="password"
              class="form-input"
              v-model="findPassword.newPassword"
              placeholder="새 비밀번호를 입력하세요"
          />
        </div>

        <div class="form-group">
          <label class="form-label">새 비밀번호 확인</label>
          <input
              type="password"
              class="form-input"
              v-model="findPassword.newPasswordConfirm"
              placeholder="새 비밀번호를 다시 입력하세요"
          />
        </div>

        <div v-if="findPasswordError" class="error-message">
          <span>⚠️</span>
          <span>{{ findPasswordError }}</span>
        </div>

        <div class="btn-group">
          <button class="btn-primary" @click="handleResetPassword">변경</button>
          <button class="btn-secondary" @click="closeFindPasswordModal">취소</button>
        </div>
      </div>

      <!-- 인증 코드 입력 단계 -->
      <div v-else-if="findPassword.codeSent">
        <div class="success-message">
          <span>✓</span>
          <span>인증 코드가 이메일로 발송되었습니다.</span>
        </div>

        <div class="form-group">
          <label class="form-label">인증 코드</label>
          <input
              type="text"
              class="form-input"
              v-model="findPassword.code"
              placeholder="인증 코드를 입력하세요"
              maxlength="6"
          />
        </div>

        <div v-if="findPasswordError" class="error-message">
          <span>⚠️</span>
          <span>{{ findPasswordError }}</span>
        </div>

        <div class="btn-group">
          <button class="btn-primary" @click="handleVerifyCode">확인</button>
          <button class="btn-secondary" @click="closeFindPasswordModal">취소</button>
        </div>
      </div>

      <!-- 이메일 입력 단계 -->
      <div v-else>
        <div class="form-group">
          <label class="form-label">이메일</label>
          <div class="verification-group">
            <input
                type="email"
                class="form-input"
                v-model="findPassword.email"
                placeholder="이메일을 입력하세요"
            />
            <button
                class="verification-btn"
                @click="handleSendCode"
                :disabled="!findPassword.email"
            >
              인증
            </button>
          </div>
        </div>

        <div v-if="findPasswordError" class="error-message">
          <span>⚠️</span>
          <span>{{ findPasswordError }}</span>
        </div>

        <button class="btn-secondary full-width mt-20" @click="closeFindPasswordModal">취소</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import axios from 'axios'

// .env에서 베이스 URL 가져오기
const API_BASE = process.env.VUE_APP_API_BASE_URL

defineProps({
  show: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close'])

const findPasswordError = ref('')
const passwordResetComplete = ref(false)

const findPassword = reactive({
  email: '',
  code: '',
  codeSent: false,
  verified: false,
  newPassword: '',
  newPasswordConfirm: ''
})

const handleSendCode = async () => {
  findPasswordError.value = ''

  if (!findPassword.email) {
    findPasswordError.value = '이메일을 입력해주세요.'
    return
  }

  try {
    await axios.post(`${API_BASE}/auth/email/send`, {
      email: findPassword.email
    });

    findPassword.codeSent = true
    alert('인증 코드가 이메일로 발송되었습니다.')
  } catch (error) {
    findPasswordError.value = error.response?.data?.message || '인증코드 발송에 실패했습니다.'
  }
}

const handleVerifyCode = async () => {
  findPasswordError.value = ''

  if (!findPassword.code) {
    findPasswordError.value = '인증 코드를 입력해주세요.'
    return
  }

  try {
    await axios.post(`${API_BASE}/auth/email/verify`, {
      email: findPassword.email,
      code: findPassword.code
    });

    findPassword.verified = true
  } catch (error) {
    findPasswordError.value = error.response?.data?.message || '인증에 실패했습니다.'
  }
}

const handleResetPassword = async () => {
  findPasswordError.value = ''

  if (!findPassword.newPassword || !findPassword.newPasswordConfirm) {
    findPasswordError.value = '새 비밀번호를 입력해주세요.'
    return
  }

  if (findPassword.newPassword.length < 8) {
    findPasswordError.value = '비밀번호는 최소 8자 이상이어야 합니다.'
    return
  }

  if (findPassword.newPassword !== findPassword.newPasswordConfirm) {
    findPasswordError.value = '비밀번호가 일치하지 않습니다.'
    return
  }

  try {
    await axios.post(`${API_BASE}/auth/password/reset`, {
      email: findPassword.email,
      newPassword: findPassword.newPassword
    });

    passwordResetComplete.value = true
  } catch (error) {
    findPasswordError.value = error.response?.data?.message || '비밀번호 변경에 실패했습니다.'
  }
}

const closeFindPasswordModal = () => {
  Object.assign(findPassword, {
    email: '',
    code: '',
    codeSent: false,
    verified: false,
    newPassword: '',
    newPasswordConfirm: ''
  })
  findPasswordError.value = ''
  passwordResetComplete.value = false
  emit('close')
}
</script>
