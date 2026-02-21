<template>

  <div class="signup-page">

    <div class="signup-container">

      <!-- 로고 영역 -->

      <div class="logo-area">

        <div class="logo-title">TABLE ORDER</div>

        <div class="logo-subtitle">점주 회원가입</div>

      </div>



      <!-- 타이틀 -->

      <h1 class="form-title">회원가입</h1>



      <!-- 회원가입 폼 -->

      <form @submit.prevent="handleSubmit">

        <!-- 이름 -->

        <div class="form-group">

          <label class="form-label">

            이름

            <span class="required">*</span>

          </label>

          <input

              type="text"

              class="form-input"

              v-model="formData.ownerName"

              placeholder="이름을 입력하세요"

              required

          />

        </div>



        <!-- 이메일 -->

        <div class="form-group">

          <label class="form-label">

            이메일

            <span class="required">*</span>

          </label>

          <input

              type="email"

              class="form-input"

              v-model="formData.ownerEmail"

              placeholder="example@email.com"

              required

          />

          <div class="help-text">

            로그인 시 사용할 이메일 주소를 입력해주세요.

          </div>

        </div>



        <!-- 비밀번호 -->

        <div class="form-group">

          <label class="form-label">

            비밀번호

            <span class="required">*</span>

          </label>

          <input

              type="password"

              :class="['form-input', passwordError ? 'error' : '']"

              v-model="formData.password"

              placeholder="비밀번호를 입력하세요"

              @input="checkPassword"

              required

          />

          <div class="help-text">

            8자 이상, 영문, 숫자, 특수문자를 포함해주세요.

          </div>

          <div v-if="passwordError" class="error-message">

            <span>⚠️</span>

            <span>{{ passwordError }}</span>

          </div>

        </div>



        <!-- 비밀번호 확인 -->

        <div class="form-group">

          <label class="form-label">

            비밀번호 확인

            <span class="required">*</span>

          </label>

          <input

              type="password"

              :class="['form-input', passwordConfirmClass]"

              v-model="formData.passwordConfirm"

              placeholder="비밀번호를 다시 입력하세요"

              @input="checkPasswordMatch"

              required

          />

          <div v-if="passwordMatchError" class="error-message">

            <span>⚠️</span>

            <span>{{ passwordMatchError }}</span>

          </div>

          <div v-if="passwordMatchSuccess" class="success-message">

            <span>✓</span>

            <span>비밀번호가 일치합니다.</span>

          </div>

        </div>



        <!-- 전화번호 -->

        <div class="form-group">

          <label class="form-label">

            전화번호

            <span class="required">*</span>

          </label>

          <input

              type="tel"

              class="form-input"

              v-model="formData.phoneNumber"

              placeholder="010-0000-0000"

              maxlength="13"

              @input="formatPhoneNumber"

              required

          />

          <div class="help-text">

            하이픈(-)을 입력해주세요

          </div>

        </div>



        <!-- 사업자 인증 -->

        <div class="form-group">

          <label class="form-label">

            사업자 인증

            <span class="required">*</span>

          </label>

          <div class="verify-group">

            <button

                type="button"

                :class="['verify-btn', { verified: isBusinessVerified }]"

                @click="openVerifyModal"

                :disabled="isBusinessVerified"

            >

              {{ isBusinessVerified ? '✓ 인증 완료' : '사업자 인증' }}

            </button>

            <div :class="['verify-status', isBusinessVerified ? 'verified' : 'pending']">

              {{ isBusinessVerified ? '인증 완료' : '인증 필요' }}

            </div>

          </div>

          <div class="help-text">

            사업자 등록 정보를 통해 본인 인증을 진행합니다.

          </div>

          <div v-if="businessVerifyError" class="errorMessage">

            <span>⚠️</span>

            <span>{{ businessVerifyError }}</span>

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



    <!-- ==================== 사업자 인증 모달 ==================== -->

    <div v-if="showVerifyModal" class="modal-overlay" @click.self="closeVerifyModal">

      <div class="modal-content">

        <div class="modal-header">

          <h2 class="modal-title">사업자 인증</h2>

          <p class="modal-description">

            사업자 등록번호와 대표자명을 입력하여 인증을 진행합니다.

          </p>

        </div>



        <form @submit.prevent="verifyBusiness" class="modal-form">

          <div class="form-group">

            <label class="form-label">

              사업자 등록번호

              <span class="required">*</span>

            </label>

            <input

                type="text"

                class="form-input"

                v-model="businessData.b_no"

                placeholder="0000000000 (10자리, 하이픈 없이)"

                maxlength="10"

                @input="formatBusinessNumberOnly"

                required

            />

            <div class="help-text">

              하이픈(-) 없이 숫자 10자리만 입력하세요.

            </div>

          </div>



          <div class="form-group">

            <label class="form-label">

              대표자명

              <span class="required">*</span>

            </label>

            <input

                type="text"

                class="form-input"

                v-model="businessData.p_nm"

                placeholder="대표자 이름을 입력하세요"

                required

            />

          </div>



          <div class="form-group">

            <label class="form-label">

              개업일자

              <span class="required">*</span>

            </label>

            <input

                type="text"

                class="form-input"

                v-model="businessData.start_dt"

                placeholder="YYYYMMDD (예: 20200101)"

                maxlength="8"

                @input="formatStartDate"

                required

            />

            <div class="help-text">

              개업일자를 8자리 숫자로 입력하세요. (예: 20200101)

            </div>

          </div>



          <div v-if="verifyErrorMessage" class="error-message">

            <span>⚠️</span>

            <span>{{ verifyErrorMessage }}</span>

          </div>

        </form>



        <div class="modal-buttons">

          <button

              type="button"

              class="modal-btn modal-btn-primary"

              @click="verifyBusiness"

              :disabled="isVerifying"

          >

            <span v-if="isVerifying" class="loading"></span>

            <span v-else>인증하기</span>

          </button>

          <button

              type="button"

              class="modal-btn modal-btn-secondary"

              @click="closeVerifyModal"

              :disabled="isVerifying"

          >

            취소

          </button>

        </div>

      </div>

    </div>

  </div>

</template>


<script setup>

import { ref, reactive, computed } from 'vue';

import axios from 'axios';

import { useRouter } from 'vue-router'; 

import { useToast } from "vue-toastification";

const toast = useToast();

const router = useRouter();



// 1. 회원가입 폼 데이터

const formData = reactive({

  ownerName: '',

  ownerEmail: '',

  password: '',

  passwordConfirm: '',

  phoneNumber: '',

  businessRegistrationNumber: ''

});



// 2. 사업자 인증 모달용 데이터

const businessData = reactive({

  b_no: '',

  p_nm: '',

  start_dt: ''

});



// 상태 관리 변수들

const isLoading = ref(false);

const isVerifying = ref(false);

const showVerifyModal = ref(false);

const isBusinessVerified = ref(false);



// 에러/성공 메시지 변수

const passwordError = ref('');

const passwordMatchError = ref('');

const passwordMatchSuccess = ref(false);

const businessVerifyError = ref('');

const errorMessage = ref('');

const verifyErrorMessage = ref('');



// --- 비밀번호 유효성 및 일치 체크 ---

const checkPassword = () => {

  const reg = /^(?=.*[a-zA-Z])(?=.*[!@#$%^*+=-])(?=.*[0-9]).{8,25}$/;

  // [수정] ref 변수에 값을 넣을 때는 반드시 .value를 사용해야 합니다.

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

  // [수정] 불필요한 이스케이프(\计)와 정규식 오타를 수정했습니다.

  formData.phoneNumber = formData.phoneNumber

    .replace(/[^0-9]/g, '')

    .replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, `$1-$2-$3`);

};



// --- 모달 제어 ---

const openVerifyModal = () => { showVerifyModal.value = true; };

const closeVerifyModal = () => {
  showVerifyModal.value = false
  if (!isBusinessVerified.value) {
    businessData.b_no = ''
    businessData.p_nm = ''
    businessData.start_dt = ''
  }
  verifyErrorMessage.value = ''
}

// ==================== 사업자 인증 처리 ====================
const verifyBusiness = async () => {

  if (businessData.b_no.length !== 10) {

    verifyErrorMessage.value = "사업자 번호 10자리를 입력해주세요.";

    return;

  }

  

  isVerifying.value = true;

  verifyErrorMessage.value = "";



  try {

    const payload = {

      businesses: [{

        b_no: businessData.b_no,

        p_nm: businessData.p_nm,

        start_dt: businessData.start_dt

      }]

    };



    const response = await axios.post('http://localhost:8083/owner/business/verify', payload);

    

    if (response.data.data && response.data.data[0].valid === "01") {

      isBusinessVerified.value = true;

      formData.businessRegistrationNumber = businessData.b_no;

      alert("인증에 성공하였습니다.");

      closeVerifyModal();

    } else {

      verifyErrorMessage.value = "사업자 정보가 일치하지 않습니다.";

    }

  } catch (error) {

    console.error(error);

    verifyErrorMessage.value = "인증 중 오류가 발생했습니다.";

  } finally {

    isVerifying.value = false;

  }

};



// --- 최종 회원가입 제출 ---

const handleSubmit = async () => {
  errorMessage.value = ''
  businessVerifyError.value = ''

  // 유효성 검사 로직 (생략 - 기존과 동일)
  if (!formData.ownerName.trim()) { /* ... */ return }
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
        businessRegistrationNumber: businessData.b_no, 
    };

    console.log("전송 데이터:", data);
    
    const result = await axios.post(`${process.env.VUE_APP_API_BASE_URL}/owner/create`, data);
    
    console.log("가입 결과:", result.data);
    toast.success("회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.", { timeout: 1500 });
    
    await router.push("/");
  } catch (e) {
    // 상세한 에러 메시지 추출
    const serverMessage = e.response?.data?.message || e.response?.data?.errorMessage || '서버 통신 오류가 발생했습니다.';
    errorMessage.value = serverMessage;
    toast.error(serverMessage);
    console.error("회원가입 에러 상세:", e.response?.data);
  } finally {
    isLoading.value = false
  }
}

// ==================== 취소 ====================
const handleCancel = () => {

  if (confirm("회원가입을 취소하시겠습니까?")) {

    router.go(-1); // 이전 페이지로 이동

  }

};

</script>

<style scoped>
@import "@/assets/css/OwnerSignup.css";
</style>