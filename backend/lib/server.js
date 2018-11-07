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
    if (unpacked[0].__merge__) {
      const results = [];
      let at /*: string|null*/ = null;
      let active /*: {[key: string]: any} | null*/ = null;
      for (const vals of vals2) {
        const nat = vals.__merge__;
        delete vals.__merge__;
        if (nat !== at || !active) {
          results.push(vals);
          active = vals;
          at = nat;
        }
        const keys = Object.keys(vals);
        for (const key of keys) {
          const m = key.match(/^__([a-z_]+)$/);
          if (!m) { continue; }
          const name = m[1];
          if (typeof active[name] !== 'object') {
            active[name] = [];
          }
          if (vals[key] !== null) {
            active[name].push(vals[key]);
          }
          delete vals[key];
        }
      }
      return results;
    }
  }
  return unpacked;
}


function groupListings(data, params) {
  if (!params.group) {
    return data;
  }
  return values(groupBy(data, data => data.grouping || data.id)).map(v => ({
    group: v[0].grouping,
    orgs: v
  }));
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

  app.get('/api/search', (req, res) => {
    const args = req.body;
    if (req.query.key) {
      args.key = [req.query.key];
    }
    res.json(groupListings(db.search(args), args));
  });

  app.post('/api/search', (req, res) => {
    res.json(groupListings(db.search(req.body), req.body));
  });

  app.get('/api/org/:id([0-9]+)', (req, res) => {
    const org = db.org(req.params.id);
    const locs = db.locs(req.params.id);
    res.json({ org, locs: [locs]});
  });

  app.get('/api/org/grouped/:id([0-9]+)', (req, res) => {
    const orgs = db.groupedOrg(req.params.id);
    res.json({ orgs: nested(orgs) });
  });

  app.post('/api/org/grouped/:id([0-9]+)', (req, res) => {
    const orgs = db.groupedOrg(req.params.id, req.body);
    res.json({ orgs: nested(orgs) });
  });

  for (const key of ['city', 'state', 'country']) {
    app.post(`/api/options/${key}`, (req, res) => {
      const options = db.options(key, req.body).map(v => v[key]);
      res.json({ options });
    });
  }

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
