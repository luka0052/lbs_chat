const http = require("http");
const fs = require("fs");
const path = require("path");
const indexHtmlFile = fs.readFileSync(path.join(__dirname, "static", "index.html"));
const styleCssFile = fs.readFileSync(path.join(__dirname, "static", "style.css"));
const scriptJSFile = fs.readFileSync(path.join(__dirname, "static", "script.js"));
const registerHtmlFile = fs.readFileSync(path.join(__dirname, "static", "auth.html"));
const loginHtmlFile = fs.readFileSync(path.join(__dirname, "static", "login.html"));
const authJSFile = fs.readFileSync(path.join(__dirname, "static", "auth.js"));
let validateTokens = [];
let db = require("./database");
const server = http.createServer((req, res) => {
    if(req.method == "GET") {
        switch (req.url) {
            case "/": return res.end(indexHtmlFile);
            case "/style.css": return res.end(styleCssFile);
            case "/script.js": return res.end(scriptJSFile);
            case "/register": return res.end(registerHtmlFile);
            case "/auth.js": return res.end(authJSFile);
            case "/login": return res.end(loginHtmlFile);
            default: return guarded(req, res); 
        }
    }
    if(req.method == "POST") {
        switch (req.url) {
            case "/api/register": return registerUser(req, res);
            case "/api/login": return login(req, res);
        }
    }
    res.statusCode = 404;
    return res.end("Error 404");
});
function registerUser(req, res) {
    let data ="";
    req.on("data", (chunk) => {
        data += chunk;
    })
    req.on("end", async () => {
        try {
            const user = JSON.parse(data);
            if(!user.login || !user.password) {
                return res.end("empty login or password");
            }
            if (await db.isUserExist(user.login)) {
                return res.end("user already exist");
            }
            await db.addUser(user);
            return res.end("Register is successful");
        } catch (error){
            return res.end("error " + error);
        }
    })
}
function login(req, res) {
    let data = "";
    req.on("data", (chunk) => {
        data += chunk;
    })
    req.on("end", () => {
        try {
            const user = JSON.parse(data);
            const token = 0;
            validateTokens.push(token);
            res.writeHead(200);
            res.end(token);
        } catch (error) {
            res.writeHead(500);
            return res.end("Error: " + error);
        }
    })
}
server.listen(3000);
const { Server } = require("socket.io");
const io = new Server(server);
io.use((socket, next) => {
    const cookie = socket.handshake.auth.cookie;
    const credentials = getCredentials(cookie);
    if (!credentials) {
        next(new Error("No auth"))
    }
    socket.credentials = credentials;
    next();
})
io.on("connection", async (socket) => {
    console.log("a user connected. id - " + socket.id);
    let username = "admin";
    let userId = socket.credentials?.user_id;
    let messages = await db.getMessages();
    socket.on("new_message", (msg) => {
        db.addMessage(msg, 1);
        io.emit("message", username + ": " + msg);
    })
    socket.emit("all_messages", messages);
})
const cookie = require("cookie");
function getCredentials(c = '') {
    const cookies = cookie.parse(c);
    const token = cookies?.token;
    if (!token || !validateTokens.includes(token)) return null;
    const [user_id, login] = token.split(".");
    if (!user_id || !login) return null;
    return {
        user_id: user_id,
        login: login
    }
}
function guarded(req, res) {
    const credentials = getCredentials(req.headers?.cookie);
    if (!credentials) {
        res.writeHead(302, {"location": "/login"})
    }
    if (req.method == "GET") {
        switch (req.url) {
            case "/": return res.end(indexHtmlFile);
            case "/script.js": return res.end(scriptJSFile);
        }
    }
    res.writeHead(404);
    res.end ("you are an idiot (404)");
}