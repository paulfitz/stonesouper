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
  }

  narrow_by_term(term) {
    if (!term) { return; }
    this.joins.push('inner join units' +
                    '  on units.taggable_id = organizations.id' +
                    '  and units.taggable_type = "Organization"');
    this.wheres.push('units match ?');
    this.params.push(term[0]);
  }

  select_locations() {
    this.joins.push('left join locations' +
                    '  on locations.taggable_id = organizations.id' +
                    '  and locations.taggable_type = "Organization"');
    this.selects.push('locations.physical_city', 'locations.latitude', 'locations.longitude');
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
    if (this.wheres) {
      txts.push("where");
      txts.push(this.wheres.join(' and '));
    }
    if (this.limits) {
      txts.push(this.limits);
    }
    return txts
  }
}

class Search {
  constructor(fname) {
    const db = new Database(fname);
    console.log(db.prepare('select name from organizations limit 3').all());
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

  search(args) {
    console.log("SEARCH", args);
    const query = new Query();
    query.narrow_by_term(args.key);
    query.select_locations();
    query.narrow_by_distance(args.around);
    query.narrow_by_geo('city', this.enlist(args.city));
    query.narrow_by_geo('state', args.state);
    query.narrow_by_geo('country', args.country);
    query.narrow_by_tags(args.tag);
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

  org(id) {
    const txts = [];
    txts.push('select * from organizations where id = ?');
    return this.db.prepare(txts.join(' ')).get(id);
  }
}

if (require.main === module) {
  const s = new Search();
  console.log(s.search({
    key: ['yellow'],
    city: ['Brooklyn', 'Yellow Springs'],
    verbose: true
  }));
  
  console.log(s.search({
    tag: ['Food'],
    around: [42.351822, -71.057484, 10, 'mile'],
    limit: 3,
    verbose: true
  }));

  console.log(s.org(288));
}

module.exports = {
  Search
};

