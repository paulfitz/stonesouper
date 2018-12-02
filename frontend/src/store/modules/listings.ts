import {ActionContext} from 'vuex';

export class State {
  public listings: any[] = [];
  public query: string = '';
  public filters: {[key: string]: string[]} = {
    city: [],
    country: [],
    tag: [],
    team: [],
    state: [],
    zip: [],

    sector_Sector: [],
    legal_LegalStructure: [],
    type_OrgType: [],
  };
  public queryCount: number = 0;
  public filterCount: number = 0;
}

const getters = {
  listings(state: State): any[] {
    return state.listings;
  },

  nlistings(state: State): number {
    return state.listings.length;
  },

  query(state: State): string {
    return state.query;
  },

  filters(state: State): {[key: string]: string[]} {
    return state.filters;
  },

  queryCount(state: State): number {
    return state.queryCount;
  },

  filterCount(state: State): number {
    return state.filterCount;
  },
};

const mutations = {
  replaceListings(state: State, lst: any[]) {
    state.listings.splice(0);
    state.listings.push.apply(state.listings, lst);
  },

  replaceQuery(state: State, query: string) {
    state.query = query;
  },

  setFilter(state: State, payload: {key: string, values: string[]}) {
    state.filters[payload.key] = payload.values;
  },

  removeFilter(state: State, key: string) {
    delete state.filters[key];
  },

  incQueryCount(state: State, offset: number) {
    state.queryCount += offset;
  },

  incFilterCount(state: State, offset: number) {
    state.filterCount += offset;
  },
};

const actions = {
  replaceListings(store: ActionContext<State, any>, lst: any[]) {
    store.commit('replaceListings', lst);
  },
  replaceQuery(store: ActionContext<State, any>, query: string) {
    store.commit('replaceQuery', query);
  },
  setFilter(store: ActionContext<State, any>, payload: {key: string, values: string[]}) {
    store.commit('setFilter', payload);
  },
  incQueryCount(store: ActionContext<State, any>, offset: number) {
    store.commit('incQueryCount', offset);
  },
  incFilterCount(store: ActionContext<State, any>, offset: number) {
    store.commit('incFilterCount', offset);
  },
};

export const listings = {
  state: new State(),
  getters,
  mutations,
  actions,
};
