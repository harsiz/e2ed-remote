// Node port of e2ed's crypto core (vencord/e2ed/index.js, buildCore()).
// Must stay byte-for-byte compatible with the WebCrypto implementation so
// messages encrypted in a Discord client can be decrypted here, and vice versa.

const crypto = require("crypto");

const CIPHER_PREFIX = "e2ed:1:";
const PBKDF2_ITERATIONS = 200000;
const KEY_LENGTH = 32; // AES-256
const IV_LENGTH = 12; // AES-GCM standard nonce size
const AUTH_TAG_LENGTH = 16;

function b64url(buf) {
    return buf
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

function unb64url(str) {
    let s = str.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    return Buffer.from(s, "base64");
}

function deriveKey(password, channelId) {
    const normalized = String(password).trim();
    const salt = "e2ed-pwd-salt-v1:" + channelId;
    return crypto.pbkdf2Sync(normalized, salt, PBKDF2_ITERATIONS, KEY_LENGTH, "sha256");
}

function passwordFingerprint(password, channelId) {
    const normalized = String(password).trim();
    const digest = crypto.createHash("sha256").update(channelId + "|" + normalized).digest();
    const hex = digest.subarray(0, 6).toString("hex");
    return hex.match(/.{1,4}/g).join(" ");
}

function isEncrypted(content) {
    return typeof content === "string" && content.indexOf(CIPHER_PREFIX) === 0;
}

function encrypt(password, channelId, text) {
    const key = deriveKey(password, channelId);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const ciphertext = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const packed = Buffer.concat([iv, ciphertext, authTag]);
    return CIPHER_PREFIX + b64url(packed);
}

function decrypt(password, channelId, content) {
    if (!isEncrypted(content)) {
        throw new Error("Not an e2ed encrypted message");
    }
    const key = deriveKey(password, channelId);
    const packed = unb64url(content.slice(CIPHER_PREFIX.length));
    const iv = packed.subarray(0, IV_LENGTH);
    const authTag = packed.subarray(packed.length - AUTH_TAG_LENGTH);
    const ciphertext = packed.subarray(IV_LENGTH, packed.length - AUTH_TAG_LENGTH);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext.toString("utf8");
}

module.exports = {
    CIPHER_PREFIX,
    isEncrypted,
    encrypt,
    decrypt,
    passwordFingerprint
};
