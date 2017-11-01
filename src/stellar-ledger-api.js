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

const APDU_MAX_SIZE = 255;
const P1_FIRST_APDU = 0x00;
const P1_MORE_APDU = 0x80;
const P2_LAST_APDU = 0x00;
const P2_MORE_APDU = 0x80;

// TODO: check bip 32 path is a stellar path and with only hardened elements

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
        var rawPublicKey = response.slice(offset, offset + 32);
        offset += 32;
        var publicKey = StellarSdk.StrKey.encodeEd25519PublicKey(rawPublicKey);
        result['publicKey'] = publicKey;
        if (validateKeypair) {
            var signature = response.slice(offset, offset + 64);
            offset += 64;
            var keyPair = StellarSdk.Keypair.fromPublicKey(publicKey);
            if (!keyPair.verify(verifyMsg, signature)) {
                throw new Error('Bad signature. Keypair is invalid. Please report this.');
            }
        }
        if (returnChainCode) {
            result['chainCode'] = response.slice(offset, offset + 32).toString('hex');
        }
        return result;
    });
};

Sledger.prototype.signTx_async = function(path, publicKey, transaction) {

    validateIsSinglePaymentTx(transaction);
    var signatureBase = transaction.signatureBase();

    var apdus = [];
    var self = this;
    var response;

    var splitPath = utils.splitPath(path);
    var bufferSize = 5 + 1 + splitPath.length * 4;
    var buffer = new Buffer(bufferSize);
    buffer[0] = 0xe0;
    buffer[1] = 0x04;
    buffer[2] = P1_FIRST_APDU;
    buffer[5] = splitPath.length;
    splitPath.forEach(function (element, index) {
        buffer.writeUInt32BE(element, 6 + 4 * index);
    });

    var chunkSize = APDU_MAX_SIZE - bufferSize;
    if (signatureBase.length <= chunkSize) { // it fits in a single apdu
        buffer[3] = P2_LAST_APDU;
        buffer[4] = 1 + splitPath.length * 4 + signatureBase.length;
        buffer = Buffer.concat([buffer, signatureBase]);
        apdus.push(buffer.toString('hex'));
    } else { // we need to send the multiple apdus to transmit the entire transaction
        buffer[3] = P2_MORE_APDU;
        buffer[4] = 1 + splitPath.length * 4 + chunkSize;
        // assert.equal(APDU_MAX_SIZE, buffer[4], 'Expected max apdu size, was: ' + buffer[4]);
        var chunk = new Buffer(chunkSize);
        var offset = 0;
        signatureBase.copy(chunk, 0, offset, chunkSize);
        buffer = Buffer.concat([buffer, chunk]);
        apdus.push(buffer.toString('hex'));
        offset += chunkSize;
        while (offset < signatureBase.length) {
            var remaining = signatureBase.length - offset;
            var available = APDU_MAX_SIZE - 5;
            chunkSize = remaining < available ? remaining : available;
            chunk = new Buffer(chunkSize);
            signatureBase.copy(chunk, 0, offset, offset + chunkSize);
            offset += chunkSize;
            buffer = new Buffer(5);
            buffer[0] = 0xe0;
            buffer[1] = 0x04;
            buffer[2] = P1_MORE_APDU;
            buffer[3] = offset < signatureBase.length ? P2_MORE_APDU : P2_LAST_APDU;
            buffer[4] = chunkSize;
            buffer = Buffer.concat([buffer, chunk]);
            apdus.push(buffer.toString('hex'));
        }
    }
    return utils.foreach(apdus, function(apdu) {
        return self.comm.exchange(apdu, [0x9000, 0x6985]).then(function(nextResponse) {
            response = nextResponse;
        });
    }).then(function() {
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
