import * as bodyParser from 'body-parser';
import {Cache} from './cache';
import * as express from 'express';
import {Search} from './soup';
import {summarizeOrg} from './summary';
import {Server} from 'http';
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

export class Bundle {
  public cache: Cache;
  public db: Search;
  public server: Server;
  public app: express.Express;

  private _update?: Promise<void>;

  public constructor(public verbose: boolean) {
  }

  public startServer(filename: string, port: number) {
    const log = this.verbose ? console.log : (() => 1);

    const db = new Search(filename);
    this.db = db;
    this.cache = new Cache(30, 60 * 60 * 24);

    const app = express();
    this.app = app;
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

    this._addGeosearch();

    app.use(express.static('website'));

    const server = app.listen(port, () => log(`== port ${port}`));
    this.server = server;
  }

  public async close() {
    this.server.close();
    await this.sync();
  }

  public async sync() {
    if (this._update) {
      await this._update;
    }
  }

  private _addGeosearch() {
    // emulate solr endpoint
    this.app.get('/geosearch', (req, res) => {
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
      const key = JSON.stringify(body);

      const runCluster = () => {
        const raw = this.db.cluster(body);
        const cooked = {
          clusters: {
            features: [] as any[]
          },
          grouped_points: [] as any[],  // what goes here?  answer: nothing.
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
        return cooked;
      }

      const payload = this.cache.get(key);
      if (payload) {
        res.set('Content-Type', 'application/json');
        res.charset = 'utf-8';
        res.send(payload);
      } else {
        const cooked = this.cache.add(key, runCluster, JSON.stringify, true);
        res.json(cooked);
      }
      // Schedule a cache update if one is not already scheduled.
      if (!this._update) {
        this._update = new Promise((resolve, reject) => {
          try {
            process.nextTick(() => {
              this.cache.update();
              this._update = undefined;
              resolve();
            });
          } catch (e) {
            reject(e);
          }
        });
      }
    });
  }
}

export function startServer(filename: string, port: number, verbose: boolean) {
  const bundle = new Bundle(verbose);
  bundle.startServer(filename, port);
  return bundle;
}

export async function stopServer(bundle: Bundle) {
  return bundle.close();
}
