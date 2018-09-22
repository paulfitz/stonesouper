import {ActionContext} from 'vuex';

export class State {
  public listings: any[] = [];
  public query: string = '';
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
};

const mutations = {
  replaceListings(state: State, lst: any[]) {
    state.listings.splice(0);
    state.listings.push.apply(state.listings, lst);
  },

  replaceQuery(state: State, query: string) {
    state.query = query;
  },
};

const actions = {
  replaceListings(store: ActionContext<State, any>, lst: any[]) {
    store.commit('replaceListings', lst);
  },
  replaceQuery(store: ActionContext<State, any>, query: string) {
    store.commit('replaceQuery', query);
  },
};

export const listings = {
  state: new State(),
  getters,
  mutations,
  actions,
};
