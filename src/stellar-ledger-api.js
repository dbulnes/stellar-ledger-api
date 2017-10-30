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

var utils = require('./utils');
var StellarSdk = require('stellar-sdk');

var Sledger = function(comm) {
    this.comm = comm;
    this.comm.setScrambleKey('l0v');
};

Sledger.prototype.getAppConfiguration_async = function() {
    var buffer = new Buffer(5);
    buffer[0] = 0xe0;
    buffer[1] = 0x06;
    buffer[2] = 0x00;
    buffer[3] = 0x00;
    buffer[4] = 0x00;
    return this.comm.exchange(buffer.toString('hex'), [0x9000]).then(function(response) {
        var result = {};
        response = new Buffer(response, 'hex');
        result['version'] = "" + response[1] + '.' + response[2] + '.' + response[3];
        return result;
    });
};

Sledger.prototype.getPublicKey_async = function(path, validateKeypair, returnChainCode) {
    var splitPath = utils.splitPath(path);
    var buffer = new Buffer(5 + 1 + splitPath.length * 4);
    buffer[0] = 0xe0;
    buffer[1] = 0x02;
    buffer[2] = (validateKeypair ? 0x01 : 0x00);
    buffer[3] = (returnChainCode ? 0x01 : 0x00);
    buffer[4] = 1 + splitPath.length * 4;
    buffer[5] = splitPath.length;
    splitPath.forEach(function (element, index) {
        buffer.writeUInt32BE(element, 6 + 4 * index);
    });
    var verifyMsg = Buffer.from('0xffffff', 'hex');
    buffer = Buffer.concat([buffer, verifyMsg]);
    return this.comm.exchange(buffer.toString('hex'), [0x9000]).then(function(response) {
        var result = {};
        response = new Buffer(response, 'hex');
        var offset = 0;
        var publicKeyLength = response[offset];
        offset += 1;
        var rawPublicKey = response.slice(offset, offset + publicKeyLength);
        offset += publicKeyLength;
        var publicKey = StellarSdk.StrKey.encodeEd25519PublicKey(rawPublicKey);
        result['publicKey'] = publicKey;
        if (validateKeypair) {
            var signatureLength = response[offset++];
            var signature = response.slice(offset, offset + signatureLength);
            offset += signatureLength;
            result['signature'] = signature.toString('hex');
            var keyPair = StellarSdk.Keypair.fromPublicKey(publicKey);
            if (!keyPair.verify(verifyMsg, signature)) {
                throw new Error('Bad signature. Keypair is invalid. Please report this.');
            }
        }
        if (returnChainCode) {
            var chaincodeLength = response[offset++];
            result['chainCode'] = response.slice(offset, offset + chaincodeLength).toString('hex');
        }
        return result;
    });
};

Sledger.prototype.signTx_async = function(path, publicKey, transaction) {
    validateIsSinglePaymentTx(transaction);
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
    if (buffer.length > 255) {
        var msg = 'Transaction too large. Allowed: 255; actual: ' + buffer.length;
        throw new Error(msg);
    }
    return this.comm.exchange(buffer.toString('hex'), [0x9000, 0x6985]).then(function(response) {
        var status = response.slice(response.length - 4).toString('hex');
        if (status === '9000') {
            var result = {};
            var signature = new Buffer(response.slice(0, response.length - 4), 'hex');
            addSignatureToTx(transaction, publicKey, signature);
            result['transaction'] = transaction;
            result['signature'] = signature;
            return result;
        } else {
            throw new Error('Transaction approval request was rejected');
        }
    });
};

Sledger.prototype.signTxHash_async = function(path, publicKey, transaction) {
	var txHash = transaction.hash();
    var splitPath = utils.splitPath(path);
    var buffer = new Buffer(5 + 1 + splitPath.length * 4);
    buffer[0] = 0xe0;
    buffer[1] = 0x08;
    buffer[2] = 0x00;
    buffer[3] = 0x00;
    buffer[4] = 1 + splitPath.length * 4 + txHash.length;
    buffer[5] = splitPath.length;
    splitPath.forEach(function (element, index) {
        buffer.writeUInt32BE(element, 6 + 4 * index);
    });
    buffer = Buffer.concat([buffer, txHash]);
    return this.comm.exchange(buffer.toString('hex'), [0x9000, 0x6985]).then(function(response) {
        var status = response.slice(response.length - 4).toString('hex');
        if (status === '9000') {
            var result = {};
            var signature = new Buffer(response.slice(0, response.length - 4), 'hex');
            addSignatureToTx(transaction, publicKey, signature);
            result['transaction'] = transaction;
            result['signature'] = signature;
            return result;
        } else {
            throw new Error('Transaction approval request was rejected');
        }
    });
};

function validateIsSinglePaymentTx(transaction) {
    if (transaction.operations.length > 1) {
        throw new Error('Method signTx_async only allows a single payment operation per transaction.' +
            ' Use signTxHash_async for this type of transaction');
    }
    var operation = transaction.operations[0];
    if (operation.type !== 'payment') {
        throw new Error('Method signTx_async only allows operations of type \'payment\'.' +
            ' Found: ' + operation.type + '. Use signTxHash_async for this type of transaction');
    }
}

function addSignatureToTx(transaction, publicKey, signature) {
    var keyPair = StellarSdk.Keypair.fromPublicKey(publicKey);
    var hint = keyPair.signatureHint();
    var decorated = new StellarSdk.xdr.DecoratedSignature({hint: hint, signature: signature});
    transaction.signatures.push(decorated);
}

module.exports = Sledger;
