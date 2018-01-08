/********************************************************************************
*   Stellar Ledger API
*   (c) 2017 LeNonDupe
*
*  Licensed under the Apache License, Version 2.0 (the "License");
*  you may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
********************************************************************************/
var StellarSdk = require('stellar-sdk');

var server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

var bip32Path = "44'/148'/0'";
var destination = "GADFVW3UXVKDOU626XUPYDJU2BFCGFJHQ6SREYOZ6IJV4XSHOALEQN2I";

var timeout = 0;
var debug = true;

/**
 * Sign a single payment transaction
 */
function runTest(comm, Api, operationName) {

    console.log(operationName);
    return comm.create_async(timeout, debug).then(function (comm) {
        var api = new Api(comm);
        return api.getPublicKey_async(bip32Path).then(function (result) {
            var publicKey = result['publicKey'];
            StellarSdk.Network.useTestNetwork();
            return loadAccount(publicKey).then(function (account) {
                sign(api, publicKey, operations[operationName](account, publicKey));
            });
        });
    });
}

function sign(api, publicKey, tx) {
  return api.signTx_async(bip32Path, tx).then(function (result) {
    var txHash = tx.hash();
    var keyPair = StellarSdk.Keypair.fromPublicKey(publicKey);
    if (keyPair.verify(txHash, result['signature'])) {
      console.log('Success! Good signature');
    } else {
      console.error('Failure: Bad signature');
    }
  }).catch(function (err) {
    console.error(err);
  });

}

function loadAccount(publicKey) {
    return server.loadAccount(publicKey);
}

var operations = {
  createAccount: function (account) {
    return new StellarSdk.TransactionBuilder(account)
      .addOperation(StellarSdk.Operation.createAccount({
        destination: destination,
        startingBalance: "2000"
      })).addMemo(StellarSdk.Memo.text("create new account"))
      .build();
  },
  payment: function(account) {
    return new StellarSdk.TransactionBuilder(account)
      .addOperation(StellarSdk.Operation.payment({
        destination: destination,
        asset: StellarSdk.Asset.native(),
        amount: "2000"
      })).addMemo(StellarSdk.Memo.text("sending starlight"))
      .build();
  },
  pathPayment: function(account, publicKey) {
    return new StellarSdk.TransactionBuilder(account)
      .addOperation(StellarSdk.Operation.pathPayment({
        destination: destination,
        sendAsset: new StellarSdk.Asset("USD", publicKey),
        sendMax: "100",
        destAsset: new StellarSdk.Asset("NGN", publicKey),
        destAmount: "1800"
      })).addMemo(StellarSdk.Memo.text("dollar to naira"))
      .build();
  },
  createOffer: function (account, publicKey) {
    var buying = new StellarSdk.Asset("SLT", publicKey);
    var selling = StellarSdk.Asset.native();
    return new StellarSdk.TransactionBuilder(account)
      .addOperation(StellarSdk.Operation.manageOffer({
        buying: buying,
        selling: selling,
        amount: "1000",
        price: { n: 1, d: 3 }
      })).addMemo(StellarSdk.Memo.text("create offer"))
      .build();
  },
  removeOffer: function(account, publicKey) {
    var buying = new StellarSdk.Asset("SLT", publicKey);
    var selling = StellarSdk.Asset.native();
    return new StellarSdk.TransactionBuilder(account)
      .addOperation(StellarSdk.Operation.manageOffer({
        buying: buying,
        selling: selling,
        amount: "0",
        price: { n: 1, d: 3 },
        offerId: '209583721'
      }))
      .build();
  },
  changeOffer: function(account, publicKey) {
    var buying = new StellarSdk.Asset("SLT", publicKey);
    var selling = StellarSdk.Asset.native();
    return new StellarSdk.TransactionBuilder(account)
      .addOperation(StellarSdk.Operation.manageOffer({
        buying: buying,
        selling: selling,
        amount: "200",
        price: { n: 5, d: 3 },
        offerId: '6849038322'
      }))
      .build();
  },
  passiveOffer: function(account, publicKey) {
    var buying = new StellarSdk.Asset("SLT", publicKey);
    var selling = StellarSdk.Asset.native();
    return new StellarSdk.TransactionBuilder(account)
      .addOperation(StellarSdk.Operation.createPassiveOffer({
        buying: buying,
        selling: selling,
        amount: "1000",
        price: { n: 1, d: 4 }
      })).addMemo(StellarSdk.Memo.text("create offer"))
      .build();
  },
  changeTrust: function(account, publicKey) {
    var asset = new StellarSdk.Asset("SLT", publicKey);
    return new StellarSdk.TransactionBuilder(account)
      .addOperation(StellarSdk.Operation.changeTrust({
        asset: asset,
        limit: "922337203685.4775807"
      }))
      .build();
  },
  removeTrust: function(account, publicKey) {
    var asset = new StellarSdk.Asset("SLT", publicKey);
    return new StellarSdk.TransactionBuilder(account)
      .addOperation(StellarSdk.Operation.changeTrust({
        asset: asset,
        limit: '0'
      }))
      .build();
  },
  allowTrust: function(account) {
    return new StellarSdk.TransactionBuilder(account)
      .addOperation(StellarSdk.Operation.allowTrust({
        trustor: destination,
        assetCode: "JPY",
        authorize: true
      })).addMemo(StellarSdk.Memo.text("allow trust"))
      .build();
  },
  revokeTrust: function(account) {
    return new StellarSdk.TransactionBuilder(account)
      .addOperation(StellarSdk.Operation.allowTrust({
        trustor: destination,
        assetCode: "JPY",
        authorize: false
      })).addMemo(StellarSdk.Memo.text("revoke trust"))
      .build();
  },
  setOptions: function(account) {
    var opts = {};
    // opts.inflationDest = "GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7";
    opts.clearFlags = StellarSdk.AuthRevocableFlag | StellarSdk.AuthImmutableFlag;
    opts.setFlags = StellarSdk.AuthRequiredFlag;
    opts.masterWeight = 255;
    // opts.lowThreshold = 255;
    // opts.medThreshold = 255;
    // opts.highThreshold = 255;

    opts.signer = {
      ed25519PublicKey: "GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7",
      // sha256Hash: revokeTrustTx(account).hash().toString('hex'),
      weight: 1
    };
    opts.homeDomain = "www.longexampleislong.com";
    return new StellarSdk.TransactionBuilder(account)
      .addOperation(StellarSdk.Operation.setOptions(opts)).build();
  },
  accountMerge: function(account) {
    return new StellarSdk.TransactionBuilder(account)
      .addOperation(StellarSdk.Operation.accountMerge({
        destination: destination
      })).addMemo(StellarSdk.Memo.text("merge account"))
      .build();
  },
  manageData: function(account) {
    return new StellarSdk.TransactionBuilder(account)
      .addOperation(StellarSdk.Operation.manageData({
        name: "appdata",
        value: "value"
      })).addMemo(StellarSdk.Memo.hash(accountMergeTx(account).hash()))
      .build();
  },
  inflation: function(account) {
    return new StellarSdk.TransactionBuilder(account)
      .addOperation(StellarSdk.Operation.inflation())
      .addMemo(StellarSdk.Memo.text("maximum memo length 28 chars"))
      .build();
  }

};

module.exports = runTest;
