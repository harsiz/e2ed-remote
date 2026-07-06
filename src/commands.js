const {
    SlashCommandBuilder,
    ContextMenuCommandBuilder,
    ApplicationCommandType,
    ApplicationIntegrationType,
    InteractionContextType
} = require("discord.js");

// User-installed ("My Apps") only, usable in servers, group DMs, and DMs.
const INTEGRATION_TYPES = [ApplicationIntegrationType.UserInstall];
const CONTEXTS = [
    InteractionContextType.Guild,
    InteractionContextType.BotDM,
    InteractionContextType.PrivateChannel
];

const encryptCommand = new SlashCommandBuilder()
    .setName("encrypt")
    .setDescription("Encrypt a message with a shared password")
    .setIntegrationTypes(INTEGRATION_TYPES)
    .setContexts(CONTEXTS);

const decryptCommand = new SlashCommandBuilder()
    .setName("decrypt")
    .setDescription("Decrypt an e2ed encrypted message")
    .addStringOption(option =>
        option
            .setName("text")
            .setDescription("The encrypted text, starting with e2ed:1:")
            .setRequired(true)
    )
    .setIntegrationTypes(INTEGRATION_TYPES)
    .setContexts(CONTEXTS);

const decryptContextMenuCommand = new ContextMenuCommandBuilder()
    .setName("Decrypt")
    .setType(ApplicationCommandType.Message)
    .setIntegrationTypes(INTEGRATION_TYPES)
    .setContexts(CONTEXTS);

module.exports = {
    commands: [encryptCommand, decryptCommand, decryptContextMenuCommand]
};
