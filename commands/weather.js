const axios = require('axios');

module.exports = async (sock, from, input) => {
    if (!input) {
        return sock.sendMessage(from, { text: '❌ Please provide a city name.\nExample: !weather Delhi' });
    }

    const apiKey = process.env.WEATHER_API_KEY;
    const city = input.trim();
    const url = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(city)}`;

    try {
        const res = await axios.get(url);
        const weather = res.data;

        const msg = `🌤️ *Weather in ${weather.location.name}, ${weather.location.country}:*
- Temp: ${weather.current.temp_c}°C
- Condition: ${weather.current.condition.text}
- Humidity: ${weather.current.humidity}%
- Wind: ${weather.current.wind_kph} km/h`;

        await sock.sendMessage(from, { text: msg });
    } catch (err) {
        console.error(err.response?.data || err);
        await sock.sendMessage(from, { text: '⚠️ Could not fetch weather. Try another city.' });
    }
};
