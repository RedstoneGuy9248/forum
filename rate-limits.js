const { rateLimit } = require("express-rate-limit");

const builder = (window, limit) => {
    return rateLimit({
        windowMs: 1000 * 60 * window,
        limit,
        standardHeaders: "draft-8",
        legacyHeaders: false
    });
};
 
const limits = {
    api: {
        v1: {
            login: builder(15, 5),
            signup: builder(60, 5),
            logout: builder(5, 30),
            verifytoken: builder(1, 60),
            posts: builder(1, 300),
            user: builder(1, 50),
            comments: builder(1, 300),
            addpost: builder(1, 5),
            addcomment: builder(1, 20),
            profile: builder(1, 20),
        }
    },
};

module.exports = {limits};