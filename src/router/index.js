import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import WorkTimeAnalyze from '@/views/WorkTimeAnalyze.vue'
import WorkTimeCopy from '@/views/WorkTimeCopy.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/Analyze',
      name: 'analyze',
      component: WorkTimeAnalyze,
    },
        {
      path: '/Copy',
      name: 'copy',
      component: WorkTimeCopy,
    },
    // {
    //   path: '/about',
    //   name: 'about',
    //   // route level code-splitting
    //   // this generates a separate chunk (About.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import('../views/AboutView.vue'),
    // },
  ],
})

export default router
