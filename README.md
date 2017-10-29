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
