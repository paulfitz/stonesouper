<template>
  <div class="form-inline">
    <Map id="map_section" />
    <div id="revert_directory">
      <button v-on:click="showDirectory" class="btn btn-primary">Directory</button>
    </div>
    <div id="overlay_section" v-on:click="wipe">
      <SearchBar id="searchbar_section" />
      <Directory id="directory_section" />
    </div>
  </div>
</template>

<script lang="ts">
  import axios from 'axios';
  import { Component, Prop, Vue } from 'vue-property-decorator';
import SearchBar from './SearchBar.vue';
import Map from './Map.vue';
import Directory from './Directory.vue';

@Component({
  components: {
    SearchBar,
    Map,
    Directory,
  },
})

export default class Browser extends Vue {
  public showDirectory() {
    document.getElementById("overlay_section")!.style!.display = 'block';
    document.getElementById("revert_directory")!.style!.display = 'none';
    document.getElementById("map")!.classList!.add('pffade');
  }

  public wipe() {
    document.getElementById("overlay_section")!.style!.display = 'none';
    document.getElementById("revert_directory")!.style!.display = 'block';
    document.getElementById("map")!.classList!.remove('pffade');
  }
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

#map_section { 
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
}

#revert_directory {
  display: none;
  position: absolute;
  left: 0;
  top: 0;
  width: 100vw;
  z-index: 1999;
  text-align: center;
  pointer-events: none;
}
#revert_directory button {
  display: inline-block;
  font-size: 200%;
  padding-top: 1em;
  padding-left: 5em;
  padding-right: 5em;
  border-bottom-left-radius: 2em;
  border-bottom-right-radius: 2em;
  border-bottom: 10px solid white;
  pointer-events: auto;
  cursor: pointer;
}
#overlay_section { 
  background-color: transparent;
  position: absolute;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  z-index: 2000;
  pointer-events: auto;
}
#directory_section { 
  background: none;
}
</style>
