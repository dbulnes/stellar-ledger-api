Javascript library for communicating with ledger-app-stellar

## Introduction

This is the companion javascript library for communicating with the [Ledger Nano S Stellar App](https://github.com/lenondupe/ledger-app-stellar).

In order to run the tests you must have the [Ledger Nano S Stellar App](https://github.com/lenondupe/ledger-app-stellar) installed on your [Ledger Nano S](https://www.ledgerwallet.com/products/ledger-nano-s).

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

The ledger stellar app supports communication over u2f and so does this javascript library. Browsers that support u2f are Google Chrome version 38+, Firefox 57+, and Opera version 40+.

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
var bip32Path = "44'/148'/0'";

/** Case 1: wait for the device connection */

// wait for the device to become connected and the Stellar app to open
// uses function callbacks to notify when the connection is established or when an error occurred while connecting

// NodeJs code:
StellarLedger.comm.create_async(Number.MAX_VALUE).then(function(comm) {
  var api = new StellarLedger.Api(comm);
  api.connect(function() { console.log('connected'); } , function(err) { console.error(err); });
});

// Browser code:
new StellarLedger.Api(new StellarLedger.comm(Number.MAX_VALUE)).connect(
  function() { console.log('connected'); }, function(err) { console.error(err) }
);

/** Case 2: obtaining the public key */

StellarLedger.comm.create_async().then(function(comm) {
  var api = new StellarLedger.Api(comm);
  // get the public key for this bip32 path
  return api.getPublicKey_async(bip32Path).then(function (result) {
    var publicKey = result['publicKey'];
    ...
  }).catch(function (err) {
      console.error(err);
  });
});


/** Case 3: signing a transaction */

var transaction = ...;
var publicKey = ...;

// default timeout is 20 seconds. if you want to customise this follow the patterns used in Case 1
StellarLedger.comm.create_async().then(function(comm) {
  var api = new StellarLedger.Api(comm);
  
  return api.signTx_async(bip32Path, transaction).then(function (result) {
      var signature = result['signature'];
      // add the signature to the transaction
      addSignatureToTransaction(signature, transaction);
      ...
  }).catch(function (err) {
      console.error(err);
  });
});

/**
 * Due to incompatibilities between different versions of StellarSdk
 * it is better the client code handle adding the signature to the transaction
 */
function addSignatureToTransaction(publicKey, signature, transaction) {
  var keyPair = StellarSdk.Keypair.fromPublicKey(publicKey);
  var hint = keyPair.signatureHint();
  var decorated = new StellarSdk.xdr.DecoratedSignature({hint: hint, signature: signature});
  transaction.signatures.push(decorated);
}
```

## Bip32 path

For an explanation on the bip 32 path see the [bip 32 logical hierarchy definition document](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki).

The Ledger Stellar App is locked on the path prefix (`44'/148'`), so you will get an error when you try to use a different one. Only hardened paths are supported at this time (all path elements must end with '). There's [a proposal](https://github.com/stellar/stellar-protocol/issues/61) for a BIP32 path convention for Stellar. Following that will ensure interoperability between wallets that use BIP32 HD key derivation.


