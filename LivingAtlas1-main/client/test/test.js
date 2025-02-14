// const { Builder, Browser, By, Key, until } = require('selenium-webdriver');


// const assert = require("assert");

// function getWebDriver() {
//     return new Builder().forBrowser(Browser.CHROME).build();
// }

// describe("mocha", async function () {
//     this.timeout(10000);
//     it("should run", () => {
//         assert.equal(true, true);
//     });

//     it("testing selenium", async function () {
//         let driver = await getWebDriver();
//         try {
//             await driver.get("https://www.google.com/ncr");
//             await driver.findElement(By.name("q")).sendKeys("webdriver", Key.RETURN);
//             await driver.wait(until.titleIs("webdriver - Google Search"), 1000);
//         } finally {
//             //this.timeout(5000);
//             await driver.quit();
//         }
//     });


//     it("testing Heroku app", async function () {
//         let driver = await getWebDriver();
//         try {
//             await driver.get("https://the-internet.herokuapp.com/login");
//             await driver.findElement(By.id("username")).sendKeys("tomsmith");
//             await driver.findElement(By.id("password")).sendKeys("SuperSecretPassword");
//             await driver.findElement(By.css("button")).click();
//             await driver.wait(until.titleIs("The Internet"), 1000);


//         } finally {
//             //this.timeout(1000);
//             await driver.quit();
//         }
//     });
// });