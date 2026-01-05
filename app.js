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
    app.get("/", async (req, res) => {
        const p = parseInt(req.query.p) ? parseInt(req.query.p) : 1;
        const l = parseInt(req.query.l) ? parseInt(req.query.l) : 10;
        const result = await functions.getPosts(l, p);
        if (result.success) {
          res.render('index', {title: "Forum: Home", p, l, result: result.data});
        } else {
            res.status(result.code).send(result.error);
        };
    });
    app.get("/profile", async (req, res) => {
        if (!req.cookies.token) {return res.status(401).send("Unauthorised");};
        const userInfo = await functions.verifyToken(req.cookies.token);
        if (!userInfo.success) {return res.status(userInfo.code).send(userInfo.error);};
        const posts = await functions.getPosts(10, 1, userInfo.data[0].username);
        if (!posts.success) {return res.status(posts.code).send(posts.error);};
        res.render('profile', {title: "Forum: Profile", userInfo: userInfo.data[0], posts: posts.data});
    });
    app.get("/profile/edit", async (req, res) => {
        if (!req.cookies.token) {return res.status(401).send("Unauthorised");};
        const userInfo = await functions.verifyToken(req.cookies.token);
        if (!userInfo.success) {return res.status(userInfo.code).send(userInfo.error);};
        res.render('profile/edit', {title: "Forum: Edit Profile", userInfo: userInfo.data[0]});
    });
    app.get("/new-post", (req, res) => {
        res.render('new-post', {title: "Forum: New Post"});
    });

    app.get("/user/:id", async (req, res) => {
        const id = req.params.id;
        const userInfo = await functions.getUser(id);
        if (!userInfo.success) {return res.status(userInfo.code).send(userInfo.error);};
        const posts = await functions.getPosts(10, 1, id);
        if (!posts.success) {return res.status(posts.code).send(posts.error);};
        res.render('user', {id, title: `Forum: View User`, userInfo: userInfo.data[0], posts: posts.data});
    });
    app.get("/login", (req, res) => {
        res.render('login', {title: "Forum: Login"});
    });
    app.get("/signup", (req, res) => {
        res.render('signup', {title: "Forum: Signup"});
    });
    app.get("/post/:id", async (req, res) => {
        const id = req.params.id;
        const comments = await functions.getComments(id, 10, 1);
        if (!comments.success) {return res.status(comments.code).send(comments.error);};
        const post = await functions.getPost(id, req.cookies.token ? req.cookies.token : null);
        if (!post.success) {return res.status(post.code).send(post.error);};
        res.render('post', {id, title: `Forum: View Post`, comments, post});
    });
    app.use("/api/v1", routeApiV1);
    app.listen(5000, () => {console.log("http://localhost:5000");});
})();
