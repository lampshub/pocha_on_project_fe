/**
 * useCustomerMenu
 * - 메뉴/카테고리 데이터 로딩 및 메뉴 상세 모달 관리
 * - 카테고리별 메뉴 필터링, 스크롤 감지를 통한 카테고리 자동 선택
 * - 직원 호출 기능
 */
import { ref } from 'vue'
import { customerMenuApi as customerOrderApi } from '@/api/customerMenuApi'
import { useToast } from 'vue-toastification'
import api from '@/api/axios'

export function useCustomerMenu() {
  const toast = useToast()

  const categories = ref([])
  const menus = ref([])
  const currentCategory = ref('main')
  const mainContent = ref(null)

  // 메뉴 상세
  const menuQuantity = ref(1)
  const selectedMenu = ref(null)
  const selectedOptions = ref({})
  const isPresentMode = ref(false)
  const showMenuDetail = ref(false)

  const getMenusByCategory = (catId) =>
    menus.value.filter((m) => m.category === catId)

  const loadMenus = async () => {
    const { data } = await customerOrderApi.getCategories()
    categories.value = data.map((cat) => ({
      id: String(cat.categoryId),
      name: cat.categoryName,
    }))
    menus.value = data.flatMap((cat) =>
      (cat.mappingMenuList ?? []).map((m) => ({
        id: m.menuId,
        category: String(cat.categoryId),
        name: m.menuName ?? '메뉴',
        description: '',
        price: m.menuPrice ?? 0,
        icon: m.imageUrl || null,
        options: null,
      }))
    )
  }

  const openMenuDetail = async (menu) => {
    try {
      const { data } = await customerOrderApi.getMenuDetail(menu.id)
      selectedMenu.value = {
        id: data.menuId,
        name: data.menuName,
        price: data.menuPrice,
        icon: menu.icon,
        description: '',
        options: data.mappingOptionList ?? [],
      }
      selectedOptions.value = {}
      menuQuantity.value = 1
      isPresentMode.value = false
      showMenuDetail.value = true
    } catch (e) {
      console.error(e)
      toast.error('메뉴 정보를 불러오지 못했습니다.')
    }
  }

  const openPresentMenuDetail = async (menu) => {
    try {
      const { data } = await customerOrderApi.getMenuDetail(menu.id)
      selectedMenu.value = {
        id: data.menuId,
        name: data.menuName,
        price: data.menuPrice,
        icon: menu.icon,
        description: '',
        options: data.mappingOptionList ?? [],
      }
      selectedOptions.value = {}
      menuQuantity.value = 1
      isPresentMode.value = true
      showMenuDetail.value = true
    } catch (e) {
      console.error(e)
      toast.error('메뉴 정보를 불러오지 못했습니다.')
    }
  }

  const closeMenuDetail = () => {
    showMenuDetail.value = false
    selectedMenu.value = null
    selectedOptions.value = {}
    isPresentMode.value = false
  }

  const handleScroll = (e) => {
    const container = e.target
    const sections = mainContent.value?.querySelectorAll('.menu-section') ?? []
    const scrollPos = container.scrollTop + 100
    const isAtBottom =
      container.scrollHeight - container.scrollTop <= container.clientHeight + 50

    if (isAtBottom) {
      currentCategory.value =
        sections[sections.length - 1]?.dataset.category ?? currentCategory.value
      return
    }
    for (const sec of sections) {
      if (
        scrollPos >= sec.offsetTop &&
        scrollPos < sec.offsetTop + sec.offsetHeight
      ) {
        currentCategory.value = sec.dataset.category
        break
      }
    }
  }

  const selectCategory = (catId) => {
    currentCategory.value = catId
    const sec = mainContent.value?.querySelector(`[data-category="${catId}"]`)
    sec?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const callStaff = async () => {
    try {
      await api.post('/sse/staffcall')
      toast.success('직원을 호출했습니다. 잠시만 기다려주세요.')
    } catch (e) {
      console.error('직원호출 실패:', e)
      toast.error('직원 호출에 실패했습니다.')
    }
  }

  return {
    categories,
    menus,
    currentCategory,
    mainContent,
    menuQuantity,
    selectedMenu,
    selectedOptions,
    isPresentMode,
    showMenuDetail,
    getMenusByCategory,
    loadMenus,
    openMenuDetail,
    openPresentMenuDetail,
    closeMenuDetail,
    handleScroll,
    selectCategory,
    callStaff,
  }
}
