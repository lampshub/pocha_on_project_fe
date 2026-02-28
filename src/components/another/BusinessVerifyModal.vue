<!-- 사업자 인증 모달 컴포넌트: 사업자 등록번호, 대표자명, 개업일자를 입력받아 국세청 API를 통해 사업자 진위를 확인하는 모달 -->
<template>
  <div v-if="show" class="modal-overlay" @click.self="closeVerifyModal">
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">사업자 인증</h2>
        <p class="modal-description">사업자 등록번호와 대표자명을 입력하여 인증을 진행합니다.</p>
      </div>

      <form @submit.prevent="verifyBusiness" class="modal-form">
        <div class="form-group">
          <input
            type="text"
            class="form-input"
            v-model="businessData.b_no"
            placeholder="사업자 등록번호 * (- 없이 10자리 입력해주세요.)"
            maxlength="12"
            @input="formatBusinessNumberOnly"
            required
          />
        </div>

        <div class="form-group">
          <input type="text" class="form-input" v-model="businessData.p_nm" placeholder="대표자명 *" required />
        </div>

        <div class="form-group">
          <input
            type="text"
            class="form-input"
            :value="formattedStartDate"
            placeholder="개업일자 * (YYYYMMDD)"
            maxlength="10"
            @input="formatStartDate"
            required
          />
        </div>
        <div
          v-if="businessData.start_dt.length === 8 && !isValidStartDate"
          class="error-message"
        >
          <span>⚠️</span>
          <span>올바른 날짜를 입력해주세요.</span>
        </div>
        <div v-if="verifyErrorMessage" class="error-message">
          <span>⚠️</span><span>{{ verifyErrorMessage }}</span>
        </div>
      </form>

      <div class="modal-buttons">
        <button
          type="button"
          class="modal-btn modal-btn-primary"
          @click="verifyBusiness"
          :disabled="isVerifying || !isValidStartDate"
        >
          <span v-if="isVerifying" class="loading"></span>
          <span v-else>인증하기</span>
        </button>
        <button type="button" class="modal-btn modal-btn-secondary" @click="closeVerifyModal" :disabled="isVerifying">취소</button>
      </div>
    </div>
  </div>
</template>

<script setup>
// 사업자 인증 모달 스크립트: 사업자 등록번호 포맷팅, 개업일자 유효성 검사, 인증 API 호출 로직을 포함

import { ref, reactive, computed } from 'vue'
import axios from 'axios'
import { useToast } from 'vue-toastification'

const toast = useToast()

// --- Props / Emits 정의 ---
defineProps({
  show: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'verified'])

// --- 사업자 인증 모달 내부 상태 ---
const businessData = reactive({
  b_no: '',
  p_nm: '',
  start_dt: ''
})

const isVerifying = ref(false)
const verifyErrorMessage = ref('')

// --- 사업자등록번호 자동 하이픈 포맷 (000-00-00000) ---
const formatBusinessNumber = (value) => {
  const digits = (value || '').replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 5) return `${digits.slice(0,3)}-${digits.slice(3)}`
  return `${digits.slice(0,3)}-${digits.slice(3,5)}-${digits.slice(5)}`
}

const formatBusinessNumberOnly = () => {
  businessData.b_no = formatBusinessNumber(businessData.b_no)
}

// --- 사업장 개업일자 자동 하이픈 포맷 (0000-00-00) ---
const formattedStartDate = computed(() => {
  const digits = businessData.start_dt.replace(/\D/g, '').slice(0, 8)

  if (digits.length <= 4) return digits
  if (digits.length <= 6) return `${digits.slice(0,4)}-${digits.slice(4)}`
  return `${digits.slice(0,4)}-${digits.slice(4,6)}-${digits.slice(6)}`
})

const formatStartDate = (e) => {
  const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 8)
  businessData.start_dt = onlyDigits
}

// --- 개업일자 날짜 유효성 검사 ---
const isValidStartDate = computed(() => {
  const value = businessData.start_dt

  if (value.length !== 8) return false

  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(4, 6))
  const day = Number(value.slice(6, 8))

  const date = new Date(year, month - 1, day)

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
})

// --- 모달 닫기: 인증 미완료 시 입력값 초기화 ---
const closeVerifyModal = () => {
  businessData.b_no = ''
  businessData.p_nm = ''
  businessData.start_dt = ''
  verifyErrorMessage.value = ''
  emit('close')
}

// --- 사업자 인증 API 호출 ---
const verifyBusiness = async () => {
  const rawBno = businessData.b_no.replace(/\D/g, '')
  if (rawBno.length !== 10) {
    verifyErrorMessage.value = '사업자 번호 10자리를 입력해주세요.'
    return
  }

  isVerifying.value = true
  verifyErrorMessage.value = ''

  try {
    const payload = {
      businesses: [{
        b_no: rawBno,
        p_nm: businessData.p_nm,
        start_dt: businessData.start_dt.replace(/\D/g, '')
      }]
    }

    const response = await axios.post(`${process.env.VUE_APP_API_BASE_URL}/owner/business/verify`, payload)

    if (response.data.data && response.data.data[0].valid === '01') {
      toast.success('인증에 성공하였습니다.')
      emit('verified', businessData.b_no)
      // 인증 성공 후 모달 닫기 (입력값 초기화 포함)
      businessData.b_no = ''
      businessData.p_nm = ''
      businessData.start_dt = ''
      verifyErrorMessage.value = ''
      emit('close')
    } else {
      verifyErrorMessage.value = '사업자 정보가 일치하지 않습니다.'
    }
  } catch (error) {
    console.error(error)
    verifyErrorMessage.value = '인증 중 오류가 발생했습니다.'
  } finally {
    isVerifying.value = false
  }
}
</script>
