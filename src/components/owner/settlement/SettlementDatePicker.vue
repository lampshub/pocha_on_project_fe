<!-- 날짜 선택 바 컴포넌트 (연/월/일 셀렉터 + 이전/다음/오늘 버튼) -->
<template>
  <div class="date-picker-bar">
    <!-- 이전 날짜 버튼 -->
    <button class="date-nav-btn" @click="$emit('go-prev')">
      <span class="nav-arrow">&#8249;</span>
    </button>

    <!-- 연/월/일 셀렉터 -->
    <div class="date-selector">
      <!-- 연도 -->
      <div class="date-select-wrap">
        <select :value="currentYear" @change="$emit('update:currentYear', Number($event.target.value)); $emit('date-change')" class="date-select">
          <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
        </select>
        <span class="date-select-label">년</span>
      </div>
      <div class="date-divider">&middot;</div>

      <!-- 월 -->
      <div class="date-select-wrap">
        <select :value="currentMonth" @change="$emit('update:currentMonth', Number($event.target.value)); $emit('date-change')" class="date-select">
          <option v-for="m in 12" :key="m" :value="m">{{ String(m).padStart(2, '0') }}</option>
        </select>
        <span class="date-select-label">월</span>
      </div>
      <div class="date-divider">&middot;</div>

      <!-- 일 -->
      <div class="date-select-wrap">
        <select :value="currentDay" @change="$emit('update:currentDay', Number($event.target.value)); $emit('date-change')" class="date-select">
          <option :value="0">전체</option>
          <option v-for="d in daysInCurrentMonth" :key="d" :value="d">{{ String(d).padStart(2, '0') }}</option>
        </select>
        <span class="date-select-label" v-if="currentDay !== 0">일</span>
      </div>
    </div>

    <!-- 다음 날짜 버튼 -->
    <button class="date-nav-btn" @click="$emit('go-next')">
      <span class="nav-arrow">&#8250;</span>
    </button>

    <!-- 오늘 버튼 -->
    <button class="date-today-btn" @click="$emit('go-today')">오늘</button>
  </div>
</template>

<script setup>
/**
 * 날짜 선택 바 컴포넌트
 * - 부모로부터 연/월/일 값을 받아 표시
 * - 변경 시 v-model 패턴으로 부모에 전달
 */
defineProps({
  /** 선택된 연도 */
  currentYear: { type: Number, required: true },
  /** 선택된 월 (1~12) */
  currentMonth: { type: Number, required: true },
  /** 선택된 일 (0 = 전체) */
  currentDay: { type: Number, required: true },
  /** 연도 옵션 배열 */
  yearOptions: { type: Array, required: true },
  /** 현재 월의 총 일수 */
  daysInCurrentMonth: { type: Number, required: true },
})

defineEmits([
  'update:currentYear',
  'update:currentMonth',
  'update:currentDay',
  'go-prev',
  'go-next',
  'go-today',
  'date-change',
])
</script>
