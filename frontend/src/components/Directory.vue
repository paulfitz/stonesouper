<template>
  <div v-masonry item-selector=".listing" fit-width="true" class="listings">
      <div v-masonry-tile class="listing" v-for="result in listings" v-on:click.stop="1">
        <h4><router-link :to="'/org/' + result.id">{{result.name}}</router-link></h4> 
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
    this.$nextTick(function () { (this as any).$redrawVueMasonry() })
  }
}

</script>

<style scoped>
div.listings {
  margin: 0 auto;
}
div.listing {
  display: inline-block;
  width: 300px;
  max-height: 400px;
  margin: 0;
  margin-left: 2em;
  margin-right: 2em;
  margin-bottom: 0.2em;
  padding-left: 1.5em;
  padding-right: 1.5em;
  padding-top: 0.5em;
  padding-bottom: 0.5em;
  background: rgba(255, 255, 255, 0.9);
  border-top-left-radius: 1.5em;
  border-bottom-right-radius: 1.5em;
  overflow: hide;
}
div.more { 
  overflow: auto;
  text-align: left;
}
</style>
