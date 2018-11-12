const Database = require('better-sqlite3');

const KMS_PER_MILE = 1.609;
const NMS_PER_MILE = 0.868976242;
const EARTH_RADIUS_IN_MILES = 3963.19;
const EARTH_RADIUS_IN_KMS = EARTH_RADIUS_IN_MILES * KMS_PER_MILE;
const EARTH_RADIUS_IN_NMS = EARTH_RADIUS_IN_MILES * NMS_PER_MILE;

function units_sphere_multiplier(units) {
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

function radians(deg) {
  return deg * Math.PI / 180.0;
}

function add_math_to_sqlite(db) {
  db.register(Math.sqrt);
  db.register(Math.cos);
  db.register(Math.sin);
  db.register(Math.acos);
  db.register(radians);
  db.register({name: 'least', varargs: true},
              Math.min);
}
    
function sphere_distance_sql(lat, lng, multiplier, threshold) {
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
  
class Query {
  constructor() {
    this.joins = [];
    this.wheres = [];
    this.params = [];
    this.selects = ["organizations.*"];
    this.joins.push("from organizations");
    this.limits = null;
    this.orders = null;
  }

  narrow_by_term(term) {
    if (!term) { return; }
    this.joins.push('inner join units' +
                    '  on units.taggable_id = organizations.id' +
                    '  and units.taggable_type = "Organization"');
    this.wheres.push('units match ?');
    this.params.push(term.join(' '));
  }

  select_locations() {
    this.joins.push('left join locations' +
                    '  on locations.taggable_id = organizations.id' +
                    '  and locations.taggable_type = "Organization"');
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

  narrow_by_geo(part, options) {
    if (!options) { return; }
    const qs = options.map(x => '?').join(',');
    this.wheres.push(`(locations.physical_${part} in (${qs})` +
                     ` or locations.mailing_${part} in (${qs}))`);
    this.params.push(...options);
    this.params.push(...options);
  }

  narrow_by_tags(tags) {
    if (!tags) { return; }
    const qs = tags.map(x => '?').join(',');
    this.joins.push('inner join taggings' +
                    '  on taggings.taggable_id = organizations.id' +
                    '  and taggings.taggable_type = "Organization"');
    this.joins.push('inner join tags' +
                    '  on tags.id = taggings.tag_id');
    this.wheres.push(`tags.name in (${qs})`);
    this.params.push(...tags);
  }

  narrow_by_distance(around) {
    if (!around) { return; }
    const [lat, lng, dist, unit] = around;
    const [dwhere, dparams] = sphere_distance_sql(parseFloat(lat, 10),
                                                  parseFloat(lng, 10),
                                                  units_sphere_multiplier(unit),
                                                  parseFloat(dist, 10));
    this.wheres.push(dwhere);
    this.params.push(...dparams);
  }

  narrow_by_grouping(grouping) {
    if (!grouping) { return; }
    // this is intended for use only by single-entry endpoint
    this.wheres.push('coalesce(grouping, organizations.id) = (select coalesce(org2.grouping, org2.id) from organizations as org2 where org2.id = ?)');
    this.params.push(grouping);
  }

  select_options(key, prefix) {
    if (!key) { return; }
    this.selects = ['distinct locations.physical_' + key + ' as ' + key];
    this.orders = 'order by locations.physical_' + key;
    if (prefix && prefix.length > 0) {
      this.wheres.push('locations.physical_' + key + " like ? collate nocase");
      this.params.push(prefix + '%');
    }
  }

  select_map(active) {
    if (!active) { return; }
    this.selects = ['locations.longitude as lng', 'locations.latitude as lat',
                    'organizations.name as name', 'organizations.id as org_id',
                    'locations.id as loc_id'];
    if (active !== 'min') {
      this.selects.push(
        'coalesce(locations.physical_address1,locations.mailing_address1) as address1',
        'coalesce(locations.physical_address2,locations.mailing_address2) as address2',
        'coalesce(locations.physical_city,locations.mailing_city) as city',
        'coalesce(locations.physical_state,locations.mailing_state) as state',
        'coalesce(locations.physical_country,locations.mailing_country) as country'
      );
    }
    this.orders = null;
  }

  limit(v) {
    if (!v) { return; }
    // nasty use of wheres
    this.limits = `limit ${parseInt(v, 10)}`;
  }

  serialize() {
    const txts = ["select"];
    txts.push(this.selects.join(", "));
    if (this.joins) {
      txts.push(...this.joins);
    }
    if (this.wheres && this.wheres.length) {
      txts.push("where");
      txts.push(this.wheres.join(' and '));
    }
    if (this.limits) {
      txts.push(this.limits);
    }
    if (this.orders) {
      txts.push(this.orders);
    }
    return txts
  }
}

class Search {
  constructor(fname) {
    const db = new Database(fname);
    add_math_to_sqlite(db);
    this.db = db;
  }

  enlist(arg) {
    if (typeof(arg) === 'string') {
      if (arg === '') {
        return null;
      }
      return [arg];
    }
    return arg;
  }

  single(arg) {
    if (!arg) { return arg; }
    if (typeof(arg) === 'string') { return arg; }
    return arg[0];
  }

  search(args) {
    const query = new Query();
    query.narrow_by_term(args.key);
    query.select_locations();
    query.narrow_by_distance(args.around);
    query.narrow_by_geo('city', this.enlist(args.city));
    query.narrow_by_geo('state', args.state);
    query.narrow_by_geo('country', args.country);
    query.narrow_by_tags(args.tag);
    query.narrow_by_grouping(args.grouping);
    query.select_options(args.options, this.single(args.optionPrefix));
    query.select_map(args.map);
    query.limit(args.limit);
    const txts = query.serialize();
    if (args.verbose) {
      for (const txt of txts) {
        console.log(txt);
      }
      console.log("   ", query.params);
    }
    return this.db.prepare(txts.join(' ')).all(query.params);
  }

  map(args, flavor) {
    args = args || {};
    args.map = flavor || 'normal';
    return this.search(args);
  }

  org(id) {
    const txts = [];
    txts.push('select * from organizations where id = ?');
    return this.db.prepare(txts.join(' ')).get(id);
  }

  locs(org_id) {
    const txts = [];
    txts.push('select * from locations where taggable_id = ? and taggable_type = ?');
    return this.db.prepare(txts.join(' ')).get(org_id, 'Organization');
  }

  groupedOrg(id, params) {
    params = params || {};
    params.grouping = id;
    return this.search(params);
  }

  options(key, params) {
    if (['city', 'state', 'country'].indexOf(key) < 0) { return []; }
    params = params || {};
    params.options = key;
    return this.search(params);
  }
}

if (require.main === module) {
  if (process.argv.length < 3) {
    console.log("call as: node ./lib/soup.js foo.sqlite3 [keyword]*");
    process.exit(1);
  }
  const s = new Search(process.argv[2]);
  const params = {
    verbose: false
  };
  if (process.argv.length > 3) {
    params.key = process.argv.slice(3);
  }
  console.log(JSON.stringify(s.search(params), null, 2));
}

module.exports = {
  Search
};

