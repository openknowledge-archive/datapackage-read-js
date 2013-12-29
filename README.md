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

## Loading and normalizing a datapackage.json

```
datapackage.load(urlToDataPackage, callback)
```

Load a datapackage.json from a URL and normalize it as per the normalize function.

`urlToDataPackage` can be either a url to actual datapackage.json or to a base directory.

# Tests

Run the tests with:

    npm test

