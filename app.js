const express = require("express");
const cookieParser = require("cookie-parser");
const expressLayouts = require('express-ejs-layouts');
const nocache = require("nocache");
const app = express();
const functions = require("./functions");
const routeApiV1 = require("./routes/api/v1/routes");
app.use(express.json());
app.use(cookieParser());
app.use(nocache());
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static("./static"));
app.get("", (req, res) => {
    res.render('index');
});
app.use("/api/v1", routeApiV1);
app.listen(5000, () => {console.log("http://localhost:5000");});
functions.removeExpiredTokens();