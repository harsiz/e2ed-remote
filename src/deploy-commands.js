require("dotenv").config();
const { REST, Routes } = require("discord.js");
const { commands } = require("./commands");

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
    console.error("Missing DISCORD_TOKEN or CLIENT_ID in .env");
    process.exit(1);
}

const rest = new REST().setToken(DISCORD_TOKEN);
const body = commands.map(command => command.toJSON());

(async () => {
    try {
        const route = GUILD_ID
            ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
            : Routes.applicationCommands(CLIENT_ID);

        const data = await rest.put(route, { body });
        console.log(
            `Registered ${data.length} command(s) ${GUILD_ID ? `to guild ${GUILD_ID}` : "globally"}.`
        );
    } catch (error) {
        console.error("Failed to register commands:", error);
        process.exit(1);
    }
})();
