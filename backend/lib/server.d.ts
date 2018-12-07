export function startServer(filename: string, port: number, verbose: boolean): any;
export function stopServer(app: any): void;

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

