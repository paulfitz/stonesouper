<template>
  <div class="form-inline searchbar">
  <div class="form-group">
    <div class="form-group">
      <label for="keyword" class="mr-sm-2 form-control-lg">Search for an organization</label>
      <input type="text"
             id="keyword"
             class="form-control form-control-lg mr-sm-2 mb-2"
             placeholder="Keywords"
             v-on:click.stop="1"
             v-model="query">
      <button v-on:click="wipe()" class="btn btn-primary mb-2 form-control-lg">Map</button>
    </div>
  </div>
  </div>
</template>

<script lang="ts">
  import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
  import {Getter, Action} from 'vuex-class';
  import axios from 'axios';
import {mapActions} from 'vuex';

@Component
export default class SearchBar extends Vue {
  @Prop({default: ''}) public keyword!: string;
  // @Prop({default: null}) public results!: any;
  @Getter listings!: any[];
  @Getter nlistings!: number;
  @Getter("query") iquery!: string;
  @Action('replaceListings') replaceListings!: (x: any[]) => void;
  @Action('replaceQuery') replaceQuery!: (x: string) => void;
  constructor() {
    super();
  }

  @Watch('query')
  public async onPropertyChanged(value: string, oldValue: string) {
    if (value.length > 2) {
      console.log("SEARCHING FOR", value);
      try {
        const x = await axios.post(`/api/search`, {key: [value + "*"], limit: 50}, {responseType: 'json'});
        console.log(`GOT ${x.data.length} listings!`);
        this.replaceListings(x.data);
      } catch(e) {
        console.log("ERROR", e);
      }
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
