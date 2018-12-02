<template>
  <div class="form-group" id="qb">
    <multiselect placeholder="Keywords" v-model="value" :options="moptions" @input="input" v-on:click.stop="1" @search-change="find" :custom-label="label" :showNoResults="false" @open="open"></multiselect>
  </div>
</template>

<script lang="ts">
  import axios from 'axios';
  import Multiselect from 'vue-multiselect';
  import {Component, Vue} from 'vue-property-decorator';
import {Getter, Action} from 'vuex-class';

@Component({
  components: {
    Multiselect
  },
})
export default class QueryBox extends Vue {
  public value: string = "";
  public moptions: string[] = [];
  @Getter filters!: {[key: string]: string[]};
  @Action('setFilter') setFilter!: (payload: {key: string, values: string[]}) => void;
  @Action('incFilterCount') incFilterCount!: (offset: number) => void;
  @Action('incQueryCount') incQueryCount!: (offset: number) => void;
  @Action('replaceQuery') replaceQuery!: (x: string) => void;

  public input(val: any) {
    if (!val) { return; }
    console.log("INPUT", val.name, val.type);
    if (val.type !== 'org') {
      // should modify filter
      this.value = "";
      this.replaceQuery("");
      console.log("setting filter");
      this.setFilter({key: val.type, values: [...new Set([...this.filters[val.type], val.name])]});
      console.log("FILTERS NOW", this.filters);
      this.incFilterCount(1);
    }
  }

  public async find(query: string) {
    console.log("FIND on", query);
    this.replaceQuery(query);
    const x = await axios.post('/api/autocomplete', {key: [query]}, { responseType: 'json' });
    console.log(">>>", x);
    this.moptions = x.data; //x.data.map((v: any) => v.name);
  }

  public label(v: any) {
    return `${v.name} (${v.type})`;
  }

  public async open() {
    this.find("");
  }
}
</script>

<style>
#qb {
  width: 400px;
}
</style>
