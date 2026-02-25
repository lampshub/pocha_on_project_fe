<template>
  <router-view />
</template>


<style>
/* 7개 파일에서 공통으로 사용하던 CSS 변수를 여기에 선언합니다 */
:root {
  --primary: #ea580c;
  --primary-dark: #c2410c;
  --primary-light: #fb923c;
  --accent-gold: #d4a574;
  --bg-dark: #0a0a0a;
  --bg-secondary: #18181b;
  --card: #27272a;
  --card-hover: #3f3f46;
  --text: #fafafa;
  --text-secondary: #a1a1aa;
  --border: #3f3f46;
  --shadow: rgba(0, 0, 0, 0.5);
  --success: #22c55e;
  --danger: #ef4444;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Noto Sans KR', sans-serif;
  background: var(--bg-dark);
  color: var(--text);
  line-height: 1.5;
}

img {
  display: block;
  max-width: 100%;
}

</style>

<script setup>
import { onMounted, onUnmounted, watch } from "vue";
import { useOrderSocketStore } from "@/store/orderSocket";
import { useToast } from "vue-toastification";

const orderSocket = useOrderSocketStore();
const toast = useToast();

onMounted(() => {
  const token = localStorage.getItem("accessToken");
  const storeId = localStorage.getItem("ownerStoreId");
  if (token && storeId) {
    orderSocket.connect(storeId, token);
  }
});

onUnmounted(() => {
  orderSocket.disconnect();
});

// 신규 주문 알림
watch(
  () => orderSocket.lastOrderMessage,
  (msg) => {
    if (!msg?.data) return;
    const latest = msg.data;

    if (latest?.type === 'PRESENT') {
      toast.info(
        `🎁 선물 주문! ${latest.senderTableNum}번 → ${latest.receiverTableNum}번`,
        { position: "top-right", timeout: 4000 }
      );
    } else {
      const menuNames = latest?.webMenuList
        ?.map(m => m.menuName)
        .join(', ') || '새 주문';

      toast.success(
        `📋 ${latest?.tableNum || ''}번 테이블: ${menuNames}`,
        { position: "top-right", timeout: 4000 }
      );
    }
  }
);
</script>