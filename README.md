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

**Note: you must have your device connected and the Stellar app open**

### Creating a test account

Before you can run some of the scripts, an account for your Ledger-based keys must exist on the Stellar test network. To initialize your Ledger-based account on this network you can run the 'initTestAccount` script.

```$ npm run script initTestAccount```

And to inspect the account details:

```$ npm run script showAccount```
