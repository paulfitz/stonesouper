import {assert} from 'chai';

import {Group, Hit, Query, startServer, stopServer} from 'lib/server';

import axios from 'axios';

import * as tmp from 'tmp';
import * as fse from 'fs-extra';

import {orderBy} from 'lodash';

let dbFilename: string;
let tmpobj;
let app: any;

const base = "http://localhost:9999";

async function search(query: Query): Promise<Hit[]> {
  const result = await axios.post(base + '/api/search', query);
  return result.data;
}

async function searchGroup(query: Query): Promise<Group[]> {
  const query2 = JSON.parse(JSON.stringify(query));
  query2.group = true;
  const result = await axios.post(base + '/api/search', query2);
  return result.data;
}

function namify(lst: {name: string}[]) {
  return lst.map(item => item.name);
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
    assert.equal(result.data.length, 1);
  });

  it('POST /api/search can return everything', async () => {
    const result = await search({});
    assert.isAbove(result.length, 20);
  });

  it('POST /api/search responds to body.key', async () => {
    const result = await search({
      key: ["Gangplank"]
    });
    assert.equal(result.length, 1);
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

  it('POST /api/search responds to body.tags', async () => {
    let result: Hit[];
    result = await search({
      tags: {
        'Sector': ['open-password-place']
      }
    });
    assert.equal(result.length, 17);

    result = await search({
      tags: {
        'Sector': ['open-password-place'],
        'LegalStructure': ['wacky'],
      }
    });
    assert.equal(result.length, 6);

    result = await search({
      tags: {
        'Sector': ['open-password-place'],
        'LegalStructure': ['!wacky'],
      }
    });
    assert.equal(result.length, 11);
  });

  it('POST /api/search responds to body.team', async () => {
    let result: Hit[];
    result = await search({ team: [] });
    assert.equal(result.length, 0);
    result = await search({ team: ['Zing', 'Zong'] });
    assert.equal(result.length, 0);
    result = await search({ team: ['Hack Spots'] });
    assert.isAbove(result.length, 20);
  });

  it('POST /api/search responds to body.includeTags', async () => {
    let result: Hit[];
    result = await search({
      tags: {
        'Sector': ['open-password-place']
      },
      includeTags: true,
    });
    assert.equal(result.length, 17);
    const tags = result[0].tags!.map(tag => tag.name);
    assert.includeMembers(tags, ['open-password-place']);
  });

  it('POST /api/search responds to body.group', async () => {
    let groups: Group[];

    groups = await searchGroup({key: ['"croque monsieur" OR "stumptown" OR "konditori"']});
    assert.equal(groups.length, 2);
    orderBy(groups, v => v.group);
    assert.equal(groups[0].orgs.length, 1);
    assert.equal(groups[0].orgs[0].name, 'Stumptown');
    assert.equal(groups[1].orgs.length, 3);
    const names = groups[1].orgs.map(org => org.name).sort();
    assert.deepEqual(names, ['Konditori', 'La Maison du Croque Monsieur', 'Stumptown Ace Hotel']);
  });

  it('GET /api/orgs/{orgId} has org', async () => {
    const result = await axios.get(base + '/api/orgs/1');
    assert.equal(result.data.org.id, 0);
    assert.equal(result.data.org.name, 'University of Advancing Technology');
  });

  it('GET /api/orgs/{orgId} has orgs', async () => {
    const result = await axios.get(base + '/api/orgs/125');
    assert.equal(result.data.orgs.length, 12);
  });

  it('POST /api/orgs/{orgId} can be filtered', async () => {
    const result = await axios.post(base + '/api/orgs/125', {
      city: ['Brooklyn']
    });
    assert.equal(result.data.orgs.length, 8);
  });

  it('POST /api/city works', async () => {
    let result = await axios.post(base + '/api/city', {
      state: ['NY'],
    });
    assert.deepEqual(namify(result.data.options), ['Astoria', 'Brooklyn', 'Ithaca', 'New York']);
    result = await axios.post(base + '/api/city', {
      state: ['NY'],
      optionPrefix: 'i'
    });
    assert.deepEqual(namify(result.data.options), ['Ithaca']);
  });

  it('GET /api/city works', async () => {
    let result = await axios.get(base + '/api/city?state=NY');
    assert.deepEqual(namify(result.data.options), ['Astoria', 'Brooklyn', 'Ithaca', 'New York']);
    result = await axios.get(base + '/api/city?state=NY&optionPrefix=i');
    assert.deepEqual(namify(result.data.options), ['Ithaca']);
  });

  it('POST /api/state works', async () => {
    let result = await axios.post(base + '/api/state', {
      country: ['USA'],
    });
    assert.includeMembers(namify(result.data.options), ['AZ', 'CA', 'OR']);
    result = await axios.post(base + '/api/state', {
      country: ['USA'],
      optionPrefix: 'm'
    });
    assert.deepEqual(namify(result.data.options), ['MA', 'ME', 'MN']);
  });

  it('POST /api/country works', async () => {
    let result = await axios.post(base + '/api/country', {
    });
    assert.includeMembers(namify(result.data.options), ['Australia', 'Japan']);
    result = await axios.post(base + '/api/country', {
      optionPrefix: 'i'
    });
    assert.deepEqual(namify(result.data.options), ['Indonesia', 'Ireland', 'Italy']);
  });

  it('POST /api/zip works', async () => {
    let result = await axios.post(base + '/api/zip', {
    });
    assert.includeMembers(namify(result.data.options), ['94115', 'H2V 1Y1']);
  });

  it('POST /api/tag works', async () => {
    let result = await axios.post(base + '/api/tag', {
    });
    assert.deepEqual(namify(result.data.options),
                     ['hack spot', 'open-password-place', 'wacky']);
  });

  it('POST /api/tag can be filtered by parent', async () => {
    let result = await axios.post(base + '/api/tag', {
      parents: ['Sector']
    });
    assert.deepEqual(namify(result.data.options), ['open-password-place']);
  });

  it('POST /api/tag_parent works', async () => {
    let result = await axios.post(base + '/api/tag_parent', {
    });
    assert.includeMembers(namify(result.data.options), ['LegalStructure', 'Sector']);
  });

  it('POST /api/team works', async () => {
    let result = await axios.post(base + '/api/team', {
    });
    assert.includeMembers(namify(result.data.options), ['Hack Spots']);
  });

  it('GET /api/map works', async () => {
    const result = await axios.get(base + '/api/map?key=coffee&city=Brooklyn');
    assert.equal(result.data.length, 2);
    assert.includeMembers(Object.keys(result.data[0]), ['lat', 'lng', 'name']);
  });

  it('GET /api/nothing throws json error', async () => {
    const result = await axios.get(base + '/api/nothing',
                                   { validateStatus: (status: number) => true });
    assert.equal(result.status, 404);
    assert.includeMembers(Object.keys(result.data), ['error', 'code']);
    assert.equal(result.data.code, 404);
  });

  it('GET /api/autocomplete works', async () => {
    const result = await axios.get(base + '/api/autocomplete?key=o');
    const types = result.data.map((x: any) => x.type);
    assert.includeMembers(types, ['org', 'tag', 'city', 'state']);
  });

});
