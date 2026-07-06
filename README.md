# e2ed remote

A Discord "My Apps" user-installed app (not a server bot) that lets you encrypt and decrypt [e2ed](https://github.com/harsiz/e2ed) messages from any server, group DM, or DM, without installing the browser extension or client mod.

It implements the exact same scheme as e2ed's Vencord/Chrome/BetterDiscord builds:

- Password based key agreement. Both people agree on a shared password out of band.
- The key is derived with PBKDF2-SHA256 (200000 iterations), salted with the channel id, so a password only works for encrypting/decrypting in the channel it was set up for.
- Messages are encrypted with AES-256-GCM and encoded as `e2ed:1:<base64url(iv + ciphertext + auth tag)>`.

See [src/crypto.js](src/crypto.js) for the implementation, ported from [vencord/e2ed/index.js](https://github.com/harsiz/e2ed/blob/main/vencord/e2ed/index.js).

## Commands

- `/encrypt` opens a form asking for a message and a password, then replies with the encrypted text (ephemeral, only you can see it).
- `/decrypt text:<encrypted text>` opens a form asking for the password, then replies with the decrypted message (ephemeral).
- Right click (or long press) a message, go to Apps, then e2ed remote, then Decrypt. It asks for the password and replies with the decrypted message (ephemeral).

Passwords are always collected through a modal form, never as a visible slash command argument, so they never show up in the public "user used /command" line.

## Setup

1. Create an application at the [Discord Developer Portal](https://discord.com/developers/applications).
2. Under **Installation**, set **Installation Contexts** to include only **User Install** (uncheck Guild Install, since this is a "My Apps" bot, not a server bot). Set the install link's default authorization to work with no scopes/permissions needed beyond `applications.commands`.
3. Under **Bot**, create a bot user and copy its token. No privileged gateway intents are required.
4. Copy `.env.example` to `.env` and fill in `DISCORD_TOKEN` (bot token) and `CLIENT_ID` (application id). Optionally set `GUILD_ID` to a test server id while developing, since guild-scoped commands update instantly while global commands can take up to an hour to propagate.
5. Install dependencies and register the commands:

   ```
   npm install
   npm run deploy
   ```

6. Start the bot:

   ```
   npm start
   ```

7. From the developer portal's Installation page, use the install link to add e2ed remote to your account, then use it from the slash command menu or a message's Apps menu anywhere you have it installed.

## Known issue

`npm audit` reports vulnerabilities in `undici`, a transitive dependency pulled in by discord.js itself. There is currently no discord.js release that resolves this without downgrading to the discord.js v13 line, so it is accepted as-is for a bot process that only makes outbound requests to Discord's API.

## Notes

- Only text is supported, matching e2ed itself. Files and attachments are untouched.
- Each command works independently. There is no persistent session or "arm/disarm" state like the client plugins have; every encrypt or decrypt asks for the password again.
