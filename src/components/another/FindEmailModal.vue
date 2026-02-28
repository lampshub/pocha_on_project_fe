<!-- 이메일 찾기 모달 컴포넌트: SMS 인증을 통해 가입된 이메일을 조회하는 3단계 모달 (전화번호 입력 → 인증코드 확인 → 이메일 표시) -->
<template>
  <div v-if="show" class="modal-overlay" @click.self="closeFindEmailModal">
    <div class="modal-content">
      <div class="modal-header">
        <div class="modal-title">이메일 찾기</div>
        <button class="close-btn" @click="closeFindEmailModal">×</button>
      </div>

      <!-- 이메일 표시 단계 -->
      <div v-if="findEmail.verified">
        <div class="result-box">
          <div class="result-label">회원님의 이메일</div>
          <div class="result-value">{{ findEmail.foundEmail }}</div>
        </div>
        <button class="btn-primary full-width" @click="closeFindEmailModal">확인</button>
      </div>

      <!-- 인증 코드 입력 단계 -->
      <div v-else-if="findEmail.codeSent">
        <div class="form-group">
          <label class="form-label">인증 코드</label>
          <input
              type="text"
              class="form-input"
              v-model="findEmail.code"
              placeholder="인증 코드를 입력하세요"
              maxlength="6"
          />
        </div>

        <div v-if="findEmailError" class="error-message">
          <span>⚠️</span>
          <span>{{ findEmailError }}</span>
        </div>

        <div class="btn-group">
          <button class="btn-primary" @click="handleVerifyEmailCode">확인</button>
          <button class="btn-secondary" @click="closeFindEmailModal">취소</button>
        </div>
      </div>

      <!-- 전화번호 입력 단계 -->
      <div v-else>
        <div class="form-group">
          <label class="form-label">이름</label>
          <input
              type="text"
              class="form-input"
              v-model="findEmail.name"
              placeholder="이름을 입력하세요"
          />
        </div>

        <div class="form-group">
          <label class="form-label">전화번호</label>
          <div class="verification-group">
            <input
                type="tel"
                class="form-input"
                v-model="findEmail.phone"
                @input="formatPhoneNumber"
                placeholder="010-0000-0000"
                maxlength="13"
            />
            <button
                class="verification-btn"
                @click="handleSendEmailCode"
                :disabled="!findEmail.name || !findEmail.phone"
            >
              인증
            </button>
          </div>
        </div>

        <div v-if="findEmailError" class="error-message">
          <span>⚠️</span>
          <span>{{ findEmailError }}</span>
        </div>

        <button class="btn-secondary full-width mt-20" @click="closeFindEmailModal">취소</button>
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

const findEmailError = ref('')
const findEmail = reactive({
  name: '',
  phone: '',
  code: '',
  codeSent: false,
  verified: false,
  foundEmail: ''
})

const formatPhoneNumber = (event) => {
  let value = event.target.value.replace(/[^0-9]/g, '')
  if (value.length <= 3) {
    findEmail.phone = value
  } else if (value.length <= 7) {
    findEmail.phone = value.slice(0, 3) + '-' + value.slice(3)
  } else {
    findEmail.phone = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11)
  }
}

const handleSendEmailCode = async () => {
  findEmailError.value = ''

  if (!findEmail.name || !findEmail.phone) {
    findEmailError.value = '이름과 전화번호를 모두 입력해주세요.'
    return
  }

  try {
    await axios.post(`${API_BASE}/auth/sms/send`, {
      name: findEmail.name,
      phone: findEmail.phone
    });

    findEmail.codeSent = true;
    alert('인증 코드가 발송되었습니다.');
  } catch (error) {
    findEmailError.value = error.response?.data?.message || '인증번호 발송에 실패했습니다. 정보를 확인해주세요.';
  }
}

const handleVerifyEmailCode = async () => {
  findEmailError.value = ''

  if (!findEmail.code) {
    findEmailError.value = '인증 코드를 입력해주세요.'
    return
  }

  try {
    const response = await axios.post(`${API_BASE}/auth/sms/verify`, {
      name: findEmail.name,
      phone: findEmail.phone,
      code: findEmail.code
    });

    findEmail.foundEmail = response.data;
    findEmail.verified = true;
  } catch (error) {
    findEmailError.value = error.response?.data?.message || '인증에 실패했습니다.';
  }
}

const closeFindEmailModal = () => {
  Object.assign(findEmail, {
    name: '',
    phone: '',
    code: '',
    codeSent: false,
    verified: false,
    foundEmail: ''
  })
  findEmailError.value = ''
  emit('close')
}
</script>
