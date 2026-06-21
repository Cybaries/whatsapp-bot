# whatsapp-bot

A multi-purpose WhatsApp bot built with Node.js and [Baileys](https://github.com/WhiskeySockets/Baileys). It includes a command system, moderation tooling, a MongoDB-backed data layer, and a Pokémon-themed mini-game.

## Features

- **Command system** — modular commands loaded from the `commands/` directory
- **Message/event handlers** — core bot logic in `Handlers/`
- **Moderation** — group moderation utilities
- **Pokémon game** — a built-in game powered by assets in `Pokemon_Game_Resources/` and `uploadPokemon.js`
- **Persistent storage** — MongoDB/Mongoose for bot and game data
- **QR-code pairing** — connect via WhatsApp's QR login flow

## Tech Stack

- [Node.js](https://nodejs.org/) (>=20.0.0)
- [Baileys](https://github.com/WhiskeySockets/Baileys) (`@whiskeysockets/baileys`, `@iamrony777/baileys`)
- Express
- MongoDB / Mongoose
- Canvas (image generation)
- Axios / node-fetch
- dotenv

## Project Structure

```
whatsapp-bot/
├── Handlers/                 # Core message/event handlers
├── Pokemon_Game_Resources/   # Assets and data for the Pokémon game
├── commands/                 # Bot commands
├── utils/                    # Shared utility functions
├── views/                    # View/template files
├── index.js                  # App entry point
├── startBot.js                # Bot startup / WhatsApp connection logic
├── uploadPokemon.js           # Script for seeding Pokémon game data
├── package.json
└── .gitignore
```

## Prerequisites

- Node.js v20 or later
- npm
- A MongoDB database (local or hosted, e.g. MongoDB Atlas)
- A WhatsApp account to pair the bot with

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Cybaries/whatsapp-bot.git
   cd whatsapp-bot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the project root and configure your environment variables, for example:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   PORT=3000
   ```
   > Check `index.js` / `startBot.js` for the exact environment variables the bot expects.

## Usage

Start the bot:

```bash
npm start
```

On first run, the bot will generate a QR code in the terminal (via the `qrcode` package). Scan it with WhatsApp on your phone (**Linked Devices → Link a Device**) to pair the bot with your account.

### Loading Pokémon game data

If you're using the Pokémon game feature, seed the database with the included resources:

```bash
node uploadPokemon.js
```

## Commands

Bot commands live in the `commands/` directory — each file typically corresponds to a single command. Check that folder for the full, up-to-date list of supported commands and their usage.

## Contributing

Issues and pull requests are welcome. If you plan to add a new command, follow the existing pattern in `commands/` and wire it up through `Handlers/`.

## License

ISC
