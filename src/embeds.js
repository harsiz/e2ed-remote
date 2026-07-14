const { EmbedBuilder } = require("discord.js");

const COLORS = {
    success: 0x23a55a,
    error: 0xf23f43,
    info: 0x5865f2
};

// The text also goes in the reply's plain message content (see index.js), so
// on mobile a single long press plus "Copy Text" grabs exactly that string.
// The embed description repeats it in a monospace code block for desktop,
// where a click-drag selection copies just the rendered text, no fences
// included, and the monospace font makes look-alike characters (0/O, 1/l/I)
// unambiguous. Description (4096 chars) is used instead of a field (1024
// chars) since encrypted text can run past a field's limit.

function encryptedEmbed(ciphertext) {
    return new EmbedBuilder()
        .setColor(COLORS.success)
        .setTitle("Message encrypted")
        .setDescription(
            "Mobile: long press the text above and choose Copy Text.\n" +
                "Desktop: select and copy the code block below.\n" +
                "Paste it into the channel.\n\n" +
                "```\n" + ciphertext + "\n```"
        );
}

function decryptedEmbed(plaintext) {
    const isEmpty = plaintext.length === 0;
    return new EmbedBuilder()
        .setColor(COLORS.success)
        .setTitle("Message decrypted")
        .setDescription(
            isEmpty
                ? "The original message was empty."
                : "Mobile: long press the text above and choose Copy Text.\n" +
                      "Desktop: select and copy the code block below.\n\n" +
                      "```\n" + plaintext + "\n```"
        );
}

function errorEmbed(title, description) {
    return new EmbedBuilder()
        .setColor(COLORS.error)
        .setTitle(title)
        .setDescription(description);
}

module.exports = { encryptedEmbed, decryptedEmbed, errorEmbed };
