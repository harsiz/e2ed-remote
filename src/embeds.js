const { EmbedBuilder } = require("discord.js");

const COLORS = {
    success: 0x23a55a,
    error: 0xf23f43,
    info: 0x5865f2
};

// The actual ciphertext/plaintext is sent as plain message content (not in the
// embed), so on mobile a single long press plus "Copy Text" grabs exactly that
// string with no markdown, code fences, or embed chrome mixed in.

function encryptedEmbed() {
    return new EmbedBuilder()
        .setColor(COLORS.success)
        .setTitle("Message encrypted")
        .setDescription(
            "The encrypted text is above. Long press it and choose Copy Text, then paste it into the channel."
        );
}

function decryptedEmbed(isEmpty) {
    return new EmbedBuilder()
        .setColor(COLORS.success)
        .setTitle("Message decrypted")
        .setDescription(
            isEmpty
                ? "The original message was empty."
                : "The decrypted text is above. Long press it and choose Copy Text if you want to save it."
        );
}

function errorEmbed(title, description) {
    return new EmbedBuilder()
        .setColor(COLORS.error)
        .setTitle(title)
        .setDescription(description);
}

module.exports = { encryptedEmbed, decryptedEmbed, errorEmbed };
