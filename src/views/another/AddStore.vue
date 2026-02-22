<template>
  <div class="form-page">
    <div class="store-form-container">

      <!-- 타이틀 -->
      <h1 class="form-title">매장 신청</h1>

      <!-- 신청 폼 -->
      <form @submit.prevent="handleSubmit">

        <!-- 매장 명 -->
        <div class="form-group">
          <label class="form-label">
            매장 명 <span class="required">*</span>
          </label>
          <input
              type="text"
              class="form-input"
              v-model="form.storeName"
              placeholder="매장 명을 입력하세요"
              required
          />
          <p class="help-text">손님들에게 표시될 매장 이름을 입력해주세요.</p>
        </div>

        <!-- 매장 주소 -->
        <div class="form-group">
          <label class="form-label">
            매장 주소 <span class="required">*</span>
          </label>
          <input
              type="text"
              class="form-input"
              v-model="form.address"
              placeholder="매장 주소를 입력하세요"
              required
          />
          <input
              type="text"
              class="form-input address-detail"
              v-model="form.addressDetail"
              placeholder="상세 주소를 입력하세요 (선택)"
          />
          <p class="help-text">매장의 정확한 주소를 입력해주세요.</p>
        </div>

        <!-- 영업시간 -->
        <div class="form-group">
          <label class="form-label">
            영업시간 <span class="required">*</span>
          </label>
          <div class="time-group">
            <div class="time-input-wrapper">
              <span class="time-label">오픈 시간</span>
              <input
                  type="time"
                  class="form-input time-input"
                  v-model="form.openTime"
                  required
              />
            </div>
            <div class="time-separator">~</div>
            <div class="time-input-wrapper">
              <span class="time-label">마감 시간</span>
              <input
                  type="time"
                  class="form-input time-input"
                  v-model="form.closeTime"
                  required
              />
            </div>
          </div>
          <p class="help-text">매장의 정규 영업시간을 설정해주세요. (예: 11:00 ~ 22:00)</p>
        </div>

        <!-- 에러 메시지 -->
        <div v-if="errorMessage" class="error-message">
          <span>⚠️</span>
          <span>{{ errorMessage }}</span>
        </div>

        <!-- 성공 메시지 -->
        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>

        <!-- 신청 버튼 -->
        <button type="submit" class="submit-btn" :disabled="isLoading">
          <span v-if="isLoading" class="loading"/>
          <span v-else>신청</span>
        </button>

        <!-- 취소 버튼 -->
        <button
            type="button"
            class="cancel-btn"
            :disabled="isLoading"
            @click="handleCancel"
        >
          취소
        </button>

        <!-- 취소 확인 모달 -->
        <div v-if="showCancelModal" class="modal-overlay" @click.self="showCancelModal = false">
          <div class="modal-box">
            <p class="modal-text">입력한 내용이 모두 삭제됩니다.<br/>정말 취소하시겠습니까?</p>
            <div class="modal-buttons">
              <button class="modal-btn confirm" @click="confirmCancel">확인</button>
              <button class="modal-btn cancel" @click="showCancelModal = false">돌아가기</button>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import {reactive, ref} from 'vue'
import {useRouter} from 'vue-router'

const router = useRouter()

// ── 폼 상태 ──────────────────────────────────────────
const form = reactive({
  storeName: '',
  address: '',
  addressDetail: '',
  openTime: '',
  closeTime: '',
})

const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)

// ── 폼 제출 ──────────────────────────────────────────
const handleSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  // 유효성 검사
  if (!form.storeName.trim()) {
    errorMessage.value = '매장 명을 입력해주세요.'
    return
  }
  if (form.storeName.trim().length < 2) {
    errorMessage.value = '매장 명은 최소 2자 이상이어야 합니다.'
    return
  }
  if (!form.address.trim()) {
    errorMessage.value = '매장 주소를 입력해주세요.'
    return
  }
  if (!form.openTime) {
    errorMessage.value = '오픈 시간을 입력해주세요.'
    return
  }
  if (!form.closeTime) {
    errorMessage.value = '마감 시간을 입력해주세요.'
    return
  }
  if (form.openTime === form.closeTime) {
    errorMessage.value = '오픈 시간과 마감 시간은 같을 수 없습니다.';
    return;
  }

  isLoading.value = true
  try {
    // 1. 하드코딩된 localStorage.setItem 줄은 완전히 삭제하세요!

    // 2. 서버에서 받은 실제 accessToken을 가져옵니다.
    const token = localStorage.getItem('accessToken');

    if (!token) {
      throw new Error("로그인 정보가 없습니다. 다시 로그인해 주세요.");
    }

    const response = await fetch(`${process.env.VUE_APP_API_BASE_URL}/store/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // 실제 토큰 전달
      },
      body: JSON.stringify({
        name: form.storeName.trim(),
        address: form.addressDetail ? `${form.address.trim()} ${form.addressDetail.trim()}` : form.address.trim(),
        openAt: form.openTime,
        closeAt: form.closeTime,
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.errorMessage || "매장 등록에 실패했습니다.");
    }

    successMessage.value = "매장이 등록되었습니다!";
    setTimeout(() => {
      router.push('/another/dashboard');
    }, 1200);
  } catch (e) {
    errorMessage.value = e.message;
  } finally {
    isLoading.value = false
  }
};

const showCancelModal = ref(false);

// ── 취소 ─────────────────────────────────────────────
const handleCancel = () => {
    showCancelModal.value = true;
    // router.back();
}

const confirmCancel = () => {
  showCancelModal.value = false;
  router.back();
}
</script>

<style scoped>
@import "@/assets/css/AddStore.css";
</style>