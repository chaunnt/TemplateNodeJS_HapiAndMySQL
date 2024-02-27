/* Copyright (c) 2021-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moment = require('moment');
const geoip = require('geoip-lite');
const crypto = require('crypto');
const Joi = require('joi');
function nonAccentVietnamese(str) {
  if (!str) {
    return str;
  }

  //     We can also use this instead of from line 11 to line 17
  //     str = str.replace(/\u00E0|\u00E1|\u1EA1|\u1EA3|\u00E3|\u00E2|\u1EA7|\u1EA5|\u1EAD|\u1EA9|\u1EAB|\u0103|\u1EB1|\u1EAF|\u1EB7|\u1EB3|\u1EB5/g, "a");
  //     str = str.replace(/\u00E8|\u00E9|\u1EB9|\u1EBB|\u1EBD|\u00EA|\u1EC1|\u1EBF|\u1EC7|\u1EC3|\u1EC5/g, "e");
  //     str = str.replace(/\u00EC|\u00ED|\u1ECB|\u1EC9|\u0129/g, "i");
  //     str = str.replace(/\u00F2|\u00F3|\u1ECD|\u1ECF|\u00F5|\u00F4|\u1ED3|\u1ED1|\u1ED9|\u1ED5|\u1ED7|\u01A1|\u1EDD|\u1EDB|\u1EE3|\u1EDF|\u1EE1/g, "o");
  //     str = str.replace(/\u00F9|\u00FA|\u1EE5|\u1EE7|\u0169|\u01B0|\u1EEB|\u1EE9|\u1EF1|\u1EED|\u1EEF/g, "u");
  //     str = str.replace(/\u1EF3|\u00FD|\u1EF5|\u1EF7|\u1EF9/g, "y");
  //     str = str.replace(/\u0111/g, "d");
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');

  //upper cases
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/Đ/g, 'D');

  // Some system encode vietnamese combining accent as individual utf-8 characters
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ''); // Huyền sắc hỏi ngã nặng
  str = str.replace(/\u02C6|\u0306|\u031B/g, ''); // Â, Ê, Ă, Ơ, Ư
  return str;
}

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(find, 'g'), replace);
}

function removeSpecialChars(str) {
  // Loại bỏ tất cả các ký tự đặc biệt, trừ chữ số và chữ cái (hoa và thường)
  let outString = str.replace(/[^a-zA-Z0-9]/g, '');
  return outString;
}

function convertToURIFormat(str) {
  let outString = removeSpecialChars(str);
  return encodeURI(replaceAll(outString, ' ', '-'));
}

function convertToURLFormat(str) {
  return '/' + convertToURIFormat(str);
}

function randomInt(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

async function chunkArray(arrData, chunkSize) {
  var arrayResult = [];
  for (var i = 0; i < arrData.length; i += chunkSize) {
    arrayResult.push(arrData.slice(i, i + chunkSize));
  }
  return arrayResult;
}

function FormatDate(date, resultFormat) {
  var newDate = moment(date, 'YYYY-MM-DD');
  var newDateFormat = newDate.format(`${resultFormat}`);
  return newDateFormat;
}

function padLeadingZeros(num, size, char = '0') {
  var s = num + '';
  while (s.length < size) s = char + s;
  return s;
}

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function randomIntByMinMax(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomFloatByMinMax(min, max) {
  let _mutiplyRate = 1000;
  let _newMin = min * _mutiplyRate;
  let _newMax = max * _mutiplyRate;
  let result = min;

  for (let i = 0; i < 100; i++) {
    result = randomIntByMinMax(_newMin, _newMax);
    result = parseFloat(result / _mutiplyRate).toFixed(5);
  }
  return result;
}

function convertStringToHex(inputText) {
  const bufferText = Buffer.from(inputText, 'utf8'); // or Buffer.from('hello world')
  return bufferText.toString('hex');
}

function isNotValidValue(value) {
  if (!value) {
    return true;
  }
  if (value === null) {
    return true;
  }
  return false;
}

function isValidValue(value) {
  return !isNotValidValue(value);
}

function isNotEmptyStringValue(stringValue) {
  if (isNotValidValue(stringValue)) {
    return false;
  }
  if ((stringValue + '').trim() === '') {
    return false;
  }
  if (stringValue.length === 0) {
    return false;
  }
  return true;
}

function isInvalidStringValue(stringValue) {
  return Joi.string().min(1).validate(stringValue) === null ? true : false;
}

function makeHashFromData(data) {
  const hashData = crypto
    .createHmac('sha256', 'ThisIsSecretKey')
    .update(data + '')
    .digest('hex');
  return hashData;
}

function checkingValidPlateNumber(plateNumber) {
  return !/[^A-Z0-9]/g.test(plateNumber);
}

function tryJsonParse(data) {
  if (data) {
    try {
      return JSON.parse(data);
    } catch (error) {
      return {};
    }
  }
  return data;
}

function tryStringify(data) {
  try {
    return JSON.stringify(data);
  } catch (error) {
    return {};
  }
}

function getValidValueArray(constantData) {
  return Object.values(constantData);
}

async function executeBatchPromise(promiseList, batchSize = 30) {
  let _executingPromiseList = chunkArray(promiseList, batchSize);
  for (let i = 0; i < _executingPromiseList.length; i++) {
    await Promise.all(_executingPromiseList[i]);
  }
}

function getGeoInfoFromClientIP(clientIp) {
  const geoInfo = geoip.lookup(clientIp);
  return geoInfo;
}

function mapRegionToArea(region) {
  switch (region) {
    case 'HN':
      return 'Hà Nội';
    case 'DN':
      return 'Đà Nẵng';
    case 'SG':
      return 'Hồ Chí Minh';
    case '57':
      return 'Bình Dương';
    case '26':
      return 'Thừa Thiên - Huế';
    default:
      return null;
  }
}

function replaceCharactersFirstLast(str, startLength = 1, endLength = 1) {
  if (str.length <= 2) {
    return str;
  }
  const firstChar = str.slice(0, startLength);
  const lastChar = str.slice(str.length - endLength, str.length);
  const middleChars = str.slice(startLength, str.length - endLength);
  const replacedChars = middleChars.replace(/./g, '*');
  return firstChar + replacedChars + lastChar;
}

function replaceCharactersToHide(str, charLength = 1) {
  if (!str || str.length <= 2) {
    return str;
  }
  const firstChar = str.slice(0, charLength);
  const lastChar = str.slice(str.length - charLength, str.length);
  const middleChars = str.slice(charLength, str.length - charLength);
  const replacedChars = middleChars.replace(/./g, '*');
  return firstChar + replacedChars + lastChar;
}

// let _specialChars = '!@#$%^&*)';
// _specialChars = _specialChars.split('');
let _number = '0123456789';
_number = _number.split('');
function generateFakerUsername(isHiddenUsername = true) {
  const faker = require('faker');
  let fakeUserName = faker.name.firstName() + faker.name.lastName();

  let indexOfRecord = new Date() * 1;

  if (indexOfRecord % 3 === 0) {
    fakeUserName = fakeUserName.toUpperCase();
  } else if (indexOfRecord % 5 === 0) {
    fakeUserName = fakeUserName;
  } else if (indexOfRecord % 4 === 0) {
    // let _charIdx = randomIntByMinMax(0, _specialChars.length - 1);
    fakeUserName = fakeUserName.toUpperCase();
    let _randomNumber = randomIntByMinMax(0, _number.length - 1);
    fakeUserName = fakeUserName.toUpperCase() + _number[_randomNumber];
  } else {
    let _randomNumber = randomIntByMinMax(0, _number.length - 1);
    fakeUserName = fakeUserName + _number[_randomNumber];
  }
  if (isHiddenUsername) {
    fakeUserName = replaceCharactersToHide(fakeUserName);
  }
  return fakeUserName;
}
generateFakerUsername();
function formatCurrency(amount) {
  const number = new Intl.NumberFormat('en-EN').format(amount);
  return number;
}

function shuffleArrayRandom(array) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }

  return array;
}

async function executeBatchPromise(promiseList, batchSize = 30) {
  let _executingPromiseList = chunkArray(promiseList, batchSize);
  for (let i = 0; i < _executingPromiseList.length; i++) {
    await Promise.all(_executingPromiseList[i]);
  }
}

module.exports = {
  nonAccentVietnamese,
  executeBatchPromise,
  replaceAll,
  removeSpecialChars,
  convertToURLFormat,
  generateFakerUsername,
  randomInt,
  randomIntByMinMax,
  randomFloatByMinMax,
  chunkArray,
  executeBatchPromise,
  FormatDate,
  getValidValueArray,
  padLeadingZeros,
  convertStringToHex,
  isNotEmptyStringValue,
  isNotValidValue,
  isValidValue,
  isInvalidStringValue,
  makeHashFromData,
  checkingValidPlateNumber,
  tryJsonParse,
  tryStringify,
  getGeoInfoFromClientIP,
  mapRegionToArea,
  shuffleArrayRandom,
  formatCurrency,
  replaceCharactersFirstLast,
  replaceCharactersToHide,
};
