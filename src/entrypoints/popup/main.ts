// popup 的入口文件：只挂载 Vue 应用，组件库随具体面板按需加载。
import { createApp } from 'vue'
import 'ant-design-vue/dist/reset.css'
import '../../styles/app.css'
import App from './App.vue'

// 把 App.vue 渲染到 popup/index.html 里的 #app。
createApp(App).mount('#app')
