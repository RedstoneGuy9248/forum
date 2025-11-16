const functions = require("../../../functions");
const express = require("express");
const router = express.Router();
const rateLimitsObj = require("../../../rate-limits");
const limits = rateLimitsObj.limits.api.v1;
const checkIfInputsGiven = (req, res, next) => {
    if (!req.body) {return res.status(400).json({success: false, error: "Provide username and password"});};
    if (!req.body.username) {return res.status(400).json({success: false, error: "Provide username"});};
    if (!req.body.password) {return res.status(400).json({success: false, error: "Provide password"});};
    next();
};

//AUTH

router.post("/signup", limits.signup, checkIfInputsGiven, async (req, res) => {
    const { username, password } = req.body;
    const result = await functions.signUp(username, password);
    if (result.success) {return res.status(result.code).json({success: result.success});} else {return res.status(result.code).json({success: result.success, error: result.error});};
});

router.post("/login", limits.login, checkIfInputsGiven, async (req, res) => {
    if (req.cookies.token) {
        return res.status(400).json({success: false, error:"already logged in. log out by GET /api/v1/logout"});
    } else {
        const { username, password } = req.body;
        const result = await functions.authenticate(username, password);
        if (result.success) {
            return res.status(result.code).cookie("token", result.token, {
                httpOnly: true,
                secure: true,
                path: "/",
                maxAge: 1000 * 60 * 60 * 24 * 7
            }).cookie("authStatus", true, {
                httpOnly: false,
                secure: false,
                path: "/",
                maxAge: 1000 * 60 * 60 * 24 * 7
            }).json({success: result.success, token: result.token});
        } else {return res.status(result.code).json({success: result.success, error: result.error});};
    };
});

router.get("/logout", limits.logout, async (req, res) => {
    if (req.cookies.token) {
        await functions.dropSession(req.cookies.token);
    };
    res.clearCookie("token", {
        secure: true,
        path: "/"
    });
    res.clearCookie("authStatus", {
        httpOnly: false,
        secure: false,
        path: "/"
    });
    res.status(200).json({success: true});
});

router.get("/verifytoken", limits.verifytoken, async (req, res) => {
    if (!req.cookies.token) {return res.status(401).json({success: false, error: "Unauthenticated"});};
    const result = await functions.verifyToken(req.cookies.token);
    return res.status(result.code).json(result.success ? {success: result.success, data: result.data} : {success: result.success, error: result.error});

});

// get data

router.get("/posts", limits.posts, async (req, res) => {
    let limit = 10;
    let page = 1;
    if (req.query.page) 
        {page = parseInt(req.query.page);};
    if (req.query.limit) 
        {limit = parseInt(req.query.limit);};
    if (req.query.id) {id = parseInt(req.query.id);};
    if (!limit || !page) {return res.status(400).json({success: false, error: "int expected in limit/string"});}
    let result;
    if (req.query.id && req.cookies.token) {
        result = await functions.getPost(id, req.cookies.token);
    } else if (req.query.id) {
        result = await functions.getPost(id);
    } else if (req.query.user) {
        result = await functions.getPosts(limit, page, req.query.user);
    } else { 
        result = await functions.getPosts(limit, page);
    };
    return res.status(result.code).json(result.success ? {success: result.success, data: result.data} : {success: result.success, error: result.error});
});

router.get("/user", limits.user, async (req, res) => {
    if (!req.query.id && !req.query.username) {return res.status(400).json({success: false, error: "Specify id or username"});};
    let username;
    if (req.query.username) {username = req.query.username;}
    let result;
    if (req.query.id) {
        const id = parseInt(req.query.id);
        if (!id) {return res.status(400).json({success: false, error: "id should be int"});};
        result = await functions.getUser(id);
    } else {
        result = await functions.getUser(username);
    }
    return res.status(result.code).json(result.success ? {success: result.success, data: result.data} : {success: result.success, error: result.error});
});


router.get("/comments", limits.comments, async (req, res) => {
    if (!req.query.id) {return res.status(400).json({success: false, error: "specify post id"});};
    const id = parseInt(req.query.id);
    if (!id) {return res.status(400).json({success: false, error: "id should be int"});};
    let limit = 10;
    let page = 1;
    if (req.query.page) 
        {page = parseInt(req.query.page);};
    if (req.query.limit) 
        {limit = parseInt(req.query.limit);};
    const result = await functions.getComments(id, limit, page);
    return res.status(result.code).json(result.success ? {success: result.success, data: result.data} : {success: result.success, error: result.error});
});

//add data
router.post("/addpost", limits.addpost, async (req, res) => {
    if (!req.body || !req.body.title || !req.body.content) {return res.status(400).json({success: false, error: "Specify post title and content"});};
    if (!req.cookies.token) {return res.status(401).json({success: false, error: "Unauthenticated"});};
    const token = req.cookies.token;
    const { title, content } = req.body;
    const tokenResult = await functions.verifyToken(token);
    if (!tokenResult.success) {return res.status(tokenResult.code).json({success: false, error: tokenResult.error});};
    const result = await functions.addPost(token, title, content);
    return res.status(result.code).json(result.success ? {success: result.success, id: result.id} : {success: result.success, error: result.error});
});

router.post("/addcomment", limits.addcomment, async (req, res) => {
    if (!req.body || !req.body.post || !req.body.content) {return res.status(400).json({success: false, error: "Specify post id and comment content"});};
    if (!req.cookies.token) {return res.status(401).json({success: false, error: "Unauthenticated"});};
    const token = req.cookies.token;
    const { post, content } = req.body;
    const tokenResult = await functions.verifyToken(token);
    if (!tokenResult.success) {return res.status(tokenResult.code).json({success: false, error: tokenResult.error});};
    const result = await functions.addComment(token, post, content);
    return res.status(result.code).json(result.success ? {success: result.success} : {success: result.success, error: result.error});
});

router.post("/addvote", limits.addvote, async (req, res) => {
    if (!req.body || !req.body.post || !req.body.value) {return res.status(400).json({success: false, error: "Specify post id and comment content"});};
    if (!req.cookies.token) {return res.status(401).json({success: false, error: "Unauthenticated"});};
    if (!(req.body.value == 1 || req.body.value == -1)) {return res.status(400).json({success: false, error: "vote should be 1 (up) or -1 (down)"});};
    const token = req.cookies.token;
    const { post, value } = req.body;
    const tokenResult = await functions.verifyToken(token);    
    if (!tokenResult.success) {return res.status(tokenResult.code).json({success: false, error: tokenResult.error});};
    const result = await functions.addVote(token, post, value);
    return res.status(result.code).json(result.success ? {success: result.success} : {success: result.success, error: result.error});     
});

router.put("/profile", limits.profile, async (req, res) => {
    if (!req.body || !req.body.username || !req.body.display_name || !req.body.description) {return res.status(400).json({success: false, error: "Specify edited content"});};
    if (!req.cookies.token) {return res.status(401).json({success: false, error: "Unauthenticated"});};
    const token = req.cookies.token;
    const { username, display_name, description } = req.body;
    const tokenResult = await functions.verifyToken(token);
    if (!tokenResult.success) {return res.status(tokenResult.code).json({success: false, error: tokenResult.error});};
    const result = await functions.editUser(token, username, display_name, description);
    return res.status(result.code).json(result.success ? {success: result.success, data: result.data} : {success: result.success, error: result.error});
});

module.exports = router;
