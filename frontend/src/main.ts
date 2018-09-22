import Vue from 'vue';
import App from './App.vue';

import {VueMasonryPlugin} from 'vue-masonry';

import store from './store';

Vue.use(VueMasonryPlugin);

Vue.config.productionTip = false;

new Vue({
  store,
  render: (h) => h(App),
}).$mount('#app');
