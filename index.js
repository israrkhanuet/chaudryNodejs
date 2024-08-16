const express = require("express");
const axios = require("axios");
const NodeCache = require("node-cache");
const config = require("./config");

const app = express();
const cache = new NodeCache({ stdTTL: config.cacheTtl });

app.get("/holidays", async (req, res) => {
    const { country, year } = req.query;

    if (!country || !year) {
        return res.status(400).json({ error: "Country and year are required" });
    }

    const cacheKey = `${country}_${year}`;
    const cachedHolidays = cache.get(cacheKey);

    if (cachedHolidays) {
        return res.json(cachedHolidays);
    }

    try {
        const response = await axios.get(
            `${config.calendarificUrl}/holidays?api_key=${config.apiKey}&country=${country}&year=${year}`
        );
        const holidays = response.data.response.holidays;

        cache.set(cacheKey, holidays);
        res.json(holidays);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/countries", async (req, res) => {
    try {
        const cachedCountries = cache.get("countries");
        if (cachedCountries) {
            return res.json(cachedCountries);
        }
        const response = await axios.get(
            `${config.calendarificUrl}/countries?api_key=${config.apiK}`
        );
        const countries = response.data.response.countries;

        cache.set("countries", countries);
        res.json(countries);
    } catch (error) {
        res.status(500).json(error.message);
    }
});

// Export the app for testing
module.exports = app;

// Optionally, start the server if this file is run directly
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
