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
            <!-- 오픈 시간 -->
            <div class="time-input-wrapper">
              <span class="time-label">오픈 시간</span>
              <div class="custom-time-picker">
                <div class="ampm-toggle">
                  <button type="button"
                    :class="['ampm-btn', { active: openAmPm === 'AM' }]"
                    @click="openAmPm = 'AM'">오전</button>
                  <button type="button"
                    :class="['ampm-btn', { active: openAmPm === 'PM' }]"
                    @click="openAmPm = 'PM'">오후</button>
                </div>
                <select class="time-select" v-model="openHour">
                  <option v-for="h in hours" :key="h" :value="h">{{ h }}시</option>
                </select>
                <select class="time-select" v-model="openMinute">
                  <option v-for="m in minutes" :key="m" :value="m">{{ String(m).padStart(2,'0') }}분</option>
                </select>
              </div>
            </div>

            <div class="time-separator">~</div>

            <!-- 마감 시간 -->
            <div class="time-input-wrapper">
              <span class="time-label">마감 시간</span>
              <div class="custom-time-picker">
                <div class="ampm-toggle">
                  <button type="button"
                    :class="['ampm-btn', { active: closeAmPm === 'AM' }]"
                    @click="closeAmPm = 'AM'">오전</button>
                  <button type="button"
                    :class="['ampm-btn', { active: closeAmPm === 'PM' }]"
                    @click="closeAmPm = 'PM'">오후</button>
                </div>
                <select class="time-select" v-model="closeHour">
                  <option v-for="h in hours" :key="h" :value="h">{{ h }}시</option>
                </select>
                <select class="time-select" v-model="closeMinute">
                  <option v-for="m in minutes" :key="m" :value="m">{{ String(m).padStart(2,'0') }}분</option>
                </select>
              </div>
            </div>
          </div>
          <p class="help-text">매장의 정규 영업시간을 설정해주세요. (예: 오전 11시 00분 ~ 오후 10시 00분)</p>
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
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// ── 폼 상태 ──────────────────────────────────────────
const form = reactive({
  storeName: '',
  address: '',
  addressDetail: '',
})

// ── 커스텀 시간 선택 상태 ─────────────────────────────
const openAmPm  = ref('AM')
const openHour  = ref(9)
const openMinute = ref(0)

const closeAmPm  = ref('PM')
const closeHour  = ref(10)
const closeMinute = ref(0)

const hours   = Array.from({ length: 12 }, (_, i) => i + 1)   // 1~12
const minutes = [0, 10, 20, 30, 40, 50]

// 24시간 포맷으로 변환 (HH:mm)
const toTime24 = (ampm, hour, minute) => {
  let h = hour % 12
  if (ampm === 'PM') h += 12
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

const openTimeStr  = computed(() => toTime24(openAmPm.value,  openHour.value,  openMinute.value))
const closeTimeStr = computed(() => toTime24(closeAmPm.value, closeHour.value, closeMinute.value))

const errorMessage  = ref('')
const successMessage = ref('')
const isLoading = ref(false)

// ── 폼 제출 ──────────────────────────────────────────
const handleSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

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
  if (openTimeStr.value === closeTimeStr.value) {
    errorMessage.value = '오픈 시간과 마감 시간은 같을 수 없습니다.'
    return
  }

  isLoading.value = true
  try {
    const token = localStorage.getItem('accessToken')
    if (!token) throw new Error('로그인 정보가 없습니다. 다시 로그인해 주세요.')

    const response = await fetch(`${process.env.VUE_APP_API_BASE_URL}/store/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: form.storeName.trim(),
        address: form.addressDetail
          ? `${form.address.trim()} ${form.addressDetail.trim()}`
          : form.address.trim(),
        openAt: openTimeStr.value,
        closeAt: closeTimeStr.value,
      }),
    })

    if (!response.ok) {
      const errData = await response.json()
      throw new Error(errData.errorMessage || '매장 등록에 실패했습니다.')
    }

    successMessage.value = '매장이 등록되었습니다!'
    setTimeout(() => { router.push('/another/dashboard') }, 1200)
  } catch (e) {
    errorMessage.value = e.message
  } finally {
    isLoading.value = false
  }
}

const showCancelModal = ref(false)

const handleCancel = () => { showCancelModal.value = true }
const confirmCancel = () => {
  showCancelModal.value = false
  router.back()
}
</script>

<style scoped>
@import "@/assets/css/AddStore.css";

/* ── 커스텀 시간 선택기 ───────────────────────────── */
.custom-time-picker {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
}

.ampm-toggle {
  display: flex;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--border);
}

.ampm-btn {
  padding: 7px 9px;
  font-size: 11px;
  font-weight: 600;
  font-family: 'Noto Sans KR', sans-serif;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  line-height: 1;
}

.ampm-btn:first-child {
  border-right: 1px solid var(--border);
}

.ampm-btn.active {
  background: var(--primary);
  color: #fff;
}

.ampm-btn:not(.active):hover {
  background: rgba(234, 88, 12, 0.15);
  color: var(--primary);
}

.time-select {
  padding: 7px 4px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  font-size: 12px;
  font-family: 'Noto Sans KR', sans-serif;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
  appearance: auto;
}

.time-select:hover,
.time-select:focus {
  border-color: var(--primary);
}
</style>