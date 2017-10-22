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

var StellarBase = require('stellar-base');
var StellarSdk = require('stellar-sdk');
var fs = require('fs');

StellarBase.Network.usePublicNetwork();
var server = new StellarSdk.Server('https://horizon.stellar.org/');
var destination = "GCKUD4BHIYSAYHU7HBB5FDSW6CSYH3GSOUBPWD2KE7KNBERP4BSKEJDV";
var publicKey = "GAQNVGMLOXSCWH37QXIHLQJH6WZENXYSVWLPAEF4673W64VRNZLRHMFM";


function loadAccount(publicKey) {
    return server.loadAccount(publicKey);
}

function createTransaction(account) {
    return new StellarBase.TransactionBuilder(account)
        .addOperation(StellarBase.Operation.payment({
            destination: destination,
            asset: StellarBase.Asset.native(),
            amount: "1"
        }))
        // .addMemo(StellarBase.Memo.id("33"))
        .build();
}

function printHexBlocks(buffer) {
    var out = '';
    for (var i = 0; i < buffer.length; ++i) {
        if (i % 4 == 0) {
            if (i > 0) {
                out += ']';
            }
            out += '\n[';
        } else if (i > 0) {
            out += ':';
        }

        out += toHex(buffer[i]);
    }
    out += ']\n';
    console.log(out);
}

function toHex (n) {
    if (n < 16) return '0' + n.toString(16)
    return n.toString(16)
}

/**
 * Utility for showing and saving the raw transaction XDR
 * To be used for developing and testing ledger-app-stellar
 */
function printTransactionXdr() {
    loadAccount(publicKey).then(function (account) {
        var transaction = createTransaction(account);
        var signatureBase = transaction.signatureBase();
        printHexBlocks(signatureBase);
        fs.writeFile("/tmp/txSignatureBase", signatureBase.toString('hex'), function (err) {
            if (err) console.log("could not write signature base file");
            else console.log("saved signature base");
        });
    });
}

module.exports = printTransactionXdr;