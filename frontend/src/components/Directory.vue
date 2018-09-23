<template>
  <div>
    <div v-masonry item-selector=".listing" gutter="10" column-width="230" >
      <div v-masonry-tile class="listing" v-for="result in listings">
        <h2>{{result.name}}</h2> 
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
}

</script>

<style scoped>
div.listing {
  display: inline-block;
  min-width: 200px;
  max-width: 300px;
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
