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
const util = require('util');

var StellarBase = require('stellar-base');
var StellarSdk = require('stellar-sdk');
var server = new StellarSdk.Server('https://horizon.stellar.org/');
var destination = "GCKUD4BHIYSAYHU7HBB5FDSW6CSYH3GSOUBPWD2KE7KNBERP4BSKEJDV";

StellarBase.Network.usePublicNetwork();

function runTest(comm, strLedger, timeout) {

    return comm.create_async(timeout, true).then(function (comm) {
        var bip32Path = "44'/148'/0'/0'/0'";
        var str = new strLedger(comm);
        return str.getPublicKey_async(bip32Path).then(function (rawPublicKey) {
          var publicKey = StellarBase.StrKey.encodeEd25519PublicKey(rawPublicKey);
          var keyPair = StellarBase.Keypair.fromPublicKey(publicKey);
          return loadAccount(keyPair).then(function (account) {
            var transaction = createTransaction(account);
            var transactionBase = transaction.signatureBase();
            return str.sign_async(bip32Path, transactionBase).then(function (signedTx) {
              console.log(signedTx.toString('hex'));
//              var signature = createSignature(keyPair, signedTx);
//              transaction.signatures.push(signature);
//              sendTransaction(transaction);
            });
          });
        });
    });
}

function loadAccount(keyPair) {
  return server.loadAccount(keyPair.publicKey());
}

function createTransaction(account) {
  return new StellarBase.TransactionBuilder(account)
          .addOperation(StellarBase.Operation.payment({
                  destination: destination,
                  asset: StellarBase.Asset.native(),
                  amount: "1"
              }))
          .build();
}

function createSignature(keyPair, signature) {
  var hint = keyPair.signatureHint();
  return new StellarBase.xdr.DecoratedSignature({hint, signature});
}

function sendTransaction(transaction) {
  server.submitTransaction(transaction)
    .then(function (transactionResult) {
        console.log(transactionResult);
    })
    .catch(function (err) {
        console.error(err);
    });
}

module.exports = runTest;
