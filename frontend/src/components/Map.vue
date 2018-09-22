<template>
  <div>
    <div class="map" id="map">
    </div>
  </div>
</template>

<script lang="ts">
 import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
  import {Getter} from 'vuex-class';

const L = (window as any).L;

let map: any = null;

function go(ndata: any[]|null) {
  console.log("HELLO", (document as any).getElementById("map"));
  const data = ndata || [
    { latitude: 60, longitude: 50, name: 'zing1' },
    { latitude: 70, longitude: 60, name: 'zing2' },
  ];
  if (!data) {
    console.log("No table found");
    return;
  }
  const tiles = L.tileLayer('//server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 18,
    attribution: 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC'
  });
  if (!map) {
    map = L.map('map', {layers: [tiles]});
  } else {
    map.off();
    map.remove();
    map = L.map('map', {layers: [tiles]});
  }
  const markers = L.markerClusterGroup();
  const points = [];
  for (let i = 0; i < data.length; i++) {
    const pt = new L.LatLng(data[i].latitude, data[i].longitude);
    const title = data[i].name;
    const marker = L.marker(pt, { title  });
    points.push(pt);
    marker.bindPopup(title);
    markers.addLayer(marker);
  }
  map.addLayer(markers);
  map.fitBounds(new L.LatLngBounds(points));
}

@Component
export default class Map extends Vue {
  @Getter public listings!: any[];
  constructor() {
    super();
  }

  public mounted() {
    go(null);
  }

  @Watch('listings')
  public async onPropertyChanged(value: any[], oldValue: any[]) {
    go(value);
  }
}

</script>

<style scoped>
div.map {
  height: 100%;
  width: 100%;
  opacity: 0.5;
 }
</style>
