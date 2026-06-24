import { createApp } from 'vue';
import './style.css';
import 'vue3-toastify/dist/index.css';
import Vue3Toastify from 'vue3-toastify';
import App from './App.vue';

createApp(App)
    .use(Vue3Toastify, {
        autoClose: 3000,
        position: 'top-right',
    })
    .mount('#app');
