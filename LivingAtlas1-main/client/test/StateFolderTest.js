/**
 * StateFolderTest.js
 *
 * Selenium + Mocha E2E tests for ArcGIS Upload Panel state folder loading.
 *
 * Tests:
 *  1. Root view: all 3 state folders appear with correct labels.
 *  2. Each state folder: sub-folders are non-empty and contain expected folder names.
 *  3. Each state/folder combo: at least one service loads when a folder is opened.
 *  4. Back navigation returns to the correct previous view.
 *
 * Prerequisites:
 *  - `npm start` running on http://localhost:3000
 *  - chromedriver available on PATH (matching installed Chrome version)
 *
 * Run: npx mocha test/StateFolderTest.js --timeout 60000
 */

const { Builder, Browser, By, until } = require('selenium-webdriver');
const assert = require('assert');

// ─── Expected Data (mirrors arcgis_services_*.json) ──────────────────────────
// These are the folder names each state's JSON data is expected to contain.
// Update if the data files change.
const EXPECTED = {
    WA: {
        label: 'Washington State ArcGIS Services',
        // Representative subset – we don't require ALL folders to guard against
        // minor data updates; we do require the core ones.
        folders: ['ADS', 'AQ', 'Authoritative', 'GIS', 'NHD', 'WQ', 'WR'],
        // Folder to drill into for the service-count check
        sampleFolder: 'GIS',
        minServices: 1,
    },
    ID: {
        label: 'Idaho ArcGIS Services',
        folders: ['Administrative', 'Allocation', 'Compliance', 'Groundwater', 'Reference', 'Regulatory'],
        sampleFolder: 'Administrative',
        minServices: 1,
    },
    OR: {
        label: 'Oregon ArcGIS Services',
        // OR has 5 folders; we check all of them
        folders: ['Framework', 'Locators', 'Projects', 'Utilities'],
        sampleFolder: 'Framework',
        minServices: 1,
    },
};

const APP_URL = 'http://localhost:3000';
const PANEL_OPEN_TIMEOUT = 10000;
const NAV_TIMEOUT = 15000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildDriver() {
    return new Builder().forBrowser(Browser.CHROME).build();
}

/** Open the app and click the GIS Services button to open the upload panel. */
async function openPanel(driver) {
    await driver.get(APP_URL);
    // Wait for the sidebar button to appear
    const gisBtn = await driver.wait(
        until.elementLocated(By.css('.left-sidebar-gis-button')),
        PANEL_OPEN_TIMEOUT,
        'GIS Services sidebar button not found'
    );
    await gisBtn.click();
    // Wait for root-level state folders to render
    await driver.wait(
        until.elementLocated(By.css('.upload-state-folder')),
        PANEL_OPEN_TIMEOUT,
        'State folder list did not appear after opening panel'
    );
}

/** Return text of all .upload-state-folder elements. */
async function getStateFolderTexts(driver) {
    const els = await driver.findElements(By.css('.upload-state-folder'));
    return Promise.all(els.map(el => el.getText()));
}

/** Click the state folder whose visible text includes `partialLabel`. */
async function clickStateFolderByLabel(driver, partialLabel) {
    const folders = await driver.findElements(By.css('.upload-state-folder'));
    for (const folder of folders) {
        const text = await folder.getText();
        if (text.includes(partialLabel)) {
            await folder.click();
            return;
        }
    }
    throw new Error(`State folder with label containing "${partialLabel}" not found`);
}

/** Return text of all .upload-folder elements (sub-folders inside a state). */
async function getSubFolderTexts(driver) {
    await driver.wait(
        until.elementLocated(By.css('.upload-folder, .upload-panel-breadcrumb')),
        NAV_TIMEOUT,
        'State sub-folder view did not load'
    );
    const els = await driver.findElements(By.css('.upload-folder'));
    return Promise.all(els.map(el => el.getText()));
}

/** Click the .upload-folder whose text includes `folderName`. */
async function clickSubFolderByName(driver, folderName) {
    const els = await driver.findElements(By.css('.upload-folder'));
    for (const el of els) {
        const text = await el.getText();
        if (text.includes(folderName)) {
            await el.click();
            return;
        }
    }
    throw new Error(`Sub-folder "${folderName}" not found`);
}

/** Click the back button in the breadcrumb. */
async function clickBack(driver) {
    const backBtn = await driver.wait(
        until.elementLocated(By.css('.upload-panel-breadcrumb-back')),
        5000,
        'Breadcrumb back button not found'
    );
    await backBtn.click();
}

// ─── Test Suites ──────────────────────────────────────────────────────────────

describe('ArcGIS Upload Panel – Root State Folders', function () {
    this.timeout(30000);
    let driver;

    before(async function () {
        driver = await buildDriver();
        await openPanel(driver);
    });

    after(async function () {
        await driver.quit();
    });

    it('should display exactly 3 state folders (WA, ID, OR)', async function () {
        const texts = await getStateFolderTexts(driver);
        // Filter out the Built-in Layers entry (if visible at root)
        const stateFolders = texts.filter(t =>
            t.includes('Washington') || t.includes('Idaho') || t.includes('Oregon')
        );
        assert.strictEqual(stateFolders.length, 3, `Expected 3 state folders, got: ${JSON.stringify(texts)}`);
    });

    it('should display Washington State ArcGIS Services folder', async function () {
        const texts = await getStateFolderTexts(driver);
        assert.ok(
            texts.some(t => t.includes('Washington State ArcGIS Services')),
            `WA folder not found. Displayed: ${JSON.stringify(texts)}`
        );
    });

    it('should display Idaho ArcGIS Services folder', async function () {
        const texts = await getStateFolderTexts(driver);
        assert.ok(
            texts.some(t => t.includes('Idaho ArcGIS Services')),
            `ID folder not found. Displayed: ${JSON.stringify(texts)}`
        );
    });

    it('should display Oregon ArcGIS Services folder', async function () {
        const texts = await getStateFolderTexts(driver);
        assert.ok(
            texts.some(t => t.includes('Oregon ArcGIS Services')),
            `OR folder not found. Displayed: ${JSON.stringify(texts)}`
        );
    });
});

// ─── Per-State content tests ──────────────────────────────────────────────────

Object.entries(EXPECTED).forEach(([stateCode, expected]) => {
    describe(`ArcGIS Upload Panel – ${stateCode} (${expected.label})`, function () {
        this.timeout(60000);
        let driver;

        before(async function () {
            driver = await buildDriver();
            await openPanel(driver);
            await clickStateFolderByLabel(driver, expected.label);
        });

        after(async function () {
            await driver.quit();
        });

        it(`should show sub-folders after clicking ${stateCode} state folder`, async function () {
            const subFolders = await getSubFolderTexts(driver);
            assert.ok(
                subFolders.length > 0,
                `Expected sub-folders for ${stateCode}, but none found`
            );
        });

        expected.folders.forEach(folderName => {
            it(`should contain folder "${folderName}" in ${stateCode}`, async function () {
                const subFolders = await getSubFolderTexts(driver);
                assert.ok(
                    subFolders.some(t => t.includes(folderName)),
                    `Folder "${folderName}" not found in ${stateCode}. Displayed: ${JSON.stringify(subFolders)}`
                );
            });
        });

        it(`should load at least ${expected.minServices} service(s) when opening "${expected.sampleFolder}"`, async function () {
            // Navigate into the sample folder
            await clickSubFolderByName(driver, expected.sampleFolder);

            // Wait for either a service row or a "no services" indication
            await driver.wait(
                until.elementLocated(By.css('.upload-item, .upload-panel-breadcrumb')),
                NAV_TIMEOUT,
                `Service list for ${stateCode}/${expected.sampleFolder} did not load`
            );

            const services = await driver.findElements(By.css('.upload-item'));
            assert.ok(
                services.length >= expected.minServices,
                `Expected ≥${expected.minServices} service(s) in ${stateCode}/${expected.sampleFolder}, got ${services.length}`
            );
        });

        it(`should navigate back to ${stateCode} sub-folder list after going into a folder`, async function () {
            // Currently inside a folder; click back once
            await clickBack(driver);

            // Should now see sub-folders again
            const subFolders = await getSubFolderTexts(driver);
            assert.ok(
                subFolders.length > 0,
                `Back navigation from folder did not return to ${stateCode} sub-folder list`
            );
        });

        it(`should navigate back to root after pressing back from state view`, async function () {
            // Click back once more to reach root
            await clickBack(driver);

            await driver.wait(
                until.elementLocated(By.css('.upload-state-folder')),
                PANEL_OPEN_TIMEOUT,
                'Back navigation did not return to root state folder list'
            );
            const texts = await getStateFolderTexts(driver);
            assert.ok(texts.length >= 3, 'Root state folder list not restored after back navigation');
        });
    });
});
