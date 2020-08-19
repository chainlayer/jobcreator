'use strict';

var job = process.argv[2]
var bridge = process.argv[3]
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
    // found the job, create jobspec
    let jobspec = new Object();
    jobspec.initiators = new Array();
    jobspec.initiators.push({
      "type": "web",
    })
    jobspec.tasks = new Array();
    jobspec.tasks.push({
      "type": bridge,
      "params": {
        "from": contracts[contractkeys[a]].marketing.pair[0],
        "to": contracts[contractkeys[a]].marketing.pair[1]
      }
    })
    jobspec.tasks.push({
      "type": "copy",
      "params": {
        "copyPath": [
          "result"
        ]
      }
    })
    jobspec.tasks.push({
      "type": "multiply",
      "params": {
        "times": Math.pow(10, contracts[contractkeys[a]].decimals)
      }
    })
    jobspec.tasks.push({
      "type": "ethint256",
      "params": {
      }
    })
    console.log(JSON.stringify(jobspec))
    
  }
}
