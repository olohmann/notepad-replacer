# notepad-replacer (Windows-Only)

> Replaces calls to notepad.exe with calls to your favorite editor.

## CLI

### Install

```bash
npm install --global notepad-replacer
```

### Usage

**Note: The replacement operation requires admin rights.**

If you want to replace notepad.exe with, for example, [Sublime](http://www.sublimetext.com/): 
```bash
notepad-replacer --install "C:\YOUR\PATH\TO\Sublime\sublime_editor.exe"
```

Afterwards you should be able to call:
```bash
notepad.exe foo.txt
```

And Sublime should open with a (new) file `foo.txt`.

If you'd like to have context menu entries (files *and* directories):
```bash
notepad-replacer --install "C:\YOUR\PATH\TO\Sublime\sublime_editor.exe" --contextmenu "Open with Sublime"
```

If you change your mind later:
```bash
notepad-replacer --uninstall
```

Additional help:

```bash
notepad-replacer --help
```

## What was done to make this work?

This tool is using the registry to set the [Image File Execution Options](https://msdn.microsoft.com/en-us/library/a329t4ed(VS.71).aspx) for `notepad.exe`. 
This is normally used to attach debuggers to EXEs automatically, but instead we use it to call a proxy which invokes the editor of your choice. All parameters are forwarded as well.  


## License

MIT © [Oliver Lohmann](http://oliver-lohmann.me)
