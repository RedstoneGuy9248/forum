const mariadb = require("mariadb");
const DEV = process.env.DEV === "true";
if (DEV) {
    require("dotenv").config({quiet: true});
};
const pool = mariadb.createPool({
    host: DEV ? "localhost" : "db",
    port: DEV ? process.env.dbport : 3306,
    user: process.env.dbusername,
    password: process.env.dbpassword,
    database: process.env.dbname,
    multipleStatements: true,
    connectTimeout: 10000,
    acquireTimeout: 10000
});
module.exports = pool;
