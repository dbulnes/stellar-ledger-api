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
		var response = new Buffer(response, 'hex');
		var publicKeyLength = response[0];
		return response.slice(1, 1 + publicKeyLength);
	});
}

LedgerStr.prototype.getPrivateKey_async = function(path) {
	var splitPath = utils.splitPath(path);
	var buffer = new Buffer(5 + 1 + splitPath.length * 4);
	buffer[0] = 0xe0;
	buffer[1] = 0x08;
	buffer[2] = 0x00;
	buffer[3] = 0x00;
	buffer[4] = 1 + splitPath.length * 4;
	buffer[5] = splitPath.length;
	splitPath.forEach(function (element, index) {
		buffer.writeUInt32BE(element, 6 + 4 * index);
	});
	return this.comm.exchange(buffer.toString('hex'), [0x9000]).then(function(response) {
		var response = new Buffer(response, 'hex');
		var secretKeyLength = response[0];
        return response.slice(1, 1 + secretKeyLength);
	});
}

LedgerStr.prototype.sign_async = function(path, rawTx) {
	var splitPath = utils.splitPath(path);
	var offset = 0;
	var apdus = [];
	var response = [];
	var self = this;
	while (offset != rawTx.length) {
		var maxChunkSize = (offset == 0 ? (150 - 1 - splitPath.length * 4) : 150)
		var chunkSize = (offset + maxChunkSize > rawTx.length ? rawTx.length - offset : maxChunkSize);
		var buffer = new Buffer(offset == 0 ? 5 + 1 + splitPath.length * 4 + chunkSize : 5 + chunkSize);
		buffer[0] = 0xe0;
		buffer[1] = 0x04;
		buffer[2] = (offset == 0 ? 0x00 : 0x80);
		buffer[3] = 0x00;
		buffer[4] = (offset == 0 ? 1 + splitPath.length * 4 + chunkSize : chunkSize);
		if (offset == 0) {
			buffer[5] = splitPath.length;
			splitPath.forEach(function (element, index) {
				buffer.writeUInt32BE(element, 6 + 4 * index);
			});
			rawTx.copy(buffer, 6 + 4 * splitPath.length, offset, offset + chunkSize);
		}
		else {
			rawTx.copy(buffer, 5, offset, offset + chunkSize);
		}
		apdus.push(buffer.toString('hex'));
		offset += chunkSize;
	}
	return utils.foreach(apdus, function(apdu) {
		return self.comm.exchange(apdu, [0x9000]).then(function(apduResponse) {
			response = apduResponse;
		})
	}).then(function() {
		response = new Buffer(response, 'hex');
        return response.slice(0, response.length - 2);
	})
}

LedgerStr.prototype.testSign_async = function(key, message) {
    var preamble = new Buffer(5);
    preamble[0] = 0xe0;
    preamble[1] = 0x10;
    preamble[2] = 0x00;
    preamble[3] = 0x00;
    preamble[4] = key.length + message.length;
    var buffer = Buffer.concat([preamble, key, message]);
    return this.comm.exchange(buffer.toString('hex'), [0x9000]).then(function(response) {
        var response = new Buffer(response, 'hex');
        var sigLength = response[0];
        return response.slice(1, 1 + sigLength);
    });
}

module.exports = LedgerStr;
