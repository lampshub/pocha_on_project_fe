import {createRouter, createWebHistory} from "vue-router";
import {customerRouter} from "@/router/customerRouter";
import {ownerRouter} from "@/router/ownerRouter";
import {anotherRouter} from "@/router/anotherRouter";

const routes = [
    ...customerRouter,
    ...ownerRouter,
    ...anotherRouter,

]

export const router = createRouter(
    {
        history: createWebHistory(),
        routes
    }
)