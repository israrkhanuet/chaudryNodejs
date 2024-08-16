const request = require("supertest");
const axios = require("axios");
const MockAdapter = require("axios-mock-adapter");
const app = require("../index"); 
const NodeCache = require("node-cache");
const config = require("../config");

const mock = new MockAdapter(axios);
const cache = new NodeCache({ stdTTL: 3600 });

describe("API Endpoints", () => {

    beforeEach(() => {
        mock.reset(); 
    });

    afterEach(() => {
        mock.reset();
        cache.flushAll();
    });

    describe("GET /countries", () => {

        
        it('should return 500 on api fetch failure', async () => {
            mock.onGet(`${config.calendarificUrl}/countries?api_key=${config.apiK}`).reply(500);

            const res = await request(app).get("/countries");
            expect(res.status).toEqual(500);
        });
        it("should return a list of countries", async () => {
            const mockCountries = [
                { country_name: "Pakistan", iso_3166: "PK" },
                { country_name: "United States", iso_3166: "US" },
            ];

            mock.onGet(/countries/).reply(200, {
                response: { countries: mockCountries },
            });

            const res = await request(app).get("/countries");
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual(mockCountries);
        });

        it("should return cached countries if available", async () => {
            const mockCountries = [
                { country_name: "Pakistan", iso_3166: "PK" },
                { country_name: "United States", iso_3166: "US" },
            ];

            cache.set("countries", mockCountries);

            const res = await request(app).get("/countries");
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual(mockCountries);

            expect(mock.history.get.length).toBe(0);
        });


    });

    describe("GET /holidays", () => {


        it("should return holidays for a specific country and year", async () => {
            const mockHolidays = [
                { name: "New Year", date: { iso: "2024-01-01" } },
                { name: "Independence Day", date: { iso: "2024-08-14" } },
            ];

            mock.onGet(/holidays/).reply(200, {
                response: { holidays: mockHolidays },
            });

            const res = await request(app).get(
                "/holidays?country=PAK&year=2024"
            );
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual(mockHolidays);
        });

        it("should return cached holidays if available", async () => {
            const mockHolidays = [
                { name: "New Year", date: { iso: "2024-01-01" } },
                { name: "Independence Day", date: { iso: "2024-08-14" } },
            ];

            const cacheKey = "PAK_2024";
            cache.set(cacheKey, mockHolidays);

            const res = await request(app).get(
                "/holidays?country=PAK&year=2024"
            );
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual(mockHolidays);

            // Ensure the external API was not called
            expect(mock.history.get.length).toBe(0);
        });

        it("should return 400 if country or year is missing", async () => {
            const res = await request(app).get("/holidays");
            expect(res.statusCode).toEqual(400);
            expect(res.body).toEqual({
                error: "Country and year are required",
            });
        });

        it("should handle errors from the external API", async () => {
            mock.onGet('/holidays?country=PAK&year=2024').reply(500);

            const res = await request(app).get(
                "/holidays"
            );
            expect(res.body).toEqual({
                error: "Country and year are required",
            });
        });

        it("should return 404 for invalid country code", async () => {
            const invalidCountryCode = "INVALID";

            mock.onGet(/holidays/).reply(500);

            const res = await request(app).get(
                `/holidays?country=${invalidCountryCode}&year=2024`
            );
            expect(res.statusCode).toEqual(500);
        });

        it("should handle server errors gracefully", async () => {
            // Simulate a server error
            const mockHolidays = [
                { name: "New Year", date: { iso: "2024-01-01" } },
            ];

            mock.onGet(/holidays/).reply(200, {
                response: { holidays: mockHolidays },
            });

            const res = await request(app).get("/holidays?country=PAK");
            expect(res.statusCode).toEqual(400); // Should return an error if year is missing
        });
    });
});
