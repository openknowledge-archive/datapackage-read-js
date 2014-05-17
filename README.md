# datapackage-read

This is a module that reads datapackage.json files. It validates some stuff, and loads some default things.

# Installation

[![NPM](https://nodei.co/npm/datapackage-read.png)](https://nodei.co/npm/datapackage-read/)

```
npm install datapackage-read
```

# Usage

The following assume you've required datapackage as follows:

```
var datapackage = require('datapackage-read');
```

## load

```
datapackage.load(path, callback)
```

* `path` {String} The path to the datapackage.json file

Load a datapackage.json from a file and normalize it as per the normalize
function. Will search for README at REAME.md in same directory as
datapackage.json.

## loadUrl

```
datapackage.loadUrl(urlToDataPackage, callback)
```

* `urlToDataPackage` {String} url to datapackage.json or directory in which
  datapackage.json contained (also handle provision of github urls e.g.
  https://github.com/datasets/gold-prices)

Load a datapackage.json from a URL, related files (e.g. README.md) and
normalize it

## normalize

```
datapackage.normalize(datapackage, url)
```

* `datapackage`: datapackage.json object (already parsed from JSON)
* `url`: [optional] url to datapackage.json or the root directory in which it
  is contained online. Used to help auto-generate things homepage 

Normalize a DataPackage DataPackage.json in various ways, for example:

* Setting a description if missing (from readme)
* Setting a url for resources
* Guessing a homepage

## parseSpecString

```
datapackage.parseSpecString(specString)
```

Parse a Data Package Spec string to a Spec object/dictionary. (See below for
more on Data Package Specs).

## Data Package Spec (Specifier)

A Data Package "Spec" is a small Object/Hash which describing the identify and
location of a Data Package. Its structure is like:

    {
      url: ...
      name: ...
      version: ...
    }

It can be parsed (and less importantly) serialized to a simple string. Spec
strings will be frequently used on e.g. the command line to identify a data
package.

A spec string can be:

* A direct URL to a datapackage e.g.

       http://mywebsite.com/mydatapackage/
       // or with the datapackage.json
       http://mywebsite.com/mydatapackage/datapackage.json

* A github URL

       http://github.com/datasets/gold-prices

* A single name

       gold-prices

   In this case the data package must be in the core datasets in the primary registry.

# Tests

Run the tests with:

    npm test

