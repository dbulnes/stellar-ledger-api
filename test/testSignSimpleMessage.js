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

var ed25519 = require("ed25519");
var crypto = require("crypto");
var StellarBase = require("stellar-base");

function runTest(comm, strLedger, timeout) {

    var secretKey = new Buffer('4ccd089b28ff96da9db6c346ec114e0f5b8a319f35aba624da8cf6ed4fb8a6fb', 'hex');
    // var publicKey = new Buffer('3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c', 'hex');
    var msg = new Buffer('72', 'hex');
    var signature = new Buffer('92a009a9f0d4cab8720e820b5f642540a2b27b5416503f8fb3762223ebdb69da085ac1e43e15996e458f3613d0f11d8c387b2eaeb4302aeeb00d291612bb0c00', 'hex');
    // console.log(ed25519.Sign(msg, secretKey).toString('hex'));
    console.log(signature.toString('hex'));

    return comm.create_async(timeout, true).then(function (comm) {
        var str = new strLedger(comm);
        str.testSign_async(secretKey, msg).then(function (sig) {
            console.log(sig.toString('hex'));
        });
    });

    // ed25519.Verify();
    // return comm.create_async(timeout, true).then(function (comm) {


        // var bip32Path = "44'/148'/0'/0'/123'";
        // console.log(new Buffer('stellar'));
        // var str = new strLedger(comm);
       // return str.getPrivateKey_async(bip32Path).then(function (rawPrivateKey) {
       //     var msg = new Buffer('stellar');
       //     var hash = crypto.createHash('sha256').update(msg).digest();
       //     var keyPair = StellarBase.Keypair.fromRawEd25519Seed(rawPrivateKey);
       //     var signature = keyPair.sign(hash);
       //     console.log(signature.toString('hex'));
       // });
       //  return str.getPublicKey_async(bip32Path).then(function (rawPublicKey) {
       //      var msg = new Buffer('stellar');
       //      var hash = crypto.createHash('sha512').update(msg).digest();
       //      return str.sign_async(bip32Path, hash).then(function (signature) {
       //        var publicKey = StellarBase.StrKey.encodeEd25519PublicKey(rawPublicKey);
       //        var keyPair = StellarBase.Keypair.fromPublicKey(publicKey);
       //        console.log(signature.toString('hex'));
       //        if (keyPair.verify(hash, signature)) {
       //          console.log('valid signature');
       //        } else {
       //          console.log('invalid signature');
       //        }
       //      });
       //  });

        // var msg = new Buffer("connectyourledgerNanoStoyourcomputerinstallthepponyourledger");
        // console.log(msg.toString('hex'));
        // return str.sign_async(bip32Path, msg).then(function (out) {
        //     console.log(out.toString('hex'));
        // });

    // });

}

module.exports = runTest;
