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

var bip32Path = "44'/148'/0'";
var destination = "GBGBTCCP7WG2E5XFYLQFJP2DYOQZPCCDCHK62K6TZD4BHMNYI5WSXESH";

var timeout = 0;
var debug = true;

StellarSdk.Network.useTestNetwork();

/**
 * Sign a single payment transaction
 */
function runTest(comm, Api) {

    return comm.create_async(timeout, debug).then(function (comm) {
        var api = new Api(comm);
        return api.getPublicKey_async(bip32Path).then(function (result) {
            var publicKey = result['publicKey'];
            return loadAccount(publicKey).then(function (account) {
                var tx = createTransaction(account);
                return api.signTx_async(bip32Path, publicKey, tx).then(function (result) {
                    var txHash = tx.hash();
                    var keyPair = StellarSdk.Keypair.fromPublicKey(publicKey);
                    if (keyPair.verify(txHash, result['signature'])) {
                        console.log('Success! Good signature');
                    } else {
                        console.error('Failure: Bad signature');
                    }
                    // addSignatureToTransaction(publicKey, result['signature'], tx);
                    // sendTransaction(tx);
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
            amount: "10"
        }))//.addMemo(StellarSdk.Memo.text("starlight"))
        .build();
}

function addSignatureToTransaction(publicKey, signature, transaction) {
    var keyPair = StellarSdk.Keypair.fromPublicKey(publicKey);
    var hint = keyPair.signatureHint();
    var decorated = new StellarSdk.xdr.DecoratedSignature({hint: hint, signature: signature});
    transaction.signatures.push(decorated);
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
