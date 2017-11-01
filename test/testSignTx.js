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
var fs = require('fs');

var server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

var bip32Path = "44'/148'/0'/0'/0'";
var destination = "GCKUD4BHIYSAYHU7HBB5FDSW6CSYH3GSOUBPWD2KE7KNBERP4BSKEJDV";

var timeout = 0;
var debug = true;

StellarSdk.Network.useTestNetwork();

function runTest(comm, api) {

    return comm.create_async(timeout, debug).then(function (comm) {
        var str = new api(comm);
        return str.getPublicKey_async(bip32Path).then(function (result) {
          var publicKey = result['publicKey'];
          return loadAccount(publicKey).then(function (account) {
            var tx = createTransaction(account, publicKey);
            return str.signTx_async(bip32Path, publicKey, tx).then(function (result) {
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
          });
        });
    });
}

function loadAccount(publicKey) {
  return server.loadAccount(publicKey);
}

function createTransaction(account, publicKey) {
    var asset = new StellarSdk.Asset("DUPE", publicKey);
    var opts = {
        timebounds: {
            minTime: 50,
            maxTime: 100
        }
    };
  return new StellarSdk.TransactionBuilder(account, opts)
          .addOperation(StellarSdk.Operation.payment({
                  source: publicKey,
                  destination: destination,
                  asset: asset,
                  amount: "30"
              }))//.addMemo(StellarSdk.Memo.id("33"))
          .build();
}

module.exports = runTest;
