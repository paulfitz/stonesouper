import Vue from 'vue';
import App from './App.vue';
import Small from './components/Small.vue';
import Home from './components/Home.vue';
import Browser from './components/Browser.vue';
import Listing from './components/Listing.vue';
import Test from './components/Test.vue';

import BootstrapVue from 'bootstrap-vue';
import {VueMasonryPlugin} from 'vue-masonry';
import Router from 'vue-router';

import store from './store';

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

Vue.use(BootstrapVue);
Vue.use(VueMasonryPlugin);
Vue.use(Router);

const routes = [
  { path: '/', component: Browser },
  { path: '/about', component: Small },
  { path: '/browse', component: Home },
  { path: '/org/:id', component: Listing },
  { path: '/test', component: Test },
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
