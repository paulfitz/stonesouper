<template>
  <div>

    <header>
      <!-- Fixed navbar -->
      <nav class="navbar navbar-expand-md navbar-dark fixed-top bg-dark">
        <a class="navbar-brand" href="#">DCC</a>
        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarCollapse" aria-controls="navbarCollapse" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarCollapse">
          <ul class="navbar-nav mr-auto">
            <li class="nav-item active">
              <a class="nav-link" href="#">Home <span class="sr-only">(current)</span></a>
            </li>
          </ul>
          <form class="form-inline mt-2 mt-md-0">
            <input class="form-control mr-sm-2" type="text" placeholder="Search" aria-label="Search">
            <button class="btn btn-outline-success my-2 my-sm-0" type="submit">Search</button>
          </form>
        </div>
      </nav>
    </header>

    <!-- Begin page content -->
    <main role="main" class="container main">

      <h1 class="mt-5">Stone Soup directory</h1>

      <p class="lead">

Discover the diversity of alternative economic projects that are growing and thriving in North America!
This is a collaborative directory, a
&ldquo;<a href="http://en.wikipedia.org/wiki/Stone_soup">Stone Soup</a>&rdquo; 
that brings together multiple databases from
groups working on alternative economies under many names: the new economy, 
the cooperative economy, the solidarity economy, and more.
Together we are the <a href="http://datacommons.coop">Data Commons Cooperative</a>.
We share our data with each other and the public to build a stronger base of information and grow our movements. 
Pitch in by 
<a href="http://member.datacommons.coop/applications/new">joining the co-op</a>.
Fish out bits you don't want with our advanced search filters.
Mmm, good soup!

      </p>

      <p>
        <router-link to="browse">Search the directory</router-link>
      </p>

    </main>

    <footer class="footer">
      <div class="container">
        <span class="text-muted">Aggregation by the Data Commons Cooperative.</span>
      </div>
    </footer>

  </div>
</template>

<style scoped>

/* Sticky footer styles
-------------------------------------------------- */
html {
  position: relative;
  min-height: 100%;
}
body {
  /* Margin bottom by footer height */
  margin-bottom: 60px;
}
.footer {
  position: absolute;
  bottom: 0;
  width: 100%;
  /* Set the fixed height of the footer here */
  height: 60px;
  line-height: 60px; /* Vertically center the text there */
  background-color: #f5f5f5;
}

.main {
  padding-top: 5em;
}

/* Custom page CSS
-------------------------------------------------- */
/* Not required for template or sticky footer method. */

body > .container {
  padding: 60px 15px 0;
}

.footer > .container {
  padding-right: 15px;
  padding-left: 15px;
}

code {
  font-size: 80%;
}
</style>
