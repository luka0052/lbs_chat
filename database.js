const fs = require("fs");
const dbFile = "./chat.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const crypto = require("crypto");
const dbWrapper = require("sqlite");
let db;

dbWrapper.open({
    filename: dbFile,
    driver: sqlite3.Database
}).then(async (dBase) => {
    db = dBase;
    try {
        if (!exists) {
            await db.run(
                `CREATE TABLE user(
                    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    login TEXT,
                    password TEXT
                );`
            );
            await db.run(
                `CREATE TABLE message(
                    msg_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    content TEXT,
                    author INTEGER,
                    FOREIGN KEY(author) REFERENCES user(user_id)
                );`
            );
        } else {
            console.log(await db.all("SELECT * FROM user"));
        }
    } catch (dbError) {
        console.log(dbError);
    }
})
module.exports = {
    getMessages: async () => {
        try {
            return db.all(
                `SELECT msg_id, content, login, user_id FROM message
                JOIN user ON message.author = user.user_id`
            );
        } catch (error) {
            console.log(error);
        }
    },
    addMessage: async (msg, userId) => {
        try {
            await db.run(
                "INSERT INTO message(content, author) VALUES (?, ?)",
                [msg, userId]
            )
        } catch (error) {
            console.log(error);
        }
    },
    isUserExist: async (login) => {
        const candidate = await db.all("select * from user where login = ?", [login]);
        return candidate.length;
    },
    addUser: async (user) => {
        const salt = crypto.randomBytes(16).toString("hex");
        const password = crypto.pbkdf2Sync(user.password, salt, 1000, 64, "sha512").toString("hex");
        await db.run (
            "insert into user (login, password) values (?, ?)", [user.login, user.password, password, salt]
        );
    },
    getAuthToken: async (user) => {
        const candidate = await db.all(
            "select * fron user where login = ?", [user.login]
        );
        if(!candidate.length) {
            throw "Wrong login"
        }
        const {user_id, login, password, salt} = candidate[0];
        const hash = crypto.pbkdf2Sync(user.password, salt, 1000, 64, "sha512").toString("hex");
        if (candidate[0].password != user.password) {
            throw "Wrong password"
        }
        return candidate[0].user_id + "." + candidate[0].login + "." + crypto.randomBytes(20).toString("hex");        
    }
}
