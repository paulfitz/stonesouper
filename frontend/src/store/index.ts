import Vue from 'vue';
import Vuex from 'vuex';
import {listing} from './modules/listing';
import {listings} from './modules/listings';

const debug = process.env.NODE_ENV !== 'production';

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    listing,
    listings,
  },
  strict: debug,
});
