import PostPayment from "@/views/payment/PostPayment.vue";
import PaymentFail from "@/views/payment/PaymentFail.vue";
import PaymentSuccess from "@/views/payment/PaymentSuccess.vue";

export const payRouter = [
    {
        path: '/payment/success',
        name: 'PaymentSuccess',
        component: PaymentSuccess
    },
    {
        path: '/payment/fail',
        name: 'PaymentFail',
        component: PaymentFail
    },
    {
        path: '/pos/payment',
        name: 'PostPayment',
        component: PostPayment

    },

]