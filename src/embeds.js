const { EmbedBuilder } = require("discord.js");

const COLORS = {
    success: 0x23a55a,
    error: 0xf23f43,
    info: 0x5865f2
};

function encryptedEmbed(ciphertext) {
    return new EmbedBuilder()
        .setColor(COLORS.success)
        .setTitle("Message encrypted")
        .setDescription("Paste this into the channel. Only someone with the password can decrypt it.")
        .addFields({ name: "Encrypted text", value: "```\n" + ciphertext + "\n```" });
}

function decryptedEmbed(plaintext) {
    return new EmbedBuilder()
        .setColor(COLORS.success)
        .setTitle("Message decrypted")
        .addFields({ name: "Plaintext", value: plaintext.slice(0, 1024) || "(empty message)" });
}

function errorEmbed(title, description) {
    return new EmbedBuilder()
        .setColor(COLORS.error)
        .setTitle(title)
        .setDescription(description);
}

module.exports = { encryptedEmbed, decryptedEmbed, errorEmbed };
