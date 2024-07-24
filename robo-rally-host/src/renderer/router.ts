import { createRouter, createWebHashHistory } from "vue-router";
import HomeView from "./views/HomeView.vue";

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView
        },{
            path: '/robots',
            name: 'robots',
            component: () => import('./views/RobotsView.vue')
        },{
            path: '/board',
            name: 'board',
            component: () => import('./views/BoardView.vue')
        }
    ]
})

export default router
