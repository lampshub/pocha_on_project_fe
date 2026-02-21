<template>
  <div class="settings-page">
    <!-- 헤더 -->
    <header class="header">
      <div class="store-name">{{ storeName }}</div>
      <router-link to="/owner/panel" class="back-btn">← 메인으로</router-link>
    </header>

    <!-- 설정 카드 -->
    <div class="settings-view">
      <div class="settings-header">
        <div class="settings-title">설정 관리</div>
        <div class="settings-subtitle">매장 운영 설정</div>
      </div>

      <div class="settings-grid">
        <div class="settings-card" @click="activeModal = 'table'">
          <div class="settings-icon">🪑</div>
          <div class="settings-card-title">테이블 관리</div>
          <div class="settings-card-desc">테이블 추가 및 삭제</div>
        </div>
        <div class="settings-card" @click="activeModal = 'menuRegister'">
          <div class="settings-icon">📝</div>
          <div class="settings-card-title">메뉴 등록</div>
          <div class="settings-card-desc">새로운 메뉴 추가</div>
        </div>
        <div class="settings-card" @click="activeModal = 'menuEdit'">
          <div class="settings-icon">✏️</div>
          <div class="settings-card-title">메뉴 수정</div>
          <div class="settings-card-desc">기존 메뉴 편집 및 삭제</div>
        </div>
        <div class="settings-card" @click="activeModal = 'hours'">
          <div class="settings-icon">🕐</div>
          <div class="settings-card-title">영업시간 관리</div>
          <div class="settings-card-desc">영업 시간 설정</div>
        </div>
        <div class="settings-card" @click="activeModal = 'mypage'">
          <div class="settings-icon">👤</div>
          <div class="settings-card-title">마이페이지</div>
          <div class="settings-card-desc">점주 정보 및 로그아웃</div>
        </div>
      </div>
    </div>

    <!-- ===== 테이블 관리 모달 ===== -->
    <div v-if="activeModal === 'table'" class="modal-overlay" @click.self="activeModal = null">
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-title">테이블 관리</div>
          <button class="close-btn" @click="activeModal = null">×</button>
        </div>
        <div class="modal-body">
          <div class="table-list">
            <div v-for="table in tables" :key="table.number" class="table-item">
              <button class="delete-table-btn" @click="deleteTable(table.number)">×</button>
              <div class="table-item-number">{{ table.number }}번</div>
            </div>
          </div>
          <div class="add-table-section">
            <div class="form-label">테이블 추가</div>
            <div class="add-table-input">
              <input type="number" v-model.number="newTableNumber" class="form-input" placeholder="테이블 번호 입력" />
              <button class="btn btn-primary" @click="addTable">추가</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 메뉴 등록 모달 ===== -->
    <div v-if="activeModal === 'menuRegister'" class="modal-overlay" @click.self="activeModal = null">
      <div class="modal-content large">
        <div class="modal-header">
          <div class="modal-title">메뉴 등록</div>
          <button class="close-btn" @click="activeModal = null">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">메뉴 이미지</label>
            <div class="image-upload-area" :class="{ 'has-image': newMenu.image }" @click="$refs.imageInput.click()">
              <input type="file" ref="imageInput" @change="handleImageUpload" accept="image/*" style="display:none" />
              <img v-if="newMenu.image" :src="newMenu.image" class="preview-image" />
              <div v-else class="upload-placeholder">
                <div class="upload-icon">📸</div>
                <div class="upload-text">클릭하여 이미지 업로드</div>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">카테고리</label>
            <select v-model="newMenu.category" class="form-select">
              <option value="">선택하세요</option>
              <option value="메인">메인</option>
              <option value="사이드">사이드</option>
              <option value="음료">음료</option>
              <option value="주류">주류</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">메뉴 이름</label>
            <input type="text" v-model="newMenu.name" class="form-input" placeholder="메뉴 이름을 입력하세요" />
          </div>
          <div class="form-group">
            <label class="form-label">가격 (원)</label>
            <input type="number" v-model.number="newMenu.price" class="form-input" placeholder="가격을 입력하세요" />
          </div>
          <div class="form-group">
            <label class="form-label">원산지</label>
            <input type="text" v-model="newMenu.origin" class="form-input" placeholder="예: 국내산 돼지고기" />
          </div>
          <div class="form-group">
            <label class="form-label">설명</label>
            <textarea v-model="newMenu.description" class="form-textarea" placeholder="메뉴 설명을 입력하세요"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">옵션</label>
            <div v-for="(option, idx) in newMenu.options" :key="idx" class="option-group">
              <div class="option-header">
                <input type="text" v-model="option.name" class="form-input" placeholder="옵션 이름 (예: 맵기 선택)" />
                <button class="remove-option-btn" @click="newMenu.options.splice(idx, 1)">삭제</button>
              </div>
              <div class="option-items">
                <div v-for="(detail, dIdx) in option.details" :key="dIdx" class="option-item">
                  <input type="text" v-model="detail.name" class="form-input" placeholder="옵션 상세" />
                  <input type="number" v-model.number="detail.price" class="form-input" placeholder="추가금액" />
                  <button class="remove-option-btn" @click="option.details.splice(dIdx, 1)">×</button>
                </div>
              </div>
              <button class="add-option-detail-btn" @click="option.details.push({ name: '', price: 0 })">+ 옵션 추가</button>
            </div>
            <button class="add-option-btn" @click="newMenu.options.push({ name: '', details: [{ name: '', price: 0 }] })">+ 새 옵션 그룹 추가</button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="activeModal = null">취소</button>
          <button class="btn btn-primary" @click="registerMenu">등록</button>
        </div>
      </div>
    </div>

    <!-- ===== 메뉴 수정 목록 모달 ===== -->
    <div v-if="activeModal === 'menuEdit'" class="modal-overlay" @click.self="activeModal = null">
      <div class="modal-content large">
        <div class="modal-header">
          <div class="modal-title">메뉴 수정</div>
          <button class="close-btn" @click="activeModal = null">×</button>
        </div>
        <div class="modal-body">
          <div class="menu-list">
            <div v-for="menu in menuList" :key="menu.id" class="menu-item" @click="openMenuDetail(menu)">
              <img :src="menu.image || 'https://via.placeholder.com/100'" class="menu-image" />
              <div class="menu-info">
                <div class="menu-category">{{ menu.category }}</div>
                <div class="menu-name">{{ menu.name }}</div>
                <div class="menu-price">{{ formatPrice(menu.price) }}원</div>
                <div class="menu-description">{{ menu.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 메뉴 상세 수정 모달 ===== -->
    <div v-if="activeModal === 'menuDetail' && editMenu" class="modal-overlay" @click.self="activeModal = null">
      <div class="modal-content large">
        <div class="modal-header">
          <div class="modal-title">메뉴 상세 수정</div>
          <button class="close-btn" @click="activeModal = null">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">카테고리</label>
            <select v-model="editMenu.category" class="form-select">
              <option value="메인">메인</option>
              <option value="사이드">사이드</option>
              <option value="음료">음료</option>
              <option value="주류">주류</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">메뉴 이름</label>
            <input type="text" v-model="editMenu.name" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">가격 (원)</label>
            <input type="number" v-model.number="editMenu.price" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">원산지</label>
            <input type="text" v-model="editMenu.origin" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">설명</label>
            <textarea v-model="editMenu.description" class="form-textarea"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">옵션</label>
            <div v-for="(option, idx) in editMenu.options" :key="idx" class="option-group">
              <div class="option-header">
                <input type="text" v-model="option.name" class="form-input" placeholder="옵션 이름" />
                <button class="remove-option-btn" @click="editMenu.options.splice(idx, 1)">삭제</button>
              </div>
              <div class="option-items">
                <div v-for="(detail, dIdx) in option.details" :key="dIdx" class="option-item">
                  <input type="text" v-model="detail.name" class="form-input" placeholder="옵션 상세" />
                  <input type="number" v-model.number="detail.price" class="form-input" placeholder="추가금액" />
                  <button class="remove-option-btn" @click="option.details.splice(dIdx, 1)">×</button>
                </div>
              </div>
              <button class="add-option-detail-btn" @click="option.details.push({ name: '', price: 0 })">+ 옵션 추가</button>
            </div>
            <button class="add-option-btn" @click="editMenu.options.push({ name: '', details: [{ name: '', price: 0 }] })">+ 새 옵션 그룹 추가</button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-danger" @click="deleteMenu">삭제</button>
          <button class="btn btn-secondary" @click="activeModal = null">취소</button>
          <button class="btn btn-primary" @click="saveMenuEdit">저장</button>
        </div>
      </div>
    </div>

    <!-- ===== 영업시간 관리 모달 ===== -->
    <div v-if="activeModal === 'hours'" class="modal-overlay" @click.self="activeModal = null">
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-title">영업시간 관리</div>
          <button class="close-btn" @click="activeModal = null">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">영업 시작 시간</label>
            <input type="time" v-model="businessHours.open" class="form-input time-input" />
          </div>
          <div class="form-group">
            <label class="form-label">영업 종료 시간</label>
            <input type="time" v-model="businessHours.close" class="form-input time-input" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="activeModal = null">취소</button>
          <button class="btn btn-primary" @click="saveBusinessHours">확인</button>
        </div>
      </div>
    </div>

    <!-- ===== 마이페이지 모달 ===== -->
    <div v-if="activeModal === 'mypage'" class="modal-overlay" @click.self="activeModal = null">
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-title">마이페이지</div>
          <button class="close-btn" @click="activeModal = null">×</button>
        </div>
        <div class="modal-body">
          <div class="profile-section">
            <div class="profile-item">
              <div class="profile-label">점주명</div>
              <div class="profile-value">{{ ownerInfo.name }}</div>
            </div>
            <div class="profile-item">
              <div class="profile-label">매장명</div>
              <div class="profile-value">{{ ownerInfo.storeName }}</div>
            </div>
            <div class="profile-item">
              <div class="profile-label">전화번호</div>
              <div class="profile-value">
                <span>{{ ownerInfo.phone }}</span>
                <button class="edit-profile-btn" @click="editingPhone = !editingPhone">수정</button>
              </div>
              <div v-if="editingPhone" class="edit-form">
                <div class="edit-form-group">
                  <label>새 전화번호</label>
                  <div class="inline-row">
                    <input v-model="newPhone" type="tel" placeholder="010-0000-0000" @input="formatPhoneNumber" maxlength="13" :disabled="phoneCodeSent" />
                    <button v-if="!phoneCodeSent" class="btn btn-primary btn-sm" @click="sendPhoneVerification">인증</button>
                  </div>
                </div>
                <div v-if="phoneCodeSent && !phoneVerified" class="edit-form-group">
                  <label>인증 코드</label>
                  <div class="inline-row">
                    <input v-model="phoneVerificationCode" type="text" placeholder="인증 코드 입력" maxlength="6" />
                    <button class="btn btn-primary btn-sm" @click="verifyPhoneCode">확인</button>
                  </div>
                </div>
                <div class="edit-form-actions">
                  <button v-if="phoneVerified" class="btn btn-primary btn-sm" @click="savePhone">변경</button>
                  <button class="btn btn-secondary btn-sm" @click="cancelPhoneEdit">취소</button>
                </div>
              </div>
            </div>
            <div class="profile-item">
              <div class="profile-label">비밀번호</div>
              <div class="profile-value">
                <span>••••••••</span>
                <button class="edit-profile-btn" @click="editingPassword = !editingPassword">수정</button>
              </div>
              <div v-if="editingPassword" class="edit-form">
                <div class="edit-form-group">
                  <label>기존 비밀번호</label>
                  <input v-model="oldPassword" type="password" placeholder="기존 비밀번호 입력" />
                </div>
                <div class="edit-form-group">
                  <label>새 비밀번호</label>
                  <input v-model="newPassword" type="password" placeholder="새 비밀번호 입력" />
                </div>
                <div class="edit-form-actions">
                  <button class="btn btn-primary btn-sm" @click="savePassword">변경</button>
                  <button class="btn btn-secondary btn-sm" @click="cancelPasswordEdit">취소</button>
                </div>
              </div>
            </div>
            <div class="profile-item">
              <div class="profile-label">이메일</div>
              <div class="profile-value">{{ ownerInfo.email }}</div>
            </div>
            <div class="profile-item">
              <div class="profile-label">사업자등록번호</div>
              <div class="profile-value">{{ ownerInfo.businessNumber }}</div>
            </div>
          </div>
          <button class="logout-btn" @click="logout">로그아웃</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
// import { tableApi, menuApi, businessApi, ownerApi } from '@/api'  ← 서버 연동 시

const router = useRouter()
const storeName = ref('강남 본점')
const activeModal = ref(null)

// ── 테이블 ──
const tables = ref([
  { number: 1 }, { number: 2 }, { number: 3 },
  { number: 4 }, { number: 5 }, { number: 6 },
])
const newTableNumber = ref(null)

// ── 메뉴 ──
const menuList = ref([
  { id: 1, name: '불고기', category: '메인', price: 18000, origin: '국내산 소고기', description: '달콤하고 맛있는 불고기입니다', image: 'https://via.placeholder.com/100', options: [{ name: '맵기 선택', details: [{ name: '순한맛', price: 0 }, { name: '보통맛', price: 0 }, { name: '매운맛', price: 0 }] }] },
  { id: 2, name: '김치찌개', category: '메인', price: 9000, origin: '국내산 돼지고기', description: '얼큰한 김치찌개', image: 'https://via.placeholder.com/100', options: [] },
  { id: 3, name: '소주', category: '주류', price: 5000, origin: '국내산', description: '참이슬', image: 'https://via.placeholder.com/100', options: [] },
])
const newMenu = reactive({ image: null, category: '', name: '', price: 0, origin: '', description: '', options: [] })
const editMenu = ref(null)

// ── 영업시간 ──
const businessHours = reactive({ open: '10:00', close: '22:00' })

// ── 마이페이지 ──
const ownerInfo = reactive({ name: '김점주', storeName: '강남 본점', phone: '010-1234-5678', email: 'owner@example.com', businessNumber: '123-45-67890', password: 'mypassword123' })
const editingPhone = ref(false)
const editingPassword = ref(false)
const newPhone = ref('')
const phoneVerificationCode = ref('')
const phoneCodeSent = ref(false)
const phoneVerified = ref(false)
const generatedPhoneCode = ref('')
const oldPassword = ref('')
const newPassword = ref('')

/* ── 서버 연동 시 아래 주석 해제 ──
onMounted(async () => {
  try {
    const [tablesRes, menusRes, hoursRes, profileRes] = await Promise.all([
      tableApi.getAll(),
      menuApi.getAll(),
      businessApi.getHours(),
      ownerApi.getProfile(),
    ])
    tables.value = tablesRes.data
    menuList.value = menusRes.data
    Object.assign(businessHours, hoursRes.data)
    Object.assign(ownerInfo, profileRes.data)
  } catch (e) {
    console.error('데이터 로딩 실패:', e)
  }
})
*/

const formatPrice = (price) => (price ?? 0).toLocaleString('ko-KR')

// ── 테이블 ──
const addTable = () => {
  if (!newTableNumber.value) return alert('테이블 번호를 입력하세요.')
  if (tables.value.find(t => t.number === newTableNumber.value)) return alert('이미 존재하는 테이블 번호입니다.')
  // await tableApi.add({ number: newTableNumber.value })  ← 서버 연동 시
  tables.value.push({ number: newTableNumber.value })
  tables.value.sort((a, b) => a.number - b.number)
  newTableNumber.value = null
  alert('테이블이 추가되었습니다.')
}

const deleteTable = (num) => {
  if (!confirm(`${num}번 테이블을 삭제하시겠습니까?`)) return
  // await tableApi.delete(num)  ← 서버 연동 시
  tables.value = tables.value.filter(t => t.number !== num)
}

// ── 메뉴 등록 ──
const handleImageUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => { newMenu.image = ev.target.result }
  reader.readAsDataURL(file)
}

const registerMenu = () => {
  if (!newMenu.name || !newMenu.category || !newMenu.price) return alert('필수 항목을 모두 입력하세요.')
  // await menuApi.create(newMenu)  ← 서버 연동 시
  menuList.value.push({ id: Date.now(), ...JSON.parse(JSON.stringify(newMenu)) })
  Object.assign(newMenu, { image: null, category: '', name: '', price: 0, origin: '', description: '', options: [] })
  activeModal.value = null
  alert('메뉴가 등록되었습니다.')
}

// ── 메뉴 수정 ──
const openMenuDetail = (menu) => {
  editMenu.value = JSON.parse(JSON.stringify(menu))
  activeModal.value = 'menuDetail'
}

const saveMenuEdit = () => {
  const idx = menuList.value.findIndex(m => m.id === editMenu.value.id)
  if (idx === -1) return
  // await menuApi.update(editMenu.value.id, editMenu.value)  ← 서버 연동 시
  menuList.value[idx] = { ...editMenu.value }
  activeModal.value = null
  alert('메뉴가 수정되었습니다.')
}

const deleteMenu = () => {
  if (!confirm('정말 이 메뉴를 삭제하시겠습니까?')) return
  // await menuApi.delete(editMenu.value.id)  ← 서버 연동 시
  menuList.value = menuList.value.filter(m => m.id !== editMenu.value.id)
  activeModal.value = null
  alert('메뉴가 삭제되었습니다.')
}

// ── 영업시간 ──
import axios from 'axios'

const saveBusinessHours = async () => {
  const storeId = localStorage.getItem('storeId')
  const token = localStorage.getItem('accessToken')

  const openAt  = businessHours.open  + ':00'
  const closeAt = businessHours.close + ':00'

  try {
    await axios.patch(
      `${process.env.VUE_APP_API_BASE_URL}/store/${storeId}/updateTime`,
      { openAt, closeAt },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    alert('영업시간이 저장되었습니다.')
    activeModal.value = null
  } catch (e) {
    alert(e.response?.data?.errorMessage || '저장 실패')
  }

}

// ── 전화번호 ──
const formatPhoneNumber = (e) => {
  let v = e.target.value.replace(/[^0-9]/g, '')
  if (v.length <= 3) newPhone.value = v
  else if (v.length <= 7) newPhone.value = v.slice(0, 3) + '-' + v.slice(3)
  else newPhone.value = v.slice(0, 3) + '-' + v.slice(3, 7) + '-' + v.slice(7, 11)
}

const sendPhoneVerification = () => {
  if (!/^010-\d{4}-\d{4}$/.test(newPhone.value)) return alert('형식이 올바르지 않습니다.')
  // await ownerApi.sendVerification(newPhone.value)  ← 서버 연동 시
  generatedPhoneCode.value = Math.floor(100000 + Math.random() * 900000).toString()
  phoneCodeSent.value = true
  alert(`인증 코드 발송 (개발용: ${generatedPhoneCode.value})`)
}

const verifyPhoneCode = () => {
  if (phoneVerificationCode.value !== generatedPhoneCode.value) return alert('인증 코드가 일치하지 않습니다.')
  phoneVerified.value = true
  alert('인증 완료')
}

const savePhone = () => {
  // await ownerApi.updatePhone({ phone: newPhone.value })  ← 서버 연동 시
  ownerInfo.phone = newPhone.value
  cancelPhoneEdit()
  alert('전화번호가 변경되었습니다.')
}

const cancelPhoneEdit = () => {
  editingPhone.value = false
  newPhone.value = ''
  phoneVerificationCode.value = ''
  phoneCodeSent.value = false
  phoneVerified.value = false
  generatedPhoneCode.value = ''
}

// ── 비밀번호 ──
const savePassword = () => {
  if (!oldPassword.value || !newPassword.value) return alert('모든 항목을 입력하세요.')
  if (oldPassword.value !== ownerInfo.password) return alert('기존 비밀번호가 일치하지 않습니다.')
  // await ownerApi.updatePassword({ old: oldPassword.value, new: newPassword.value })  ← 서버 연동 시
  ownerInfo.password = newPassword.value
  cancelPasswordEdit()
  alert('비밀번호가 변경되었습니다.')
}

const cancelPasswordEdit = () => {
  editingPassword.value = false
  oldPassword.value = ''
  newPassword.value = ''
}

const logout = () => {
  if (!confirm('로그아웃 하시겠습니까?')) return
  // 서버 연동 시: 토큰 삭제 후 로그인 페이지로 이동
  router.push('/')
}
</script>

<style scoped>
@import "@/assets/css/OwnerSettings.css";
</style>