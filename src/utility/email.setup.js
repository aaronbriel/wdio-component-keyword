/**
 * Run this file from command line - npm run setupEmail or can be called directly using - node email.setup.js
 */

//https://developers.google.com/gmail/api/v1/reference/
//https://developers.google.com/gmail/api/auth/scopes
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const { OAuth2Client } = require("google-auth-library");
const util = require('util');
const readFilePromise = util.promisify(fs.readFile);
// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/gmail-nodejs-quickstart.json
const SCOPES = ['https://mail.google.com/'];
const TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
  process.env.USERPROFILE) + '/.credentials/';
const TOKEN_PATH = TOKEN_DIR + 'gmail-nodejs-quickstart.json';
const SECRET_PATH = process.cwd() + '/src/utility/client_secret.json';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("c or create to generate token. d or delete to delete token. anything else to exit.\n", function (response) {
  switch (response.trim().toLowerCase()) {
    case 'c':
    case 'create':
      authorizePromise().then(() => {
        console.log("Authorized");
      }).catch((err) => {
        console.log("error in authorize: " + err);
      });
      break;
    case 'd':
    case 'delete':
      deleteToken();
      break;
    default: break;
  }
  rl.close();
});

/**
 * Create an OAuth2 client with the given credentials
 *
 * @returns OAuth2Client with token.
 */
function authorizePromise() {
  return new Promise((resolve, reject) => {
    readFilePromise(SECRET_PATH).then((content) => {
      const credentials = JSON.parse(content);
      const clientSecret = credentials.installed.client_secret;
      const clientId = credentials.installed.client_id;
      const redirectUrl = credentials.installed.redirect_uris[0];
      let oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUrl);

      // Check if we have previously stored a token.
      readFilePromise(TOKEN_PATH).then((token) => {
        console.log("token: " + token.toString());
        oauth2Client.credentials = JSON.parse(token);
        resolve(oauth2Client);
      }).catch((err) => {
        getNewTokenPromise(oauth2Client).then((auth) => {
          storeToken(auth.credentials);
          resolve(auth);
        }).catch((err) => {
          reject(err);
        });
      });
    }).catch((err) => {
      console.log("Error loading client secret file: " + err);
      reject(err);
    });
  });
}

/**
 * Get new token after prompting for user authorization
 *
 * @param {OAuth2Client} oauth2Client The OAuth2 client to get token for.
 * @returns OAuth2Client with token after being stored.
 */
function getNewTokenPromise(oauth2Client) {
  return new Promise((resolve, reject) => {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES
    });
    console.log("Authorize this app by visiting this url: ", authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question("Enter the code from that page here: ", function (code) {
      rl.close();
      oauth2Client.getToken(code, function (err, token) {
        if (err) {
          console.log("Error while trying to retrieve access token", err);
          reject(err);
        }
        oauth2Client.credentials = token;
        resolve(oauth2Client)
      });
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
  console.log("Token stored to " + TOKEN_PATH);
}

/**
 * Delete token on disk.
 */
function deleteToken() {
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      fs.unlinkSync(TOKEN_PATH)
      console.log("Token deleted: " + TOKEN_PATH);
    } else {
      console.log("no token found at: " + TOKEN_PATH)
    }
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
}