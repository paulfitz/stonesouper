<template>
  <div class="searchbar">
    <div class="form-group">
      <label for="keyword">Keywords</label>
      <input type="text"
             id="keyword"
             class="form-control"
             v-model="query">
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
    // Do stuff with the watcher here.
    // let i = 1;
    // i = parseInt(value, 10);
    console.log("SEARCHING FOR", value);
    const x = await axios.post(`/api/search`, {key: [value]}, {responseType: 'json'});
    // this.results = x.data;
    this.replaceListings(x.data);
  }

  get query() {
    console.log("READING " + this.iquery);
    return this.iquery;
  }

  set query(value: string) {
    console.log("SETTING TO " + value);
    this.replaceQuery(value);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.searchbar {
  padding-top: 1em;
}
div, input {
  font-size: 130%;
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
