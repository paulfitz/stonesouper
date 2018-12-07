import {assert} from 'chai';

import {preferSite, summarizeName, summarizeDescription} from 'lib/summary';

function sumName(...names: (string | null)[]) {
  return summarizeName(names.map(val => ({name: val})));
}

function sumDesc(...descs: (string | null)[]) {
  return summarizeDescription(descs.map(val => ({description: val})));
}

describe('Summary', function() {

  it('can summarize names', function() {
    assert.equal(sumName('goodness coffee'), 'goodness coffee');
    assert.equal(sumName('Goodness Coffee', 'GOODNESS COFFEE'), 'Goodness Coffee');
    assert.equal(sumName('GOODNESS COFFEE', null, 'Goodness Coffee'), 'Goodness Coffee');
    assert.equal(sumName(
      'goodness coffee', 'Goodness Coffee', 'Goodness', 'Coffee', 'GOODNESS COFFEE'
    ), 'Goodness Coffee');
  });

  it('can summarize descriptions', function() {
    assert.equal(sumDesc("one"), "one");
    assert.equal(sumDesc("one", "three"), "three");
    assert.equal(sumDesc("three", "one"), "three");
    assert.equal(sumDesc(null, "", "something", null, "?"), "something");
    assert.equal(sumDesc(null), null);
  });

  it('has venerable coop prejudice', function() {
    assert.equal(preferSite('thing.com', 'thing.coop'), 'thing.coop');
    assert.equal(preferSite('thing.coop', 'thing.com'), 'thing.coop');
    assert.equal(preferSite(null, 'thing.com'), 'thing.com');
    assert.equal(preferSite('thing.com', null), 'thing.com');
    assert.equal(preferSite(null, null), null);
  });
});
