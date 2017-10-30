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

var request = require('request');
var bip32Path = "44'/148'/0'/0'/0'";

/**
 * Request a test account from Friendbot for your Ledger-based public key
 */
function initTestAccount(comm, api, timeout) {

    return comm.create_async(timeout, true).then(function (comm) {
        var str = new api(comm);
        str.getPublicKey_async(bip32Path, false, false).then(function (result) {
            console.log('requesting test account for publicKey: ' + result['publicKey']);
            request.get({
                url: 'https://horizon-testnet.stellar.org/friendbot',
                qs: { addr: result['publicKey'] },
                json: true
            }, function(error, response, body) {
                if (error || response.statusCode !== 200) {
                    console.error('ERROR!', error || body);
                }
                else {
                    console.log('SUCCESS! You have a new account :)\n', body);
                }
            });
        }).catch(function (err) {
            console.log(err);
        }).catch(function (err) {
            console.log(err);
        });
    });

}

module.exports = initTestAccount;