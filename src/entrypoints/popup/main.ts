// popup 的入口文件：创建 Vue 应用，并挂载 Ant Design Vue。
import { createApp } from 'vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import '../../styles/app.css'
import App from './App.vue'

// 把 App.vue 渲染到 popup/index.html 里的 #app。
createApp(App).use(Antd).mount('#app')
