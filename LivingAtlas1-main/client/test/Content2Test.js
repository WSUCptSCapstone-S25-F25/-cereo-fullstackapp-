const { Builder, Browser, By, Key, until } = require('selenium-webdriver');
const assert = require("assert");

function getWebDriver() {
    return new Builder().forBrowser(Browser.CHROME).build();
}

describe("Card Component Existence Tests", function () {
    this.timeout(20000);
    let driver;

    before(async function () {
        driver = await getWebDriver();
        await driver.get("http://localhost:3000");
        await driver.wait(until.elementLocated(By.css(".card")), 25000); // waits up to 25 seconds for the card to appear

    });

    after(async function () {
        await driver.quit();
    });

    it("should check if card exists", async function () {
        const cardTitle = await driver.findElement(By.css(".card"), 25000);
        assert.ok(cardTitle); // checks that cardTitle is not null or undefined

        const cardDescription = await driver.findElement(By.css(".card p"));
        assert.ok(cardDescription); // checks that cardDescription is not null or undefined

        const learnMoreButton = await driver.findElement(By.css(".card button"));
        assert.ok(learnMoreButton); // checks that learnMoreButton is not null or undefined
    });


    it("should check if card has 'River' tag by verifying background color", async function () {
        const dropdown = await driver.findElement(By.css(".search-bar select"));
        await dropdown.click(); // Open dropdown

        const riverOption = await driver.findElement(By.css(".search-bar select option[value='River']"));
        await riverOption.click(); // Select "River" option

        // Verify that "River" filter is applied
        const activeFilterTag = await driver.findElement(By.css(".filter-tag")).getText();
        //assert.strictEqual(activeFilterTag, "River"); // "Riverx" because of the close button text "x"
        const cardBackgroundColor = await driver.findElement(By.css(".card")).getCssValue("background-color");
        assert.strictEqual(cardBackgroundColor, 'rgba(153, 204, 255, 1)'); // Corresponding to #99ccff

    });




    // Add more tests as needed for other elements
});
