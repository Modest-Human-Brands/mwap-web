import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'

import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')