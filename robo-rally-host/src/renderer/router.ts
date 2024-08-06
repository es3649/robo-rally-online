import { createRouter, createWebHashHistory } from "vue-router";
import HomeView from "./views/HomeView.vue";
import LobbyView from "./views/LobbyView.vue";

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView
        },{
            path: '/lobby',
            name: 'lobby',
            component: LobbyView
        },{
            path: '/robots',
            name: 'robots',
            component: () => import('./views/RobotsView.vue')
        },{
            path: '/board',
            name: 'board',
            component: () => import('./views/BoardView.vue')
        },{
            path: '/game',
            name: 'game',
            component: () => import('./views/GameView.vue')
        }
    ]
})

export default router
