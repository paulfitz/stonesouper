<template>
  <div class="searchbar">
  <div class="form-group">
    <div class="form-group form-inline">
      <SimpleFilter filterKey="city" />
      <SimpleFilter filterKey="state" />
      <SimpleFilter filterKey="zip" />
      <SimpleFilter filterKey="country" />
      <SimpleFilter filterKey="tag" />
      <SimpleFilter filterKey="team" />
      <SimpleFilter filterKey="sector_Sector" />
      <SimpleFilter filterKey="legal_LegalStructure" />
      <SimpleFilter filterKey="type_OrgType" />
    </div>
    <div class="form-group form-inline">
      <input type="text"
             id="keyword"
             class="form-control form-control-lg mr-sm-2 mb-2"
             placeholder="Keywords"
             v-on:click.stop="1"
             v-model="query">
      <button v-on:click="search()" v-on:click.stop="1" class="btn btn-primary mb-2 form-control-lg">Search</button>
    </div>
  </div>
  </div>
</template>

<script lang="ts">
  import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
  import {Getter, Action} from 'vuex-class';
  import axios from 'axios';
import {mapActions} from 'vuex';
import SimpleFilter from './SimpleFilter.vue';
import {completeQuery} from '../filter';

@Component({
  components: {
    SimpleFilter,
  },
})

export default class SearchBar extends Vue {
  @Prop({default: ''}) public keyword!: string;
  // @Prop({default: null}) public results!: any;
  @Getter filters!: {[key: string]: string[]};
  @Getter listings!: any[];
  @Getter nlistings!: number;
  @Getter("query") iquery!: string;
  @Getter("queryCount") queryCount!: string;
  @Action('replaceListings') replaceListings!: (x: any[]) => void;
  @Action('replaceQuery') replaceQuery!: (x: string) => void;
  constructor() {
    super();
  }

  public async search() {
    return this.go(this.query);
  }

  @Watch('queryCount')
  public async watchQueryCount() {
    return this.search();
  }

  public async go(value: string) {
    console.log("SEARCHING FOR", value);
    try {
      const params: any = {
        limit: 5000
      };
      if (value !== '') {
        params.key = [value + "*"];
      }
      completeQuery(params, this.filters);
      console.log("PARAMS", params);
      const x = await axios.post(`/api/map`, params, {responseType: 'json'});
      console.log(`GOT ${x.data.length} listings!`);
      this.replaceListings(x.data);
    } catch(e) {
      console.log("ERROR", e);
    }
  }

  @Watch('query')
  public async onPropertyChanged(value: string, oldValue: string) {
    if (value.length > 2) {
      await this.go(value);
    }
  }

  get query() {
    return this.iquery;
  }

  set query(value: string) {
    this.replaceQuery(value);
  }

  public wipe() {
    document.getElementById("overlay_section")!.style!.display = 'none';
    document.getElementById("revert_directory")!.style!.display = 'block';
    document.getElementById("map")!.classList!.remove('pffade');
    return false;
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.searchbar {
  padding-top: 5em;
  padding-bottom: 5em;
  max-width: 500px;
  margin: 0 auto;
}
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
