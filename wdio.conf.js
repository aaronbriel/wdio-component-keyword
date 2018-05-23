const capability = require("./capabilities.json")[process.env.CAPABILITY];
const chai = require("chai");
const shell = require("shelljs");
let testCount = 0;
const glob = require("glob");
const fs = require("fs");
const featuresPath = "./test/Product/features/*.feature";
let filesWithTags = "";

//Filter out feature files that don't have specified tags, this prevents unnecessary loading of browser driver
if (process.env.TAG && process.env.TAG !== "" && process.env.TAG !== "@All") {
  const expressionNode = process.env.TAG.match(/(@\w+)/g) || []
  filesWithTags = glob.sync(featuresPath).map((file) => {
    const content = fs.readFileSync(file, 'utf8')
    var found = false;
    if (content.length > 0) {
      const tagsInFile = content.match(/(@\w+)/g) || []
      tagsInFile.forEach(t => {
        expressionNode.forEach(e => {
          if (e == t) {
            found = true;
          }
        })
      })
    }
    if (found) {
      return file;
    } else {
      return null
    }
  }).filter(x => x != null)
}

exports.config = {
  //uncomment below lines to debug wdio.config.js
  //debug: true,
  //execArgv: ['--inspect=127.0.0.1:5859'],
  host: "localhost",
  path: "/wd/hub",
  specs: filesWithTags ? filesWithTags : featuresPath,
  exclude: [],
  suites: {
    foo: [""]
  },
  // TODO: Fork wdio to allow multiple ports
  port: capability.port,
  maxInstances: 1,
  capabilities: getCapability(),
  services: ["selenium-standalone"],
  seleniumLogs: "/logs/selenium.log",
  logLevel: "silent",
  coloredLogs: true,
  bail: 0,
  screenshotPath: "./results/screenshots/",
  screenshotOnReject: true,
  waitforTimeout: 60000,
  framework: "cucumber",
  cucumberOpts: {
    require: ["./test/common/steps/*",
      "./test/Product/steps/*"],
    format: ["pretty"],
    backtrace: false,
    compiler: ["js:babel-register"],
    failAmbiguousDefinitions: true,
    failFast: false,
    ignoreUndefinedDefinitions: false,
    name: [],
    snippets: false,
    source: true,
    profile: [],
    snippetSyntax: undefined,
    strict: true,
    tagExpression: process.env.TAG,
    tagsInTitle: false,
    timeout: 70000,
    tags: []
  },
  reporters: ["cucumber", "json", "junit", "allure"],
  reporterOptions: {
    junit: {
      outputDir: "./results"
    },
    json: {
      outputDir: "./results"
    },
    allure: {
      outputDir: './results/allure/',
      disableWebdriverStepsReporting: false,
      useCucumberStepReporter: true
    }
  },

  // WebDriverIO specific hooks
  onPrepare: function (config, capabilities) {
    //cleanup existing screenshots before run
    const path = require('path');
    var deletePath = path.resolve("./results");
    deleteFolderRecursive(deletePath);
    // Deals with All tag 
    if (process.env.TAG === "@All") {
      process.env.TAG = ""
    }
    // Spawns 32 bit process for IE11
    if (JSON.stringify(capabilities).includes('internet explorer')) {
      const cp = require('child_process');
      cp.execSync('node selenium-standalone install --config=../../../config.ie.js',
        { cwd: './node_modules/selenium-standalone/bin' }
      );
      let seleniumSpawn = cp.spawn('node', ['selenium-standalone', 'start', '--config=../../../config.ie.js'],
        { cwd: './node_modules/selenium-standalone/bin' }
      );
      //keep the spawn alive
      seleniumSpawn.stderr.on('data', function (data) { });
    }
  },
  beforeSession: function (config, capabilities, specs) { },
  before: function (capabilities, specs) {
    global.expect = chai.expect;
    global.assert = chai.assert;
    global.should = chai.should();
  },
  beforeSuite: function (suite) { },
  beforeHook: function () { },
  afterHook: function () { },
  beforeTest: function (test) { },
  beforeCommand: function (commandName, args) { },
  afterCommand: function (commandName, args, result, error) { },
  afterTest: function (test) { },
  afterSuite: function (suite) { },
  after: function (result, capabilities, specs) { },
  afterSession: function (config, capabilities, specs) { },
  onComplete: function (exitCode, config, capabilities) {
    // TODO: Remove after wdio update resolves cleanup of rouge procs
    // clean up drivers
    const cp = require('child_process');
    if (process.platform === 'win32') {
      let lines = cp.execSync('tasklist').toString().trim().split("\n");
      //remove the table headers    
      let processes = lines.slice(2);
      //match the process name and ID
      let parsed = processes.map(function (process) {
        return process.match(/(.+?)[\s]+?(\d+)/)[0];
      });
      let filtered = parsed.filter(function (process) {
        return /chromedriver/.test(process) || /geckodriver/.test(process) || /IEDriverServer/.test(process) || /iexplore/.test(process);
      });
      //try and kill all processes filtered
      filtered.forEach(proc => {
        try {
          cp.execSync('taskkill /PID ' + proc.split(" ").filter(i => i)[1] + ' /F');
        } catch (error) { }
      });
    } else {
      shell.exec('kill -9 $(pgrep chromedriver)', { silent: true });
      shell.exec('kill -9 $(pgrep geckodriver)', { silent: true });
    }
    cp.execSync('allure generate .', { cwd: './results/allure' });
  },

  // Cucumber specific hooks
  beforeFeature: function (feature) { },
  beforeScenario: function (scenario) {
    // reload with fresh browser each time, 
    // delay is added to prevent errors of browser reloading while taking fail screenshot
    testCount++
    if (testCount > 1) {
      browser.pause(2000);
      browser.reload();
    }
  },
  beforeStep: function (step) { },
  afterStep: function afterStep(stepResult) {
    takeScreenshot(stepResult);
  },
  afterScenario: function (scenario) { },
  afterFeature: function (feature) { }
};

function getCapability() {
  if (process.env.CAPABILITY.includes('multiDesktop')) {
    return [require("./capabilities.json")['chrome'],
    require("./capabilities.json")['firefox']]
  } else if (process.env.CAPABILITY.includes('multiMobile')) {
    return [require("./capabilities.json")['iPhoneSimulator'],
    require("./capabilities.json")['androidEmulator']]
  } else {
    return [capability]
  }
}

function takeScreenshot(stepResult) {
  if (stepResult.status == "failed") {
    const path = require('path');
    let shotPath = exports.config.screenshotPath;
    let scenarioName = stepResult.step.scenario.name
      .split(":")[0]
      .replace(/ /g, '');
    let fileName = scenarioName + "_" + process.env.CAPABILITY + Date.now() + ".png";
    const resolvedPath = path.resolve(shotPath, fileName);
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      mkDirByPathSync(dir);
    }
    browser.saveScreenshot(resolvedPath);
  }
}

function mkDirByPathSync(targetDir, { isRelativeToScript = false } = {}) {
  const path = require('path');
  const sep = path.sep;
  const initDir = path.isAbsolute(targetDir) ? sep : '';
  const baseDir = isRelativeToScript ? __dirname : '.';

  targetDir.split(sep).reduce((parentDir, childDir) => {
    const curDir = path.resolve(baseDir, parentDir, childDir);
    if (!fs.existsSync(curDir)) {
      fs.mkdirSync(curDir);
      console.log(`Directory ${curDir} created!`);
    }
    return curDir;
  }, initDir);
}

function deleteFolderRecursive(deletePath) {
  const path = require('path');
  if (fs.existsSync(deletePath)) {
    fs.readdirSync(deletePath).forEach(function (file, index) {
      var curPath = path.resolve(deletePath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(deletePath);
  }
};
