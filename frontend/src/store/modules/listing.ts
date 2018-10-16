import {ActionContext} from 'vuex';

export class State {
  public listing: any = null;
}

const getters = {
  listing(state: State): any {
    return state.listing;
  },
};

const mutations = {
  replaceListing(state: State, listing: any) {
    state.listing = listing;
  },
};

const actions = {
  replaceListing(store: ActionContext<State, any>, listing: any) {
    store.commit('replaceListing', listing);
  },
};

export const listing = {
  state: new State(),
  getters,
  mutations,
  actions,
};
