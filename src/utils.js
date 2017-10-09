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
var crc = require('crc');
var base32 = require('base32.js');

var SledgerUtils = {}

SledgerUtils.splitPath = function(path) {
	var result = [];
	var components = path.split('/');
	components.forEach(function (element, index) {
		var number = parseInt(element, 10);
		if (isNaN(number)) {
			return;
		}
		if ((element.length > 1) && (element[element.length - 1] == "'")) {
			number += 0x80000000;
		}
		result.push(number);
	});
	return result;
}

SledgerUtils.encodeEd25519PublicKey = function(data) {
  data              = new Buffer(data);
  let versionByte   = 6 << 3; // ed25519PublicKey (G)
  let versionBuffer = new Buffer([versionByte]);
  let payload       = Buffer.concat([versionBuffer, data]);
  let checksum      = new Buffer(2);
  checksum.writeUInt16LE(crc.crc16xmodem(payload), 0);
  let unencoded     = Buffer.concat([payload, checksum]);

  return base32.encode(unencoded);
}

module.exports = SledgerUtils;
