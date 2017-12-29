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

StellarSdk.Network.useTestNetwork();

var server = new StellarSdk.Server('https://horizon-testnet.stellar.org/');
var destination = "GBMHY2EIEGFHW6G4OIC6QA7I7IUPUDD33PGCJLVC57THODEUQY62KNHD";
var publicKey = "GBGBTCCP7WG2E5XFYLQFJP2DYOQZPCCDCHK62K6TZD4BHMNYI5WSXESH";

function loadAccount(publicKey) {
    return server.loadAccount(publicKey);
}

function createTransaction(account) {
  return setOptionsTx(account);
  // return allowTrustTx(account);
  // return manageDataTx(account);
  // return accountMergeTx(account);
  // return pathPaymentTx(account, publicKey);
  // return createAccountTx(account);
}

function pathPaymentTx(account, publicKey) {
  return new StellarSdk.TransactionBuilder(account)
    .addOperation(StellarSdk.Operation.pathPayment({
      destination: destination,
      sendAsset: new StellarSdk.Asset("USD", publicKey),
      sendMax: "50",
      destAsset: new StellarSdk.Asset("NGN", publicKey),
      destAmount: "18000"
    })).addMemo(StellarSdk.Memo.text("dollar to naira"))
    .build();
}

function accountMergeTx(account) {
  return new StellarSdk.TransactionBuilder(account)
    .addOperation(StellarSdk.Operation.accountMerge({
      destination: destination
    })).addMemo(StellarSdk.Memo.text("merge account"))
    .build();
}

function manageDataTx(account) {
  return new StellarSdk.TransactionBuilder(account)
    .addOperation(StellarSdk.Operation.manageData({
      name: "name",
      value: "value"
    })).addMemo(StellarSdk.Memo.text("manage data"))
    .build();
}

function allowTrustTx(account) {
  return new StellarSdk.TransactionBuilder(account)
    .addOperation(StellarSdk.Operation.allowTrust({
      trustor: destination,
      assetCode: "JPY",
      authorize: true
    })).addMemo(StellarSdk.Memo.text("allow trust"))
    .build();
}

function createAccountTx(account) {
    return new StellarSdk.TransactionBuilder(account)
        .addOperation(StellarSdk.Operation.createAccount({
            destination: destination,
            startingBalance: "100"
        }))
        .build();
}

function setOptionsTx(account) {
  var opts = {};
  opts.inflationDest = "GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7";
  opts.setFlags = StellarSdk.AuthRequiredFlag;
  opts.lowThreshold = 1;
  opts.highThreshold = 3;

  opts.signer = {
    ed25519PublicKey: "GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7",
    weight: 1
  };
  opts.homeDomain = "www.example.com";
  return new StellarSdk.TransactionBuilder(account)
    .addOperation(StellarSdk.Operation.setOptions(opts)).build();
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