import {assert} from 'chai';

import {Hit, Query, startServer, stopServer} from 'lib/server';

import axios from 'axios';

import * as tmp from 'tmp';
import * as fse from 'fs-extra';

let dbFilename: string;
let tmpobj;
let app: any;

const base = "http://localhost:9999";

async function search(query: Query): Promise<Hit[]> {
  const result = await axios.post(base + '/api/search', query);
  return result.data;
}

describe('server', async () => {

  before(async () => {
    // Copy the db before tests, in case we ever want to mutate it (we don't right now).
    tmp.setGracefulCleanup();
    tmpobj = tmp.dirSync({unsafeCleanup: true});
    dbFilename = `${tmpobj.name}/stonesoup.sqlite3`;
    await fse.copy('../data/stonesoup.sqlite3', dbFilename);
    app = startServer(dbFilename, 9999, false);
  });

  after(async () => {
    stopServer(app);
  });

  it('GET /api/search responds to params.key', async () => {
    const result = await axios.get(base + '/api/search', {
      params: {
        key: "Gangplank"
      }
    });
    assert.equal(result.data.length, 2);
  });

  it('POST /api/search can return everything', async () => {
    const result = await search({});
    assert.isAbove(result.length, 20);
  });

  it('POST /api/search responds to body.key', async () => {
    const result = await search({
      key: ["Gangplank"]
    });
    assert.equal(result.length, 2);
  });

  it('POST /api/search responds to body.city', async () => {
    let result: Hit[];

    result = await search({
      key: ["coffee"],
      city: ["Phoenix"]
    });
    assert.equal(result.length, 6);

    result = await search({
      city: ["Phoenix"]
    });
    assert.equal(result.length, 7);

    result = await search({
      key: ["coffee"],
      city: ["Phoenix", "London"]
    });
    assert.equal(result.length, 7);

    result = await search({
      key: ["coffee", "songbird"],
      city: ["Phoenix"]
    });
    assert.equal(result.length, 1);
    assert.equal(result[0].name, 'Songbird Coffee & Tea House');
  });

  it('POST /api/search responds to body.state', async () => {
    let result: Hit[];
    result = await search({
      state: ["CA"]
    });
    assert.equal(result.length, 49);

    result = await search({
      state: ["CA", "MA"]
    });
    assert.equal(result.length, 50);
  });

  it('POST /api/search responds to body.country', async () => {
    let result: Hit[];
    result = await search({
      country: ["Taiwan"]
    });
    assert.equal(result.length, 3);
  });

  it('POST /api/search responds to body.around', async () => {
    let result: Hit[];

    result = await search({
      around: [34.017951, -118.493567, 1, 'mile']
    });
    assert.equal(result.length, 1);
    assert.equal(result[0].name, 'Philz Coffee');

    result = await search({
      around: [34.017951, -118.493567, 100, 'mile']
    });
    assert.equal(result.length, 3);

    result = await search({
      around: [34.017951, -118.493567, 10000, 'mile']
    });
    assert.isAbove(result.length, 20);
  });

  it('GET /api/org/{orgId} works', async () => {
    const result = await axios.get(base + '/api/org/1');
    assert.equal(result.data.org.id, 1);
    assert.equal(result.data.org.name, 'Arcosanti');
  });
});
