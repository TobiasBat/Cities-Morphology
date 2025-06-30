import { createRouter, createWebHashHistory } from 'vue-router'
import SimulationView from '@/views/SimulationView.vue'
import IntroductionView from '@/views/IntroductionView.vue'
import AboutView from '@/views/AboutView.vue'
import Calculator from '@/views/Calculator.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: IntroductionView
    },
    {
      path: '/simulation',
      name: 'simulation',
      component: SimulationView
    },
    {
      path: '/compare',
      name: 'compare',
      component: SimulationView
    },
    {
      path: '/introduction',
      name: 'introduction',
      component: IntroductionView
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView
    },
    {
      path: '/calculator',
      name: 'calculatr',
      component: Calculator
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    return { top: 0 }
  },
})

export default router
