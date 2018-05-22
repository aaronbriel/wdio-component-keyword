import Constants from "../utility/constants";
/**
 * The Driver is a wrapper around the WebDriverIO 'browser' object.
 * It can be used for both mobile and web. 
 * But, it could easily be divided into two drivers: mobile & web. 
 * 
 * Ex: Driver.clickOnElementWithText(Pages.Login.Element, 'textvalue');
 */
class Driver {

  /**
   * Checks if tests are running in mobile capability.
   * @returns True if capability is mobile.
   */
  isMobile() {
    return process.env.CAPABILITY.includes('android') ||
      process.env.CAPABILITY.includes('iphone') ||
      process.env.CAPABILITY.includes('Mobile');
  }

  /**
  * Checks if tests are running in android capability.
  * @returns True if capability is android.
  */
  isAndroid() {
    return process.env.CAPABILITY.includes('android');
  }

  /**
   * Waits for Angular on page to load.
   */
  waitForAngularToLoad() {
    browser.pause(1500);
  }

  /**
   * Executes a JQuery event on the given element.
   * @param {*} element Element to trigger event on.
   * @param {*} event Event to be triggered.
   */
  triggerJQueryEvent(element, event) {
    browser.waitForVisible(element);
    browser.waitForEnabled(element);
    browser.execute('$("' + element + '").trigger("' + event + '")');
  }

  /**
   * Loops through elements with given locator and clicks the one
   * that contains text passed in
   * @param {*} locator Locator of elements to loop through
   * @param {*} text Text to find in element to click
   */
  clickElementWithText(locator, text) {
    elements = browser.elements(locator);
    for (i = 0; i < elements.length; i++) {
      if (elements[i].value.contains(text)) {
        elements[i].click()
      }
    }
  }

  /**
   * Clicks on all visible elements by selector. Catches any errors thrown to click other elements.
   * @param {*} selector Selector to find elements to click on.
   */
  clickElementLoop(selector) {
    let els = browser.elements(selector);
    els.value.forEach(el => {
      try {
        if (el.isVisible()) {
          el.click();
        }
      } catch (error) {
        //don't care
      }
    })
  }


  /**
   * Accepts alert with given wait time.
   * @param {*} waitTime Wait time in seconds.
   */
  acceptAlert(waitTime) {
    this.wait(waitTime ? waitTime : 3);
    browser.alertAccept();
  }

  // clickElementWithText(selector, text) {
  //   let elements = browser.elements(selector);
  //   for (var i=0; i < elements.length; i++) {
  //     if (elements[i].value.contains(text)) {
  //       elements.value[i].click()
  //     }
  //   }
  // for (element in elements) {
  //   if (element.value.contains(text)) {
  //     element.click()
  //   }
  // }
  // }

  /**
   * Clicks on given element.
   * @param {*} element Element to be clicked on.
   */
  clickOnElement(element) {
    this.clickWhenVisible(element);
  }

  /**
   * Sends 'Enter' key to given element.
   * @param {*} element Element to send 'Enter' key to.
   */
  sendEnterToElement(element) {
    browser.waitForVisible(element);
    browser.keys("\uE007");
  }

  /**
   * Clicks on given element only if given element exists.
   * @param {*} element Element to be clicked on.
   */
  clickOnElementIfExists(element) {
    browser.pause(3000);
    if (browser.isExisting(element)) this.clickWhenVisible(element);
  }

  /**
   * Dismisses alert with given wait time.
   * @param {*} waitTime Wait time in seconds.
   */
  dismissAlert(waitTime) {
    this.wait(waitTime ? waitTime : 3);
    browser.alertDismiss();
  }

  /**
   * Checks if the given element exists.
   * @param {*} element Element to check.
   * @returns True if element exists.
   */
  elementExists(element) {
    return browser.isExisting(element);
  }

  /**
   * Sends text to given element.
   * @param {*} element Element to send text to.
   * @param {*} text Text to be pass into element.
   */
  fillElementWithText(element, text) {
    browser.waitForVisible(element);
    browser.waitForEnabled(element);
    browser.addValue(element, text);
  }

  /**
   * Gets the text from given element.
   * @param {*} element Element to pull text from.
   * @returns Text from element.
   */
  getElementTextContent(element) {
    browser.waitForText(element);
    return browser.getText(element);
  }

  /**
   * Clears text from given element.
   * @param {*} element Element to clear text from.
   */
  deleteElementText(element) {
    browser.waitForVisible(element);
    browser.waitForEnabled(element);
    browser.clearElement(element);
  }

  /**
   * Browser goes to specified URL.
   * @param {*} url URL to go to.
   */
  loadUrl(url) {
    browser.url(url);
    if (!this.isMobile()) {
      browser.windowHandleMaximize();
    }
  }

  /**
   * Moves browser view to given element.
   * @param {*} element Element to move into view.
   * @param {*} xOffset Horizontal offset from element.
   * @param {*} yOffset Vertical offset from element.
   */
  moveToElement(element, xOffset = 0, yOffset = 0) {
    browser.moveToObject(element, xOffset, yOffset);
  }

  /**
   * Browser goes to specified URL in new browser window.
   * @param {*} url URL to go to in new window.
   */
  openTab(url) {
    browser.newWindow(url);
  }

  /**
   * Assert: Gets and compares page title with expected title.
   * @param {*} title Expected page title.
   */
  shouldHaveTitle(title) {
    browser.getTitle().should.be.equal(title);
  }

  /**
   * Assert: checks if given element exists.
   * @param {*} element Element to exist.
   */
  shouldSeeElement(element) {
    browser.waitForExist(element).should.exist;
  }

  /**
   * Assert: checks if given element has specified text.
   * @param {*} element Element to compare text on.
   * @param {*} text Expected text from element.
   */
  shouldSeeElementWithTextContent(element, text) {
    this.waitForAndReturnText(element, 50000).should.contain(text);
  }

  /**
    * Loops through elements found with the selector and gets the last text value that isn't blank.
    *@param {*} selector Selector to find elements to pull text from.
    *@param {*} timeout Timeout in milliseconds.
    * @returns Text found in an element.
    */
  waitForAndReturnText(selector, timeout) {
    let elText = "";
    browser.waitUntil(function () {
      let els = browser.elements(selector);
      els.value.forEach(el => {
        try {
          if (el.getText() !== "") {
            elText = el.getText();
          }
        } catch (error) {
        }
      })
      return elText !== "";
    }, timeout, 'Waited for text timeout', 2000);
    return elText;
  }

  /**
   * Assert: checks if given element has specified value.
   * @param {*} element Element to compare value on.
   * @param {*} value Expected value from element.
   */
  shouldSeeElementWithValue(element, value) {
    browser.waitForExist(element).should.exist;
    browser.getAttribute(element, "value").should.have.contain(value);
  }

  /**
   * Switch to specified tab number, 0 being main page.
   * @param {*} tab Tab to switch to.
   */
  switchTab(tab) {
    let tabIds = browser.getTabIds();
    browser.switchTab(tabIds[tab]);
  }

  /**
   * Generic wait function in seconds.
   * @param {*} seconds Wait time in seconds. 
   */
  wait(seconds) {
    browser.pause(seconds * 1000);
  }

  /**
   * Waits for the given element to no longer exist on page. Must have existed first before calling function.
   * @param {*} element Element to wait for.
   */
  waitForElementNotToExist(element) {
    browser.waitForExist(element); // Wait for element to exist
    browser.waitForExist(element, 120000, false); // Now wait for it to NOT exist (2 mins)
  }

  /**
   * Gets first availible element on page with given element selector.
   * @param {*} element Element selector.
   * @returns First element.
   */
  getFirstAvailableElementOnPage(element) {
    const allElementsOfSelector = browser.elements(element).value;

    for (let elem of allElementsOfSelector) {
      if (this.isClickable(elem.selector)) {
        return elem.selector;
      }
    }
  }

  /**
   * Checks if element is clickable by confirming it both exists and is visible on page.
   * @param {*} element Element to check.
   * @returns True if element is visible and exists.
   */
  isClickable(element) {
    if ((browser.isExisting(element) && browser.isVisible(element)) === true) {
      return true;
    }
    return false;
  }

  /**
   * Clicks element when visible.
   * @param {*} element Element to be clicked on.
   */
  clickWhenVisible(element) {
    browser.waitForExist(element);
    browser.waitForVisible(element);
    let clicked = false;
    do {
      try {
        browser.click(element);
      } catch (error) {
        browser.pause(2000);
      } finally {
        clicked = true;
      }
    } while (!clicked);
  }

}

export default new Driver();
