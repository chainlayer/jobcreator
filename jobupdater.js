'use strict';

var job = process.argv[2]
var jobid = process.argv[3]
var operator = process.argv[4]
var directoryfile = process.argv[5]

const fs = require('fs');

let rawdata = fs.readFileSync(directoryfile)
let directory = JSON.parse(rawdata);
let contracts = directory.contracts;
let operators = directory.operators;

let opkeys = Object.keys(operators);
let operatorapi = new Object();
let found = false
let contractkeys = Object.keys(contracts);
let oracleAddress = ""

// Find oracle address
for (var a = 0; a < opkeys.length; a++) {
  if (opkeys[a] == operator) {
    oracleAddress = operators[opkeys[a]].oracleAddress
  }
}

// Find job
for (var a = 0; a < contractkeys.length; a++) {
  if (contracts[contractkeys[a]].marketing.path == job) {
    for (var b = 0; b < contracts[contractkeys[a]].oracles.length; b++) {
      if (contracts[contractkeys[a]].oracles[b].operator == operator) {
        contracts[contractkeys[a]].oracles[b].jobId = jobid
      }
    }
  }
}

fs.writeFile('directory.json', JSON.stringify(directory), function writeJSON(err) {
  if (err) return console.log(err);
  console.log('writing file')
});
