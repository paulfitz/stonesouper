This is a start at rewriting https://github.com/datacommons/stonesoup, the directory software
that runs the http://find.coop website.

This is a backend only.  A demo frontend is available at https://github.com/paulfitz/stonesouper_demo_frontend

To run the backend, get a data commons
database and place it at backend/stonesoup.sqlite3.  If you don't have one, you can copy a small
demo db:

```
cp data/stonesoup.sqlite3 stonesoup.sqlite3
```

Then:

```
npm i
npm start
```

The backend will be serving on localhost:5555

The most exhaustive information about the api can be found in the tests in
`test/test_api.ts`.

## GET /api/search

Search database for the given keyword, returning a list of organizations.
See common parameters.

Example:

 * /api/search?key=philz
 * /api/search?key=coffee&city=Brooklyn

Returns a list of organizations.

## GET /api/map

As for the search endpoint, but returns a list of coordinates as opposed to 
organizations.  Example:

 * /api/map?key=coffee&state=CA

## GET /api/orgs/:id

Fetch information about an organization by ids returned in searches.

## GET /api/[city|state|country|zip|tag|team]

Gets a list of cities, states, countries etc.  Can be filtered by a prefix:

 * /api/city?state=NY
 * /api/city?state=NY&optionPrefix=i

## GET|POST /api/orgs/:id/grouped

Fetch information about an organization by id.  Gives back a list of entries that
have been grouped with that organization.

POST method accepts a json body of the same form as /api/search, and returns only entries that
are grouped with the specified organization and that also meet the search criteria.

## Common parameters

All the endpoints below can accept a set of parameters, either as query parameters
in a GET, or as json fields in a POST.  As JSON, the parameters are passed as follows:

```ts
{
  key?: string[],
  city?: string[],
  state?: string[],
  country?: string[],
  around?: [number, number, number, 'km'|'mile'];  // latitude, longitude, distance, unit,
  tag: string[],
  tags: {[kind: 'Sector'|'LegalStructure'|...]: string[]},
}
```

As query parameters, the same fields are passed.  If the field begins with 
the character '[' it is interpreted as json.  Otherwise, it is split on the character
';' and treated as a list of strings.

All parameters are optional, and can be combined freely and efficiently.

Tags that start with `!` are treated as tags to exclude.

## GET /...

Any material placed in a `website` subdirectory will be served.  So the single-page
application in `stonesouper_demo_frontend` can be placed here when compiled to make a
standalone webserver.
