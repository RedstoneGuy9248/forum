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
    connectTimeout: 2000,
    acquireTimeout: 2000
});
module.exports = pool;
