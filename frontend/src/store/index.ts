import Vue from 'vue';
import Vuex from 'vuex';
import {listings} from './modules/listings';

const debug = process.env.NODE_ENV !== 'production';

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    listings,
  },
  strict: debug,
});
