const express = require("express");
const cookieParser = require("cookie-parser");
const nocache = require("nocache");
const app = express();
app.use(express.json());
app.use(express.static("./static"));
app.use(cookieParser());
app.use(nocache());
app.listen(5000, () => {console.log("http://localhost:5000")});
