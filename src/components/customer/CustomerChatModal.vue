<!--
  CustomerChatModal.vue
  - 채팅/선물 대상 테이블 선택 모달
  - 현재 사용 중인 다른 테이블 목록 표시
  - 기존 대화방 목록 (빠른 재입장)
  - 채팅 시작 / 선물하기 버튼
-->
<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="chat-modal-wrapper">
      <div class="modal-content table-select-modal">
        <div class="modal-header">
          <h3>테이블 선택</h3>
          <button
            v-if="presentPendingList.length > 0"
            class="present-header-icon"
            @click="$emit('open-present-from-header')"
          >
            🎁
            <span class="present-header-badge">{{ presentPendingList.length }}</span>
          </button>
          <button class="close-btn" @click="$emit('close')">×</button>
        </div>

        <div class="modal-body">
          <div v-if="activeTables.length === 0" class="no-tables">
            현재 대화 가능한 테이블이 없습니다.
          </div>
          <div v-else class="table-grid">
            <div
              v-for="t in activeTables"
              :key="t"
              :class="['table-item', { selected: selectedTable?.tableNum === t }]"
              @click="$emit('select-table', t)"
            >
              <span v-if="getUnreadCountForTable(t) > 0" class="table-unread-badge">
                {{ getUnreadCountForTable(t) }}
              </span>
              <span class="table-name">{{ t }}번</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button
            class="action-btn action-btn-primary"
            :disabled="!selectedTable"
            @click="$emit('open-chat')"
          >채팅 시작하기</button>
          <button
            class="action-btn action-btn-primary"
            :disabled="!selectedTable"
            @click="$emit('open-present')"
          >선물하기</button>
          <button class="action-btn action-btn-secondary" @click="$emit('close')">취소</button>
        </div>
      </div>

      <div v-if="myChatRooms.length > 0" class="existing-rooms-section">
        <div class="existing-rooms-label">💬 대화 중인 채팅방</div>
        <div class="existing-rooms-list">
          <div
            v-for="room in myChatRooms"
            :key="room.id"
            class="existing-room-item"
            @click="$emit('open-chat-room', room.otherTableNum)"
          >
            <div class="room-item-left">
              <div class="room-table-avatar">{{ room.otherTableNum }}</div>
              <div class="room-item-info">
                <span class="room-table-num">{{ room.otherTableNum }}번 테이블</span>
                <span class="room-last-msg">{{ room.lastMessage || '대화를 시작해보세요' }}</span>
              </div>
            </div>
            <span v-if="room.unreadCount > 0" class="room-unread-badge">{{ room.unreadCount }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: { type: Boolean, default: false },
  activeTables: { type: Array, default: () => [] },
  selectedTable: { type: Object, default: null },
  myChatRooms: { type: Array, default: () => [] },
  presentPendingList: { type: Array, default: () => [] },
  getUnreadCountForTable: { type: Function, required: true },
})
defineEmits(['close', 'select-table', 'open-chat', 'open-present', 'open-chat-room', 'open-present-from-header'])
</script>

<style scoped>
.table-select-modal {
  width: 520px !important;
  max-width: 92vw !important;
  padding: 24px !important;
}

.modal-footer {
  display: flex !important;
  gap: 10px;
  padding: 14px 20px 20px;
  border-top: 1px solid #3f3f46;
}

.modal-footer .action-btn {
  flex: 1 !important;
  min-width: 0;
}

.modal-footer .action-btn-primary {
  height: 46px;
  padding: 0 12px;
  background-color: var(--primary, #ea580c);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
}

.modal-footer .action-btn-secondary {
  height: 46px;
  padding: 0 12px;
  background: transparent;
  border: 2px solid rgba(255,255,255,0.35);
  border-radius: 12px;
  color: rgba(255,255,255,0.65);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
