require("dotenv").config();
const mysql = require("mysql");

const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASS;
const DB_NAME = process.env.DB_NAME;

const con = mysql.createConnection({
  host: DB_HOST || "127.0.0.1",
  user: DB_USER || "root",
  password: DB_PASS,
  database: DB_NAME || "my-sales-coach",
  multipleStatements: true,
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");

  // UPDATE THE table name here!!
  let sql =
    "DROP TABLE if exists XXXX; CREATE TABLE XXXXX(id INT NOT NULL AUTO_INCREMENT, firstname VARCHAR(40) not null, lastname VARCHAR(40) not null, PRIMARY KEY (id));";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Table creation `XXXXX` was successful!");

    console.log("Closing...");
  });

  con.end();
});
