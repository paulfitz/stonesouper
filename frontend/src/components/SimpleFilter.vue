<template>
  <div class="form-group">
    <multiselect v-model="mvalue" :placeholder="filterKey" :options="moptions" :multiple="true" :loading="loading" @search-change="find" @open="open" @input="input"></multiselect>
  </div>
</template>

<script lang="ts">
import axios from 'axios';
import Multiselect from 'vue-multiselect'
import {Getter, Action} from 'vuex-class';
import {Component, Prop, Vue} from 'vue-property-decorator';

@Component({
  components: {
    Multiselect,
  },
})

export default class SimpleFilter extends Vue {
  @Getter filters!: {[key: string]: string[]};
  @Getter query!: string;
  @Action('setFilter') setFilter!: (payload: {key: string, values: string[]}) => void;
  @Prop({default: ''}) public filterKey!: string;

  public mvalue: string|null = null;
  public moptions: string[] = [];
  public loading: boolean = false;

  public update() {
    this.setFilter({key: this.filterKey, values: ['one', 'two']});
  }

  public async open() {
    return this.find("");
  }

  public input(val: any) {
    console.log("INPUT", val);
    this.setFilter({key: this.filterKey, values: val});
  }

  public async find(query: string) {
    this.loading = true;
    try {
      const params: any = {
        optionPrefix: query,
      };
      const filt = this.filters;
      for (const key of Object.keys(filt)) {
        if (filt[key].length > 0 && key !== this.filterKey) {
          params[key] = filt[key];
        }
      }
      console.log(">>>", params);
      const x = await axios.post(`/api/${this.filterKey}`, params, { responseType: 'json' });
      this.loading = false;
      this.moptions = x.data.options;
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
