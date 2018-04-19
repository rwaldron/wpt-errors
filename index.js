#!/usr/bin/env node

const fs = require("fs");
const cp = require("child_process");
const path = require("path");

const glob = require("glob");
const data = {};


const manifest = require(`./MANIFEST.json`);

console.log(Object.keys(manifest.items));

// Subset, but seems like a good place to start.
const { manual, reftest, testharness } = manifest.items;

const unsorted = [
  ...Object.keys(manual),
  ...Object.keys(reftest),
  ...Object.keys(testharness),
];

const canonical = Array.from(new Set(unsorted.sort()), path => `/${path}`);
// console.log(canonical);

const runs = require(`./testruns.json`);

glob(`./summary/*.json`, (error, files) => {
  files.forEach(file => {
    try {
      let contents = JSON.parse(fs.readFileSync(file, "utf8"));
      let count = Object.keys(contents).length;
      let key = path.basename(file);

      // key is eg. "chrome-63.0-linux-summary.json"
      data[key] = contents;
    } catch (e) {}
  });

  const intermediate = {};
  const sortable = [];

  canonical.forEach(test => {
    Object.keys(data).forEach((summary, index) => {
      let platform = toPlatformName(summary);
      let sha = commit(platform);

      if (!intermediate[test]) {
        intermediate[test] = [];
        sortable.push(test);
      }
      let disparity;

      if (data[summary][test]) {
        let [completed, expected] = data[summary][test];

        disparity = { expected, completed };
      } else {
        disparity = { expected: 0, completed: 0 };
      }

      intermediate[test].push({
        platform,
        sha,
        test,
        disparity
      });
    });
  });

  console.log(Object.keys(intermediate).length);

  sortable.sort();

  let finished = sortable.reduce((accum, test) => {
    accum[test] = intermediate[test];
    return accum;
  }, {});

  fs.writeFileSync(`./intermediate.json`, JSON.stringify(finished, null, 2));

  const consolidated = consolidate(finished);

  fs.writeFileSync(`./consolidated.json`, JSON.stringify(consolidated, null, 2));
});

function toPlatformName(text) {
  return text.replace("-summary.json", "");
}

function commit(platform) {
  let shas = runs.by_platform[platform];
  return shas[shas.length - 1];
}

function nest(record, components, results) {
  if (components.length) {
    let key = components.shift();

    if (!record[key]) {
      record[key] = {};
    }

    if (components.length) {
      nest(record[key], components, results);
    } else {
      record[key] = results;
    }
    return record;
  } else {
    return record;
  }
}

function consolidate(data) {
  const files = Object.keys(data);
  let record = {};

  files.forEach(file => {
    let results = data[file];
    let parsed = path.parse(file);
    let components = parsed.dir.split(path.sep).filter(Boolean);
    components.push(parsed.base);
    record = nest(record, components, results);
  });

  return record;
}


