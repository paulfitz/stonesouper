<template>
  <div class="form-group" id="qb">
    <multiselect placeholder="Keywords" v-model="value" :options="moptions" @input="input" v-on:click.stop="1" @search-change="find" :custom-label="label" :showNoResults="false" @open="open" :allow-empty="true" :multiple="false" :taggable="true" @tag="tagme"></multiselect>
  </div>
</template>

<script lang="ts">
  import axios from 'axios';
  import Multiselect from 'vue-multiselect';
  import {Component, Vue} from 'vue-property-decorator';
import {Getter, Action} from 'vuex-class';
import {completeQuery} from '../filter';

@Component({
  components: {
    Multiselect
  },
})
export default class QueryBox extends Vue {
  public value: any = "";
  public moptions: any[] = [];
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
    } else {
      // should go to org
      console.log("I SHOULD DO SOMETHING ABOUT", val);
      this.replaceQuery(val.name);
    }
  }

  public tagme(val: any) {
    const t = {
      name: val,
      type: '',
    };
    this.value = t;
    this.moptions.push(t);
    this.replaceQuery(val);
  }

  public async find(query: string) {
    console.log("FIND on", query);
    this.replaceQuery(query);
    const params = {key: [query]};
    completeQuery(params, this.filters);
    const x = await axios.post('/api/autocomplete', params, { responseType: 'json' });
    console.log(">>>", x);
    this.moptions = x.data; //x.data.map((v: any) => v.name);
  }

  public label(v: any) {
    if (!v.type) { return v.name; }
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
