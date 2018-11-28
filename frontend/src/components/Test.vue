<template>
  <div class="form-inline">
    <SearchBar id="searchbar_section" />
    <Directory id="directory_section" />
  </div>
</template>

<script lang="ts">
  import axios from 'axios';
  import { Component, Prop, Vue } from 'vue-property-decorator';
import SearchBar from './SearchBar.vue';
import Directory from './Directory.vue';

@Component({
  components: {
    SearchBar,
    Directory,
  },
})

export default class Test extends Vue {
}
</script>

<style scoped>
html, body, div {
  margin: 0;
  padding: 0;
}
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  position: relative;
}
</style>
