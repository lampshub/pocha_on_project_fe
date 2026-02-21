import {createApp} from 'vue'
import vuetify from './plugins/vuetify';
import '@mdi/font/css/materialdesignicons.css'
import {createPinia} from "pinia";
import App from "@/App.vue";
import {router} from "@/router";
import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";
import axios from 'axios';

const app = createApp(App);
const options = {
    position: "top-right",
    timeout: 1500,
    closeOnClick: true,
};

/**
 * 1. Request Interceptor: 모든 요청에 토큰 자동 부착
 * 점주님의 서비스는 accessToken 하나에 로그인/매장/테이블 정보가 갱신되어 담기므로
 * 스토리지의 accessToken만 참조하면 됩니다.
 */
axios.interceptors.request.use(
    config => {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

/**
 * 2. Response Interceptor: 401 에러(토큰 만료) 발생 시 처리
 */
axios.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        // 401 에러이고, 재시도하지 않은 요청일 때 (무한 루프 방지)
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                
                // 주의: refresh 요청 시에는 인터셉터가 아닌 별도 axios 인스턴스나 경로를 조심해야 함
                // 여기서는 기존 백엔드 로직(/owner/refresh)에 맞춰 수정이 필요할 수 있습니다.
                const response = await axios.post('/owner/refresh', { 
                    refreshToken: refreshToken 
                });

                const newAccessToken = response.data.accessToken;
                const newRefreshToken = response.data.refreshToken;

                // 새로운 토큰들 저장
                localStorage.setItem("accessToken", newAccessToken);
                if (newRefreshToken) {
                    localStorage.setItem("refreshToken", newRefreshToken);
                }

                // 기존에 실패했던 요청의 헤더를 새 토큰으로 교체 후 재요청
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                return axios(originalRequest); 

            } catch (refreshError) {
                console.error("토큰 갱신 실패:", refreshError);
                localStorage.clear();
                // 점주 관리 시스템 로그인 페이지로 이동
                router.push('/owner/login'); 
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(vuetify);
app.use(Toast, options)

app.mount('#app');