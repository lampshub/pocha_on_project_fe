<!--
  MyPageModal.vue
  마이페이지 모달 - 점주 정보 조회, 비밀번호 변경, 로그아웃
-->
<template>
  <!-- 마이페이지 모달 오버레이 -->
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <!-- 모달 헤더 -->
      <div class="modal-header">
        <div class="modal-title">마이페이지</div>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      <div class="modal-body">
        <!-- 점주 프로필 정보 섹션 -->
        <div class="profile-section">
          <!-- 점주명 -->
          <div class="profile-item">
            <div class="profile-label">점주명</div>
            <div class="profile-value">{{ ownerInfo.name }}</div>
          </div>
          <!-- 이메일 -->
          <div class="profile-item">
            <div class="profile-label">이메일</div>
            <div class="profile-value">{{ ownerInfo.email }}</div>
          </div>
          <!-- 전화번호 -->
          <div class="profile-item">
            <div class="profile-label">전화번호</div>
            <div class="profile-value">{{ ownerInfo.phone }}</div>
          </div>
          <!-- 사업자등록번호 -->
          <div class="profile-item">
            <div class="profile-label">사업자등록번호</div>
            <div class="profile-value">{{ ownerInfo.businessNumber }}</div>
          </div>

          <!-- 비밀번호 수정 -->
          <div class="profile-item">
            <div class="profile-label">비밀번호</div>
            <div class="profile-value">
              <span>••••••••</span>
              <button class="edit-profile-btn" @click="$emit('update:editingPassword', !editingPassword)">수정</button>
            </div>
            <!-- 비밀번호 수정 폼 -->
            <div v-if="editingPassword" class="edit-form">
              <div class="edit-form-group">
                <label>기존 비밀번호</label>
                <div style="position:relative;">
                  <input :value="oldPassword"
                    @input="$emit('update:oldPassword', $event.target.value)"
                    :type="showOldPassword ? 'text' : 'password'"
                    placeholder="기존 비밀번호 입력"
                    style="width:100%; padding-right:48px;" />
                  <button type="button" @click="$emit('update:showOldPassword', !showOldPassword)"
                    style="position:absolute; right:6px; top:50%; transform:translateY(-50%); padding:2px 6px; font-size:11px; background:#3f3f46; color:#a1a1aa; border:none; border-radius:4px; cursor:pointer;">
                    {{ showOldPassword ? '숨김' : '보기' }}
                  </button>
                </div>
              </div>
              <div class="edit-form-group">
                <label>새 비밀번호</label>
                <div style="position:relative;">
                  <input :value="newPassword"
                    @input="$emit('update:newPassword', $event.target.value)"
                    :type="showNewPassword ? 'text' : 'password'"
                    placeholder="새 비밀번호 (8자 이상)"
                    style="width:100%; padding-right:48px;" />
                  <button type="button" @click="$emit('update:showNewPassword', !showNewPassword)"
                    style="position:absolute; right:6px; top:50%; transform:translateY(-50%); padding:2px 6px; font-size:11px; background:#3f3f46; color:#a1a1aa; border:none; border-radius:4px; cursor:pointer;">
                    {{ showNewPassword ? '숨김' : '보기' }}
                  </button>
                </div>
              </div>
              <!-- 변경/취소 버튼 -->
              <div class="edit-form-actions">
                <button class="btn btn-primary btn-sm" style="padding-top:4px; padding-bottom:4px;"
                  @click="$emit('save-password')">변경</button>
                <button class="btn btn-secondary btn-sm" style="padding-top:4px; padding-bottom:4px;"
                  @click="$emit('cancel-password-edit')">취소</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 로그아웃 버튼 -->
        <button class="logout-btn" @click="$emit('logout')">로그아웃</button>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Props:
 * - show: 모달 표시 여부
 * - ownerInfo: 점주 정보 객체 { name, email, phone, businessNumber }
 * - editingPassword: 비밀번호 수정 모드 여부
 * - oldPassword: 기존 비밀번호
 * - newPassword: 새 비밀번호
 * - showOldPassword: 기존 비밀번호 표시 여부
 * - showNewPassword: 새 비밀번호 표시 여부
 */
defineProps({
  show: { type: Boolean, required: true },
  ownerInfo: { type: Object, required: true },
  editingPassword: { type: Boolean, default: false },
  oldPassword: { type: String, default: '' },
  newPassword: { type: String, default: '' },
  showOldPassword: { type: Boolean, default: false },
  showNewPassword: { type: Boolean, default: false },
})

/**
 * Emits:
 * - close: 모달 닫기
 * - save-password: 비밀번호 변경 요청
 * - cancel-password-edit: 비밀번호 수정 취소
 * - logout: 로그아웃
 * - update:editingPassword: 비밀번호 수정 모드 토글
 * - update:oldPassword: 기존 비밀번호 값 변경
 * - update:newPassword: 새 비밀번호 값 변경
 * - update:showOldPassword: 기존 비밀번호 표시 토글
 * - update:showNewPassword: 새 비밀번호 표시 토글
 */
defineEmits([
  'close',
  'save-password',
  'cancel-password-edit',
  'logout',
  'update:editingPassword',
  'update:oldPassword',
  'update:newPassword',
  'update:showOldPassword',
  'update:showNewPassword',
])
</script>
