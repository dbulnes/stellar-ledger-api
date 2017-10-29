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
// var StellarBase = require('stellar-base');
var StellarSdk = require('stellar-sdk');

var server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
var destination = "GCKUD4BHIYSAYHU7HBB5FDSW6CSYH3GSOUBPWD2KE7KNBERP4BSKEJDV";

StellarSdk.Network.useTestNetwork();

function runTest(comm, strLedger, timeout) {

    return comm.create_async(timeout, true).then(function (comm) {
        var bip32Path = "44'/148'/0'/0'/0'";
        var str = new strLedger(comm);
        return str.getPublicKey_async(bip32Path).then(function (result) {
          var publicKey = result['publicKey'];
          return loadAccount(publicKey).then(function (account) {
            var tx = createTransaction(account);
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

function createTransaction(account) {
  return new StellarSdk.TransactionBuilder(account)
          .addOperation(StellarSdk.Operation.payment({
                  destination: destination,
                  asset: StellarSdk.Asset.native(),
                  amount: "30"
              }))
          .build();
}

module.exports = runTest;
