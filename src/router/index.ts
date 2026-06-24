import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'home',
            component: () => import('@/views/RoutePlaceholder.vue'),
        },
        {
            path: '/c/:conversationId',
            name: 'conversation',
            component: () => import('@/views/RoutePlaceholder.vue'),
        },
        {
            path: '/settings',
            name: 'settings',
            component: () => import('@/views/RoutePlaceholder.vue'),
        },
    ],
});

export default router;
