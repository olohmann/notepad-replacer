'use strict';

var fs = require('fs');
var osenv = require('osenv');
var path = require('path');
var Promise = require('bluebird');

var configFileName = '.notepad-replacer';
var configFilePath = path.join(osenv.home(), configFileName);
var dummyMarker = '-3qlsvw92';

function getAbsolutePathToScript() {
  var promise = new Promise(function (resolve, reject) {
    var exec = require('child_process').exec;
    exec("npm config get prefix", function (err, stdout, stderr) {
      if (!err) {
        resolve(stdout.replace(/(\r\n|\n|\r)/gm, "") + "\\notepad-replacer.cmd");
      }
      else {
        reject(err);
      }
    });
  });

  return promise;
}

function installRegKey(scriptPath) {
  var createKey = Promise.promisify(require('regedit').createKey);
  var putValue = Promise.promisify(require('regedit').putValue);

  return createKey('HKLM\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\notepad.exe').
    then(function () {
    return putValue({
      'HKLM\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\notepad.exe': {
        'Debugger': {
          value: scriptPath + ' ' + dummyMarker,
          type: 'REG_SZ'
        }
      }
    });
  });
}

function uninstallRegKey() {
  var deleteKey = Promise.promisify(require('regedit').deleteKey);

  return deleteKey(
    'HKLM\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\notepad.exe'
    );

}

function uninstall() {
  return getAbsolutePathToScript()
    .then(uninstallRegKey);
}

function install(exe) {
  return saveConfig(exe)
    .then(getAbsolutePathToScript)
    .then(installRegKey);
}

function saveConfig(exe) {
  if (!exe) {
    throw new Error('No replacement exe specified.');
  }

  var writeFile = Promise.promisify(require("fs").writeFile);
  return writeFile(configFilePath, JSON.stringify({ exe: exe }));
}

function readConfig() {
  var readFile = Promise.promisify(require("fs").readFile);

  return readFile(configFilePath, "utf8")
    .then(function (contents) {
    return JSON.parse(contents);
  }, function (err) {
      throw new Error('Failed to read config file');
    });
}

function spawnTool(config, argv) {
  var args = [];

  var promise = new Promise(function (resolve, reject) {
    if (argv.length >= 1) {
      if (argv[0] === 'node' && argv.length >= 2) {
        args = argv.slice(2);
      } else {
        args = argv;
      }
    }

    if (args.length >= 1) {
      if (args[0] === dummyMarker) {
        args = args.slice(2);
      }
    }

    // console.log('invoking: '+ config.exe  + ' ARGS: ' + JSON.stringify(args));

    var spawn = require('child_process').spawn;

    var child = spawn(config.exe, args, {
      detached: true
    });

    child.unref();
    resolve();
  });

  return promise;
}

function invoke(argv) {
  return readConfig()
    .then(function (config) {
    return spawnTool(config, argv);
  });
}

module.exports.install = install;
module.exports.uninstall = uninstall;
module.exports.invoke = invoke;
