const mariadb = require("mariadb");
require("dotenv").config({quiet: true});
const pool = mariadb.createPool({
    host: "localhost",
    port: process.env.dbport,
    user: process.env.dbusername,
    password: process.env.dbpassword,
    database: process.env.dbname,
    multipleStatements: true,
    connectTimeout: 2000,
    acquireTimeout: 2000
});
module.exports = pool;
