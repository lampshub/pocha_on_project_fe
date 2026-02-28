/**
 * useCustomerOrder
 * - 주문 생성 (신규/추가 주문)
 * - 주문 내역 로드 및 패널 관리
 * - 결제 페이지 이동
 */
import { ref } from 'vue'
import { customerMenuApi as customerOrderApi } from '@/api/customerMenuApi'
import { useToast } from 'vue-toastification'
import { useRouter } from 'vue-router'

export function useCustomerOrder(tableNum, GROUP_ID_KEY, cartItems, totalPrice, loadCart, closePanel, formatPrice) {
  const toast = useToast()
  const router = useRouter()

  const orderHistory = ref([])
  const newOrderCount = ref(0)
  const showOrderHistory = ref(false)

  const mapOrderListToViewModel = (listDto) => {
    return (listDto ?? []).map((ordering, index) => ({
      groupId: ordering.groupId,
      orderNumber: index + 1,
      totalPrice: ordering.totalPrice,
      items: (ordering.listDetailDto ?? []).map((detail) => ({
        id: detail.menuId,
        name: detail.menuName,
        option:
          detail.orderDetailOpDto
            ?.map(
              (opt) =>
                `${opt.optionName}: ${opt.orderDetailOptionDetailDto
                  ?.map((d) => d.optionDetailName)
                  .join(', ')}`
            )
            .join(' / ') || null,
        quantity: detail.menuQuantity,
        price: detail.linePrice,
      })),
    }))
  }

  const loadOrderHistory = async () => {
    const gid = localStorage.getItem(GROUP_ID_KEY)
    if (!gid) {
      orderHistory.value = []
      return
    }
    const { data } = await customerOrderApi.getOrderList(gid)
    orderHistory.value = mapOrderListToViewModel(data)
  }

  const openOrderHistory = async () => {
    closePanel()
    await loadOrderHistory()
    newOrderCount.value = 0
    showOrderHistory.value = true
  }

  const placeOrder = async () => {
    if (!cartItems.value.length) {
      toast.warning('장바구니가 비어있습니다.')
      return
    }

    if (!confirm(`총 ${formatPrice(totalPrice.value)}원을 주문하시겠습니까?`))
      return

    const payload = {
      tableNum: tableNum.value,
      idempotencyKey: crypto.randomUUID(),
      webMenuList: [],
    }

    let currentGroupId = localStorage.getItem(GROUP_ID_KEY)
    let returnedGroupId
    if (currentGroupId) {
      try {
        const { data } = await customerOrderApi.addOrder(currentGroupId, payload)
        returnedGroupId = data
      } catch (e) {
        console.warn('추가 주문 실패, 새주문 생성 : ', e)
        localStorage.removeItem(GROUP_ID_KEY)
        const { data } = await customerOrderApi.createOrder(payload)
        returnedGroupId = data
      }
    } else {
      const { data } = await customerOrderApi.createOrder(payload)
      returnedGroupId = data
    }
    localStorage.setItem(GROUP_ID_KEY, returnedGroupId)

    toast.success('주문이 완료되었습니다!')
    newOrderCount.value += 1
    await loadCart()
    await loadOrderHistory()
    closePanel()
  }

  const handlePayment = () => {
    router.push({
      name: 'CustomerPayment',
      params: { tableNum: tableNum.value },
      query: {
        amount: totalPrice.value,
        groupId: localStorage.getItem('currentGroupId'),
      },
    })
  }

  return {
    orderHistory,
    newOrderCount,
    showOrderHistory,
    loadOrderHistory,
    openOrderHistory,
    placeOrder,
    handlePayment,
  }
}
