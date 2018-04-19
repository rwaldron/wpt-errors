# wpt-errors

1. `MANIFEST.json` is copied from my local web-platform-tests clone. Sorry, I know that's totally bogus.
1. `testruns.json` is based on [testruns-index.json](https://storage.googleapis.com/wptd/testruns-index.json), but that file is no longer updated, so the local file needs to be manually updated. It really shouldn't use a local file.
1. `npm install`
1. `node index.js` to produce `intermediate.json` & `consolidated.json`
