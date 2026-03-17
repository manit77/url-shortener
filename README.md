# URL Shortener

Simple URL shortener written in Node.js using Express.  
Short URLs are stored in a local JSON file (no external database required).

## Features

- **Create short URLs** for any target URL
- **Optional custom ID** support (choose your own short code)
- **Persistent storage** in a `db.json` file
- **Simple HTML form** served at `/form`
- **JSON API** for programmatic use

## Prerequisites

- Node.js 18+ (recommended)
- npm or yarn

## Configuration

The app reads settings from `config.json`:

```json
{
  "url": "https://a.visitel.us",
  "port": 8050,
  "data_dir": ""
}
```

- **url**: Base public URL that will prefix all generated short links (e.g. `https://a.visitel.us/abc123`)
- **port**: Port the Express server listens on
- **data_dir**: Optional directory where `db.json` will be stored; if empty, it is stored next to `index.js`

## Installation

```bash
git clone <this-repo-url>
cd url-shortener
npm install
```

## Running the server

```bash
node index.js
```

The server will start on the port configured in `config.json` (default: `8050`).

## API Usage

### 1. Create a short URL

**Endpoint**

- **POST** `/shorten`
- **Content-Type**: `application/json`

**Request body**

```json
{
  "url": "https://example.com/some/very/long/path",
  "id": "custom123" // optional
}
```

- **url** (required): The original URL to shorten
- **id** (optional): Custom short ID. If omitted, a random 6-character ID is generated.

**Successful response**

```json
{
  "id": "abc123",
  "short": "https://a.visitel.us/abc123",
  "original": "https://example.com/some/very/long/path"
}
```

**Error responses**

- `400`: `{"error": "url is required"}`
- `409`: `{"error": "ID already taken", "id": "custom123"}`

### cURL example

```bash
curl -X POST http://localhost:8050/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","id":"myid"}'
```

## Redirects

To use a short URL, open:

```text
GET /:id
```

If `id` exists in the database, you will be redirected to the original URL.  
If it does not exist, the server responds with `404 Short URL not found`.

## HTML Form

A basic form UI is served from the `public` directory:

- Visit `http://localhost:8050/form` in your browser
- Fill in the URL (and optional custom ID)
- Submit to receive a generated short link

## Data Storage

- All mappings are stored in `db.json`
- The file is created automatically on first run if it does not exist
- The structure is a simple key-value map:

```json
{
  "abc123": "https://example.com",
  "myid": "https://google.com"
}
```

You can back up or move this file to persist your data.

## Notes

- This project is intended as a lightweight, educational URL shortener.
- It is not hardened for production (no auth, rate limiting, or validation beyond basic checks).
