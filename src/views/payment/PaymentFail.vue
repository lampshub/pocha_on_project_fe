<template>
  <div class="payment-result-page">
    <div class="result-fail">
      <div class="result-icon">❌</div>
      <h2>결제에 실패했습니다</h2>

      <div class="result-info" v-if="code || message">
        <div class="info-row" v-if="code">
          <span class="info-label">에러 코드</span>
          <span class="info-value">{{ code }}</span>
        </div>
        <div class="info-row" v-if="message">
          <span class="info-label">에러 메시지</span>
          <span class="info-value">{{ message }}</span>
        </div>
      </div>

      <button class="done-btn" @click="goBack">돌아가기</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const code = ref('')
const message = ref('')

onMounted(() => {
  code.value = route.query.code || ''
  message.value = route.query.message || '알 수 없는 오류가 발생했습니다.'
})

const goBack = () => router.back()
</script>

<style scoped>
.payment-result-page {
  min-height: 100vh;
  background: #0f0f1a;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #fff;
}

.result-fail {
  text-align: center;
  max-width: 420px;
  width: 100%;
}

.result-icon { font-size: 64px; margin-bottom: 16px; }
.result-fail h2 { color: #ef4444; margin-bottom: 24px; }

.result-info {
  background: #1a1a2e;
  border: 1px solid #2a2a3e;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  text-align: left;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #2a2a3e;
  font-size: 14px;
}

.info-row:last-child { border-bottom: none; }
.info-label { color: #888; }
.info-value { font-weight: 600; color: #ccc; }

.done-btn {
  width: 100%;
  padding: 16px;
  background: #ea580c;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}
</style>