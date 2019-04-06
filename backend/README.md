# stonesoup api

To run the stonesoup backend, get a `stonesoup.sqlite3` database (there's some
pseudo-data for testing purposes in `../data`) and then do:

```sh
npm install
node ./index.js
```

The most exhaustive information about the api can be found in the tests in
`test/test_api.ts`.

## Common parameters

All the endpoints below can accept a set of parameters, either as query parameters
in a GET, or as json fields in a POST.  As JSON, the parameters are passed as follows:

```ts
{
  key?: string[],
  city?: string[],
  state?: string[],
  country?: string[],
  around?: [number, number, number, 'km'|'mile'];  // latitude, longitude, distance, unit
}
```

As query parameters, the same fields are passed.  If the field begins with 
the character '[' it is interpreted as json.  Otherwise, it is split on the character
';' and treated as a list of strings.

All parameters are optional, and can be combined freely and efficiently.

## GET /api/search

Search database for the given keyword, returning a list of organizations.
See common parameters.

Example:

 * /api/search?key=philz
 * /api/search?key=coffee&city=Brooklyn

Returns a list of organizations.

## GET /api/map

As for the search endpoint, but returns a list of coordinates as opposed to 
organizations.

## GET /api/orgs/:id

Fetch information about an organization by id.

## GET|POST /api/orgs/:id/grouped

Fetch information about an organization by id.  Gives back a list of entries that
have been grouped with that organization.

POST method accepts a json body of the same form as /api/search, and returns only entries that
are grouped with the specified organization and that also meet the search criteria.

## GET /...

Any material placed in a `website` subdirectory will be served.  So the single-page
application in `../frontend` can be placed here when compiled to make a
standalone webserver.
