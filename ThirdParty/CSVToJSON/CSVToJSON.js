/* Copyright (c) 2023 TORITECH LIMITED 2022 */

function ReadCSVToJSON(filePath) {
  const csvtojson = require('csvtojson');
  return new Promise((resolve, reject) => {
    try {
      csvtojson({
        delimiter: ';',
      })
        .fromFile(filePath)
        .then(jsonObj => {
          resolve(jsonObj);
        });
    } catch (error) {
      reject(error);
    }
  });
}
module.exports = {
  ReadCSVToJSON,
};
