<template>
  <div id="app">
    <Map id="map_section" />
    <div id="overlay_section">
      <SearchBar id="searchbar_section" />
      <Directory id="directory_section" />
    </div>
  </div>
</template>

<script lang="ts">
  import axios from 'axios';
  import { Component, Prop, Vue } from 'vue-property-decorator';
import SearchBar from './components/SearchBar.vue';
import Map from './components/Map.vue';
import Directory from './components/Directory.vue';

@Component({
  components: {
    SearchBar,
    Map,
    Directory,
  },
})

export default class App extends Vue {
}
</script>

<style>
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

#map_section { 
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
}

#overlay_section { 
  position: absolute;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  z-index: 2000;
}
#directory_section { 
}
</style>
