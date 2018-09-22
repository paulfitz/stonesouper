<template>
  <div>
    <h1>Stone Soup Directory</h1>
    <div v-masonry item-selector=".listing" column-width="230" gutter="10">
      <div class="listing" v-for="result in listings">
        <h2>{{result.name}}</h2> {{ JSON.stringify(result) }}
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
  max-width: 200px;
  max-height: 300px;
  margin: 0.5em;
  padding: 0.5em;
  background: white;
  border-radius: 1em;
  overflow: scroll;
}
</style>
