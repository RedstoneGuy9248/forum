const bcrypt = require('bcrypt');
const crypto = require('crypto');
const saltRounds = 10;
const pool = require("./db");
const cron = require("node-cron");


const signUp = async (username, password) => {
    const hash = await bcrypt.hash(password, saltRounds);
    if (parseInt(username) || /\s/.test(username)) {return {success: false, code: 400, error: "invalid username"};};
    let conn;
    try {
        conn = await pool.getConnection();
        const userExists = await conn.query("SELECT EXISTS(SELECT 1 FROM users WHERE username = ?) AS FOUND;", [username]);
        if (userExists[0].FOUND) {return {success: false, code: 401, error: "username already exists"};};
        await conn.query("INSERT INTO users (username, display_name, password_hash) VALUES (?, ?, ?)", [username, username, hash]);
        return {success: true, code: 200};
    } catch(err) {console.log(err); return {success: false, code: 500, error: "internal server error"};} finally {if (conn) {conn.end();}};
};



const authenticate = async (username, password) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const userExists = await conn.query("SELECT EXISTS(SELECT 1 FROM users WHERE username = ?) AS FOUND;", [username]);
        if (!userExists[0].FOUND) {return {success: false, code: 401, error: "username doesnt exist"};};
        const hash = await conn.query("SELECT password_hash FROM users WHERE username = ?", [username]);
        const result = await bcrypt.compare(password, hash[0].password_hash);
        if (!result) {return {success: false, code: 401, error: "wrong password"};};
        const token = crypto.randomBytes(64).toString("hex");
        await conn.query("INSERT INTO sessions (id, token) VALUES ((SELECT id FROM users WHERE username = ?), ?);", [username, token]);
        return {success: true, code: 200, token};
    } catch(err) {console.log(err); return {success: false, code: 500, error: "internal server error"};} finally {if (conn) {conn.end();}};
};

const verifyToken = async (token) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const query = await conn.query("SELECT A.id, A.username, A.display_name, A.description FROM users AS A INNER JOIN sessions AS B ON A.id = B.id WHERE B.token = ?;", [token]);
        if (query.length === 0) {return {success: false, code: 401, error: "invalid/expired token"};} else {return {success: true, code: 200, data: query};};
    } catch(err) {console.log(err); return false;} finally {if (conn) {conn.end();}};
};

const removeExpiredTokens = () => {
    cron.schedule("0 0 * * *", async () => {
        let conn;
        try {
            conn = await pool.getConnection();
            await conn.query("DELETE FROM sessions WHERE expiry_date < CURDATE()");
        } catch(err) {console.log(err);} finally {if (conn) {conn.end();}};
    });
};

const getPosts = async (limit, page, user) => {
    let conn;
    let rows;
    const offset = (page - 1) * (limit);
    try {
        conn = await pool.getConnection();
        if (parseInt(user)) {
            rows = await conn.query("SELECT A.*, B.username, B.display_name FROM posts AS A JOIN users AS B ON A.poster_id = B.id WHERE B.id = ? ORDER BY ID DESC LIMIT ? OFFSET ?;", [user, limit, offset]);
        } else if (user) {
            rows = await conn.query("SELECT A.*, B.username, B.display_name FROM posts AS A JOIN users AS B ON A.poster_id = B.id WHERE B.username = ? ORDER BY ID DESC LIMIT ? OFFSET ?;", [user, limit, offset]);
        } else {
            rows = await conn.query("SELECT A.*, B.username, B.display_name FROM posts AS A JOIN users AS B ON A.poster_id = B.id ORDER BY ID DESC LIMIT ? OFFSET ?;", [limit, offset]);
        };
        if (rows && rows.length > 0) {return {success: true, code: 200, data: rows};} else {return {success: false, code: 200, error: "no data meets specifications"};};
    } catch(err) {console.log(err);return {success: false, code: 500, error: "internal server error"};} finally {if (conn) {conn.end();}};
};

const getPost = async (id) => {
    try {
        conn = await pool.getConnection();
        rows = await conn.query("SELECT * FROM posts WHERE ID = ?;", [id]);
        if (rows && rows.length > 0) {return {success: true, code: 200, data: rows};} else {return {success: false, code: 200, error: "no data meets specifications"};};
    } catch(err) {console.log(err);return {success: false, code: 500, error: "internal server error"};} finally {if (conn) {conn.end();}};
};

const getUser = async (user) => {
    try {
        conn = await pool.getConnection();
        if (parseInt(user)) {
            rows = await conn.query("SELECT id, username, display_name, description FROM users WHERE id = ?;", [user]);
        } else {
            rows = await conn.query("SELECT id, username, display_name, description FROM users WHERE username = ?;", [user]);
        }
        if (rows && rows.length > 0) {return {success: true, code: 200, data: rows};} else {return {success: false, code: 200, error: "no data meets specifications"};};
    } catch(err) {console.log(err);return {success: false, code: 500, error: "internal server error"};} finally {if (conn) {conn.end();}};
};

const dropSession = async (token) => {
        try {
        conn = await pool.getConnection();
        result = await conn.query("DELETE FROM sessions WHERE token = ?", [token]);
        return {success: true, code: 200};
    } catch(err) {console.log(err);return {success: false, code: 500, error: "internal server error"};} finally {if (conn) {conn.end();}};
};


const getComments = async (id, limit, page) => {
    let conn;
    let rows;
    const offset = (page - 1) * (limit);
    try {
        conn = await pool.getConnection();
        rows = await conn.query("SELECT * FROM comments WHERE post_id = ? ORDER BY ID LIMIT ? OFFSET ?;", [id, limit, offset]);
        if (rows && rows.length > 0) {return {success: true, code: 200, data: rows};} else {return {success: false, code: 200, error: "no data meets specifications"};};
    } catch(err) {console.log(err);return {success: false, code: 500, error: "internal server error"};} finally {if (conn) {conn.end();}};
};

const addPost = async (token, title, content) => {
    let conn;
    try {
        conn = await pool.getConnection();
        result = await conn.query("INSERT INTO posts (poster_id, title, content) VALUES ((SELECT id FROM sessions WHERE token = ?), ?, ?)", [token, title, content]);
        return {success: true, code: 200};
    } catch(err) {console.log(err);return {success: false, code: 500, error: "internal server error"};} finally {if (conn) {conn.end();}};
};
const addComment = async (token, post, content) => {
    let conn;
    try {
        conn = await pool.getConnection();
        result = await conn.query("INSERT INTO comments (post_id, user_id, content) VALUES (?, (SELECT id FROM sessions WHERE token = ?), ?)", [post, token, content]);
        return {success: true, code: 200};
    } catch(err) {console.log(err);return {success: false, code: 500, error: "internal server error"};} finally {if (conn) {conn.end();}};
};

module.exports = {signUp, authenticate, removeExpiredTokens, verifyToken, getPosts, getPost, getUser, dropSession, getComments, addPost, addComment};