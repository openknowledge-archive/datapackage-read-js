var fs = require('fs')
  , urlmod = require('url')
  , path = require('path')
  , marked = require('marked')
  , request = require('request')
  ;

exports.load = function(path_, cb) {
  // TODO: support just passing a directory
  var dpjsonPath = path_;
  var base = path.dirname(dpjsonPath);
  fs.readFile(dpjsonPath, function(error, body) {
    if (error) {
      cb(error);
      return;
    }
    try {
      var datapackage = JSON.parse(body);
    } catch(e) {
      cb({message: 'datapackage.json is invalid JSON. Details: ' + e.message});
      return;
    }

    // now dig up and use README if it exists
    var readmePath = path.join(base, 'README.md');
    fs.readFile(readmePath, 'utf8', function(err, body) {
      if (!err) {
        datapackage['readme'] = body.replace(/\r\n/g, '\n');
      }
      datapackage = exports.normalize(datapackage, base);
      cb(null, datapackage); 
    });
  });
}

exports.loadUrl = function(datapackage_url, cb) {
  var datapackage_url = exports.normalizeDataPackageUrl(datapackage_url);
  var base = datapackage_url.replace(/datapackage.json$/g, '');
  request(datapackage_url, function(error, response, body) {
    if (error) {
      cb(error);
      return;
    } else if (response.statusCode != 200) {
      cb({message: 'Unable to access file. Status code: ' + response.statusCode});
      return;
    }
    // TODO: handle bad JSON
    try {
      var datapackage = JSON.parse(body);
    } catch(e) {
      cb({message: 'datapackage.json is invalid JSON. Details: ' + e.message});
      return;
    }

    // now dig up and use README if it exists
    var readme_url = base + 'README.md'
    request(readme_url, function(err, resp, body) {
      if (!err && resp.statusCode == 200) {
        datapackage['readme'] = body.replace(/\r\n/g, '\n');
      }
      datapackage = exports.normalize(datapackage, base);
      cb(null, datapackage); 
    });
  });
};

// ## loadMany
//
// Load all the Data Packages info at the provided urls and return in one big
// hash (keyed by Data Package names)
//
// @return: via the callback
exports.loadManyUrls = function(urls, callback) {
  var output = {}
    , count = urls.length
    ;
  function done() {
    count--;
    if (count == 0) {
      callback(null, output);
    }
  }
  urls.forEach(function(url) {
    exports.loadUrl(url, function(err, dpjson) {
      if (err) {
        console.error(url, err)
      } else {
        output[dpjson.name] = dpjson;
      }
      done();
    });
  });
}

exports.normalize = function(datapackage, url_) {
  var base = url_ ? url_.replace(/datapackage.json$/g, '') : '';
  // ensure certain fields exist
  if (! ('description' in datapackage)) {
    datapackage.description  = '';
  }
  // set description as first paragraph of readme if no description
  if (!datapackage.description && 'readme' in datapackage) {
    var html = marked(datapackage.readme);
    html = html.replace(/<p>/g, '\n<p>');
    var plain = stripTags(html).split('\n\n')[0].replace(' \n', '').replace('\n', ' ').replace(/^ /, '');
    datapackage.description = plain;
  } else if (!datapackage.readme) {
    datapackage.readme = datapackage.description;
  }

  datapackage.readmeHtml = marked(datapackage.readme);

  if (!datapackage.resources) {
    datapackage.resources = [];
  }

  datapackage.resources.forEach(function(info) {
    if (!info.url && info.path && base) {
      info.url = base + info.path;
    }
    if (!info.name && info.url) {
      info.name = _nameFromUrl(info.url);
    }
    // upgrade for change in JTS spec - https://github.com/dataprotocols/dataprotocols/issues/60
    if (info.schema && info.schema.fields) {
      info.schema.fields = info.schema.fields.map(function(field) {
        if (!field.name) {
          field.name = field.id;
          // TODO: (?) do we also want delete the id attribute
          // delete field.id;
        }
        return field;
      });
    }
  });

  // special cases for github data packages
  if (base.indexOf('raw.github.com') != -1) {
    var offset = base.split('/').slice(3,5).join('/');
    var githubrepo = 'https://github.com/' + offset;
    if (!('homepage' in datapackage)) {
      datapackage.homepage = githubrepo;
    }
    if (!('bugs' in datapackage)) {
      datapackage.bugs = {
        url: githubrepo + '/issues'
      }
    }
  }

  // have a stab at setting a sensible homepage if none there yet
  if (!('homepage' in datapackage)) {
    datapackage.homepage = base;
  }

  return datapackage;
}

// Parse Data Package spec strings (see README)
exports.parseSpecString = function(specString) {
  out = {
    url: '',
    name: '',
    version: '',
    original: specString
  }

  var url = specString.replace('/datapackage.json', '')
    , name = ''
    ;

  if (url.indexOf('http') != -1) {
    var urlparts = urlmod.parse(url)
      , path = urlparts.pathname
      , parts = path.split('/')
      , name = parts.pop()
      ;

    out.url = url;

    var ghNotRaw = '//github.com';
    if (url.indexOf(ghNotRaw) != -1) {
      out.url = url.replace(ghNotRaw, '//raw.github.com') + '/master';
      out.version = 'master'
    }
  }

  var _tmp = name.split('@');
  out.name = _tmp[0];
  if (_tmp.length > 1) {
    out.version = _tmp.split('@');
  }
  return out;
}

exports.normalizeDataPackageUrl = function(url) {
  var url = exports.parseSpecString(url).url;
  if (url.indexOf('datapackage.json') == -1) {
    url = url.replace(/\/$/, '');
    url += '/datapackage.json'
  }
  return url;
};

// ========================================================
// Utilities

// Create a name from a URL (no extension)
// e.g. http://.../abc/xyz.fbc.csv?... => xyz.fbc
function _nameFromUrl(url_) {
  var name = urlmod.parse(url_).pathname.split('/').pop();
  if (name.indexOf('.') != -1) {
    var _parts = name.split('.');
    _parts.pop();
    name = _parts.join('.');
  }
  return name;
}

var stripTags = function(str){
  if (str == null) return '';
  return String(str).replace(/<\/?[^>]+>/g, '');
}

