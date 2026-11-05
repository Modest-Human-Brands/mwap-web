import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: (to) => (to.hash ? { el: to.hash, behavior: 'smooth' } : { top: 0 }),
  routes: [
    { path: '/', name: 'sites', component: () => import('@/views/SitesView.vue') },
    {
      path: '/sites/:slug',
      name: 'site',
      component: () => import('@/views/SiteDetailView.vue'),
      meta: { bare: true },
    },
    {
      path: '/sites/:slug/edit',
      name: 'site-edit',
      component: () => import('@/views/EditSiteView.vue'),
      meta: { bare: true },
    },
    { path: '/analytics', name: 'analytics', component: () => import('@/views/AnalyticsView.vue') },
    {
      path: '/new',
      name: 'new-site',
      component: () => import('@/views/wizard/TemplateStep.vue'),
      meta: { bare: true },
    },
    {
      path: '/new/details',
      name: 'new-site-details',
      component: () => import('@/views/wizard/DetailsStep.vue'),
      meta: { bare: true },
    },
    {
      path: '/new/review',
      name: 'new-site-review',
      component: () => import('@/views/wizard/ReviewStep.vue'),
      meta: { bare: true },
    },
    {
      path: '/new/published',
      name: 'new-site-published',
      component: () => import('@/views/wizard/PublishedStep.vue'),
      meta: { bare: true },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
declare module 'vue-router' {
  interface RouteMeta {
    /** Full-screen page without the app top bar (the create wizard). */
    bare?: boolean
  }
}