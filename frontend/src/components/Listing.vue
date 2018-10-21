<template>
  <div class="container">
  <div class="post">
    <div class="loading" v-if="!listing">Loading...</div>
    <div v-if="error" class="error">
      {{ error }}
    </div>
    <transition name="slide">
      <div v-if="listing" class="content" :key="listing.org.id">
        <h2>{{ listing.org.name }}</h2>

        {{ listing.org.description }}

      <div v-for="result in listing.locs">
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

        <a href="javascript:history.go(-1)">Go Back</a>
      </div>
    </transition>
  </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
  import {Getter, Action} from 'vuex-class';
import axios from 'axios';

@Component
export default class Listing extends Vue {
  @Prop({default: true}) public loading!: boolean;
  @Prop({default: ""}) public error!: string;
  @Getter listing!: any;
  @Action('replaceListing') replaceListing!: (x: any) => void;
  constructor() {
    super();
  }
  public async created() {
    console.log(this.$route.params.id);
    const x = await axios.get(`/api/org/${this.$route.params.id}`, {responseType: 'json'});
    this.replaceListing(x.data);
  }
}
</script>

<style scoped>
.post {
  margin-top: 5em;
}
.loading {
  position: absolute;
  top: 10px;
  right: 10px;
}
.error {
  color: red;
}
.content {
  transition: all .35s ease;
  position: absolute;
}
.slide-enter {
  opacity: 0;
  transform: translate(30px, 0);
}
.slide-leave-active {
  opacity: 0;
  transform: translate(-30px, 0);
}
.more { 
  padding: 2em;
}
</style>
