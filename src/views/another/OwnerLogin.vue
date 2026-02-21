<template>
  <div class="login-page">
    <div class="login-container">
      <div class="logo-area">
        <div class="logo-title">TABLE ORDER</div>
        <div class="logo-subtitle">점주 관리 시스템</div>
      </div>

      <h1 class="login-title">로그인</h1>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">이메일</label>
          <input
              type="email"
              class="form-input"
              v-model="email"
              placeholder="이메일을 입력하세요"
              required
              autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label class="form-label">비밀번호</label>
          <input
              type="password"
              class="form-input"
              v-model="password"
              placeholder="비밀번호를 입력하세요"
              required
              autocomplete="current-password"
          />
        </div>

        <div v-if="errorMessage" class="error-message">
          <span>⚠️</span>
          <span>{{ errorMessage }}</span>
        </div>

        <button type="submit" class="login-btn" :disabled="isLoading">
          <span v-if="isLoading" class="loading"></span>
          <span v-else>로그인</span>
        </button>
      </form>

      <div class="login-footer">
        <router-link to="/another/signup" class="footer-link">회원가입</router-link>
        <span class="footer-divider">|</span>
        <a class="footer-link" @click="showFindEmailModal = true">이메일 찾기</a>
        <span class="footer-divider">|</span>
        <a class="footer-link" @click="showFindPasswordModal = true">비밀번호 찾기</a>
      </div>
    </div>

    </div>

    <!-- ==================== 이메일 찾기 모달 ==================== -->
    <div v-if="showFindEmailModal" class="modal-overlay" @click.self="closeFindEmailModal">
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

    <!-- ==================== 비밀번호 찾기 모달 ==================== -->
    <div v-if="showFindPasswordModal" class="modal-overlay" @click.self="closeFindPasswordModal">
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
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

// 로그인 관련 상태
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

// .env에서 베이스 URL 가져오기
const API_BASE = process.env.VUE_APP_API_BASE_URL;

const handleLogin = async () => {
  errorMessage.value = ''
  
  if (!email.value || !password.value) {
    errorMessage.value = '이메일과 비밀번호를 모두 입력해주세요.'
    return
  }

  isLoading.value = true

  try {
    // 엔드포인트: http://localhost:8083/owner/baseLogin
    const response = await axios.post(`${API_BASE}/owner/baseLogin`, {
      ownerEmail: email.value, // 백엔드 BaseLoginDto 필드명
      password: password.value
    });

    // 백엔드 반환값: TokenDto (accessToken, refreshToken, name)
    const { accessToken, refreshToken, name } = response.data;

    // 토큰 저장
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('ownerName', name);

    // 로그인 성공 후 대시보드로 이동
    router.push('/another/dashboard');

  } catch (error) {
    console.error('Login Error:', error);
    
    // 401 Unauthorized 에러 처리
    if (error.response && error.response.status === 401) {
      errorMessage.value = '이메일 또는 비밀번호가 일치하지 않습니다.';
    } else if (error.response && error.response.status === 404) {
      errorMessage.value = '존재하지 않는 사용자 계정입니다.';
    } else {
      errorMessage.value = '로그인 중 오류가 발생했습니다. 서버 상태를 확인하세요.';
    }
  } finally {
    isLoading.value = false
  }
}

// ==================== 이메일 찾기 ====================
const showFindEmailModal = ref(false)
const findEmailError = ref('')
const findEmail = reactive({
  name: '',
  phone: '',
  code: '',
  codeSent: false, // 인증번호 입력 단계 전환용
  verified: false, // 결과 표시 단계 전환용
  foundEmail: ''   // 백엔드에서 받은 마스킹된 이메일
})

// 전화번호 하이픈 자동 삽입 (010-0000-0000)
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

// 1. 인증번호 발송 (SmsSendReqDto 매핑)
const handleSendEmailCode = async () => {
  findEmailError.value = ''

  if (!findEmail.name || !findEmail.phone) {
    findEmailError.value = '이름과 전화번호를 모두 입력해주세요.'
    return
  }

  try {
    // POST http://localhost:8083/auth/sms/send
    await axios.post(`${API_BASE}/auth/sms/send`, {
      name: findEmail.name,
      phone: findEmail.phone // 하이픈 포함 전송 시 백엔드 SmsSender에서 정제함
    });

    findEmail.codeSent = true;
    alert('인증 코드가 발송되었습니다.');
  } catch (error) {
    // 백엔드 throw new RuntimeException 메시지 처리
    findEmailError.value = error.response?.data?.message || '인증번호 발송에 실패했습니다. 정보를 확인해주세요.';
  }
}

// 2. 인증번호 확인 및 이메일 조회 (SmsVerifyReqDto 매핑)
const handleVerifyEmailCode = async () => {
  findEmailError.value = ''

  if (!findEmail.code) {
    findEmailError.value = '인증 코드를 입력해주세요.'
    return
  }

  try {
    // POST http://localhost:8083/auth/sms/verify
    const response = await axios.post(`${API_BASE}/auth/sms/verify`, {
      name: findEmail.name,
      phone: findEmail.phone,
      code: findEmail.code
    });

    // 성공 시 백엔드에서 마스킹된 이메일 문자열(String)을 직접 반환함
    findEmail.foundEmail = response.data; 
    findEmail.verified = true;
  } catch (error) {
    // 5회 실패 차단, 코드 불일치 등 메시지 처리
    findEmailError.value = error.response?.data?.message || '인증에 실패했습니다.';
  }
}

// 모달 닫기 시 데이터 초기화
const closeFindEmailModal = () => {
  showFindEmailModal.value = false
  Object.assign(findEmail, {
    name: '',
    phone: '',
    code: '',
    codeSent: false,
    verified: false,
    foundEmail: ''
  })
  findEmailError.value = ''
}

// ==================== 비밀번호 찾기 ====================
const showFindPasswordModal = ref(false)
const findPasswordError = ref('')
const passwordResetComplete = ref(false)

const findPassword = reactive({
  email: '',
  code: '',
  codeSent: false,    // 인증번호 입력 단계
  verified: false,    // 새 비밀번호 입력 단계
  newPassword: '',
  newPasswordConfirm: ''
})

// 1. 이메일 인증코드 발송 (EmailRequestDto 매핑)
const handleSendCode = async () => {
  findPasswordError.value = ''
  
  if (!findPassword.email) {
    findPasswordError.value = '이메일을 입력해주세요.'
    return
  }

  try {
    // POST /auth/email/send
    await axios.post(`${API_BASE}/auth/email/send`, {
      email: findPassword.email
    });
    
    findPassword.codeSent = true
    alert('인증 코드가 이메일로 발송되었습니다.')
  } catch (error) {
    findPasswordError.value = error.response?.data?.message || '인증코드 발송에 실패했습니다.'
  }
}

// 2. 인증코드 검증 (EmailVerifyRequest 매핑)
const handleVerifyCode = async () => {
  findPasswordError.value = ''

  if (!findPassword.code) {
    findPasswordError.value = '인증 코드를 입력해주세요.'
    return
  }

  try {
    // POST /auth/email/verify
    // 성공 시 백엔드 Redis에 "EMAIL_VERIFIED:이메일"이 10분간 저장됨
    await axios.post(`${API_BASE}/auth/email/verify`, {
      email: findPassword.email,
      code: findPassword.code
    });

    findPassword.verified = true
  } catch (error) {
    // 차단 여부, 코드 불일치 등 메시지 출력
    findPasswordError.value = error.response?.data?.message || '인증에 실패했습니다.'
  }
}

// 3. 비밀번호 변경 실행 (PasswordResetReqDto 매핑)
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
    // POST /auth/password/reset
    await axios.post(`${API_BASE}/auth/password/reset`, {
      email: findPassword.email,
      newPassword: findPassword.newPassword
    });

    passwordResetComplete.value = true
  } catch (error) {
    // 이메일 인증 필요, 기존 비번 동일 등 메시지 처리
    findPasswordError.value = error.response?.data?.message || '비밀번호 변경에 실패했습니다.'
  }
}

// 모달 초기화
const closeFindPasswordModal = () => {
  showFindPasswordModal.value = false
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
}
</script>

<style scoped>

@import "@/assets/css/OwnerLogin.css";

</style>