import Vue from 'vue';
import App from './App.vue';
import Small from './components/Small.vue';
import Browser from './components/Browser.vue';
import Listing from './components/Listing.vue';

import {VueMasonryPlugin} from 'vue-masonry';
import Router from 'vue-router';

import store from './store';

Vue.use(VueMasonryPlugin);
Vue.use(Router);

const routes = [
  { path: '/about', component: Small },
  { path: '/', component: Browser },
  { path: '/org/:id', component: Listing },
];

const router = new Router({
  mode: 'history',
  routes,  // short for routes: routes
});

Vue.config.productionTip = false;

new Vue({
  store,
  router,
  render: (h) => h(App, {}),
}).$mount('#app');
