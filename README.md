# HTML import updater
[![NPM version][npm-img]][npm-link] 

A cli tool that reads HTML files and updates their script, style or import 'src' or 'href' according to your settings.

![html-import-updater](https://user-images.githubusercontent.com/1515742/31330377-7588674e-acde-11e7-94a9-40f73e7d1441.gif)

### [Download latest binaries 📀](https://github.com/DHI/html-import-updater/releases/latest)

##### What is this for?
✅ Polymer projects that change the location of their 3rd party libs<br/>
✅ Polymer projects that move to npm <br/>
✅ Any project that has a bunch of HTML imports that need to be bulk-updated <br/>
✅ Works with nested HTML imports and can exclude paths

## Usage (packaged)
Download the latest binary release for your OS on [the release page](https://github.com/DHI/html-import-updater/releases).

Available builds: linux, macos, windows

-------------------------------------------------------------------

To package the app yourself (essentially create the binaries mentioned above), run
```bash
npm run publish:all # creates binaries in ./package
```

## Usage (unpackaged, as a node app)
You can run this tool as a node app or packaged executable.

```bash
yarn add html-import-updater # or npm install html-import-updater
cd node_modules/html-import-updater
node ./index.js [options]
```

```bash
# or clone repo and run
node ./index.js [options]
```

### Windows
```bash
PowerShell ./html-import-updater.exe [options]
```
### Mac / Linux
```bash
./html-import-updater [options]
```

## Options
```bash
Usage: index [options]

Options:

  -V, --version             output the version number
  --cwd, --workingDir       Current working directory (where your files
                            are).
  --e, --excludePaths       One or many paths (or globs) you want to
                            exclude, i.e. `-e "prefix-*"`. Can be
                            applied multiple times: `-e "one" -e "two"`.
  --o, --outputDir          The output directory.
  --s, --search             The string you want to search for, i.e. "../"
  --r, --replace            The string you want to replace each     
                            occurrence of the search string with.
  --ep, --excludePatterns   One or many regular expressions that you
                            want to exclude from each matched search
                            item, i.e. `-ep "iron.*"`. Can be applied
                            multiple times: `-ep "one" -ep "two"`.
  -h, --help                output usage information
```

## Developing
The development enviornment has only been used on a macOS & Unix enviornment. Use on Windows at your own risk. The executables from releases (above) should work fine.

Install dependencies
```bash
yarn
```

Run app with babel-node
```bash
babel-node index.js [options]
```

> Requires node v8.5.0+

#### Run a demo
```bash
npm run demo # outputs files with replaced locations to ./replaced
```

#### Testing
```bash
yarn
npm run dev # continuous tests, watches files for changes
```

#### Run tests once
```bash
npm run test
```


[npm-img]: https://badge.fury.io/js/html-import-updater.svg
[npm-link]: https://npmjs.org/package/html-import-updater
