<template>
  <div class="settings-page">
    <header class="header">
      <div class="store-name">{{ storeName }}</div>
      <router-link to="/owner/panel" class="back-btn">← 메인으로</router-link>
    </header>

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
            <div v-for="table in tables" :key="table.id" class="table-item">
              <button class="delete-table-btn" @click="deleteTable(table.id, table.number)">×</button>
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
            <div class="image-upload-area" :class="{ 'has-image': newMenu.imagePreview }" @click="$refs.imageInput.click()">
              <input type="file" ref="imageInput" @change="handleImageUpload" accept="image/*" style="display:none" />
              <img v-if="newMenu.imagePreview" :src="newMenu.imagePreview" class="preview-image" />
              <div v-else class="upload-placeholder">
                <div class="upload-icon">📸</div>
                <div class="upload-text">클릭하여 이미지 업로드</div>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">카테고리</label>
            <select v-model="newMenu.categoryId" class="form-select">
              <option :value="null" disabled>선택하세요</option>
              <option v-for="cat in categories" :key="cat.categoryId" :value="cat.categoryId">
                {{ cat.categoryName }}
              </option>
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

          <!-- 옵션 섹션 -->
          <div class="form-group">
            <label class="form-label">옵션</label>
            <div v-for="(option, oIdx) in newMenu.options" :key="oIdx" class="option-group">
              <div class="option-header">
                <input type="text" v-model="option.optionName" class="form-input" placeholder="옵션 그룹명 (예: 맵기 선택)" />
                <button class="remove-option-btn" @click="newMenu.options.splice(oIdx, 1)">삭제</button>
              </div>
              <div class="option-items">
                <div v-for="(detail, dIdx) in option.details" :key="dIdx" class="option-item">
                  <input type="text" v-model="detail.optionDetailName" class="form-input" placeholder="옵션 상세명" />
                  <input type="number" v-model.number="detail.optionDetailPrice" class="form-input" placeholder="추가금액" />
                  <button class="remove-option-btn" @click="option.details.splice(dIdx, 1)">×</button>
                </div>
              </div>
              <button class="add-option-detail-btn" @click="option.details.push({ optionDetailName: '', optionDetailPrice: 0 })">+ 옵션 상세 추가</button>
            </div>
            <button class="add-option-btn" @click="newMenu.options.push({ optionName: '', details: [{ optionDetailName: '', optionDetailPrice: 0 }] })">+ 옵션 추가</button>
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
            <div v-for="menu in menuList" :key="menu.menuId" class="menu-item" @click="openMenuDetail(menu)">
              <img :src="menu.imageUrl || 'https://via.placeholder.com/100'" class="menu-image" />
              <div class="menu-info">
                <div class="menu-name">{{ menu.menuName }}</div>
                <div class="menu-price">{{ formatPrice(menu.menuPrice) }}원</div>
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
            <select v-model="editMenu.categoryId" class="form-select">
              <option :value="null" disabled>선택하세요</option>
              <option v-for="cat in categories" :key="cat.categoryId" :value="cat.categoryId">
                {{ cat.categoryName }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">메뉴 이름</label>
            <input type="text" v-model="editMenu.menuName" class="form-input" />
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
            <textarea v-model="editMenu.explanation" class="form-textarea"></textarea>
          </div>

          <!-- 옵션 아코디언 -->
          <div class="form-group">
            <label class="form-label">옵션</label>

            <div v-for="option in editMenu.options" :key="option.optionId" class="option-group">
              <!-- 옵션 헤더 - 클릭하면 펼침/접음 -->
              <div class="option-header accordion-header" @click="toggleOption(option.optionId)">
                <span class="option-title">{{ option.optionName || '(이름 없음)' }}</span>
                <span class="accordion-arrow">{{ expandedOptions.includes(option.optionId) ? '▲' : '▼' }}</span>
                <button class="remove-option-btn" @click.stop="deleteOption(option.optionId)">삭제</button>
              </div>

              <!-- 펼쳐진 상태 -->
              <div v-if="expandedOptions.includes(option.optionId)" class="accordion-body">
                <!-- 옵션명 수정 -->
                <div class="option-name-edit">
                  <input type="text" v-model="option.optionName" class="form-input" placeholder="옵션 그룹명" />
                  <button class="btn btn-secondary btn-sm" @click="updateOption(option)">저장</button>
                </div>

                <!-- 옵션 상세 목록 -->
                <div class="option-items">
                  <div v-for="detail in option.details" :key="detail.optionDetailId" class="option-item">
                    <input type="text" v-model="detail.optionDetailName" class="form-input" placeholder="옵션 상세명" />
                    <input type="number" v-model.number="detail.optionDetailPrice" class="form-input" placeholder="추가금액" />
                    <button class="btn btn-secondary btn-sm" @click="updateOptionDetail(detail)">저장</button>
                    <button class="remove-option-btn" @click="deleteOptionDetail(detail.optionDetailId, option.optionId)">×</button>
                  </div>
                </div>
                <button class="add-option-detail-btn" @click="addOptionDetail(option)">+ 옵션 상세 추가</button>
              </div>
            </div>

            <!-- 새 옵션 그룹 추가 -->
            <button class="add-option-btn" @click="addOption">+ 옵션 추가</button>
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
              <div class="profile-label">이메일</div>
              <div class="profile-value">{{ ownerInfo.email }}</div>
            </div>
            <div class="profile-item">
              <div class="profile-label">전화번호</div>
              <div class="profile-value">{{ ownerInfo.phone }}</div>
            </div>
            <div class="profile-item">
              <div class="profile-label">사업자등록번호</div>
              <div class="profile-value">{{ ownerInfo.businessNumber }}</div>
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
                  <input v-model="newPassword" type="password" placeholder="새 비밀번호 (8자 이상)" />
                </div>
                <div class="edit-form-actions">
                  <button class="btn btn-primary btn-sm" @click="savePassword">변경</button>
                  <button class="btn btn-secondary btn-sm" @click="cancelPasswordEdit">취소</button>
                </div>
              </div>
            </div>
          </div>
          <button class="logout-btn" @click="logout">로그아웃</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/axios.js'

const router = useRouter()
const storeName = ref(localStorage.getItem('currentStoreName') || '매장')
const activeModal = ref(null)

// ── 테이블 ──
const tables = ref([])
const newTableNumber = ref(null)

// ── 메뉴 ──
const menuList = ref([])
const categories = ref([])
const newMenu = reactive({
  imageFile: null,
  imagePreview: null,
  categoryId: null,
  name: '',
  price: 0,
  origin: '',
  description: '',
  options: [], // [{ optionName, details: [{ optionDetailName, optionDetailPrice }] }]
})
const editMenu = ref(null)
const expandedOptions = ref([]) // 수정 화면에서 펼쳐진 optionId 목록

// ── 영업시간 ──
const businessHours = reactive({ open: '10:00', close: '22:00' })

// ── 마이페이지 ──
const ownerInfo = reactive({ name: '', email: '', phone: '', businessNumber: '' })
const editingPassword = ref(false)
const oldPassword = ref('')
const newPassword = ref('')

// ── 초기 로딩 ──
onMounted(async () => {
  await Promise.all([loadTables(), loadMenus(), loadCategories(), loadMyPage()])
})

const loadTables = async () => {
  try {
    const res = await api.get('/customertable/gettablelist')
    tables.value = res.data.map(t => ({ id: t.customerTableId, number: t.tableNum }))
  } catch (e) {
    console.error('테이블 목록 로딩 실패:', e)
  }
}

const loadMenus = async () => {
  try {
    const res = await api.get('/view/all')
    // 응답: [{ menuId, menuName, menuPrice, imageUrl }]
    menuList.value = res.data
  } catch (e) {
    console.error('메뉴 목록 로딩 실패:', e)
  }
}

const loadCategories = async () => {
  try {
    const res = await api.get('/view/category')
    // 응답: [{ categoryId, categoryName, mappingMenuList }]
    categories.value = res.data
  } catch (e) {
    console.error('카테고리 로딩 실패:', e)
  }
}

const loadMyPage = async () => {
  try {
    const res = await api.get('/owner/mypage')
    ownerInfo.name = res.data.ownerName
    ownerInfo.email = res.data.ownerEmail
    ownerInfo.phone = res.data.phoneNumber
    ownerInfo.businessNumber = res.data.BusinessRegistrationNumber
  } catch (e) {
    console.error('마이페이지 로딩 실패:', e)
  }
}

const formatPrice = (price) => (price ?? 0).toLocaleString('ko-KR')

// ── 테이블 ──
const addTable = async () => {
  if (!newTableNumber.value) return alert('테이블 번호를 입력하세요.')
  try {
    await api.post('/customertable/create', { tableNum: newTableNumber.value })
    alert('테이블이 추가되었습니다.')
    newTableNumber.value = null
    await loadTables()
  } catch (e) {
    alert(e.response?.data?.errorMessage || '테이블 추가 실패')
  }
}

const deleteTable = async (tableId, tableNum) => {
  if (!confirm(`${tableNum}번 테이블을 삭제하시겠습니까?`)) return
  try {
    await api.delete(`/customertable/${tableId}`)
    await loadTables()
  } catch (e) {
    alert(e.response?.data?.errorMessage || '테이블 삭제 실패')
  }
}

// ── 메뉴 등록 ──
const handleImageUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return
  newMenu.imageFile = file
  const reader = new FileReader()
  reader.onload = (ev) => { newMenu.imagePreview = ev.target.result }
  reader.readAsDataURL(file)
}

const registerMenu = async () => {
  if (!newMenu.name || !newMenu.categoryId || !newMenu.price) return alert('필수 항목을 모두 입력하세요.')
  try {
    // 1. 메뉴 등록 → menuId 반환
    const formData = new FormData()
    formData.append('menuName', newMenu.name)
    formData.append('price', newMenu.price)
    formData.append('origin', newMenu.origin)
    formData.append('explanation', newMenu.description)
    formData.append('categoryId', newMenu.categoryId)
    if (newMenu.imageFile) formData.append('menuImage', newMenu.imageFile)

    const menuRes = await api.post('/store/menu/create', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const menuId = menuRes.data // 백엔드: body(menuId)

    // 2. 옵션 그룹 순서대로 등록
    for (const option of newMenu.options) {
      if (!option.optionName.trim()) continue
      const optionRes = await api.post(`/store/menu/${menuId}/option`, {
        optionName: option.optionName,
      })
      const optionId = optionRes.data // 백엔드: body(optionId)

      // 3. 옵션 상세 등록
      for (const detail of option.details) {
        if (!detail.optionDetailName.trim()) continue
        await api.post(`/store/menu/option/${optionId}/detail`, {
          optionDetailName: detail.optionDetailName,
          optionDetailPrice: detail.optionDetailPrice,
        })
      }
    }

    alert('메뉴가 등록되었습니다.')
    Object.assign(newMenu, {
      imageFile: null, imagePreview: null, categoryId: null,
      name: '', price: 0, origin: '', description: '', options: [],
    })
    activeModal.value = null
    await loadMenus()
  } catch (e) {
    alert(e.response?.data?.errorMessage || '메뉴 등록 실패')
  }
}

// ── 메뉴 수정 열기 ──
const openMenuDetail = async (menu) => {
  expandedOptions.value = []
  try {
    // 백엔드에 새로 만들 점주용 상세 API
    // GET /store/menu/{menuId}/detail
    // 응답: { menuId, menuName, price, categoryId, origin, explanation, imageUrl,
    //         options: [{ optionId, optionName, details: [{ optionDetailId, optionDetailName, optionDetailPrice }] }] }
    const res = await api.get(`/store/menu/${menu.menuId}/detail`)
    editMenu.value = {
      id: res.data.menuId,
      menuName: res.data.menuName,
      price: res.data.price,
      categoryId: res.data.categoryId,
      origin: res.data.origin || '',
      explanation: res.data.explanation || '',
      options: (res.data.options || []).map(o => ({
        optionId: o.optionId,
        optionName: o.optionName,
        details: (o.details || []).map(d => ({
          optionDetailId: d.optionDetailId,
          optionDetailName: d.optionDetailName,
          optionDetailPrice: d.optionDetailPrice,
        })),
      })),
    }
  } catch (e) {
    // 백엔드 API 미완성 시 fallback
    editMenu.value = {
      id: menu.menuId,
      menuName: menu.menuName,
      price: menu.menuPrice,
      categoryId: null,
      origin: '',
      explanation: '',
      options: [],
    }
  }
  activeModal.value = 'menuDetail'
}

// ── 메뉴 정보 저장 ──
const saveMenuEdit = async () => {
  try {
    const formData = new FormData()
    formData.append('menuName', editMenu.value.menuName)
    formData.append('price', editMenu.value.price)
    formData.append('origin', editMenu.value.origin || '')
    formData.append('explanation', editMenu.value.explanation || '')
    formData.append('categoryId', editMenu.value.categoryId)
    if (editMenu.value.imageFile) formData.append('menuImage', editMenu.value.imageFile)

    await api.put(`/store/menu/${editMenu.value.id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    alert('메뉴 정보가 수정되었습니다.')
    await loadMenus()
  } catch (e) {
    alert(e.response?.data?.errorMessage || '메뉴 수정 실패')
  }
}

// ── 메뉴 삭제 ──
const deleteMenu = async () => {
  if (!confirm('정말 이 메뉴를 삭제하시겠습니까?')) return
  try {
    await api.delete(`/store/menu/${editMenu.value.id}`)
    alert('메뉴가 삭제되었습니다.')
    activeModal.value = null
    await loadMenus()
  } catch (e) {
    alert(e.response?.data?.errorMessage || '메뉴 삭제 실패')
  }
}

// ── 옵션 아코디언 토글 ──
const toggleOption = (optionId) => {
  const idx = expandedOptions.value.indexOf(optionId)
  if (idx === -1) expandedOptions.value.push(optionId)
  else expandedOptions.value.splice(idx, 1)
}

// ── 옵션 추가 (수정 화면) ──
const addOption = async () => {
  try {
    const res = await api.post(`/store/menu/${editMenu.value.id}/option`, { optionName: '새 옵션' })
    const newOptionId = res.data
    editMenu.value.options.push({ optionId: newOptionId, optionName: '새 옵션', details: [] })
    expandedOptions.value.push(newOptionId) // 추가 즉시 펼침
  } catch (e) {
    alert(e.response?.data?.errorMessage || '옵션 추가 실패')
  }
}

// ── 옵션명 수정 ──
const updateOption = async (option) => {
  try {
    await api.put(`/store/menu/option/${option.optionId}`, { optionName: option.optionName })
    alert('옵션이 수정되었습니다.')
  } catch (e) {
    alert(e.response?.data?.errorMessage || '옵션 수정 실패')
  }
}

// ── 옵션 삭제 ──
const deleteOption = async (optionId) => {
  if (!confirm('이 옵션을 삭제하시겠습니까?')) return
  try {
    await api.delete(`/store/menu/option/${optionId}`)
    editMenu.value.options = editMenu.value.options.filter(o => o.optionId !== optionId)
    expandedOptions.value = expandedOptions.value.filter(id => id !== optionId)
  } catch (e) {
    alert(e.response?.data?.errorMessage || '옵션 삭제 실패')
  }
}

// ── 옵션 상세 추가 ──
const addOptionDetail = async (option) => {
  try {
    const res = await api.post(`/store/menu/option/${option.optionId}/detail`, {
      optionDetailName: '새 옵션 상세',
      optionDetailPrice: 0,
    })
    const newDetailId = res.data
    option.details.push({ optionDetailId: newDetailId, optionDetailName: '새 옵션 상세', optionDetailPrice: 0 })
  } catch (e) {
    alert(e.response?.data?.errorMessage || '옵션 상세 추가 실패')
  }
}

// ── 옵션 상세 수정 ──
const updateOptionDetail = async (detail) => {
  try {
    await api.put(`/store/menu/option/detail/${detail.optionDetailId}`, {
      optionDetailName: detail.optionDetailName,
      optionDetailPrice: detail.optionDetailPrice,
    })
    alert('옵션 상세가 수정되었습니다.')
  } catch (e) {
    alert(e.response?.data?.errorMessage || '옵션 상세 수정 실패')
  }
}

// ── 옵션 상세 삭제 ──
const deleteOptionDetail = async (optionDetailId, optionId) => {
  if (!confirm('이 옵션 상세를 삭제하시겠습니까?')) return
  try {
    await api.delete(`/store/menu/option/detail/${optionDetailId}`)
    const option = editMenu.value.options.find(o => o.optionId === optionId)
    if (option) option.details = option.details.filter(d => d.optionDetailId !== optionDetailId)
  } catch (e) {
    alert(e.response?.data?.errorMessage || '옵션 상세 삭제 실패')
  }
}

// ── 영업시간 ──
const saveBusinessHours = async () => {
  const storeId = localStorage.getItem('currentStoreId')
  try {
    await api.patch(`/store/${storeId}/updateTime`, {
      openAt: businessHours.open + ':00',
      closeAt: businessHours.close + ':00',
    })
    alert('영업시간이 저장되었습니다.')
    activeModal.value = null
  } catch (e) {
    alert(e.response?.data?.errorMessage || '저장 실패')
  }
}

// ── 비밀번호 ──
const savePassword = async () => {
  if (!oldPassword.value || !newPassword.value) return alert('모든 항목을 입력하세요.')
  try {
    await api.put('/owner/mypage/updatepassword', {
      oldPassword: oldPassword.value,
      newPassword: newPassword.value,
    })
    alert('비밀번호가 변경되었습니다.')
    cancelPasswordEdit()
  } catch (e) {
    alert(e.response?.data?.errorMessage || '비밀번호 변경 실패')
  }
}

const cancelPasswordEdit = () => {
  editingPassword.value = false
  oldPassword.value = ''
  newPassword.value = ''
}

const logout = () => {
  if (!confirm('로그아웃 하시겠습니까?')) return
  localStorage.clear()
  router.push('/')
}
</script>

<style scoped>
@import "@/assets/css/OwnerSettings.css";

/* 아코디언 스타일 */
.accordion-header {
  cursor: pointer;
  user-select: none;
}
.accordion-header:hover {
  opacity: 0.85;
}
.option-title {
  flex: 1;
  font-weight: 700;
}
.accordion-arrow {
  font-size: 12px;
  color: #a1a1aa;
  margin-right: 8px;
}
.accordion-body {
  padding: 12px 0 4px 0;
  border-top: 1px solid #3f3f46;
  margin-top: 4px;
}
.option-name-edit {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
</style>