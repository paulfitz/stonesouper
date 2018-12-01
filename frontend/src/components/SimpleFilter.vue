<template>
  <div class="form-group">
    <multiselect :value="initialValue" :placeholder="filterKey.split('_')[0]" :options="moptions" :multiple="true" :loading="loading" @search-change="find" @open="open" @input="input"></multiselect>
  </div>
</template>

<script lang="ts">
import axios from 'axios';
import Multiselect from 'vue-multiselect'
import {Getter, Action} from 'vuex-class';
import {Component, Prop, Vue} from 'vue-property-decorator';
import {completeQuery} from '../filter';

@Component({
  components: {
    Multiselect,
  },
})

export default class SimpleFilter extends Vue {
  @Getter filters!: {[key: string]: string[]};
  @Getter query!: string;
  @Action('setFilter') setFilter!: (payload: {key: string, values: string[]}) => void;
  @Action('incQueryCount') incQueryCount!: (offset: number) => void;
  @Prop({default: ''}) public filterKey!: string;
  @Prop({default: ''}) public parent!: string;

  public mvalue: string|null = null;
  public moptions: string[] = [];
  public loading: boolean = false;

  public update() {
    this.setFilter({key: this.filterKey, values: ['one', 'two']});
  }

  public get initialValue() {
    return this.filters[this.filterKey];
  }

  public async open() {
    return this.find("");
  }

  public input(val: any) {
    console.log("INPUT", val);
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
