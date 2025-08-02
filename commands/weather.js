// commands/weather.js

const axios = require('axios');

module.exports = {
    config: {
        command: 'weather',
        aliases: [],
        description: 'Get current weather for a city',
        usage: '!weather <city>',
        category: 'utilities',
        dm: true
    },

    handler: async (sock, from, input, msg) => {
        if (!input) {
            return {
                text: '❌ Please provide a city name.\n\n📌 Example: *!weather Delhi*'
            };
        }

        const apiKey = process.env.WEATHER_API_KEY;
        const city = input.trim();
        const url = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(city)}`;

        try {
            const res = await axios.get(url);
            const weather = res.data;

            const responseText = `🌤️ *Weather in ${weather.location.name}, ${weather.location.country}:*\n` +
                `- 🌡️ Temp: *${weather.current.temp_c}°C*\n` +
                `- 🌥️ Condition: *${weather.current.condition.text}*\n` +
                `- 💧 Humidity: *${weather.current.humidity}%*\n` +
                `- 🌬️ Wind: *${weather.current.wind_kph} km/h*`;

            return { text: responseText };
        } catch (err) {
            console.error(err.response?.data || err.message || err);
            return {
                text: '⚠️ Could not fetch weather info. Make sure the city name is correct.'
            };
        }
    }
};
