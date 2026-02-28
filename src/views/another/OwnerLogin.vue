<!-- 점주 로그인 페이지: 로그인 폼과 이메일/비밀번호 찾기 모달을 관리하는 오케스트레이터 컴포넌트 -->
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

    <!-- 이메일 찾기 모달 -->
    <FindEmailModal :show="showFindEmailModal" @close="showFindEmailModal = false" />

    <!-- 비밀번호 찾기 모달 -->
    <FindPasswordModal :show="showFindPasswordModal" @close="showFindPasswordModal = false" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import FindEmailModal from '@/components/another/FindEmailModal.vue'
import FindPasswordModal from '@/components/another/FindPasswordModal.vue'

// 페이지 진입시 포커스 제거(커서 깜박임 없앰)
onMounted(() => {
  document.activeElement.blur()
})

const router = useRouter()

// 로그인 관련 상태
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

// .env에서 베이스 URL 가져오기
const API_BASE = process.env.VUE_APP_API_BASE_URL;

// 모달 표시 상태
const showFindEmailModal = ref(false)
const showFindPasswordModal = ref(false)

const handleLogin = async () => {
  errorMessage.value = ''

  if (!email.value || !password.value) {
    errorMessage.value = '이메일과 비밀번호를 모두 입력해주세요.'
    return
  }

  isLoading.value = true

  try {
    const response = await axios.post(`${API_BASE}/owner/baseLogin`, {
      ownerEmail: email.value,
      password: password.value
    });

    const { accessToken, refreshToken, name } = response.data;

    // 토큰 저장
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('ownerName', name);

    // 로그인 성공 후 대시보드로 이동
    router.push('/another/dashboard');

  } catch (error) {
    console.error('Login Error:', error);

    if (error.response && (error.response.status === 401 || error.response.status === 404)) {
      errorMessage.value = '이메일 또는 비밀번호가 일치하지 않습니다.';
    } else {
      errorMessage.value = '로그인 중 오류가 발생했습니다. 서버 상태를 확인하세요.';
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
@import "@/assets/css/OwnerLogin.css";
</style>
