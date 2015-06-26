#!/usr/bin/env node
'use strict';
var meow = require('meow');
var chalk = require('chalk');
var notepadReplacer = require('./');

var cli = meow({
    help: [
        'Usage',
        '  notepad-replacer [--install <editor.exe>] [--contextmenu <name>] [--uninstall]',
        '',
        'When no install/uninstall flag is used, it invokes your configured replacement and forwards any parameters.',
        '--install <path-to-editor-exe> Enables the notepad replacement.',
        '--contextmenu <name>           Adds a content menu entry (only valid in )',
        '--uninstall                    Disables the notepad replacement.',
        ''
    ].join('\n')
});

var promise;

if (cli.flags.contextmenu && !cli.flags.install) {
  console.error(chalk.red.bold('Parameter --contextmenu is only valid in conjunction with --install.'));
} else if (cli.flags.install) {  
  promise = notepadReplacer.install(cli.flags.install, cli.flags.contextmenu);
} else if (cli.flags.uninstall) {
  promise = notepadReplacer.uninstall();
} else {
  console.dir(process.argv);
  promise = notepadReplacer.invoke(process.argv);
}

if (promise) {
  promise.catch(function(err) { 
    console.error(chalk.red.bold('Error: ' + err.message));
  });
}
