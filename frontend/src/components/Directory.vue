<template>
  <div v-masonry item-selector=".listing">
      <div v-masonry-tile class="listing" v-for="result in listings" v-on:click.stop="1">
        <h2><router-link :to="'/org/' + result.id">{{result.name}}</router-link></h2> 
        <div class="more">
          {{ result.physical_address1 }}
          {{ result.physical_address2 }}
          <br v-if="result.physical_address1 || result.physical_address2" />
          {{ result.physical_city }}
          {{ result.physical_state }}
          {{ result.physical_zip }}
          <br v-if="result.physical_city || result.physical_state || result.physical_zip" />
          {{ result.physical_country }}
        </div>
      </div>
  </div>
</template>

<script lang="ts">
 import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
  import {Getter} from 'vuex-class';

@Component
export default class Directory extends Vue {
  @Getter public nlistings!: number;
  @Getter public listings!: any[];
  constructor() {
    super();
  }

  @Watch('listings')
  public async onPropertyChange(value: any, oldValue: any) {
    console.log("HELLO!!!");
    console.log((this as any).$nextTick);
    console.log((this as any).$redrawVueMasonry);
    // (this as any).$redrawVueMasonry();
    this.$nextTick(function () { (this as any).$redrawVueMasonry() })
    console.log("goo");
  }
}

</script>

<style scoped>
div.listing {
  display: inline-block;
  width: 300px;
  max-height: 400px;
  margin: 0.5em;
  padding: 0.5em;
  background: white;
  border-radius: 1em;
  overflow: hide;
}
div.more { 
  overflow: auto;
  text-align: left;
}
</style>
