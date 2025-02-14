const { Builder, Browser, By, Key, until } = require("selenium-webdriver");
const { assert, expect } = require("chai");

function getWebDriver() {
  return new Builder().forBrowser(Browser.FIREFOX).build();
}

// This will test whether the map is displayed on the site or not
describe("Testing Mapbox load on React", function () {
  this.timeout(15000);
  it("should load the map", async function () {
    let driver = await getWebDriver();
    try {
      await driver.get("http://localhost:3000/");
      // We find the mapbox canvas on the site
      const mapElement = await driver.findElement(By.css(".mapboxgl-canvas"));
      // It should be true if we are able to find the map element
      expect(await mapElement.isDisplayed()).to.be.true;
    } finally {
      await driver.quit();
    }
  });
});

// This will test whether the popup shows up when a marker is clicked
describe("Testing marker popups", function () {
  this.timeout(15000);

  it("should show the popup when marker is clicked", async function () {
    let driver = await getWebDriver();
    
    try {
      await driver.get("http://localhost:3000/");

      // wait for the map to load
      await driver.wait(until.elementLocated(By.css('.blue-marker')), 10000);
      const markerElements = await driver.findElements(By.css('.blue-marker'));
      await markerElements[0].click();

      // wait for the popup
      await driver.wait(until.elementLocated(By.css('.mapboxgl-popup-content')), 5000);
      const popupElement = await driver.findElement(By.css('.mapboxgl-popup-content'));
      const isPopupDisplayed = await popupElement.isDisplayed();
      expect(isPopupDisplayed).to.be.true;
    } finally {
      await driver.quit();
    }
  });
});
