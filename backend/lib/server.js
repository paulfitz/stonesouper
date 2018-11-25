const express = require('express');
const bodyParser = require('body-parser');

const {Search} = require('./soup');

const {groupBy, values} = require('lodash');



// this logic for mapping sql results to nested json can probably be replaced with
// typeorm if it is patched to accept CTEs.
function nested1(vals /*: {[key: string]: any}*/) {
  const keys = Object.keys(vals);
  for (const key of keys) {
    const m = key.match(/^([a-z_0-9]+)__([a-z_0-9]+)$/);
    if (!m) { continue; }
    if (vals[m[1]] !== null) {
      if (typeof vals[m[1]] !== 'object') {
        vals[m[1]] = {};
      }
      vals[m[1]][m[2]] = vals[key];
    }
    delete vals[key];
  }
  return vals;
}

// this logic for mapping sql results to nested json can probably be replaced with
// typeorm if it is patched to accept CTEs.
function nested(vals2 /*: Array<{[key: string]: any}>*/) {
  const unpacked = vals2.map(nested1);
  if (unpacked.length > 0) {
    const last = {};
    const merged = [];
    for (const o of unpacked) {
      const id = o.id;
      const lid = last[id];
      if (lid === undefined) {
        last[id] = merged.length;
        merged.push(o);
        if (o.locs) { o.locs = [o.locs]; }
        else { o.locs = []; }
        if (o.tags) { o.tags = [o.tags]; }
        else { o.tags = []; }
      } else {
        if (o.locs) { merged[lid].locs.push(o.locs); }
        if (o.tags) { merged[lid].tags.push(o.tags); }
      }
    }
    return merged;
  }
  return unpacked;
}

function groupListings(data, params) {
  if (!params.group) {
    return nested(data);
  }
  return values(groupBy(data, data => data.grouping || data.id)).map(v => ({
    group: v[0].grouping,
    orgs: nested(v)
  }));
}

function getOrPost(app, path, action) {
  app.post(path, action);
  app.get(path, (req, res) => {
    const query = {};
    for (const key of Object.keys(req.query)) {
      const v = req.query[key];
      if (v[0] === '[' || v[0] == '{') {
        query[key] = JSON.parse(v);
      } else {
        query[key] = v.split(';');
      }
    }
    req.body = query;
    return action(req, res);
  });
}

function startServer(filename, port, verbose) {
  const log = verbose ? console.log : ((...args) => 1);

  const db = new Search(filename);

  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));

  app.use((req, res, next) => {
    log("--", req.url);
    next();
  });

  const api = express.Router();

  getOrPost(api, '/search', (req, res) => {
    res.json(groupListings(db.search(req.body), req.body));
  });

  getOrPost(api, '/map', (req, res) => {
    res.json(db.map(req.body));
  });

  getOrPost(api, '/map/min', (req, res) => {
    res.json(db.map(req.body, 'min'));
  });

  getOrPost(api, '/orgs/:id([0-9]+)', (req, res) => {
    const orgs = nested(db.groupedOrg(req.params.id, req.body));
    const org = orgs.filter(o => o.id === parseInt(req.params.id, 10))[0];
    res.json({ orgs, org });
  });

  for (const key of ['city', 'state', 'country', 'zip', 'tag']) {
    getOrPost(api, `/${key}`, (req, res) => {
      const options = db.options(key, req.body);
      const result = (key === 'tag') ? options : options.map(v => v[key]);
      res.json({ name: key, options: result });
    });
  }

  api.use(function(req, res) {
    const err = new Error("Not found");
    err.status = 404;
    throw err;
  });

  api.use(function(err, req, res, next) {
    const code = err.status || 500;
    if (code === 500) {
      console.error(err);
    }
    res.status(code).json({error: err.message, code});
  });

  app.use('/api', api);

  app.use(express.static('dist'));

  return app.listen(port, () => log(`== port ${port}`));
}

function stopServer(server) {
  server.close();
}

module.exports = {
  startServer,
  stopServer,
};
