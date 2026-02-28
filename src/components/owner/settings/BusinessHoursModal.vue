<!--
  BusinessHoursModal.vue
  영업시간 관리 모달 - 오전/오후, 시, 분 커스텀 피커
-->
<template>
  <!-- 영업시간 관리 모달 오버레이 -->
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <!-- 모달 헤더 -->
      <div class="modal-header">
        <div class="modal-title">영업시간 관리</div>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      <div class="modal-body">
        <!-- 영업 시작 시간 -->
        <div class="form-group">
          <label class="form-label">영업 시작 시간</label>
          <div class="custom-time-picker">
            <!-- 오전/오후 토글 -->
            <div class="ampm-toggle">
              <button type="button" :class="['ampm-btn', { active: hoursOpenAmPm === 'AM' }]"
                @click="$emit('update:hoursOpenAmPm', 'AM')">오전</button>
              <button type="button" :class="['ampm-btn', { active: hoursOpenAmPm === 'PM' }]"
                @click="$emit('update:hoursOpenAmPm', 'PM')">오후</button>
            </div>
            <!-- 시 선택 -->
            <select class="time-select" :value="hoursOpenHour"
              @change="$emit('update:hoursOpenHour', Number($event.target.value))">
              <option v-for="h in timeHours" :key="h" :value="h">{{ h }}시</option>
            </select>
            <!-- 분 선택 -->
            <select class="time-select" :value="hoursOpenMinute"
              @change="$emit('update:hoursOpenMinute', Number($event.target.value))">
              <option v-for="m in timeMinutes" :key="m" :value="m">{{ String(m).padStart(2,'0') }}분</option>
            </select>
          </div>
        </div>

        <!-- 영업 종료 시간 -->
        <div class="form-group">
          <label class="form-label">영업 종료 시간</label>
          <div class="custom-time-picker">
            <!-- 오전/오후 토글 -->
            <div class="ampm-toggle">
              <button type="button" :class="['ampm-btn', { active: hoursCloseAmPm === 'AM' }]"
                @click="$emit('update:hoursCloseAmPm', 'AM')">오전</button>
              <button type="button" :class="['ampm-btn', { active: hoursCloseAmPm === 'PM' }]"
                @click="$emit('update:hoursCloseAmPm', 'PM')">오후</button>
            </div>
            <!-- 시 선택 -->
            <select class="time-select" :value="hoursCloseHour"
              @change="$emit('update:hoursCloseHour', Number($event.target.value))">
              <option v-for="h in timeHours" :key="h" :value="h">{{ h }}시</option>
            </select>
            <!-- 분 선택 -->
            <select class="time-select" :value="hoursCloseMinute"
              @change="$emit('update:hoursCloseMinute', Number($event.target.value))">
              <option v-for="m in timeMinutes" :key="m" :value="m">{{ String(m).padStart(2,'0') }}분</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 모달 푸터 -->
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')">취소</button>
        <button class="btn btn-primary" @click="$emit('save')">저장</button>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Props:
 * - show: 모달 표시 여부
 * - hoursOpenAmPm: 영업 시작 오전/오후 ('AM' | 'PM')
 * - hoursOpenHour: 영업 시작 시 (1~12)
 * - hoursOpenMinute: 영업 시작 분
 * - hoursCloseAmPm: 영업 종료 오전/오후 ('AM' | 'PM')
 * - hoursCloseHour: 영업 종료 시 (1~12)
 * - hoursCloseMinute: 영업 종료 분
 * - timeHours: 시 선택지 배열 [1..12]
 * - timeMinutes: 분 선택지 배열 [0, 5, 10, ...]
 */
defineProps({
  show: { type: Boolean, required: true },
  hoursOpenAmPm: { type: String, required: true },
  hoursOpenHour: { type: Number, required: true },
  hoursOpenMinute: { type: Number, required: true },
  hoursCloseAmPm: { type: String, required: true },
  hoursCloseHour: { type: Number, required: true },
  hoursCloseMinute: { type: Number, required: true },
  timeHours: { type: Array, required: true },
  timeMinutes: { type: Array, required: true },
})

/**
 * Emits:
 * - close: 모달 닫기
 * - save: 영업시간 저장
 * - update:hoursOpenAmPm: 시작 오전/오후 변경
 * - update:hoursOpenHour: 시작 시 변경
 * - update:hoursOpenMinute: 시작 분 변경
 * - update:hoursCloseAmPm: 종료 오전/오후 변경
 * - update:hoursCloseHour: 종료 시 변경
 * - update:hoursCloseMinute: 종료 분 변경
 */
defineEmits([
  'close',
  'save',
  'update:hoursOpenAmPm',
  'update:hoursOpenHour',
  'update:hoursOpenMinute',
  'update:hoursCloseAmPm',
  'update:hoursCloseHour',
  'update:hoursCloseMinute',
])
</script>
