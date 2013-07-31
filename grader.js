#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/


var cheerio = require('cheerio');
var fs = require('fs');
var program = require('commander');
var rest = require('restler');
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
  var instr = infile.toString();
  if (!fs.existsSync(instr)) {
    console.log("%s does not exist. Exiting.", instr);
    process.exit(1);
  }
  return instr;
};

var cheerioHtmlFile = function(htmlfile) {
  return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
  return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
  $ = cheerioHtmlFile(htmlfile);
  var checks = loadChecks(checksfile).sort();
  var out = {};
  for (var ii in checks) {
    var present = $(checks[ii]).length > 0;
    out[checks[ii]] = present;
  }
  return out;
};

var clone = function(fn) {
  // TODO(jonathanau): Remove workaround once issue fixed
  //
  // Workaround for commander.js issue.
  // http://stackoverflow.com/a/6772648
  return fn.bind({});
};

var buildfn = function(checksfile) {

  var checkUrlAndPrintToConsole = function(result, response) {
    if (result instanceof Error) {
        console.error('Error: ' + util.format(response.message));
        process.exit(1);
    }

    $ = cheerio.load(result);

    // TODO(jonathanau): Refactor common logic between checkUrlAndPrintToConsole
    //  and checkHtmlFile into separate method
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for (var ii in checks) {
      var present = $(checks[ii]).length > 0;
      out[checks[ii]] = present;
    }
    var outJson = JSON.stringify(out, null, 4);
    console.log(outJson);
  };

  return checkUrlAndPrintToConsole;
};

if (require.main == module) {
  program
    .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
    .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists))
    .option('-u, --url <url>', 'Site address')
    .parse(process.argv);
  if (program.file) {
    var checkJson = checkHtmlFile(program.file, program.checks);
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
  } else if (program.url) {
    checkUrlAndPrintToConsole = buildfn(program.checks);
    rest.get(program.url).on('complete', checkUrlAndPrintToConsole);
  } else {
    console.log("Need to specify file or URL");
    process.exit(1);
  }
} else {
  exports.checkHtmlFile = checkHtmlFile;
}
