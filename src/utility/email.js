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

/**
 * Asynchronously calls gmail API to authorize, read and delete mail.
 * 
 * First run of the authorize will require getting a token and it will store it for later runs.
 */
class Email {

  /**
   * Create an OAuth2 client with the given credentials
   *
   * @returns OAuth2Client with token.
   */
  authorize() {
    return new Promise((resolve, reject) => {
      readFilePromise(SECRET_PATH).then((content) => {
        const credentials = JSON.parse(content);
        const clientSecret = credentials.installed.client_secret;
        const clientId = credentials.installed.client_id;
        const redirectUrl = credentials.installed.redirect_uris[0];
        let oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUrl);

        // Check if we have previously stored a token.
        readFilePromise(TOKEN_PATH).then((token) => {
          oauth2Client.credentials = JSON.parse(token);
          resolve(oauth2Client);
        }).catch((err) => {
          this.getNewToken(oauth2Client).then((auth) => {
            this.storeToken(auth.credentials);
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
  getNewToken(oauth2Client) {
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
  storeToken(token) {
    try {
      fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
      if (err.code != 'EEXIST') {
        throw err;
      }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    console.log("Token stored to " + TOKEN_PATH);
  }

  /**
   * Delete token on disk.
   */
  deleteToken() {
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

  /**
   * Get list of mail id in inbox.
   *
   * @param {OAuth2Client} auth OAuth2Client with token.
   * @returns messages JSON.
   */
  listMail(auth) {
    return new Promise((resolve, reject) => {
      let gmail = google.gmail('v1');
      gmail.users.messages.list({
        auth: auth,
        userId: 'me',
      }, function (err, response) {
        if (err) {
          reject(err);
        }
        resolve(response.data.messages);
      });
    });
  }

  /**
   * Read mail with given id in inbox. Only supports messages with text body.
   *
   * @param {OAuth2Client} auth OAuth2Client with token.
   * @param {string} id Mail ID.
   * @returns Body text of message if supported.
   */
  readMail(auth, id) {
    return new Promise((resolve, reject) => {
      let gmail = google.gmail('v1');
      gmail.users.messages.get({
        auth: auth,
        userId: 'me',
        id: id,
        format: 'full',
      }, function (err, response) {
        if (err) {
          reject(err);
        }
        if (!response.data.payload.parts[0].body.data) {
          reject(new Error("Do not support message type. Only text messages."));
        } else {
          resolve(Buffer.from(response.data.payload.parts[0].body.data, 'base64').toString('ascii'));
        }
      });
    });
  }

  /**
   * Delete mail with given id in inbox.
   *
   * @param {OAuth2Client} auth OAuth2Client with token.
   * @param {string} id Mail ID.
   */
  deleteMail(auth, id) {
    return new Promise((resolve, reject) => {
      let gmail = google.gmail('v1');
      gmail.users.messages.delete({
        auth: auth,
        userId: 'me',
        id: id,
      }, function (err, response) {
        if (err) {
          reject(err);
        }
        resolve(true);
      });
    });
  }

  /**
   * Delete all mail in inbox.
   */
  deleteAllMail() {
    console.log("Deleting mail...");
    return new Promise((resolve, reject) => {
      this.authorize().then((creds) => {
        this.listMail(creds).then((messages) => {
          let promises = [];
          if (!messages || messages.length == 0) {
            console.log("No mail found.");
            resolve(true);
          } else {
            for (let i = 0; i < messages.length; i++) {
              promises.push(this.deleteMail(creds, messages[i].id));
            }
          }
          Promise.all(promises).then(() => {
            console.log("Deleted success!");
            resolve(true);
          }).catch((err) => {
            reject(err);
          });
        }).catch((err) => {
          reject(err);
        });
      }).catch((err) => {
        reject(err);
      });
    });
  }

  /**
   * Waits until at least 1 message is in inbox, then reads it.
   *
   * @returns Email body text.
   */
  waitAndReadFirstEmail() {
    return new Promise((resolve, reject) => {
      this.authorize().then((creds) => {
        browser.waitUntil(() => {
          this.listMail(creds).then((messages) => {
            if (!messages || messages.length == 0) {
              return false;
            } else {
              this.readMail(creds, messages[0].id).then((bodyText) => {
                //this will actually get the password/username from email
                //let text = bodyText.match(/:\s(.*?)\./)[1].trim();
                resolve(bodyText);
              }).catch((err) => {
                reject(err);
              });
            };
          }).catch((err) => {
            reject(err);
          });
        }, 60000, "No mail found.", 1000);
      }).catch((err) => {
        reject(err);
      });
    });
  }

}
export default new Email();