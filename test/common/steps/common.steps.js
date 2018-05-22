import { Given, When, Then } from "cucumber";
import Utility from "../../../src/utility/utility";
import Constants from "../../../src/utility/constants";
import Driver from "../../../src/utility/driver";

// Pulling path of page specific locators for elements
let pagePath = Constants.getLocatorPath();

/**
 * Common Steps
 */
Given(/^I go to the "(.*?)" page$/, pageName => {
  global.pageContext = pageName
  const url = require(pagePath + `${global.pageContext}.json`).url["URL"]
  Driver.loadUrl(Constants.getBaseUrl() + url);
});

Given(/^I am on the "(.*?)" page$/, pageName => {
  global.pageContext = pageName;
});

When(/^I switch to the "(.*?)" window$/, (window) => {
  if (window === "new") {
    window = 1;
  }
  else {
    window = 0;
  };
  var tabIds = browser.getTabIds();
  browser.switchTab(tabIds[window]);
});

When(/^I click the "(.*?)" button on the page$/, (element) => {
  const button = require(pagePath + `${global.pageContext}.json`).buttons[element]
  Driver.shouldSeeElement(button);
  if (Driver.isAndroid()) {
    Driver.triggerJQueryEvent(button, 'click');
  } else {
    Driver.clickElementLoop(button);
  }
  Driver.waitForAngularToLoad();
});

When(/^I click the "(.*?)" link on the page$/, (element) => {
  const link = require(pagePath + `${global.pageContext}.json`).hrefs[element]
  Driver.shouldSeeElement(link);
  Driver.clickElementLoop(link);
});

Then(/^I should see the "(.*?)" button on the page$/, (element) => {
  const button = require(pagePath + `${global.pageContext}.json`).buttons[element]
  Driver.shouldSeeElement(button);
});

Then(/^I should see "(.*?)" with text "(.*?)"$/, (element, text) => {
  const locator = require(pagePath + `${global.pageContext}.json`).special[element]
  Driver.shouldSeeElementWithTextContent(locator, text)
});

When(/^I enter "(.*?)" into the "(.*?)"$/,
  (value, element) => {
    const input = require(pagePath + `${global.pageContext}.json`).inputs[element]
    Driver.fillElementWithText(input, value);
  }
);

When(/^I delete text from the "(.*?)"$/,
  (element) => {
    const input = require(pagePath + `${global.pageContext}.json`).inputs[element]
    Driver.deleteElementText(input);
  }
);
