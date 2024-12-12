const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'shops',
});

connection.connect(error => {
  if (error) {
    console.log('Error connecting to the database', error);
    return;
  }
  console.log('Connected!!!');
});

module.exports = connection;
