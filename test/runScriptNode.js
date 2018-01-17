/********************************************************************************
*   Stellar Ledger API
*   (c) 2017-2018 LeNonDupe
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


var Q = require('q');
var StellarLedger = require('../src');

var scripts = {
    testGetAppConfiguration: require('./testGetAppConfiguration'),
    testGetPublicKey: require('./testGetPublicKey'),
    testSignTx: require('./testSignTx'),
    printTransactionXdr: require('./printTransactionXdr'),
    showAccount: require('./showAccount'),
    initTestAccount: require('./initTestAccount')
};

function runScript(scriptName, operationName) {
    console.log('running: ' + scriptName);
    Q.resolve().then(function () {
        return scripts[scriptName](StellarLedger.comm, StellarLedger.Api, operationName);
    }).fail(function (err) {
        console.error("failure: " + err);
    });
}

var nodeCmdArgs = process.argv.slice(2);
var scriptName = nodeCmdArgs[0];
var operationName = null;
if (nodeCmdArgs.length > 1) {
    operationName = nodeCmdArgs[1];
}
runScript(scriptName, operationName);

module.exports = runScript;
