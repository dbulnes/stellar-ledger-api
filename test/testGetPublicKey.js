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

var bip32Path = "44'/148'/0'/0'/0'";
var returnSignature = true;
var returnChainCode = true;

var timeout = 0;
var debug = false;

/**
 * Print the stellar public key on the Ledger device at {@code bip32Path}
 */
function runTest(comm, api) {

    return comm.create_async(timeout, debug).then(function (comm) {
        var str = new api(comm);
        str.getPublicKey_async(bip32Path, returnSignature, returnChainCode).then(function (result) {
            console.log('publicKey: ' + result['publicKey']);
            console.log('chainCode: ' + result['chainCode']);
        }).catch(function (err) {
            console.log(err);
        });
    });

}

module.exports = runTest;
