NodeJS api for communication with ledger-app-stellar

## Introduction

This is the companion javascript library for communicating with the [Ledger Nano S Stellar App](https://github.com/lenondupe/ledger-app-stellar).

It is currently work in progress. In order to run the tests you must have the [Ledger Nano S Stellar App](https://github.com/lenondupe/ledger-app-stellar) installed.

## Building

In order to build this project and run the tests you must have [NodeJS](https://nodejs.org/en/) and [NPM](https://www.npmjs.com/) installed. When you install NodeJS from a package NPM is also installed.

To build the project run

```$ npm install```

## Running the scripts

The `./test` directory contains a number of test scripts you can run. Each can be run by invoking

```$ npm run script $scriptName```

Where `$scriptName` is the name of script file in the `./test` directory minus the `.js` extension. So, for instance, to run the `testGetPublicKey.js` script run

```$ npm run script testGetPublicKey```

**Note: you must have your device connected and the Stellar app opened**

### Creating a test account

Before you can run some of the scripts, an account for your Ledger-based keys must exist on the Stellar test network. To initialize your Ledger-based account on this network you must run the 'initTestAccount` script.

```$ npm run script initTestAccount```

You can inspect the account details by running

```$ npm run script showAccount```
