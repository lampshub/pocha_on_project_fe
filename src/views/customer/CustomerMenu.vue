<!--
  CustomerMenu.vue – 고객 메뉴 주문 페이지 (메인 오케스트레이터)
  모든 하위 컴포넌트와 컴포저블을 조합하여 전체 주문 화면을 구성
-->
<template>
  <div class="app-root">
    <CustomerSidebar :tableNum="tableNum" :categories="categories" :currentCategory="currentCategory"
      :getMenusByCategory="getMenusByCategory" @handle-hidden-admin-trigger="handleHiddenAdminTrigger"
      @select-category="selectCategory" @call-staff="callStaff" @handle-payment="handlePayment" />
    <CustomerMenuGrid ref="menuGridRef" :categories="categories" :currentTime="currentTime"
      :getMenusByCategory="getMenusByCategory" :formatPrice="formatPrice"
      @scroll="handleScroll" @open-menu-detail="openMenuDetail" @quick-add="quickAddToCart" />
    <CustomerFloatingButtons :isPanelOpen="isPanelOpen" :presentUnread="presentUnread"
      :unreadChatCount="unreadChatCount" :newOrderCount="newOrderCount" :cartCount="cartItems.length"
      @open-chat="openChatModal" @open-order-history="openOrderHistory" @open-cart="openCart" />
    <CustomerAdminAuthModal :show="showSettingsModal" :password="adminPassword"
      @update:password="adminPassword = $event" @close="closeSettingsModal" @verify="verifyAdminPassword" />
    <CustomerPresentToast :show="showPresentToast" :notification="presentNotification"
      @click="onPresentToastClick" />
    <CustomerOrderHistoryPanel :show="showOrderHistory" :orderHistory="orderHistory"
      :formatPrice="formatPrice" @close="closePanel" />
    <CustomerCartPanel :show="showCart" :cartItems="cartItems" :totalPrice="totalPrice"
      :formatPrice="formatPrice" @close="closePanel" @increase="increaseQuantity"
      @decrease="decreaseQuantity" @delete-line="deleteCartLine" @place-order="placeOrder" />
    <CustomerPresentPanel :show="showPresentPanel" :selectedTable="selectedPresentTable"
      :categories="categories" :getMenusByCategory="getMenusByCategory" :formatPrice="formatPrice"
      @close="closePresentPanel" @open-present-detail="openPresentMenuDetail" />
  </div>
  <!-- 채팅 패널 (루트 div 밖 — 원본 구조 유지) -->
  <CustomerChatPanel ref="chatPanelRef" :show="showChatPanel" :selectedTable="selectedChatTable"
    :chatMessages="chatMessages" :chatInput="chatInput"
    @update:chatInput="chatInput = $event" @close="closeChatPanel" @send="sendMessage" />
  <!-- 채팅/선물 테이블 선택 모달 -->
  <CustomerChatModal :show="showChatModal" :activeTables="activeTables" :selectedTable="selectedTable"
    :myChatRooms="myChatRooms" :presentPendingList="presentPendingList"
    :getUnreadCountForTable="getUnreadCountForTable" @close="closeChatModal"
    @select-table="selectTable" @open-chat="openChat(null, selectedTable)"
    @open-present="closeChatModal(); openPresent(selectedTable)"
    @open-chat-room="(tNum) => openChat(tNum, selectedTable)"
    @open-present-from-header="openPresentFromHeader" />
  <!-- 메뉴 상세 모달 -->
  <CustomerMenuDetailModal :show="showMenuDetail" :menu="selectedMenu" :quantity="menuQuantity"
    :selectedOptions="selectedOptions" :isPresentMode="isPresentMode" :formatPrice="formatPrice"
    @close="closeMenuDetail" @add-to-cart="addToCartFromDetail" @send-present="sendPresent"
    @update:quantity="menuQuantity = $event"
    @select-option="(optionId, detail) => { selectedOptions[optionId] = detail }" />
  <!-- 선물 수신 오버레이 (폭죽 애니메이션) -->
  <CustomerPresentOverlay ref="presentOverlayRef" :visible="presentOverlayVisible"
    :presentData="presentActiveData" @close="closePresentPopup" />
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, onUnmounted, watch } from 'vue'
// 하위 컴포넌트
import CustomerSidebar from '@/components/customer/CustomerSidebar.vue'
import CustomerMenuGrid from '@/components/customer/CustomerMenuGrid.vue'
import CustomerFloatingButtons from '@/components/customer/CustomerFloatingButtons.vue'
import CustomerAdminAuthModal from '@/components/customer/CustomerAdminAuthModal.vue'
import CustomerPresentToast from '@/components/customer/CustomerPresentToast.vue'
import CustomerOrderHistoryPanel from '@/components/customer/CustomerOrderHistoryPanel.vue'
import CustomerCartPanel from '@/components/customer/CustomerCartPanel.vue'
import CustomerPresentPanel from '@/components/customer/CustomerPresentPanel.vue'
import CustomerChatPanel from '@/components/customer/CustomerChatPanel.vue'
import CustomerChatModal from '@/components/customer/CustomerChatModal.vue'
import CustomerMenuDetailModal from '@/components/customer/CustomerMenuDetailModal.vue'
import CustomerPresentOverlay from '@/components/customer/CustomerPresentOverlay.vue'
// 컴포저블
import { useCustomerAuth } from '@/composables/customer/useCustomerAuth'
import { useCustomerMenu } from '@/composables/customer/useCustomerMenu'
import { useCustomerCart } from '@/composables/customer/useCustomerCart'
import { useCustomerOrder } from '@/composables/customer/useCustomerOrder'
import { useCustomerChat } from '@/composables/customer/useCustomerChat'
import { useCustomerPresent } from '@/composables/customer/useCustomerPresent'
import { useCustomerNavGuard } from '@/composables/customer/useCustomerNavGuard'

/* ── 유틸 ── */
const formatPrice = (price) => (price ?? 0).toLocaleString('ko-KR')

/* ── 시계 ── */
const currentTime = ref('')
const updateClock = () => {
  const n = new Date()
  currentTime.value = String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0')
}
let clockInterval = null

/* ── 인증/테이블 ── */
const {
  GROUP_ID_KEY, TABLE_SESSION_KEY, parseJwt,
  tableNum, storeId, selectedTable, accessToken,
  adminPassword, showSettingsModal,
  closeSettingsModal, verifyAdminPassword, handleHiddenAdminTrigger, releaseTable,
} = useCustomerAuth()
const selectTable = (tNum) => { selectedTable.value = { tableNum: tNum } }

/* ── 메뉴/카테고리 ── */
const {
  categories, currentCategory, mainContent,
  menuQuantity, selectedMenu, selectedOptions, isPresentMode, showMenuDetail,
  getMenusByCategory, loadMenus, openMenuDetail, openPresentMenuDetail,
  closeMenuDetail, handleScroll, selectCategory, callStaff,
} = useCustomerMenu()

/* ── 패널 공통 닫기 (순환 의존 방지를 위해 배열+함수로 선언 후 뒤에서 등록) ── */
const closePanelFns = []
const closePanel = () => closePanelFns.forEach((fn) => fn())

/* ── 장바구니 ── */
const {
  cartItems, showCart, totalPrice, loadCart, quickAddToCart,
  addToCartFromDetail, increaseQuantity, decreaseQuantity, deleteCartLine, openCart,
} = useCustomerCart(selectedMenu, selectedOptions, menuQuantity, closeMenuDetail, closePanel)

/* ── 주문 ── */
const {
  orderHistory, newOrderCount, showOrderHistory,
  openOrderHistory, placeOrder, handlePayment,
} = useCustomerOrder(tableNum, GROUP_ID_KEY, cartItems, totalPrice, loadCart, closePanel, formatPrice)

/* ── 선물 ── */
const {
  showPresentPanel, selectedPresentTable, presentNotification, presentUnread,
  showPresentToast, presentPendingList, presentActiveData, presentOverlayVisible,
  presentConfettiCanvasRef, presentToastTimer, tableStompClient,
  openPresent, closePresentPanel, onPresentToastClick, openPresentFromHeader,
  closePresentPopup, sendPresent, connectTableWebSocket,
} = useCustomerPresent(tableNum, storeId, accessToken, selectedMenu, menuQuantity, closeMenuDetail, parseJwt, closePanel)

/* ── 채팅 ── */
const {
  showChatModal, showChatPanel, selectedChatTable, chatInput, chatMessages, chatMessagesRef,
  unreadChatCount, activeTables, myChatRooms, getUnreadCountForTable,
  openChatModal, closeChatModal, openChat, closeChatPanel,
  sendMessage, connectChatAlarmSSE, disconnectChatAlarmSSE, loadUnreadTotalCount,
} = useCustomerChat(tableNum, storeId, accessToken, tableStompClient, closePanel)

/* ── closePanel 에 모든 패널 ref 등록 ── */
closePanelFns.push(
  () => { showOrderHistory.value = false },
  () => { showCart.value = false },
  () => { showPresentPanel.value = false },
  () => { showChatPanel.value = false },
)

/* ── 패널 열림 상태 computed ── */
const isPanelOpen = computed(() =>
  showOrderHistory.value || showCart.value || showPresentPanel.value || showChatPanel.value
)

/* ── 자식 컴포넌트 ref → 컴포저블 ref 연결 ── */
const menuGridRef = ref(null)
const chatPanelRef = ref(null)
const presentOverlayRef = ref(null)
watch(menuGridRef, (c) => { mainContent.value = c?.scrollArea ?? null })
watch(chatPanelRef, (c) => { chatMessagesRef.value = c?.chatMessagesEl ?? null })
watch(presentOverlayRef, (c) => { presentConfettiCanvasRef.value = c?.canvasRef ?? null })

/* ── 네비게이션 가드 ── */
const { setupGuards, removeGuards } = useCustomerNavGuard(TABLE_SESSION_KEY, releaseTable)

/* ── 라이프사이클 ── */
onMounted(async () => {
  setupGuards()
  updateClock()
  clockInterval = setInterval(updateClock, 1000)
  try {
    await Promise.all([loadMenus(), loadCart()])
    connectTableWebSocket()
    connectChatAlarmSSE()
  } catch (e) { console.error('초기 로딩 실패', e) }
  await loadUnreadTotalCount()
})
onBeforeUnmount(() => { removeGuards() })
onUnmounted(() => {
  if (clockInterval) clearInterval(clockInterval)
  if (presentToastTimer.value) clearTimeout(presentToastTimer.value)
  if (tableStompClient.value) tableStompClient.value.deactivate()
  disconnectChatAlarmSSE()
})
</script>

<style scoped>
@import "@/assets/css/customerMenu.css";
</style>
