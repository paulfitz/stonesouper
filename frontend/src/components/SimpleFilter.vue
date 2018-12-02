<template>
  <div class="form-group">
    <multiselect :value="initialValue" :placeholder="filterKey.split('_')[0]" :options="moptions" :multiple="true" :loading="loading" @search-change="find" @open="open" @input="input"></multiselect>
  </div>
</template>

<script lang="ts">
import axios from 'axios';
import Multiselect from 'vue-multiselect'
import {Getter, Action} from 'vuex-class';
import {Component, Prop, Vue, Watch} from 'vue-property-decorator';
import {completeQuery} from '../filter';

@Component({
  components: {
    Multiselect,
  },
})

export default class SimpleFilter extends Vue {
  @Getter('filters') filters!: {[key: string]: string[]};
  @Getter('queryCount') queryCount!: number;
  @Getter('filterCount') filterCount!: number;
  @Getter query!: string;
  @Action('setFilter') setFilter!: (payload: {key: string, values: string[]}) => void;
  @Action('incQueryCount') incQueryCount!: (offset: number) => void;
  @Prop({default: ''}) public filterKey!: string;
  @Prop({default: ''}) public parent!: string;
  public initialValue: string[] = [];

  public moptions: string[] = [];
  public loading: boolean = false;

  public mounted() {
    console.log("MOUNTING");
    this.initialValue = this.filters[this.filterKey];
  }

  public update() {
    this.setFilter({key: this.filterKey, values: ['one', 'two']});
  }

  @Watch('filterCount')
  public updateFilters() {
    const nxt = this.filters[this.filterKey];
    const v1 = JSON.stringify(this.initialValue);
    const v2 = JSON.stringify(nxt);
    if (v1 !== v2) {
      console.log("UPDATING FILTERS");
      this.initialValue = nxt;
      this.incQueryCount(1);
    }
  }

  public async open() {
    return this.find("");
  }

  public input(val: any) {
    console.log("INPUT", val);
    this.initialValue = val;
    this.setFilter({key: this.filterKey, values: val});
    this.incQueryCount(1);
  }

  public async find(query: string) {
    this.loading = true;
    try {
      const params: any = {
        optionPrefix: query,
      };
      const path = completeQuery(params, this.filters, this.filterKey);
      console.log(">>>", params, path);
      const x = await axios.post(path, params, { responseType: 'json' });
      this.loading = false;
      const val = x.data.options.map((v: any) => v.name);
      this.moptions = val;
    } catch (e) {
      this.loading = false;
      console.log("ERROR", e);
    }
  }
}
</script>

<!-- New step!
     Add Multiselect CSS. Can be added as a static asset or inside a component. -->
<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
