import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); //current directory of the index.js file
const configFilePath = path.join(__dirname, "config.json");

// Load config
const config = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
const BASE_URL = config.url;
const dbFilePath = path.join(config.data_dir ? config.data_dir : __dirname, "db.json");

const app = express();
app.use(express.json());

// Simple username/password auth for /form
function formAuth(req, res, next) {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Basic ")) {
        res.setHeader("WWW-Authenticate", 'Basic realm="URL Shortener Form"');
        return res.status(401).send("Authentication required");
    }

    const base64Credentials = authHeader.split(" ")[1] || "";
    const credentials = Buffer.from(base64Credentials, "base64").toString("utf8");
    const [user, pass] = credentials.split(":");

    if (user === config.username && pass === config.password) {
        return next();
    }

    res.setHeader("WWW-Authenticate", 'Basic realm="URL Shortener Form"');
    return res.status(401).send("Invalid credentials");
}

// 👉 Serve static files (index.html for /form) with auth
app.use("/form", formAuth, express.static(path.join(__dirname, "public")));


// Load DB or initialize
let db = {};
if (fs.existsSync(dbFilePath)) {
    db = JSON.parse(fs.readFileSync(dbFilePath, "utf8"));
} else {
    fs.writeFileSync(dbFilePath, JSON.stringify({}, null, 2));
}

// Save DB to disk
function saveDb() {
    fs.writeFileSync(dbFilePath, JSON.stringify(db, null, 2));
}

// Generate random ID
function generateId() {
    return crypto.randomBytes(3).toString("hex").slice(0, 6);
}

// 📌 MAIN SHORTENER ROUTE
app.post("/shorten", (req, res) => {
    const { url, id } = req.body;

    if (!url) {
        return res.status(400).json({ error: "url is required" });
    }

    // If user provided custom ID
    if (id) {
        if (db[id]) {
            return res.status(409).json({
                error: "ID already taken",
                id
            });
        }

        db[id] = url;
        saveDb();

        return res.json({
            id,
            short: `${BASE_URL}/${id}`,
            original: url
        });
    }

    // No custom ID → generate one
    let newId;
    do {
        newId = generateId();
    } while (db[newId]); // avoid collisions

    db[newId] = url;
    saveDb();

    res.json({
        id: newId,
        short: `${BASE_URL}/${newId}`,
        original: url
    });
});

// 📌 REDIRECT ROUTE
app.get("/:id", (req, res) => {
    const id = req.params.id;

    if (!db[id]) {
        return res.status(404).send("Short URL not found");
    }

    res.redirect(db[id]);
});

const server = app.listen(config.port, () => {
    console.log(`URL Shortener running on port ${config.port}`);
    console.log(`Public URL base: ${BASE_URL}`);
});

server.on("error", (err) => {
    console.error("❌ Server error:", err.message);
});
