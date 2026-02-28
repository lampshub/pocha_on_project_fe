/**
 * useCustomerCart
 * - 장바구니 CRUD (추가, 수량 변경, 삭제)
 * - 장바구니 패널 열기/닫기
 * - 장바구니 총액 계산
 */
import { ref, computed } from 'vue'
import { customerMenuApi as customerOrderApi } from '@/api/customerMenuApi'
import { useToast } from 'vue-toastification'

export function useCustomerCart(selectedMenu, selectedOptions, menuQuantity, closeMenuDetail, closePanel) {
  const toast = useToast()

  const cartItems = ref([])
  const showCart = ref(false)

  const totalPrice = computed(() =>
    cartItems.value.reduce((sum, item) => sum + item.price, 0)
  )

  const mapCartToViewModel = (cartDto) => {
    const lineList = cartDto?.cartDetailDto ?? cartDto?.items ?? []
    return lineList.map((line) => ({
      id: line.menuId,
      name: line.menuName,
      price: line.lineTotalPrice ?? 0,
      quantity: line.menuQuantity ?? line.quantity ?? 1,
      option: line.cartOptionDtoList?.length
        ? line.cartOptionDtoList
            .map(
              (opt) =>
                `${opt.optionName}: ${opt.optionDetailNameList?.join(', ')}`
            )
            .join(' / ')
        : null,
      fieldKey: line.fieldKey,
      optionIds: line.optionIds ?? [],
    }))
  }

  const loadCart = async () => {
    const { data } = await customerOrderApi.getCart()
    cartItems.value = mapCartToViewModel(data)
  }

  const quickAddToCart = async (menu) => {
    const payload = {
      createDetailDto: [
        {
          menuId: menu.id,
          menuQuantity: 1,
          optionId: [],
        },
      ],
    }
    await customerOrderApi.createCartLine(payload)
    await loadCart()
    toast.success(`${menu.name} 담김!`)
  }

  const addToCartFromDetail = async () => {
    if (!selectedMenu.value) return

    const optionIdList = Object.entries(selectedOptions.value)
      .filter(([, detail]) => detail != null)
      .map(([optionId, detail]) => ({
        optionId: Number(optionId),
        optionDetailId: [detail.optionDetailId],
      }))

    const payload = {
      createDetailDto: [
        {
          menuId: selectedMenu.value.id,
          menuQuantity: menuQuantity.value,
          optionId: optionIdList,
        },
      ],
    }

    await customerOrderApi.createCartLine(payload)
    await loadCart()

    toast.success(`${selectedMenu.value.name}이(가) 장바구니에 담겼습니다.`)
    closeMenuDetail()
  }

  const increaseQuantity = async (idx) => {
    const line = cartItems.value[idx]
    if (!line) return
    await customerOrderApi.updateCartQty({
      menuId: line.id,
      delta: 1,
      optionIds: line.optionIds ?? [],
      fieldKey: line.fieldKey,
    })
    await loadCart()
  }

  const decreaseQuantity = async (idx) => {
    const line = cartItems.value[idx]
    if (!line) return
    if (line.quantity > 1) {
      await customerOrderApi.updateCartQty({
        menuId: line.id,
        delta: -1,
        optionIds: line.optionIds ?? [],
        fieldKey: line.fieldKey,
      })
    } else {
      if (!confirm('장바구니에서 삭제하시겠습니까?')) return
      await customerOrderApi.deleteCartLine({ fieldKey: line.fieldKey })
    }
    await loadCart()
  }

  const deleteCartLine = async (idx) => {
    const line = cartItems.value[idx]
    if (!line) return
    if (!confirm('장바구니에서 삭제하시겠습니까?')) return
    await customerOrderApi.deleteCartLine({ fieldKey: line.fieldKey })
    await loadCart()
  }

  const openCart = async () => {
    closePanel()
    await loadCart()
    showCart.value = true
  }

  return {
    cartItems,
    showCart,
    totalPrice,
    loadCart,
    quickAddToCart,
    addToCartFromDetail,
    increaseQuantity,
    decreaseQuantity,
    deleteCartLine,
    openCart,
  }
}
