const mariadb = require("mariadb");
require("dotenv").config();
const pool = mariadb.createPool({
    host: "localhost",
    port: process.env.dbport,
    user: process.env.dbusername,
    password: process.env.dbpassword,
    database: process.env.dbname
});
module.exports = pool;