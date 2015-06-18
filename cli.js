#!/usr/bin/env node
'use strict';
var meow = require('meow');
var chalk = require('chalk');
var notepadReplacer = require('./');

var cli = meow({
    help: [
        'Usage',
        '  notepad-replacer [--install] [--uninstall]',
        '',
        'When no install/uninstall flag is used, it invokes your configured replacement and forwards any parameters.',
        '--install <path-to-editor-exe> Enables the notepad replacement.',
        '--uninstall                    Disables the notepad replacement.',
        ''
    ].join('\n')
});

var promise;

if (cli.flags.install) {  
  promise = notepadReplacer.install(cli.flags.install);
} else if (cli.flags.uninstall) {
  promise = notepadReplacer.uninstall();
} else {
  promise = notepadReplacer.invoke(process.argv);
}

if (promise) {
  promise.catch(function(err) { 
    console.error(chalk.red.bold('Error: ' + err.message));
  });
}
