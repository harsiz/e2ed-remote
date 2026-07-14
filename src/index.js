require("dotenv").config();
const {
    Client,
    GatewayIntentBits,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    MessageFlags
} = require("discord.js");
const { encrypt, decrypt, isEncrypted } = require("./crypto");
const { encryptedEmbed, decryptedEmbed, errorEmbed } = require("./embeds");

const MODAL_ENCRYPT = "e2ed_encrypt_modal";
const MODAL_DECRYPT = "e2ed_decrypt_modal";
const MODAL_DECRYPT_MSG = "e2ed_decrypt_msg_modal";

const FIELD_MESSAGE = "message";
const FIELD_TEXT = "text";
const FIELD_PASSWORD = "password";

// Discord message content is capped at 2000 characters. The ciphertext goes
// straight into the reply's content (not an embed), so it stays a single
// clean long-press-and-copy on mobile. AES-GCM adds a 12 byte iv and 16 byte
// tag, and base64url expands that by 4/3, so this cap keeps the encrypted
// output comfortably under 2000 even for worst-case multi-byte UTF-8 input.
const MAX_MESSAGE_LENGTH = 1200;
const DISCORD_CONTENT_LIMIT = 2000;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
    try {
        if (interaction.isChatInputCommand()) {
            if (interaction.commandName === "encrypt") return handleEncryptCommand(interaction);
            if (interaction.commandName === "decrypt") return handleDecryptCommand(interaction);
        } else if (interaction.isMessageContextMenuCommand()) {
            if (interaction.commandName === "Decrypt") return handleDecryptContextMenu(interaction);
        } else if (interaction.isModalSubmit()) {
            if (interaction.customId === MODAL_ENCRYPT) return handleEncryptModal(interaction);
            if (interaction.customId === MODAL_DECRYPT) return handleDecryptModal(interaction);
            if (interaction.customId === MODAL_DECRYPT_MSG) return handleDecryptMsgModal(interaction);
        }
    } catch (error) {
        console.error("Interaction handling failed:", error);
        const payload = { embeds: [errorEmbed("Something went wrong", "Please try again.")], flags: MessageFlags.Ephemeral };
        if (interaction.deferred || interaction.replied) {
            await interaction.followUp(payload).catch(() => {});
        } else {
            await interaction.reply(payload).catch(() => {});
        }
    }
});

async function handleEncryptCommand(interaction) {
    const modal = new ModalBuilder().setCustomId(MODAL_ENCRYPT).setTitle("Encrypt a message");

    const messageInput = new TextInputBuilder()
        .setCustomId(FIELD_MESSAGE)
        .setLabel("Message to encrypt")
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(MAX_MESSAGE_LENGTH)
        .setRequired(true);

    const passwordInput = new TextInputBuilder()
        .setCustomId(FIELD_PASSWORD)
        .setLabel("Shared password")
        .setStyle(TextInputStyle.Short)
        .setMaxLength(200)
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(messageInput),
        new ActionRowBuilder().addComponents(passwordInput)
    );

    await interaction.showModal(modal);
}

async function handleDecryptCommand(interaction) {
    const text = interaction.options.getString("text", true);

    const modal = new ModalBuilder().setCustomId(MODAL_DECRYPT).setTitle("Decrypt a message");

    const textInput = new TextInputBuilder()
        .setCustomId(FIELD_TEXT)
        .setLabel("Encrypted text")
        .setStyle(TextInputStyle.Paragraph)
        .setValue(text.slice(0, 4000))
        .setRequired(true);

    const passwordInput = new TextInputBuilder()
        .setCustomId(FIELD_PASSWORD)
        .setLabel("Shared password")
        .setStyle(TextInputStyle.Short)
        .setMaxLength(200)
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(textInput),
        new ActionRowBuilder().addComponents(passwordInput)
    );

    await interaction.showModal(modal);
}

async function handleDecryptContextMenu(interaction) {
    const target = interaction.targetMessage;
    const content = target && typeof target.content === "string" ? target.content : "";

    if (!isEncrypted(content)) {
        return interaction.reply({
            embeds: [errorEmbed("Nothing to decrypt", "That message is not an e2ed encrypted message.")],
            flags: MessageFlags.Ephemeral
        });
    }

    const modal = new ModalBuilder().setCustomId(MODAL_DECRYPT_MSG).setTitle("Decrypt this message");

    const textInput = new TextInputBuilder()
        .setCustomId(FIELD_TEXT)
        .setLabel("Encrypted text")
        .setStyle(TextInputStyle.Paragraph)
        .setValue(content.slice(0, 4000))
        .setRequired(true);

    const passwordInput = new TextInputBuilder()
        .setCustomId(FIELD_PASSWORD)
        .setLabel("Shared password")
        .setStyle(TextInputStyle.Short)
        .setMaxLength(200)
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(textInput),
        new ActionRowBuilder().addComponents(passwordInput)
    );

    await interaction.showModal(modal);
}

async function handleEncryptModal(interaction) {
    const message = interaction.fields.getTextInputValue(FIELD_MESSAGE);
    const password = interaction.fields.getTextInputValue(FIELD_PASSWORD);
    const channelId = interaction.channelId;

    const ciphertext = encrypt(password, channelId, message);

    if (ciphertext.length > DISCORD_CONTENT_LIMIT) {
        return interaction.reply({
            embeds: [
                errorEmbed(
                    "Message too long",
                    "The encrypted result does not fit in a single Discord message. Try a shorter message."
                )
            ],
            flags: MessageFlags.Ephemeral
        });
    }

    await interaction.reply({
        content: ciphertext,
        embeds: [encryptedEmbed()],
        flags: MessageFlags.Ephemeral
    });
}

async function handleDecryptModal(interaction) {
    await runDecrypt(interaction);
}

async function handleDecryptMsgModal(interaction) {
    await runDecrypt(interaction);
}

async function runDecrypt(interaction) {
    const text = interaction.fields.getTextInputValue(FIELD_TEXT).trim();
    const password = interaction.fields.getTextInputValue(FIELD_PASSWORD);
    const channelId = interaction.channelId;

    if (!isEncrypted(text)) {
        return interaction.reply({
            embeds: [errorEmbed("Not an e2ed message", "That text does not start with the e2ed:1: prefix.")],
            flags: MessageFlags.Ephemeral
        });
    }

    try {
        const plaintext = decrypt(password, channelId, text);
        await interaction.reply({
            content: plaintext.length > 0 ? plaintext.slice(0, DISCORD_CONTENT_LIMIT) : undefined,
            embeds: [decryptedEmbed(plaintext.length === 0)],
            flags: MessageFlags.Ephemeral
        });
    } catch (error) {
        await interaction.reply({
            embeds: [
                errorEmbed(
                    "Decryption failed",
                    "The password is wrong, or this message was encrypted in a different channel."
                )
            ],
            flags: MessageFlags.Ephemeral
        });
    }
}

client.login(process.env.DISCORD_TOKEN);
