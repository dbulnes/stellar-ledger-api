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
if (typeof ledger == 'undefined') {
    ledger = require('ledgerco');
    comm = ledger.comm_node;
    browser = false;
}
else {
    browser = true;
    comm = ledger.comm_u2f;
}

strLedger = require('../src');

var Q = require('q');

var TIMEOUT = 10000;

var tests = [
   // {name: 'testGetAppConfiguration', run: require('./testGetAppConfiguration')},
   // {name: 'testGetPublicKey', run: require('./testGetPublicKey')}
//    {name: 'testSignSimpleMessage', run: require('./testSignSimpleMessage')}
    {name: 'testTransaction', run: require('./testTransaction')}
];

function runTests() {
    tests.reduce(function (a, step) {
        return a.then(function () {
            console.info(step.name ? 'Running test ' + step.name : '');
            return (step.run)(comm, strLedger, TIMEOUT);
        }).fail(function (err) {
            console.error('Failed test', step.name, err);
        })
    }, Q.resolve());
}

if (!browser) {
    runTests();
}

module.exports = runTests;