import { ref, onUnmounted } from "vue";
import axios from "axios";

let sdkLoadPromise = null;

function loadTossPaymentsSDK() {
    if (sdkLoadPromise) return sdkLoadPromise;

    sdkLoadPromise = new Promise((resolve, reject) => {
        if (window.TossPayments) {
            resolve(window.TossPayments);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://js.tosspayments.com/v2/standard';
        script.onload = () => resolve(window.TossPayments);
        script.onerror = () => reject(new Error('토스페이먼츠 SDK 로드 실패'));
        document.head.appendChild(script);
    });
    return sdkLoadPromise;
}

export function usePayment() {
    const CLIENT_KEY = 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm';
    const API_BASE = process.env.VUE_APP_API_BASE_URL || 'http://localhost:8083'; // 기본값 설정

    const isReady = ref(false);
    const isLoading = ref(false);
    const error = ref(null);

    let widgets = null;
    let currentAmount = { currency: 'KRW', value: 0 };

    async function initWidget(paymentMethodSelector, agreementSelector, amount, customerKey) {
        try {
            isLoading.value = true;
            error.value = null;

            const TossPayments = await loadTossPaymentsSDK();
            const tossPayments = TossPayments(CLIENT_KEY);

            // ANONYMOUS 상수는 SDK 로드 후 사용 가능
            const widgetConfig = customerKey ? { customerKey } : { customerKey: "ANONYMOUS" };
            widgets = await tossPayments.widgets(widgetConfig);

            currentAmount = { currency: 'KRW', value: amount };
            await widgets.setAmount(currentAmount);

            await Promise.all([
                widgets.renderPaymentMethods({
                    selector: paymentMethodSelector,
                    variantKey: 'DEFAULT', // 템플릿에 맞게 수정 (보통 DEFAULT나 AGREEMENT)
                }),
                widgets.renderAgreement({
                    selector: agreementSelector,
                    variantKey: 'AGREEMENT',
                }),
            ]);
            isReady.value = true;
        } catch (e) {
            error.value = e.message || '결제위젯 초기화 실패';
            console.error('[usePayment] initWidget error', e);
        } finally {
            isLoading.value = false;
        }
    }

    async function updateAmount(newAmount) {
        if (!widgets) return;
        currentAmount = { currency: 'KRW', value: newAmount };
        await widgets.setAmount(currentAmount);
    }

    async function requestPayment(options = {}) {
        if (!widgets || !isReady.value) {
            error.value = '결제위젯이 아직 준비되지 않았습니다.';
            return;
        }

        try {
            isLoading.value = true;
            error.value = null;

            // 1. 서버에 주문 생성 요청 (여기서 데이터 구조 확인 필요)
            const { data } = await axios.post(`${API_BASE}/api/payment/order`, {
                amount: currentAmount.value,
                orderName: options.orderName || '포차온 주문',
                ...options.metadata,
            });

            // 중요: 서버 응답 객체에서 orderId를 정확히 추출해야 함
            const orderId = data.orderId;

            const origin = window.location.origin;
            const successPath = options.successPath || '/payment/success';
            const failPath = options.failPath || '/payment/fail';

            // 2. 결제 요청
            await widgets.requestPayment({
                orderId: orderId, // 발급받은 orderId 사용
                orderName: options.orderName || '포차온 주문',
                successUrl: `${origin}${successPath}`,
                failUrl: `${origin}${failPath}`,
                customerName: options.customerName || undefined,
                customerEmail: options.customerEmail || undefined
            });
        } catch (e) {
            if (e.code === 'USER_CANCEL') {
                error.value = null;
                return;
            }
            error.value = e.message || '결제 요청 실패';
            console.error('[usePayment] requestPayment error: ', e);
        } finally {
            isLoading.value = false;
        }
    }

    async function confirmPayment({ paymentKey, orderId, amount }) {
        try {
            isLoading.value = true;
            error.value = null;

            const { data } = await axios.post(`${API_BASE}/api/payment/confirm`, {
                paymentKey,
                orderId,
                amount: Number(amount),
            });
            return data;
        } catch (e) {
            const errData = e.response?.data;
            error.value = errData?.message || '결제 승인 실패';
            throw e;
        } finally {
            isLoading.value = false;
        }
    }

    onUnmounted(() => {
        widgets = null;
        isReady.value = false;
    });

    return {
        isReady,
        isLoading,
        error,
        initWidget,
        updateAmount,
        requestPayment,
        confirmPayment,
    };
}