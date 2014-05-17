var assert = require('assert')
  , fs = require('fs')
  , tools = require('../datapackage-read.js')
  ;

var dpin = {
  "name": "gold-prices",
  "readme": "Abc *em*\n\nXyz",
  "resources": [
    {
      "path": "data/data.csv",
      "format": "csv",
      "schema": {
        "fields": [
          {
            "type": "date",
            "id": "date"
          },
          {
            "type": "number",
            "id": "price"
          }
        ]
      }
    }
  ]
};
var dpin2 = JSON.parse(JSON.stringify(dpin));
dpin2.readme = 'Abc *em*\nzzz\n\nXYZ';
var sourceUrl = 'https://raw.github.com/datasets/gold-prices/master/datapackage.json'; 
var sourceUrlBase = 'https://raw.github.com/datasets/gold-prices/master/'; 

describe('normalize', function() {
  it('works in basic case', function() {
    dpout = tools.normalize(dpin, sourceUrl);
    assert.equal(dpout.resources[0].url, sourceUrlBase + 'data/data.csv');
    assert.equal(dpout.description, 'Abc em');
    assert.equal(dpout.homepage, 'https://github.com/datasets/gold-prices');
    assert.equal(dpout.bugs.url, 'https://github.com/datasets/gold-prices/issues');
  });
  it('updates resource schema (for JTS change)', function() {
    dpout = tools.normalize(dpin, sourceUrl);
    assert.equal(dpout.resources[0].schema.fields[0].name, dpin.resources[0].schema.fields[0].id);
  });
  it('checking description', function() {
    dpout = tools.normalize(dpin2, sourceUrl);
    assert.equal(dpout.description, 'Abc em\nzzz');
  });
  it('sets names for resources', function() {
    dpout = tools.normalize(dpin, sourceUrl);
    assert.equal(dpout.resources[0].name, 'data');
  });
});

describe('load', function() {
  it('works in basic case', function(done) {
    tools.load('test/data/dp1/datapackage.json', function(error, data) {
      assert(!error)
      assert.equal(data.readme, 'The README.\n');
      done();
    });
  });
  it('reports error with bad path', function(done) {
    tools.load('test/data/dp1/does-not-exist.json', function(error, data) {
      assert(error)
      done();
    });
  });
});

describe('loadUrl', function() {
  it('works in basic case', function(done) {
    tools.loadUrl(sourceUrl, function(err, dpout) {
      assert(err === null);
      assert.equal(dpout.resources[0].url, sourceUrlBase + 'data/data.csv');
      assert(dpout.readme.length > 50);
      assert(dpout.description.length <  150);
      done();
    });
  });

  it('works with 404', function(done) {
    this.timeout(4000);
    var badUrl = 'https://raw.github.com/datasets/gold-prices/master/xyz.txt';
    tools.loadUrl(badUrl, function(err, dpout) {
      assert(err!=null);
      done();
    });
  });

  it('works with bad data', function(done) {
    var csvurl = 'https://raw.github.com/datasets/gold-prices/master/README.md'; 
    dpout = tools.loadUrl(csvurl, function(err, dpout) {
      // disable
      // as we now add datapackage.json to url this gives 404 rather than bad JSON
      // assert.equal(err.message.indexOf('datapackage.json is invalid JSON'), 0);
      done();
    });
  });
});

describe('loadManyUrls', function() {
  it('works', function(done) {
    gdpUrl = 'https://github.com/datasets/gdp';
    tools.loadManyUrls([sourceUrl, gdpUrl], function(err, dpout) {
      assert.equal(Object.keys(dpout).length, 2);
      assert.equal(dpout['gdp'].homepage, gdpUrl);
      done();
    });
  });
});

describe('normalizeDataPackageUrl', function() {
  it('works', function() {
    gdpUrl = 'https://github.com/datasets/gdp';
    var out = tools.normalizeDataPackageUrl(gdpUrl);
    assert.equal(out, 'https://raw.github.com/datasets/gdp/master/datapackage.json');
    var out = tools.normalizeDataPackageUrl('http://xyz.com/mydatapackage/');
    assert.equal(out, 'http://xyz.com/mydatapackage/datapackage.json');
  });
});

describe('parseSpecString', function() {
  it('url ok', function() {
    var url = 'http://data.okfn.org/data/country-codes';
    var out = tools.parseSpecString(url);
    assert.equal(out.url, url);
    assert.equal(out.name, 'country-codes');
  });

  it('url ok', function() {
    var url = 'http://data.okfn.org/data/country-codes/datapackage.json';
    var out = tools.parseSpecString(url);
    assert.equal(out.url, url.replace('/datapackage.json', ''));
    assert.equal(out.name, 'country-codes');
  });

  it('github ok', function() {
    gdpUrl = 'https://github.com/datasets/gdp';
    var out = tools.parseSpecString(gdpUrl);
    assert.equal(out.url, 'https://raw.github.com/datasets/gdp/master');
    assert.equal(out.name, 'gdp');
  });
});

