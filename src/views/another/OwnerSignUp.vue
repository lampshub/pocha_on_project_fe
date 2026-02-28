<!-- 점주 회원가입 페이지: 이름, 이메일, 비밀번호, 전화번호 입력 폼과 사업자 인증 모달을 조합하여 점주 계정을 생성하는 페이지 컴포넌트 -->
<template>
  <div class="signup-page">
    <div class="signup-container">

      <!-- 로고 -->
      <div class="logo-area">
        <div class="logo-title">TABLE ORDER</div>
      <div class="logo-subtitle">점주 관리 시스템</div>
      </div>
      <!-- 타이틀 -->

      <h1 class="form-title">회원가입</h1>

      <!-- 회원가입 폼 -->
      <form @submit.prevent="handleSubmit">

        <!-- 이름 -->
        <div class="form-group">
          <input type="text" class="form-input" v-model="formData.ownerName" placeholder="이름 *" required />
        </div>

        <!-- 이메일 -->
        <div class="form-group">
          <input type="email" class="form-input" v-model="formData.ownerEmail" placeholder="이메일 * (example@email.com)" required />
        </div>

        <!-- 비밀번호 -->
        <div class="form-group">
          <input
            type="password"
            :class="['form-input', passwordError ? 'error' : '']"
            v-model="formData.password"
            placeholder="비밀번호 * (8자 이상, 영문+숫자+특수문자)"
            @input="checkPassword"
            required
          />
          <div v-if="passwordError" class="error-message">
            <span>⚠️</span><span>{{ passwordError }}</span>
          </div>
        </div>

        <!-- 비밀번호 확인 -->
        <div class="form-group">
          <input
            type="password"
            :class="['form-input', passwordConfirmClass]"
            v-model="formData.passwordConfirm"
            placeholder="비밀번호 확인 *"
            @input="checkPasswordMatch"
            required
          />
          <div v-if="passwordMatchError" class="error-message">
            <span>⚠️</span><span>{{ passwordMatchError }}</span>
          </div>
          <div v-if="passwordMatchSuccess" class="success-message">
            <span>✓</span><span>비밀번호가 일치합니다.</span>
          </div>
        </div>

        <!-- 전화번호 -->
        <div class="form-group">
          <input
            type="tel"
            class="form-input"
            v-model="formData.phoneNumber"
            placeholder="전화번호 * (010-0000-0000)"
            maxlength="13"
            @input="formatPhoneNumber"
            required
          />
        </div>

        <!-- 사업자 인증 -->
        <div class="form-group">
          <div class="verify-group">
            <button
              type="button"
              :class="['verify-btn', { verified: isBusinessVerified }]"
              @click="openVerifyModal"
              :disabled="isBusinessVerified"
            >
              {{ isBusinessVerified ? '✓ 사업자 인증 완료' : '사업자 인증 *' }}
            </button>
            <div :class="['verify-status', isBusinessVerified ? 'verified' : 'pending']">
              {{ isBusinessVerified ? '인증완료' : '인증필요' }}
            </div>
          </div>
          <div v-if="businessVerifyError" class="error-message">
            <span>⚠️</span><span>{{ businessVerifyError }}</span>
          </div>
        </div>

        <!-- 전체 에러 메시지 -->
        <div v-if="errorMessage" class="error-message" style="margin-top: 20px;">
          <span>⚠️</span>
          <span>{{ errorMessage }}</span>
        </div>

        <!-- 회원가입 버튼 -->
        <button type="submit" class="submit-btn" :disabled="isLoading">
          <span v-if="isLoading" class="loading"></span>
          <span v-else>회원가입</span>
        </button>

        <!-- 취소 버튼 -->
        <button
            type="button"
            class="cancel-btn"
            @click="handleCancel"
            :disabled="isLoading"
        >
          취소
        </button>
      </form>
    </div>


    <!-- 사업자 인증 모달 (자식 컴포넌트) -->
    <BusinessVerifyModal
      :show="showVerifyModal"
      @close="handleVerifyModalClose"
      @verified="handleBusinessVerified"
    />
  </div>
</template>

<script setup>
// 점주 회원가입 페이지 스크립트: 폼 상태 관리, 비밀번호 유효성 검사, 전화번호 포맷팅, 사업자 인증 모달 제어, 회원가입 API 호출

import { ref, reactive, computed } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import BusinessVerifyModal from '@/components/another/BusinessVerifyModal.vue'

const toast = useToast()
const router = useRouter()


// 1. 회원가입 폼 데이터
const formData = reactive({
  ownerName: '',
  ownerEmail: '',
  password: '',
  passwordConfirm: '',
  phoneNumber: '',
  businessRegistrationNumber: ''
})

// 상태 관리 변수들
const isLoading = ref(false)
const showVerifyModal = ref(false)
const isBusinessVerified = ref(false)

// 에러/성공 메시지 변수
const passwordError = ref('')
const passwordMatchError = ref('')
const passwordMatchSuccess = ref(false)
const businessVerifyError = ref('')
const errorMessage = ref('')


// --- 비밀번호 유효성 및 일치 체크 ---
const checkPassword = () => {
  const reg = /^(?=.*[a-zA-Z])(?=.*[!@#$%^*+=-])(?=.*[0-9]).{8,25}$/;
  if (!reg.test(formData.password)) {
    passwordError.value = "8자 이상 영문, 숫자, 특수문자를 조합해주세요.";
  } else {
    passwordError.value = "";
  }
  checkPasswordMatch();
};

const checkPasswordMatch = () => {
  if (!formData.passwordConfirm) {
    passwordMatchError.value = "";
    passwordMatchSuccess.value = false;
    return;
  }
  if (formData.password !== formData.passwordConfirm) {
    passwordMatchError.value = "비밀번호가 일치하지 않습니다.";
    passwordMatchSuccess.value = false;
  } else {
    passwordMatchError.value = "";
    passwordMatchSuccess.value = true;
  }
};

const passwordConfirmClass = computed(() => {
  if (!formData.passwordConfirm) return '';
  return formData.password === formData.passwordConfirm ? 'success' : 'error';
});


// --- 전화번호 자동 하이픈 포맷 ---
const formatPhoneNumber = () => {
  formData.phoneNumber = formData.phoneNumber
      .replace(/[^0-9]/g, '')
      .replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, `$1-$2-$3`);
};


// --- 사업자 인증 모달 제어 ---
const openVerifyModal = () => {
  showVerifyModal.value = true
}

const handleVerifyModalClose = () => {
  showVerifyModal.value = false
}

const handleBusinessVerified = (businessNumber) => {
  isBusinessVerified.value = true
  formData.businessRegistrationNumber = businessNumber
}


// --- 최종 회원가입 제출 ---
const handleSubmit = async () => {
  errorMessage.value = ''
  businessVerifyError.value = ''

  // 비밀번호 형식 검사
  if (passwordError.value) {
    errorMessage.value = "비밀번호 형식을 확인해주세요."
    return
  }

  // 비밀번호 일치 검사
  if (!passwordMatchSuccess.value) {
    errorMessage.value = "비밀번호가 일치하지 않습니다."
    return
  }

  if (!formData.ownerName.trim()) {
    return
  }

  if (!isBusinessVerified.value) {
    businessVerifyError.value = '사업자 인증이 필요합니다.'
    errorMessage.value = '사업자 인증을 완료해주세요.'
    return
  }

  isLoading.value = true;
  errorMessage.value = "";

  try {
    const data = {
      ownerName: formData.ownerName,
      ownerEmail: formData.ownerEmail,
      password: formData.password,
      phoneNumber: formData.phoneNumber,
      businessRegistrationNumber: formData.businessRegistrationNumber.replace(/\D/g, ''),
    };

    console.log("전송 데이터:", data);

    const result = await axios.post(`${process.env.VUE_APP_API_BASE_URL}/owner/create`, data);

    console.log("가입 결과:", result.data);
    toast.success("회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.", {timeout: 1500});

    await router.push("/");
  } catch (e) {
    const serverMessage = e.response?.data?.message || e.response?.data?.errorMessage || '서버 통신 오류가 발생했습니다.';
    errorMessage.value = serverMessage;
    toast.error(serverMessage);
  } finally {
    isLoading.value = false;
  }
};

const handleCancel = () => {
  if (confirm("회원가입을 취소하시겠습니까?")) {
    router.go(-1);
  }
};
</script>

<style>
@import "@/assets/css/OwnerSignup.css";
</style>
