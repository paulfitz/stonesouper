import * as BetterSqlite3 from 'better-sqlite3';
import * as Supercluster from 'supercluster';

const KMS_PER_MILE = 1.609;
const NMS_PER_MILE = 0.868976242;
const EARTH_RADIUS_IN_MILES = 3963.19;
const EARTH_RADIUS_IN_KMS = EARTH_RADIUS_IN_MILES * KMS_PER_MILE;
const EARTH_RADIUS_IN_NMS = EARTH_RADIUS_IN_MILES * NMS_PER_MILE;

export interface Query {
  key?: string[],
  city?: string[],
  state?: string[],
  country?: string[],
  around?: [number, number, number, 'km'|'mile'],  // lat, long, distance, unit

  map?: 'min'|'normal',
  tag?: string[],
  tags?: {[parent: string]: string[]},
  team?: string[],

  range?: [number, number, number, number],   // minLng, minLat, maxLng, maxLat
  zoom?: number,
  radius?: number,
  maxZoom?: number,

  optionPrefix?: string,

  group?: boolean,
  includeTags?: boolean,
  parents?: string[],
}

export interface Coord {
  lat: string,
  lng: string,
}

export interface Address {
  address1: string,
  address2: string,
  city: string,
  state: string,
  zip: string,
  country: string,
}

export interface MinMapItem extends Coord {
  name: string,
  org_id: number,
  loc_id: number,
}

export interface MapItem extends MinMapItem, Address {
}

export interface Loc extends Coord, Address {
  id: number,
  is_primary?: boolean,
}

export interface Org {
  id: number,
  name: string,
  locs: Array<Loc>,
}

export interface Tag {
  id: number,
  name: string,
  id1: number|null,
  name1: string|null,
  id2: number|null,
  name2: string|null,
}

export interface Hit {
  id: number,
  name: string,

  description: string,

  website: string|null,
  email: string|null,
  phone: string|null,
  fax: string|null,

  year_founded: number|null,

  created_at: string|null,
  updated_at: string|null,

  locs: Loc[],
  tags?: Tag[],
}

export interface Group {
  group: number,
  orgs: Hit[]
}


function units_sphere_multiplier(units: string) {
  units = units.split('s')[0]
  if (units === 'km') {
    return EARTH_RADIUS_IN_KMS
  } else if (units === 'nm') {
    return EARTH_RADIUS_IN_NMS;
  } else if (units === 'mile') {
    return EARTH_RADIUS_IN_MILES
  }
  throw new Error('unrecognized unit');
}

function radians(deg: number) {
  return deg * Math.PI / 180.0;
}

function add_math_to_sqlite(db: any) {
  db.register(Math.sqrt);
  db.register(Math.cos);
  db.register(Math.sin);
  db.register(Math.acos);
  db.register(radians);
  db.register({name: 'least', varargs: true},
              Math.min);
}
    
function sphere_distance_sql(lat: number, lng: number, multiplier: number,
                             threshold: number): [string, number[]] {
  const cond = " \
       latitude is not null and longitude is not null and \
        (ACOS(least(1,COS(?)*COS(?)*COS(RADIANS(latitude))*COS(RADIANS(longitude))+ \
          COS(?)*SIN(?)*COS(RADIANS(latitude))*SIN(RADIANS(longitude))+ \
          SIN(?)*SIN(RADIANS(latitude))))*?) <= ? \
          ";
  const rlat = radians(lat);
  const rlng = radians(lng);
  const params = [rlat, rlng, rlat, rlng, rlat, multiplier, threshold];
  return [cond, params];
}
  
class QueryBuilder {
  public joins: string[] = ["from organizations"];
  public wheres: string[] = [];
  public params: any[] = [];
  public selects: string[] = ["organizations.*"];
  public groups?: string[];
  public limits?: string|null = null;
  public orders: string|null = null;
  public have_tags: any = {};
  public have_dsos: boolean = false;

  constructor() {
  }

  public narrow_by_term(term?: string[]) {
    if (!term) { return; }
    this.joins.push('inner join units' +
                    '  on units.taggable_id = organizations.id' +
                    '  and units.taggable_type = \'Organization\'');
    this.wheres.push('units match ?');
    this.params.push(term.join(' '));
  }

  public select_locations() {
    this.joins.push('left join locations' +
                    '  on locations.taggable_id = organizations.id' +
                    '  and locations.taggable_type = \'Organization\'');
    // For historic reasons, stonesoup dbs have physical and mailing addresses
    // in a single location record.  This didn't really work well so is unused.
    // location_label can be set to 'physical' or 'mailing' if type of address is
    // known.
    this.selects.push('locations.id = organizations.primary_location_id as locs__is_primary',
                      'locations.id as locs__id',
                      'locations.note as locs__label',
                      'locations.physical_address1 as locs__address1',
                      'locations.physical_address2 as locs__address2',
                      'locations.physical_city as locs__city',
                      'locations.physical_state as locs__state',
                      'locations.physical_zip as locs__zip',
                      'locations.physical_country as locs__country',
                      'locations.latitude as locs__lat',
                      'locations.longitude as locs__lng');
  }

  public narrow_by_geo(part: string, options: string[]|null) {
    if (!options) { return; }
    const qs = options.map(x => '?').join(',');
    if (part === 'zip' && !options.some(x => x.includes('-'))) {
      // a nuance with zip codes is we may want to match weakly
      const clauses = [];
      for (const opt of options) {
        const safeOpt = opt.replace(/[^a-zA-Z0-9]/g, '');
        clauses.push(`(locations.physical_${part} like '${safeOpt}%' ` +
                     ` or locations.mailing_${part} like '${safeOpt}%')`);
      }
      this.wheres.push(`(${clauses.join(' or ')})`)
    } else {
      this.wheres.push(`(locations.physical_${part} in (${qs})` +
                       ` or locations.mailing_${part} in (${qs}))`);
      this.params.push(...options);
      this.params.push(...options);
    }
  }

  public join_tags(postfix: string, joinType?: string) {
    joinType = joinType || 'inner';
    if (this.have_tags[postfix]) { return; }
    this.joins.push(`${joinType} join taggings as taggings${postfix}` +
                    `  on taggings${postfix}.taggable_id = organizations.id` +
                    `  and taggings${postfix}.taggable_type = \'Organization\'`);
    this.joins.push(`${joinType} join tags as tags${postfix}` +
                    `  on tags${postfix}.id = taggings${postfix}.tag_id`);
    this.have_tags[postfix] = true;
  }

  public narrow_by_tags(tags: string[]) {
    if (!tags) { return; }
    this.narrow_by_many_tags({'': tags});
  }

  public narrow_by_many_tags(tags: {[name: string]: string[]}) {
    if (!tags) { return; }
    const keys = Object.keys(tags);
    for (const key of keys) {
      const ptags = tags[key].filter(k => k[0] !== '!');
      const ntags = tags[key].filter(k => k[0] === '!').map(k => k.slice(1));
      const postfix = key ? `_${key}` : '';
      if (ptags.length > 0) {
        this.join_tags(postfix)
        if (key !== '') {
          // key is the expected parent
          this.wheres.push(`tags${postfix}.parent_id = (select id from tags as t${postfix} where name = ? order by id limit 1)`);
          this.params.push(key);
        }
        const pqs = ptags.map(x => '?').join(',');
        this.wheres.push(`tags${postfix}.name in (${pqs})`);
        this.params.push(...ptags);
      }
      if (ntags.length > 0) {
        const npostfix = '_' + postfix;
        const nqs = ntags.map(x => '?').join(',');
        this.params.push('Organization');
        if (key !== '') {
          this.wheres.push(`(not exists(select 1 from taggings as tg2${npostfix} inner join tags as t2${npostfix} on tg2${npostfix}.tag_id = t2${npostfix}.id where tg2${npostfix}.taggable_id = organizations.id and tg2${npostfix}.taggable_type=? and t2${npostfix}.parent_id = (select id from tags as t${npostfix} where name = ? order by id limit 1) and t2${npostfix}.name in (${nqs})))`);
          this.params.push(key);
        } else {
          this.wheres.push(`(not exists(select 1 from taggings as tg2${npostfix} inner join tags as t2${npostfix} on tg2${npostfix}.tag_id = t2${npostfix}.id where tg2${npostfix}.taggable_id = organizations.id and tg2${npostfix}.taggable_type=? and t2${npostfix}.name in (${nqs})))`);
        }
        this.params.push(...ntags);
      }
    }
  }

  public join_dsos() {
    if (this.have_dsos) { return; }
    this.joins.push('inner join data_sharing_orgs_taggables as dt on dt.taggable_id = organizations.id and dt.taggable_type = \'Organization\'');
    this.joins.push('inner join data_sharing_orgs on dt.data_sharing_org_id = data_sharing_orgs.id');
    this.have_dsos = true;
  }

  public narrow_by_dsos(dsos?: string[]) {
    if (!dsos) { return; }
    this.join_dsos();
    const qs = dsos.map(x => '?').join(',');
    this.wheres.push(`data_sharing_orgs.name in (${qs})`);
    this.params.push(...dsos);
  }

  public narrow_by_distance(around?: [string, string, string, string]) {
    if (!around) { return; }
    const [lat, lng, dist, unit] = around;
    const [dwhere, dparams] = sphere_distance_sql(parseFloat(lat),
                                                  parseFloat(lng),
                                                  units_sphere_multiplier(unit),
                                                  parseFloat(dist));
    this.wheres.push(dwhere);
    this.params.push(...dparams);
  }

  public narrow_by_grouping(grouping?: number) {
    if (!grouping) { return; }
    // this is intended for use only by single-entry endpoint
    this.wheres.push('coalesce(grouping, organizations.id) = (select coalesce(org2.grouping, org2.id) from organizations as org2 where org2.id = ?)');
    this.params.push(grouping);
  }

  public select_options(key: string|undefined, prefix: string, args: {parents: string[]}) {
    if (!key) { return; }
    if (key === 'tag') { this.select_tag_options(prefix, args); }
    else if (key === 'tag_parent') { this.select_tag_parent_options(prefix); }
    else if (key === 'team') { this.select_team_options(prefix); }
    else { this.select_loc_options(key, prefix); }
  }

  public select_tag_options(prefix: string, args: {parents: string[]}) {
    this.selects = ['distinct tags.id, tags.name'];
    this.orders = 'order by tags.name';
    this.wheres.push('tags.name <> "" and tags.name is not null');
    this.join_tags("");
    if (args.parents) {
      this.joins.push('inner join tags as tags_parent on tags.parent_id = tags_parent.id')
      const ps = args.parents.map(x => '?').join(',');
      this.wheres.push(`tags_parent.name in (${ps})`);
      this.params.push(...args.parents);
    }
    if (prefix && prefix.length > 0) {
      this.wheres.push("tags.name like ? collate nocase");
      this.params.push(prefix + '%');
    }
  }

  public select_tag_parent_options(prefix: string) {
    this.selects = ['distinct tags_parent.id as id, tags_parent.name'];
    this.orders = 'order by tags_parent.name';
    this.join_tags("");
    this.joins.push('inner join tags as tags_parent on tags.parent_id = tags_parent.id')
    if (prefix && prefix.length > 0) {
      this.wheres.push("tags_parent.name like ? collate nocase");
      this.params.push(prefix + '%');
    }
  }

  public select_team_options(prefix: string) {
    this.selects = ['distinct data_sharing_orgs.id as id, data_sharing_orgs.name'];
    this.orders = 'order by data_sharing_orgs.name';
    this.join_dsos();
    if (prefix && prefix.length > 0) {
      this.wheres.push("data_sharing_orgs.name like ? collate nocase");
      this.params.push(prefix + '%');
    }
  }

  public select_loc_options(key?: string, prefix?: string) {
    if (!key) { return; }
    this.selects = ['distinct locations.physical_' + key + ' as name'];
    this.wheres.push('locations.physical_' + key + ' <> "" and locations.physical_' + key + ' is not null');
    this.orders = 'order by locations.physical_' + key;
    if (prefix && prefix.length > 0) {
      this.wheres.push('locations.physical_' + key + " like ? collate nocase");
      this.params.push(prefix + '%');
    }
  }

  public select_map(active: string|undefined, range: [number, number, number, number],
                    args: {icon?: boolean}) {
    if (!active) { return; }
    this.selects = ['locations.longitude as lng', 'locations.latitude as lat',
                    'organizations.name as name', 'organizations.id as org_id',
                    'locations.id as loc_id'];
    if (range) {
      this.wheres.push('locations.longitude >= ? and locations.longitude <= ? and ' +
                       'locations.latitude >= ? and locations.latitude <= ?');
      this.params.push(range[0], range[2], range[1], range[3]);
    }
    if (active !== 'min') {
      this.selects.push(
        'coalesce(locations.physical_address1,locations.mailing_address1) as address1',
        'coalesce(locations.physical_address2,locations.mailing_address2) as address2',
        'coalesce(locations.physical_zip,locations.mailing_zip) as zip',
        'coalesce(locations.physical_city,locations.mailing_city) as city',
        'coalesce(locations.physical_state,locations.mailing_state) as state',
        'coalesce(locations.physical_country,locations.mailing_country) as country'
      );
    }
    if (active === 'directory') {
      this.selects.push('grouping');
    }
    if (args.icon) {
      // for dbs that have an icon field attached to organizations, select it.
      this.selects.push('icon_group_id');
    }
    this.orders = null;
  }

  public select_tags(active?: string) {
    if (!active) { return; }
    // throw new Error('Not yet supported');
    this.joins.push('left join taggings as sel_taggings ' +
                    'on sel_taggings.taggable_id = organizations.id and ' +
                    '  sel_taggings.taggable_type = \'Organization\'');
    this.joins.push('left join tags as main_tag on sel_taggings.tag_id = main_tag.id');
    this.joins.push('left join tags as parent_tag on parent_tag.id = main_tag.parent_id');
    this.joins.push('left join tags as grandparent_tag on grandparent_tag.id = parent_tag.parent_id');
    this.selects.push('main_tag.name as tags__name, main_tag.id as tags__id');
    this.selects.push('parent_tag.name as tags__name1, parent_tag.id as tags__parent_id1');
    this.selects.push('grandparent_tag.name as tags__name2, grandparent_tag.id as tags__id2');
  }

  public limit(v: string) {
    if (!v) { return; }
    // nasty use of wheres
    this.limits = `limit ${parseInt(v, 10)}`;
  }

  public serialize() {
    const txts = ["select"];
    txts.push(this.selects.join(", "));
    if (this.joins) {
      txts.push(...this.joins);
    }
    if (this.wheres && this.wheres.length) {
      txts.push("where");
      txts.push(this.wheres.join(' and '));
    }
    if (this.groups) {
      txts.push("group by");
      txts.push(this.groups.join(', '));
    }
    if (this.orders) {
      txts.push(this.orders);
    }
    if (this.limits) {
      txts.push(this.limits);
    }
    return txts;
  }

  public text() {
    return this.serialize().join(' ');
  }
}

export class Search {
  private db: BetterSqlite3.Database;

  constructor(fname: string) {
    const db = new BetterSqlite3(fname);
    add_math_to_sqlite(db);
    this.db = db;
  }

  public enlist(arg: string|string[]|null) {
    if (typeof(arg) === 'string') {
      if (arg === '') {
        return null;
      }
      return [arg];
    }
    return arg;
  }

  public single(arg: string|string[]) {
    if (!arg) { return arg; }
    if (typeof(arg) === 'string') { return arg; }
    return arg[0];
  }

  public compile(args: any) {
    const query = new QueryBuilder();
    query.narrow_by_term(args.key);
    query.select_locations();
    query.narrow_by_distance(args.around);
    query.narrow_by_geo('city', this.enlist(args.city));
    query.narrow_by_geo('state', args.state);
    query.narrow_by_geo('country', args.country);
    query.narrow_by_geo('zip', args.zip);
    query.narrow_by_tags(args.tag);
    query.narrow_by_many_tags(args.tags);
    query.narrow_by_dsos(args.team);
    query.narrow_by_grouping(args.grouping);
    query.select_options(args.options, this.single(args.optionPrefix), args);
    query.select_map(args.map, args.range, args);
    query.select_tags(args.includeTags);
    query.limit(args.limit);
    if (args.onePerGroup) {
      query.groups = ['coalesce(grouping, organizations.id)'];
    }
    return query;
  }

  public search(args: any) {
    const query = this.compile(args);
    if (args.verbose) {
      const txts = query.serialize();
      for (const txt of txts) {
        console.log(txt);
      }
      console.log("   ", query.params);
    }
    return this.db.prepare(query.text()).all(query.params);
  }

  public map(args: any, flavor?: string) {
    args = args || {};
    args.map = flavor || args.map || 'normal';
    return this.search(args);
  }

  public cluster(args: any) {
    args = args || {};
    args.map = 'min';
    const range = args.range || [-180, -85, 180, 85];
    const zoom = args.zoom || 2;
    const radius = parseFloat(args.radius || '70');
    const maxZoom = parseFloat(args.maxZoom || '16');
    const results = this.search(args);
    const index = new Supercluster({
      radius,
      maxZoom
    });
    const data = results.map(row => ({
      "type": "Feature" as "Feature",
      "geometry": {
        "type": "Point" as "Point",
        "coordinates": [parseFloat(row.lng), parseFloat(row.lat)]
      },
      "properties": {
        name: row.name,
        id: row.org_id,
        icon: row.icon_group_id
      }
    })).filter(feat => !(isNaN(feat.geometry.coordinates[0]) ||
                         isNaN(feat.geometry.coordinates[1])));
    index.load(data);
    return index.getClusters(range, zoom);
  }

  public org(id: number) {
    const txts = [];
    txts.push('select * from organizations where id = ?');
    return this.db.prepare(txts.join(' ')).get(id);
  }

  public locs(org_id: number) {
    const txts = [];
    txts.push('select * from locations where taggable_id = ? and taggable_type = ?');
    return this.db.prepare(txts.join(' ')).get(org_id, 'Organization');
  }

  public groupedOrg(id: number, params: any) {
    params = params || {};
    params.grouping = id;
    return this.search(params);
  }

  public options(key: string, params: any) {
    if (['city', 'state', 'country', 'zip', 'tag',
         'tag_parent', 'team'].indexOf(key) < 0) { return []; }
    params = params || {};
    params.options = key;
    return this.search(params);
  }

  public addType(type: string, lst: any[]) {
    lst.forEach(x => x.type = type);
    lst.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    return lst;
  }

  public autocomplete(params: any, limit?: number) {
    if (!params.key) { return []; }
    if (params.key.length !== 1) { return []; }
    const key = params.key[0];
    params = params || {};

    if (key === "") {
      params.key = null;
      params.optionPrefix = key;
      params.options = 'team';
      return this.addType('team', this.search(params));
    }

    const results = [];
    params.limit = limit || 3;

    params.key = null;
    params.optionPrefix = key;
    for (const option of ['team', 'tag', 'city', 'state', 'country', 'zip']) {
      params.options = option;
      results.push(...this.addType(option, this.search(params)));
    }
    params.options = null;
    params.optionPrefix = null;

    params.key = [String(key) + '*'];
    params.map = 'min';
    params.onePerGroup = true;
    results.push(...this.addType('org', this.search(params)));
    params.key = null;
    params.map = null;

    return results;
  }
}

if (require.main === module) {
  if (process.argv.length < 3) {
    console.log("call as: ts-node ./lib/soup.ts foo.sqlite3 [keyword]*");
    process.exit(1);
  }
  const s = new Search(process.argv[2]);
  const params: any = {
    verbose: false
  };
  if (process.argv.length > 3) {
    params.key = process.argv.slice(3);
  }
  console.log(JSON.stringify(s.search(params), null, 2));
}

