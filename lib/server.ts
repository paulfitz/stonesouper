import * as bodyParser from 'body-parser';
import * as express from 'express';
import {Search} from './soup';
import {summarizeOrg} from './summary';
import {groupBy, values} from 'lodash';

function nested1(vals: {[key: string]: any}) {
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

function nested(vals2: Array<{[key: string]: any}>) {
  const unpacked = vals2.map(nested1);
  if (unpacked.length > 0) {
    const last: {[name: string]: number} = {};
    const merged = [];
    const locIds = new Set();
    for (const o of unpacked) {
      const id = o.id;
      const lid = last[id];
      if (lid === undefined) {
        last[id] = merged.length;
        merged.push(o);
        if (o.locs) { locIds.add(o.locs.id); o.locs = [o.locs]; }
        else { o.locs = []; }
        if (o.tags) { o.tags = [o.tags]; }
        else { o.tags = []; }
      } else {
        if (o.locs) {
          if (!locIds.has(o.locs.id)) {
            locIds.add(o.locs.id);
            merged[lid].locs.push(o.locs);
          }
        }
        if (o.tags) { merged[lid].tags.push(o.tags); }
      }
    }
    return merged;
  }
  return unpacked;
}

function groupListings(data: any, params: any) {
  if (!params.group) {
    return nested(data);
  }
  return values(groupBy(data, data => data.grouping || data.id)).map(v => ({
    group: v[0].grouping,
    orgs: nested(v)
  }));
}

function getOrPost(app: express.Router, path: string, action: express.RequestHandler) {
  app.post(path, action);
  app.get(path, (req, res, next) => {
    const query: {[name: string]: any} = {};
    for (const key of Object.keys(req.query)) {
      const v = req.query[key];
      if (v[0] === '[' || v[0] == '{') {
        query[key] = JSON.parse(v);
      } else {
        query[key] = v.split(';');
      }
    }
    req.body = query;
    return action(req, res, next);
  });
}

function asList(param: string[]|string|null) {
  if (!param) { return null; }
  if (!Array.isArray(param)) {
    param = [param];
  }
  return param.map(p => p.startsWith('-') ? `!${p.slice(1)}` : p);
}

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export function startServer(filename: string, port: number, verbose: boolean) {
  const log = verbose ? console.log : (() => 1);

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

  getOrPost(api, '/map/cluster', (req, res) => {
    res.json(db.cluster(req.body));
  });


  getOrPost(api, '/orgs/:id([0-9]+)', (req, res) => {
    const orgs = nested(db.groupedOrg(req.params.id, req.body));
    const org = summarizeOrg(orgs as any, parseInt(req.params.id, 10));
    res.json({ orgs, org });
  });

  for (const key of ['city', 'state', 'country', 'zip', 'tag', 'tag_parent', 'team']) {
    getOrPost(api, `/${key}`, (req, res) => {
      const options = db.options(key, req.body);
      res.json({ name: key, options });
    });
  }

  getOrPost(api, '/autocomplete', (req, res) => {
    res.json(db.autocomplete(req.body));
  });

  api.use(function(req, res) {
    throw new ApiError("Not found", 404);
  });

  api.use(function(err: ApiError, req: express.Request, res: express.Response, next: express.NextFunction) {
    const code = err.status || 500;
    if (code === 500) {
      console.error(err);
    }
    res.status(code).json({error: err.message, code});
  });

  app.use('/api', api);

  // emulate solr endpoint
  app.get('/geosearch', (req, res) => {
    if (!req.query.bounds) {
      throw new Error("need bounds");
    }
    if (!req.query.zoom) {
      throw new Error("need bounds");
    }
    const body: any = {
      range: req.query.bounds.split(',').map((x: string) => parseFloat(x)),
      zoom: parseInt(req.query.zoom),
      icon: true,
      radius: req.query.radius,
      maxZoom: req.query.maxZoom,
    };
    if (req.query.country) { body.country = asList(req.query.country); }
    if (req.query.city) { body.city = asList(req.query.city); }
    if (req.query.zip) { body.zip = asList(req.query.zip); }
    if (req.query.state_two_letter) { body.state = asList(req.query.state_two_letter); }
    if (req.query.type_name) { body.tag = asList(req.query.type_name); }
    if (req.query.search_text) { body.key = asList(req.query.search_text); }
    if (req.query.require_org_type) {
      // solidarity db is a bit misconfigured, OrgTypes don't have parents set up :(
      if (!body.tags) { body.tags = {}; }
      body.tags[''] = asList(req.query.require_org_type);
    }
    const raw = db.cluster(body);
    const cooked = {
      clusters: {
        features: [] as any[]
      },
      grouped_points: [] as any[],  // what goes here?
      single_points: {
        features: [] as any[]
      }
    }
    for (const feat of raw) {
      delete feat.id;
      if (feat.properties.cluster) {
        cooked.clusters.features.push(feat);
        feat.properties = {clusterCount: feat.properties.point_count};
      } else {
        cooked.single_points.features.push(feat);
        feat.properties = {
          popupContent: feat.properties.name,
          org_id: String(feat.properties.id),
          icon_group_id: String(feat.properties.icon)
        };
      }
    }
    res.json(cooked);
  });

  app.use(express.static('website'));

  return app.listen(port, () => log(`== port ${port}`));
}

export function stopServer(server: any) {
  server.close();
}

