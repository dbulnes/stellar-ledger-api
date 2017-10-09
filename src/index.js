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

LedgerStr.prototype.getAddress_async = function(path, boolDisplay, boolChaincode) {
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
		result['publicKey'] = utils.encodeEd25519PublicKey(response.slice(1, 1 + publicKeyLength));
		if (boolChaincode) {
			result['chainCode'] = response.slice(1 + publicKeyLength, 1 + publicKeyLength + 32).toString('hex');
		}
		return result;
	});
}

module.exports = LedgerStr;
