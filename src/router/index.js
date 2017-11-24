import Vue from 'vue'
import Router from 'vue-router'
import leaflet from '@/components/leaflet'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'leaflet',
      component: leaflet
    }
  ]
})
