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
      path: '/host',
      name: 'host',
      // route level code-splitting
      // this generates a separate chunk (Host.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/HostGame.vue')
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
