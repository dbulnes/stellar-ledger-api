/********************************************************************************
 *   Stellar Ledger API
 *   (c) 2017 - 2018 LeNonDupe
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

const CLA = 0xe0;
const INS_GET_PK = 0x02;
const INS_SIGN_TX = 0x04;
const INS_GET_CONF = 0x06;
const INS_SIGN_TX_HASH = 0x08;

const APDU_MAX_SIZE = 150;
const P1_FIRST_APDU = 0x00;
const P1_MORE_APDU = 0x80;
const P2_LAST_APDU = 0x00;
const P2_MORE_APDU = 0x80;

const SW_OK = 0x9000;
const SW_CANCEL = 0x6985;
const SW_UNKNOWN_OP = 0x6c24;

var StellarLedgerApi = function(comm) {
    this.comm = comm;
    this.comm.setScrambleKey('l0v');
};

StellarLedgerApi.prototype.getAppConfiguration_async = function() {
    var buffer = Buffer.alloc(5);
    buffer[0] = CLA;
    buffer[1] = INS_GET_CONF;
    buffer[2] = 0x00;
    buffer[3] = 0x00;
    buffer[4] = 0x00;
    return this.comm.exchange(buffer.toString('hex'), [SW_OK]).then(function(response) {
        var result = {};
        response = Buffer.from(response, 'hex');
        result['version'] = "" + response[1] + '.' + response[2] + '.' + response[3];
        return result;
    });
};

StellarLedgerApi.prototype.getPublicKey_async = function(path, validateKeypair, confirm) {
    checkStellarBip32Path(path);
    var splitPath = utils.splitPath(path);
    var buffer = Buffer.alloc(5 + 1 + splitPath.length * 4);
    buffer[0] = CLA;
    buffer[1] = INS_GET_PK;
    buffer[2] = (validateKeypair ? 0x01 : 0x00);
    buffer[3] = (confirm ? 0x01 : 0x00);
    buffer[4] = 1 + splitPath.length * 4;
    buffer[5] = splitPath.length;
    splitPath.forEach(function (element, index) {
        buffer.writeUInt32BE(element, 6 + 4 * index);
    });
    var verifyMsg = Buffer.from('0xffffff', 'hex');
    buffer = Buffer.concat([buffer, verifyMsg]);
    return this.comm.exchange(buffer.toString('hex'), [SW_OK]).then(function(response) {
        var result = {};
        response = Buffer.from(response, 'hex');
        var offset = 0;
        var rawPublicKey = response.slice(offset, offset + 32);
        offset += 32;
        result['publicKey'] = utils.encodeEd25519PublicKey(rawPublicKey);
        if (validateKeypair) {
            var signature = response.slice(offset, offset + 64);
            if (!utils.verifyEd25519Signature(verifyMsg, signature, rawPublicKey)) {
                throw new Error('Bad signature. Keypair is invalid. Please report this.');
            }
        }
        return result;
    });
};

StellarLedgerApi.prototype.signTx_async = function(path, transaction) {
    checkStellarBip32Path(path);

    if (transaction.operations.length > 1) {
        throw new Error('The transaction contains multiple operations. ' +
            'This is not supported by the Ledger at this time.');
    }

    var signatureBase = transaction.signatureBase();

    var apdus = [];
    var self = this;
    var response;

    var splitPath = utils.splitPath(path);
    var bufferSize = 5 + 1 + splitPath.length * 4;
    var buffer = Buffer.alloc(bufferSize);
    buffer[0] = CLA;
    buffer[1] = INS_SIGN_TX;
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
    } else { // we need to send multiple apdus to transmit the entire transaction
        buffer[3] = P2_MORE_APDU;
        buffer[4] = 1 + splitPath.length * 4 + chunkSize;
        var chunk = Buffer.alloc(chunkSize);
        var offset = 0;
        signatureBase.copy(chunk, 0, offset, chunkSize);
        buffer = Buffer.concat([buffer, chunk]);
        apdus.push(buffer.toString('hex'));
        offset += chunkSize;
        while (offset < signatureBase.length) {
            var remaining = signatureBase.length - offset;
            var available = APDU_MAX_SIZE - 5;
            chunkSize = remaining < available ? remaining : available;
            chunk = Buffer.alloc(chunkSize);
            signatureBase.copy(chunk, 0, offset, offset + chunkSize);
            offset += chunkSize;
            buffer = Buffer.alloc(5);
            buffer[0] = CLA;
            buffer[1] = INS_SIGN_TX;
            buffer[2] = P1_MORE_APDU;
            buffer[3] = offset < signatureBase.length ? P2_MORE_APDU : P2_LAST_APDU;
            buffer[4] = chunkSize;
            buffer = Buffer.concat([buffer, chunk]);
            apdus.push(buffer.toString('hex'));
        }
    }
    return utils.foreach(apdus, function(apdu) {
        return self.comm.exchange(apdu, [SW_OK, SW_CANCEL, SW_UNKNOWN_OP]).then(function(nextResponse) {
            response = nextResponse;
        });
    }).then(function() {
        var status = Buffer.from(response.slice(response.length - 4), 'hex').readUInt16BE(0);
        if (status === SW_OK) {
            var result = {};
            var signature = Buffer.from(response.slice(0, response.length - 4), 'hex');
            result['transaction'] = transaction;
            result['signature'] = signature;
            return result;
        } else if (status === SW_UNKNOWN_OP) {
            console.log('Operation unknown to device. ' +
                'Make sure you have the latest version of the Stellar app on your device.');
            // fall back on hash signing (pre-2.0)
            return signTxHash_async_internal.call(self, path, transaction.hash());
        } else {
            throw new Error('Transaction approval request was rejected');
        }
    });
};

StellarLedgerApi.prototype.signTxHash_async = function() {
    throw new Error('This method of signing transactions was removed. Use signTx_async instead.');
};

StellarLedgerApi.prototype.connect = function(success, error) {
  this.getAppConfiguration_async().then(success)
    .catch(function (err) { error(err); });
};

// deprecated
function signTxHash_async_internal(path, txHash) {
  var splitPath = utils.splitPath(path);
  var buffer = Buffer.alloc(5 + 1 + splitPath.length * 4);
  buffer[0] = CLA;
  buffer[1] = INS_SIGN_TX_HASH;
  buffer[2] = 0x00;
  buffer[3] = 0x00;
  buffer[4] = 1 + splitPath.length * 4 + txHash.length;
  buffer[5] = splitPath.length;
  splitPath.forEach(function (element, index) {
    buffer.writeUInt32BE(element, 6 + 4 * index);
  });
  buffer = Buffer.concat([buffer, txHash]);
  return this.comm.exchange(buffer.toString('hex'), [SW_OK, SW_CANCEL]).then(function(response) {
    var status = Buffer.from(response.slice(response.length - 4), 'hex').readUInt16BE(0);
    if (status === SW_OK) {
      var result = {};
      result['signature'] = Buffer.from(response.slice(0, response.length - 4), 'hex');
      return result;
    } else {
      throw new Error('Transaction approval request was rejected');
    }
  });
}

function checkStellarBip32Path(path) {
    if (!path.startsWith("44'/148'")) {
        throw new Error("Not a Stellar BIP32 path. Path: " + path + "."
            + " The Stellar app is authorized only for paths starting with 44'/148'."
            + " Example: 44'/148'/0'");
    }
    path.split('/').forEach(function (element) {
        if (!element.toString().endsWith('\'')) {
            throw new Error("Detected a non-hardened path element in requested BIP32 path." +
                " Non-hardended paths are not supported at this time. Please use an all-hardened path." +
                " Example: 44'/148'/0'");
        }
    });
}

module.exports = StellarLedgerApi;
