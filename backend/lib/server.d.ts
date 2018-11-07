export function startServer(filename: string, port: number, verbose: boolean): any;
export function stopServer(app: any): void;

export interface Query {
  key?: string[],
  city?: string[],
  state?: string[],
  country?: string[],
  around?: [number, number, number, 'km'|'mile'],  // lat, long, distance, unit
  group?: boolean
}

export interface Listing {
  org: {
    id: number,
    name: string,
  }
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

  // Everything up to this point is per-organization.  After this, we are per-location.

  location_label: string|null,
  address1: string|null,
  address2: string|null,
  city: string|null,
  state: string|null,
  zip: string|null,
  country: string|null,
  is_primary: number,

  latitude: number|null,
  longitude: number|null,
}

export interface Group {
  group: number,
  orgs: Hit[]
}

