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

/**
 * Looks at a list of questions from the login.data.json file and answers correctly or incorrectly.
 * @param {*} question Question asked on the login screen.
 * @param {*} answerCorrectly Either grabs the correct answer from JSON file or randomly generates an answer.
 * @returns answer to be passed into text box.
 */
function CheckQuestion(question, answerCorrectly) {
  const UUID = require('uuid-js');
  var value;
  switch (question.toString().replace(/,\s*$/, "")) {
    case require(dataPath + "login.data.json").questions["QUESTION1"]:
      value = answerCorrectly ? require(dataPath + "login.data.json").answers["ANSWER1"] : UUID.create().toString();
      break;
    case require(dataPath + "login.data.json").questions["QUESTION2"]:
      value = answerCorrectly ? require(dataPath + "login.data.json").answers["ANSWER2"] : UUID.create().toString();
      break;
    case require(dataPath + "login.data.json").questions["QUESTION3"]:
      value = answerCorrectly ? require(dataPath + "login.data.json").answers["ANSWER3"] : UUID.create().toString();
      break;
    case require(dataPath + "login.data.json").questions["QUESTION4"]:
      value = answerCorrectly ? require(dataPath + "login.data.json").answers["ANSWER4"] : UUID.create().toString();
      break;
    case require(dataPath + "login.data.json").questions["QUESTION5"]:
      value = answerCorrectly ? require(dataPath + "login.data.json").answers["ANSWER5"] : UUID.create().toString();
      break;
    default: assert(false, "Did not have question in list: " + question);
  }
  return value;
}
