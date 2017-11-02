Javascript library for communicating with ledger-app-stellar

## Introduction

This is the companion javascript library for communicating with the [Ledger Nano S Stellar App](https://github.com/lenondupe/ledger-app-stellar).

It is currently work in progress. In order to run the tests you must have the [Ledger Nano S Stellar App](https://github.com/lenondupe/ledger-app-stellar) installed on your [Ledger Nano S](https://www.ledgerwallet.com/products/ledger-nano-s).

## Building

To build this project and run the tests you must have [NodeJS](https://nodejs.org/en/) and [NPM](https://www.npmjs.com/) installed. Note that usually, when you install NodeJS from a package, NPM is also installed, so you should be fine with just installing the former.

After you've installed NodeJS run

```$ npm install```

in the project root directory.

## Running the scripts

The `./test` directory contains a number of test scripts you can run. Each by invoking

```$ npm run script $scriptName```

where `$scriptName` is the name of script file in the `./test` directory minus the `.js` extension. So, for instance, to run the `testGetPublicKey.js` script run

```$ npm run script testGetPublicKey```

If the test succeeds you will see your public key printed on the console.

**Note: make sure the Stellar app is open**

## Browser support

The ledger stellar app supports communication over u2f and so does this javascript library. Browsers that support u2f are Google Chrome version 38+ and Opera version 40+.

First browserify the library:

```$ npm run browserify```

This will generate the file `./browser/sledger.js` that contains everything you need to connect with the app in the browser.

To generate a minified version run:

```$ npm run uglify```

The tests can also be run in the browser. To do this the tests must be browserified first:

```$ npm run browserify-test```

Chrome only opens u2f channels if the page is served over https. Follow the instructions [here](https://gist.github.com/dergachev/7028596) to fire up a simple https server with python.

You must also enable browser support in the Stellar app settings.

Then open https://localhost:4443/test/index.html to run the tests

## Usage

```javascript
var StellarLedger = require('stellar-ledger-api');
var bip32Path = "44'/148'/0'/0'/0'";

/** Case 1: obtaining the public key */

// initialize the communication link - this is the common pattern for all operations
StellarLedger.comm.create_async().then(function(comm) {
  var api = new StellarLedger.api(comm);
  // get the public key for this bip32 path
  return api.getPublicKey_async(bip32Path).then(function (result) {
    var publicKey = result['publicKey'];
    ...
  }).catch(function (err) {
      console.error(err);
  });
});

/** Case 2: signing a single payment transaction */

var transaction = ...;
var publicKey = ...;

StellarLedger.comm.create_async().then(function(comm) {
  var api = new StellarLedger.api(comm);
  
  return api.signTx_async(bip32Path, publicKey, transaction).then(function (result) {
      var signedTransaction = result['transaction'];
      ...
  }).catch(function (err) {
      console.error(err);
  });
});

/** Case 3: signing an arbitrary transaction */

StellarLedger.comm.create_async().then(function(comm) {
  var api = new StellarLedger.api(comm);
  
  return api.signTxHash_async(bip32Path, publicKey, transaction).then(function (result) {
      var signedTransaction = result['transaction'];
      ...
  }).catch(function (err) {
      console.error(err);
  });
});
```

## Bip32 path

For an explanation on the bip 32 path see the [bip 32 logical hierarchy definition document](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki).

The Ledger Stellar App is currently locked for the XLM cointype 148, so you will get an error when you try to use a different one. This could change in the future when other coins on the stellar network [register their coin type](https://github.com/satoshilabs/slips/blob/master/slip-0044.md). Since accounts on the Stellar network are not free like on most other networks it makes sense to use the same account for all Stellar-based assets. And that means using the same bip32 path.

Only hardened paths are supported at this time (all path elements must end with ').
