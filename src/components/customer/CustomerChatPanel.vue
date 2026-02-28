<!--
  CustomerChatPanel.vue
  - 1:1 채팅 슬라이드 패널
  - 실시간 메시지 표시 (내 메시지 / 상대 메시지 구분)
  - 메시지 입력 및 전송
-->
<template>
  <div class="slide-panel" :class="{ open: show }">
    <div class="panel-header">
      <h2 class="panel-title">{{ selectedTable }}번 테이블 채팅</h2>
      <button class="close-btn" @click="$emit('close')">✕</button>
    </div>
    <div class="panel-content chat-content">
      <div class="chat-messages" ref="chatMessagesEl">
        <div
          v-for="(msg, idx) in chatMessages"
          :key="idx"
          :class="['chat-message', msg.isMine ? 'mine' : 'theirs']"
        >
          <div class="message-bubble">
            <div class="message-text">{{ msg.text }}</div>
            <div class="message-time">{{ msg.time }}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="panel-footer chat-footer">
      <input
        type="text"
        class="chat-input"
        :value="chatInput"
        @input="$emit('update:chatInput', $event.target.value)"
        @keyup.enter="$emit('send')"
        placeholder="메시지를 입력하세요..."
      />
      <button class="send-btn" @click="$emit('send')">전송</button>
    </div>
  </div>
</template>

<script setup>
import { ref, defineExpose } from 'vue'

defineProps({
  show: { type: Boolean, default: false },
  selectedTable: { type: Number, default: null },
  chatMessages: { type: Array, default: () => [] },
  chatInput: { type: String, default: '' },
})
defineEmits(['close', 'send', 'update:chatInput'])

const chatMessagesEl = ref(null)
defineExpose({ chatMessagesEl })
</script>
