Feature: Web Demo

@home
Scenario: Go to homepage
  Given I go to the "home" page
  When I click the "LOGIN_LINK" link on the page
  And I am on the "login" page
  Then I should see the "LOGIN_BUTTON" button on the page

@login
Scenario: Attempt to login
  Given I go to the "home" page
  When I click the "LOGIN_LINK" link on the page
  And I am on the "login" page
  Then I should see the "LOGIN_BUTTON" button on the page
  When I enter "test_user" into the "USERNAME_INPUT"
  And I enter "test_pwd" into the "PASSWORD_INPUT"
  And I click the "LOGIN_BUTTON" button on the page
