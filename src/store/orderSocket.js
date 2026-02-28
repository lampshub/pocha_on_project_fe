// src/store/orderSocket.js
import { defineStore } from "pinia";
import { ref } from "vue";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export const useOrderSocketStore = defineStore("orderSocket", () => {
  const isConnected = ref(false);
  const lastOrderMessage = ref(null);
  const lastQueueMessage = ref(null);
  let stompClient = null;

  function connect(storeId, accessToken) {
    // 1. 이미 연결되어 있다면 중복 연결 방지
    if (stompClient?.active) return;
    try {
      const base64Url = accessToken.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));
      if (payload.tableNum) return;
    } catch (e) {
      void e;
    }

    // 2. 토큰 유효성 및 권한 체크 (손님 계정은 연결 제외)
    if (!accessToken) return;

    try {
      const base64Url = accessToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));

      // tableNum이 있다는 것은 '손님'이라는 의미이므로 사장님용 소켓 연결 안 함
      if (payload.tableNum) {
        console.warn("손님 계정은 주문 알림 소켓에 연결할 수 없습니다.");
        return;
      }
    } catch (error) {
      console.error("토큰 파싱 에러:", error);
      return; // 에러 발생 시 연결 시도 중단
    }

    // 3. STOMP 클라이언트 설정
    stompClient = new Client({
      // 서버 주소가 올바른지 확인하세요 (http/https)
      webSocketFactory: () => new SockJS(`${process.env.VUE_APP_API_BASE_URL}/connect`),
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 5000, // 재연결 대기 시간 5초로 변경

      onConnect: () => {
        isConnected.value = true;
        console.log("주문 웹소켓 연결됨 (Pinia)");

        // 일반 주문 구독
        stompClient.subscribe(`/topic/order/${storeId}`, (message) => {
          lastOrderMessage.value = {
            data: JSON.parse(message.body),
            _ts: Date.now(), // 동일 메시지 수신 시 watch 감지를 위한 타임스탬프
          };
        });

        // 대기열/큐 업데이트 구독
        stompClient.subscribe(`/topic/order-queue/${storeId}`, (message) => {
          lastQueueMessage.value = {
            data: JSON.parse(message.body),
            _ts: Date.now(),
          };
        });
      },

      onDisconnect: () => {
        isConnected.value = false;
      },
      onStompError: (frame) => {
        console.error("주문 STOMP 에러:", frame);
        stompClient?.deactivate(); // ★ 에러 시 재연결 중단
        stompClient = null;
        isConnected.value = false;
      },
    });

    stompClient.activate();
  }

  function disconnect() {
    if (stompClient) {
      stompClient.deactivate();
      stompClient = null;
    }
    isConnected.value = false;
  }

  return {
    isConnected,
    lastOrderMessage,
    lastQueueMessage,
    connect,
    disconnect,
  };
});
