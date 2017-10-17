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

'use strict';

var Q = require('q');
var utils = require('./utils');
var StellarBase = require('stellar-base');

var LedgerStr = function(comm) {
    this.comm = comm;
}

LedgerStr.prototype.getAppConfiguration_async = function() {
    var buffer = new Buffer(5);
    buffer[0] = 0xe0;
    buffer[1] = 0x06;
    buffer[2] = 0x00;
    buffer[3] = 0x00;
    buffer[4] = 0x00;
    return this.comm.exchange(buffer.toString('hex'), [0x9000]).then(function(response) {
        var result = {};
        var response = new Buffer(response, 'hex');
        result['version'] = "" + response[1] + '.' + response[2] + '.' + response[3];
        return result;
    });
}

LedgerStr.prototype.getPublicKey_async = function(path, boolDisplay, boolChaincode) {
    var splitPath = utils.splitPath(path);
    var buffer = new Buffer(5 + 1 + splitPath.length * 4);
    buffer[0] = 0xe0;
    buffer[1] = 0x02;
    buffer[2] = (boolDisplay ? 0x01 : 0x00);
    buffer[3] = (boolChaincode ? 0x01 : 0x00);
    buffer[4] = 1 + splitPath.length * 4;
    buffer[5] = splitPath.length;
    splitPath.forEach(function (element, index) {
        buffer.writeUInt32BE(element, 6 + 4 * index);
    });
    return this.comm.exchange(buffer.toString('hex'), [0x9000]).then(function(response) {
        var result = {};
        var response = new Buffer(response, 'hex');
        var publicKeyLength = response[0];
        var rawPublicKey = response.slice(1, 1 + publicKeyLength);
        result['publicKey'] = StellarBase.StrKey.encodeEd25519PublicKey(rawPublicKey);
        if (boolChaincode) {
            result['chainCode'] = response.slice(1 + publicKeyLength, 1 + publicKeyLength + 32).toString('hex');
        }
        return result;
    });
}

LedgerStr.prototype.signTransaction_async = function(path, publicKey, transaction) {
	var signatureBase = transaction.signatureBase();
    var splitPath = utils.splitPath(path);
    var buffer = new Buffer(5 + 1 + splitPath.length * 4);
    buffer[0] = 0xe0;
    buffer[1] = 0x04;
    buffer[2] = 0x00;
    buffer[3] = 0x00;
    buffer[4] = 1 + splitPath.length * 4 + signatureBase.length;
    buffer[5] = splitPath.length;
    splitPath.forEach(function (element, index) {
        buffer.writeUInt32BE(element, 6 + 4 * index);
    });
    buffer = Buffer.concat([buffer, signatureBase]);
    return this.comm.exchange(buffer.toString('hex'), [0x9000]).then(function(response) {
    	var signedTx = new Buffer(response.slice(0, response.length - 4), 'hex');
    	var keyPair = StellarBase.Keypair.fromPublicKey(publicKey);
        var hint = keyPair.signatureHint();
        var signature = new StellarBase.xdr.DecoratedSignature({hint: hint, signature: signedTx});
        transaction.signatures.push(signature);
        return transaction;
    });
}


module.exports = LedgerStr;
