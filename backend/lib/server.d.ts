export function startServer(filename: string, port: number, verbose: boolean): any;
export function stopServer(app: any): void;

export interface Query {
  key?: string[],
  city?: string[],
  state?: string[],
  country?: string[],
  around?: [number, number, number, 'km'|'mile'];  // lat, long, distance, unit
}

export interface Listing {
  org: {
    id: number,
    name: string
  }
}

export interface Hit {
  id: number,
  name: string
}
