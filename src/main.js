import { createApp } from "vue";
import vuetify from "./plugins/vuetify";
import "@mdi/font/css/materialdesignicons.css";
import { createPinia } from "pinia";
import App from "@/App.vue";
import { router } from "@/router";
import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";
import axios from "axios";

const refreshAxios = axios.create(); // 인터셉터가 없는 깨끗한 인스턴스
const app = createApp(App);
const options = {
  position: "top-right",
  timeout: 1300,
  closeOnClick: true,
};

const SESSION_KEY = "is_session_active";

// 1. 현재 탭/창의 세션 상태 확인
const isSessionActive = sessionStorage.getItem(SESSION_KEY);

if (!isSessionActive) {
    // 세션 정보가 아예 없다면 (즉, 브라우저를 새로 켰거나 탭을 새로 연 경우)
    localStorage.clear();
    // 이제 세션이 시작되었음을 기록 (이 값은 새로고침해도 유지됨)
    sessionStorage.setItem(SESSION_KEY, "true");
} else {
    // 세션 정보가 있다면 (새로고침한 경우 등)
    // 아무것도 하지 않음 (localStorage 유지)
    console.log("세션 유지 중 - 새로고침 감지");
}

/**
 * 1. Request Interceptor: 모든 요청에 토큰 자동 부착
 * 점주님의 서비스는 accessToken 하나에 로그인/매장/테이블 정보가 갱신되어 담기므로
 * 스토리지의 accessToken만 참조하면 됩니다.
 */
axios.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * 2. Response Interceptor: 401 에러(토큰 만료) 발생 시 처리
 */
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // 401 에러이고, 재시도하지 않은 요청일 때 (무한 루프 방지)
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const customerPaths = ["/customertable", "/cart", "/orders", "/view"];
      const isCustomerRequest = customerPaths.some((p) =>
        originalRequest.url?.includes(p),
      );
      if (isCustomerRequest) {
        return Promise.reject(error);
      }

     try {
  const refreshToken = localStorage.getItem("refreshToken");
  // axios.post 대신 refreshAxios.post 사용
  const response = await refreshAxios.post(
    `${process.env.VUE_APP_API_BASE_URL}/owner/refresh`,
    {},
    { headers: { Authorization: `Bearer ${refreshToken}` } }
  );

        const newAccessToken = response.data.accessToken;
        const newRefreshToken = response.data.refreshToken;

        // 새로운 토큰들 저장
        localStorage.setItem("accessToken", newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        // 기존에 실패했던 요청의 헤더를 새 토큰으로 교체 후 재요청
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        console.error("토큰 갱신 실패:", refreshError);
        localStorage.clear();
        // 점주 관리 시스템 로그인 페이지로 이동
        router.push("/");
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);



const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(vuetify);
app.use(Toast, options);

app.mount("#app");
