<template>
  <div>
    <div class="map fade" id="map">
    </div>
  </div>
</template>

<script lang="ts">
 import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
  import {Getter} from 'vuex-class';

const L = (window as any).L;

let map: any = null;

function escapeHtml(unsafe: string) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }

function go(base: any, ndata: any[]|null) {
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
    maxZoom: 12,
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
    const marker = L.marker(pt, { title });
    points.push(pt);
    // oh gosh this is so painful - there must be an easier way to set up a link programmatically.
    marker.bindPopup("<a class='poplink' data-id='" + data[i].id + "' href='#'>" + escapeHtml(title) + "</a>")
      .on('popupopen', function (popup: any) {
        const classname = document.getElementsByClassName("poplink");
        var myFunction = function(this: any) {
          base.$router.push('/org/' + this.getAttribute('data-id') + "#");
        };
        for (let i = 0; i < classname.length; i++) {
          classname[i].addEventListener('click', myFunction, false);
        }
      });
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
    go(this, this.listings);
  }

  @Watch('listings')
  public async onPropertyChanged(value: any[], oldValue: any[]) {
    go(this, value);
  }
}

</script>

<style scoped>
div.map {
  height: 100%;
  width: 100%;
 }
.fade { 
  opacity: 0.5;
}
</style>
