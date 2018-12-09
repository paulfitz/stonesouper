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

        <p v-html="listing.org.description"></p>

        <div v-if="listing.org.website">
          <p>
            See <a v-bind:href="websiteLink(listing.org.website)">{{ listing.org.website }}</a>
          </p>
        </div>

        <div v-if="listing.org.locs">
          <p>
            <h4>Address</h4>
            <div v-for="result in listing.org.locs">
              {{ result.address1 }}
              {{ result.address2 }}
              <br v-if="result.address1 || result.address2" />
              {{ result.city }}
              {{ result.state }}
              {{ result.zip }}
              <br v-if="result.city || result.state || result.zip" />
              {{ result.country }}
            </div>
          </p>
        </div>

        <div v-if="listing.org.phone">
          <p>
            <h4>Phone number</h4>
            {{ listing.org.phone }}
          </p>
        </div>
        
        <div v-if="listing.org.website">
          <p>
            <h4>Website</h4>
            <a v-bind:href="websiteLink(listing.org.website)">{{ listing.org.website }}</a>
          </p>
        </div>
        
        <div v-if="listing.org.email">
          <p>
            <h4>Email</h4>
            {{ listing.org.email }}
          </p>
        </div>

        <div v-for="grp in nestedTags">
          <p>
            <h5>{{ grp[0].name1 || 'Tags' }}</h5>
            <div v-for="tag in grp">
              {{ tag.name }}
            </div>
          </p>
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
import {groupBy} from 'lodash';

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
    const x = await axios.get(`/api/orgs/${this.$route.params.id}`, {
      responseType: 'json',
      params: {
        includeTags: true
      }
    });
    this.replaceListing(x.data);
  }

  public websiteLink(url: string|null) {
    if (!url) { return ''; }
    if (!url.match(/^https?:\/\//)) { return url; }
    return `http://${url}`;
  }

  public get nestedTags() {
    const x = groupBy(this.listing.org.tags, 'name1');
    const y = Object.keys(x).map(k => x[k]);
    console.log("TAGS", y);
    return y;
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
