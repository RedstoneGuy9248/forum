const express = require("express");
const cookieParser = require("cookie-parser");
const expressLayouts = require('express-ejs-layouts');
const nocache = require("nocache");
const app = express();
const functions = require("./functions");
const routeApiV1 = require("./routes/api/v1/routes");
(async () => {
    await functions.startupTests();
    functions.removeExpiredTokens();
    app.use(express.json());
    app.use(cookieParser());
    app.use(nocache());
    app.set('view engine', 'ejs');
    app.use(expressLayouts);
    app.use(express.static("./static"));
    app.get("/", (req, res) => {
        res.render('index', {title: "Forum: Home"});
    });
    app.get("/profile", (req, res) => {
        res.render('profile', {title: "Forum: Profile"});
    });
    app.get("/profile/edit", (req, res) => {
        res.render('profile/edit', {title: "Forum: Edit Profile"});
    });
    app.get("/new-post", (req, res) => {
        res.render('new-post', {title: "Forum: New Post"});
    });

    app.get("/user/:id", (req, res) => {
        res.render('user', {id: req.params.id, title: `Forum: View User`});
    });
    app.get("/login", (req, res) => {
        res.render('login', {title: "Forum: Login"});
    });
    app.get("/signup", (req, res) => {
        res.render('signup', {title: "Forum: Signup"});
    });
    app.get("/post/:id", (req, res) => {
        res.render('post', {id: req.params.id, title: `Forum: View Post`});
    });
    app.use("/api/v1", routeApiV1);
    app.listen(5000, () => {console.log("http://localhost:5000");});
})();
