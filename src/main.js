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

const SNAPSHOT_KEY = "pre_unload_snapshot";
const SESSION_KEY = "is_session_active";

const snapshot = sessionStorage.getItem(SNAPSHOT_KEY);

if (snapshot) {
  // 새로고침: sessionStorage 스냅샷이 살아있음
  sessionStorage.removeItem(SNAPSHOT_KEY);
  sessionStorage.setItem(SESSION_KEY, "true");
  console.log("새로고침 감지 - localStorage 유지");
} else {
  // 브라우저 종료 후 재시작: 고객 토큰 정리
  // selectedTable은 더 이상 사용하지 않으므로 토큰만 확인
  if (!localStorage.getItem("ownerName")) {
    // ownerName 없으면 고객 토큰 → 제거
    localStorage.removeItem("accessToken");
    localStorage.removeItem("currentGroupId");
  }
  sessionStorage.setItem(SESSION_KEY, "true");
}

// beforeunload 시 스냅샷 저장 (새로고침/종료 판별용)
window.addEventListener("beforeunload", () => {
  sessionStorage.setItem(SNAPSHOT_KEY, "1");
});

/**
 * 1. Request Interceptor: 모든 요청에 토큰 자동 부착
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
        const response = await refreshAxios.post(
          `${process.env.VUE_APP_API_BASE_URL}/owner/refresh`,
          {},
          { headers: { Authorization: `Bearer ${refreshToken}` } }
        );

        const newAccessToken = response.data.accessToken;
        const newRefreshToken = response.data.refreshToken;

        localStorage.setItem("accessToken", newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        console.error("토큰 갱신 실패:", refreshError);
        // 점주 토큰만 삭제 (고객 데이터 보존)
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
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