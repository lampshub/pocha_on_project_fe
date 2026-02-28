/**
 * useMenuManagement
 * - 메뉴 목록 로딩 / 등록 / 수정 / 삭제
 * - 메뉴 이미지 업로드 처리
 * - 가격 포맷팅
 */
import { ref, reactive } from 'vue'
import api from '@/api/axios.js'

export function useMenuManagement() {
  /** 전체 메뉴 목록 */
  const menuList = ref([])

  /** 새 메뉴 등록 폼 데이터 */
  const newMenu = reactive({
    imageFile: null,
    imagePreview: null,
    categoryId: null,
    name: '',
    price: 0,
    origin: '',
    description: '',
    options: [],
  })

  /** 수정 중인 메뉴 데이터 */
  const editMenu = ref(null)

  /** 확장된 옵션 목록 (옵션 펼침 상태 관리) */
  const expandedOptions = ref([])

  /** 서버에서 전체 메뉴 목록 가져오기 */
  const loadMenus = async () => {
    try {
      const res = await api.get('/view/all')
      menuList.value = Array.isArray(res.data) ? res.data : []
    } catch (e) {
      console.error('메뉴 목록 로딩 실패:', e)
    }
  }

  /** 새 메뉴 등록 시 이미지 파일 선택 처리 */
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    newMenu.imageFile = file
    const reader = new FileReader()
    reader.onload = (ev) => { newMenu.imagePreview = ev.target.result }
    reader.readAsDataURL(file)
  }

  /** 메뉴 수정 시 이미지 파일 선택 처리 */
  const handleEditImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) {
      editMenu.value.imagePreview = null
      editMenu.value.imageFile = null
      return
    }
    editMenu.value.imageFile = file
    editMenu.value.imagePreview = URL.createObjectURL(file)
  }

  /**
   * 새 메뉴를 서버에 등록
   * - 메뉴 기본 정보 + 옵션/상세옵션 순차 등록
   * @param {Object} callbacks - { onSuccess } 등록 성공 시 콜백
   */
  const registerMenu = async (callbacks = {}) => {
    if (!newMenu.name || !newMenu.categoryId || !newMenu.price) return alert('필수 항목을 모두 입력하세요.')
    try {
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
      const menuId = menuRes.data

      // 옵션 및 옵션 상세 등록
      for (const option of newMenu.options) {
        if (!option.optionName.trim()) continue
        const optionRes = await api.post(`/store/menu/${menuId}/option`, { optionName: option.optionName })
        const optionId = optionRes.data
        for (const detail of option.details) {
          if (!detail.optionDetailName.trim()) continue
          await api.post(`/store/menu/option/${optionId}/detail`, {
            optionDetailName: detail.optionDetailName,
            optionDetailPrice: detail.optionDetailPrice,
          })
        }
      }

      alert('메뉴가 등록되었습니다.')
      // 폼 초기화
      Object.assign(newMenu, {
        imageFile: null, imagePreview: null, categoryId: null,
        name: '', price: 0, origin: '', description: '', options: [],
      })
      await loadMenus()
      if (callbacks.onSuccess) callbacks.onSuccess()
    } catch (e) {
      alert(e.response?.data?.errorMessage || '메뉴 등록 실패')
    }
  }

  /**
   * 메뉴 상세 정보를 로딩하여 수정 모달 열기
   * @param {Object} menu - 선택된 메뉴
   * @param {Function} onReady - 모달 표시 콜백
   */
  const openMenuDetail = async (menu, onReady) => {
    const menuId = menu.menuId ?? menu.id
    if (!menuId) return alert('메뉴 ID를 찾을 수 없습니다.')
    expandedOptions.value = []
    editMenu.value = {
      id: menuId, menuName: menu.menuName || '', price: menu.menuPrice || 0,
      categoryId: null, origin: '', explanation: '', imageFile: null, options: [],
    }
    if (onReady) onReady()
    try {
      const res = await api.get(`/store/menu/${menuId}/detail`)
      editMenu.value = {
        id: menuId,
        menuName: res.data.menuName || '',
        price: res.data.price || 0,
        categoryId: res.data.categoryId ?? null,
        origin: res.data.origin || '',
        explanation: res.data.explanation || '',
        imageUrl: res.data.imageUrl || null,
        imageFile: null,
        imagePreview: null,
        options: (res.data.options || []).map(o => ({
          optionId: o.optionId,
          optionName: o.optionName || '',
          details: (o.details || []).map(d => ({
            optionDetailId: d.optionDetailId,
            optionDetailName: d.optionDetailName || '',
            optionDetailPrice: d.optionDetailPrice || 0,
          })),
        })),
      }
    } catch (e) {
      alert('메뉴 정보 로딩 실패: ' + (e.response?.data?.errorMessage || e.message))
    }
  }

  /**
   * 수정된 메뉴 정보를 서버에 저장
   * @param {Function} onSuccess - 성공 시 콜백
   */
  const saveMenuEdit = async (onSuccess) => {
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
      if (onSuccess) onSuccess()
    } catch (e) {
      alert(e.response?.data?.errorMessage || '메뉴 수정 실패')
    }
  }

  /**
   * 메뉴 삭제 (확인 후)
   * @param {Function} onSuccess - 성공 시 콜백
   */
  const deleteMenu = async (onSuccess) => {
    if (!confirm('정말 이 메뉴를 삭제하시겠습니까?')) return
    try {
      await api.delete(`/store/menu/${editMenu.value.id}`)
      alert('메뉴가 삭제되었습니다.')
      await loadMenus()
      if (onSuccess) onSuccess()
    } catch (e) {
      alert(e.response?.data?.errorMessage || '메뉴 삭제 실패')
    }
  }

  /** 가격을 한국어 형식으로 포맷 (예: 10,000) */
  const formatPrice = (price) => (price ?? 0).toLocaleString('ko-KR')

  return {
    menuList,
    newMenu,
    editMenu,
    expandedOptions,
    loadMenus,
    handleImageUpload,
    handleEditImageUpload,
    registerMenu,
    openMenuDetail,
    saveMenuEdit,
    deleteMenu,
    formatPrice,
  }
}
