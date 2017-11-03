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

var bip32Path = "44'/148'/0'/0'/0'";
var server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

var timeout = 0;
var debug = false;

function showAccount(comm, Api) {

    return comm.create_async(timeout, debug).then(function (comm) {
        var api = new Api(comm);
        api.getPublicKey_async(bip32Path, false, false).then(function (result) {
            console.log('showing account details for publicKey: ' + result['publicKey']);
            server.loadAccount(result['publicKey']).then(function(account) {
                console.log('Account details for: ' + result['publicKey']);
                console.log(account);
            });
        }).catch(function (err) {
            console.log(err);
        }).catch(function (err) {
            console.log(err);
        });
    });
}

module.exports = showAccount;