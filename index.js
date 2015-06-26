'use strict';

var fs = require('fs');
var osenv = require('osenv');
var path = require('path');
var Promise = require('bluebird');
var chalk = require('chalk');

var configFileName = '.notepad-replacer';
var configFilePath = path.join(osenv.home(), configFileName);
var dummyMarker = '-3qlsvw92';

var regKeyFile = 'HKCR\\*\\shell\\NotepadReplacer';
var regKeyDirectory = 'HKCR\\Directory\\shell\\NotepadReplacer'; 
var regKeyReplace = 'HKLM\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\notepad.exe'

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

  var values = {};
  values[regKeyReplace] = {
    'Debugger': {
      value: scriptPath + ' ' + dummyMarker,
      type: 'REG_SZ'
    }
  };

  return createKey(regKeyReplace).
    then(function () {
    return putValue(values);
  });
}

function installContextmenuRegKey(exe, title) {
  var createKey = Promise.promisify(require('regedit').createKey);
  var putValue = Promise.promisify(require('regedit').putValue);
  
  var values = {};
  
  values[regKeyFile] = {
    'Default': {
      value: title,
      type: 'REG_DEFAULT'
    },
    'Icon': {
      value: exe,
      type: 'REG_SZ'
    }
  };
  
  values[regKeyDirectory] = {
    'Default': {
      value: title,
      type: 'REG_DEFAULT'
    },
    'Icon': {
      value: exe,
      type: 'REG_SZ'
    }
  };
  
  values[regKeyFile + '\\command'] = {
    'Default': {
      value: 'notepad.exe "%1"',
      type: 'REG_DEFAULT'
    }
  };
    
  values[regKeyDirectory + '\\command'] = {
    'Default': {
      value: 'notepad.exe "%1"',
      type: 'REG_DEFAULT'
    }
  };
  
  return createKey([
      regKeyFile, 
      regKeyFile + '\\command', 
      regKeyDirectory, 
      regKeyDirectory + '\\command'])
    .then(function() {     
      return putValue(values);
    });  
}

function uninstallContextmenuRegKey() {
  var deleteKey = Promise.promisify(require('regedit').deleteKey);

  return deleteKey(regKeyFile + '\\command')
      .then(function() {
        return deleteKey(regKeyFile + '\\');
      })
      .then(function() {
        return deleteKey(regKeyDirectory + '\\command');
      })
      .then(function() {
        return deleteKey(regKeyDirectory + '\\');
      }).catch(function(e) {
        console.warn(e.cause);
        console.warn(chalk.yellow('Context menu registry keys did not uninstall properly.'));
      }); 
}

function uninstallRegKey() {
  var deleteKey = Promise.promisify(require('regedit').deleteKey);
  
  return deleteKey(regKeyReplace)
    .catch(function(e) {
        console.warn(e.cause);
        console.warn(chalk.yellow('Registry key did not uninstall properly.'));
    });;
}

function uninstall() {
  return getAbsolutePathToScript()
    .then(uninstallRegKey)
    .then(uninstallContextmenuRegKey);
}

function install(exe, contextmenu) {
  if (!fs.existsSync(exe)) {
    throw new Error('Path "' + exe + '" does not exist.');
  }
  
  var process = saveConfig(exe, contextmenu)
    .then(getAbsolutePathToScript)
    .then(installRegKey);
    
  if (contextmenu) {
    process = process.then(function() { 
      return installContextmenuRegKey(exe, contextmenu);
    });
  }
  
  return process;
}

function saveConfig(exe) {
  if (!exe) {
    throw new Error('No replacement exe specified.');
  }

  var writeFile = Promise.promisify(require("fs").writeFile);
  return writeFile(configFilePath, JSON.stringify({ exe: exe}));
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
      // Remove marker parameter (Registry Detour Entry)
      if (args[0] === dummyMarker) {
        args = args.slice(2);
      }
      
      args = [args.join(' ')];
    }

    var spawn = require('child_process').spawn;

    var child = spawn(config.exe, args, {
      stdio: 'ignore',
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
