import { Given, When, Then } from "cucumber";
import Constants from "../../../src/utility/constants";
import Driver from "../../../src/utility/driver";
import Email from "../../../src/utility/email";

// Pulling page specific locators and data
const pagePath = Constants.getLocatorPath();
const dataPath = "../data/";

Then(/^I should not see unexpected question$/, () => {
  const question = require(pagePath + `${global.pageContext}.json`).special["QUESTION1"];
  Driver.waitForAngularToLoad();
  if (!Driver.isAndroid()) {
    if(browser.isExisting(question)[0]) {
      assert(false, "Unexpected question: " + Driver.getElementTextContent(question));  
    }
  }
});

Given(/^I delete all email$/, () => {
  return new Promise((resolve, reject) => {
      Email.deleteAllMail().then(() => {
        resolve(true);
      }).catch((err) => {
        reject(new Error(err));
      });
  });
});

Given(/^I read email for "(.*?)"$/, (emailText) => {
  return new Promise((resolve, reject) => {
    Email.waitAndReadFirstEmail().then((bodyText) => {
      if(bodyText.includes(emailText)) {
        resolve(true);
      } else {
        reject(new Error("Did not find: " + emailText));
      }
    }).catch((err) => {
      reject(new Error(err));
    });
  });
});

When(/^I answer "(.*?)" correctly$/,
  (element) => {
    var question = Driver.waitForAndReturnText(require(pagePath + `${global.pageContext}.json`).special[element], 50000);
    var value = CheckQuestion(question, true);
    Driver.fillElementWithText(require(pagePath + `${global.pageContext}.json`).inputs[element], value);
  }
);

When(/^I answer "(.*?)" incorrectly$/,
  (element) => {
    var question = Driver.waitForAndReturnText(require(pagePath + `${global.pageContext}.json`).special[element], 50000);
    var value = CheckQuestion(question, false);
    Driver.fillElementWithText(require(pagePath + `${global.pageContext}.json`).inputs[element], value);
  }
);
