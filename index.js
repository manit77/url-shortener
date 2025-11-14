import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, "db.json");
const CONFIG_FILE = path.join(__dirname, "config.json");

const app = express();
app.use(express.json());

// Load config
const config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
const BASE_URL = config.url;

// Load DB or initialize
let db = {};
if (fs.existsSync(DB_FILE)) {
    db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
} else {
    fs.writeFileSync(DB_FILE, JSON.stringify({}, null, 2));
}

// Save DB to disk
function saveDb() {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
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

        // Register new shortened link
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
