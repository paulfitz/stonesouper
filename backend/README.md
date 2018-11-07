# stonesoup api

To run the stonesoup backend, get a `stonesoup.sqlite3` database (there's some
pseudo-data for testing purposes in `../data`) and then do:

```sh
npm install
node ./index.js
```

The most exhaustive information about the api can be found in the tests in
`test/test_api.ts`.

== GET /api/search?key=<keyword>

Search database for the given keyword, returning a list of organizations.

== POST /api/search

Accepts a json body of the form:

```ts
{
  key?: string[],
  city?: string[],
  state?: string[],
  country?: string[],
  around?: [number, number, number, 'km'|'mile'];  // latitude, longitude, distance, unit
}
```

All parameters are optional, and can be combined freely and efficiently.
Returns a list of organizations.

== GET /api/org/:id

Fetch information about an organization by id.

== GET /api/org/grouped/:id

Fetch information about an organization by id.  Gives back a list of entries that
have been grouped with that organization.

== POST /api/org/grouped/:id

Accepts a json body of the same form as /api/search, and returns only entries that
are grouped with the specified organization and that also meet the search criteria.

== GET /...

Any material placed in a `dist` subdirectory will be served.  So the single-page
application in `../frontend` can be placed here to make a fully standalone webserver.
