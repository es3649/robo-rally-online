import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },{
      path: "/join",
      name: "join",
      component: () => import('../views/JoinGame.vue')
    },{
      path: "/lobby",
      name: "lobby",
      component: () => import('../views/Lobby.vue')
    },{
      path: "/game",
      name: "game",
      component: () => import('../views/Game.vue')
    }
  ]
})

export default router
