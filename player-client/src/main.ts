import './assets/styles/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueCookieNext } from 'vue-cookie-next'

import App from './App.vue'
import router from './router'


const app = createApp(App)

app.use(createPinia())
app.use(VueCookieNext)
app.use(router)

app.mount('#app')

// set default cookie config
VueCookieNext.config({ expire: '1d' })
