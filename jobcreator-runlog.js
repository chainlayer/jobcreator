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
    let jobspec = new Object();
    if (contracts[contractkeys[a]].contractVersion==2) {
      // found the job, create jobspec
      jobspec.initiators = new Array();
      jobspec.initiators.push({
        "type": "runlog",
        "params": {
          "address": oracleAddress
        }
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
      jobspec.tasks.push({
        "type": "ethtx",
        "params": {
        }
      })
    }
    if (contracts[contractkeys[a]].contractVersion==3) {
      // found the job, create jobspec
      jobspec.initiators = new Array();
      jobspec.initiators.push({
        "type": "fluxmonitor",
        "params": {
          "address": contractkeys[a],
          "requestData": {
            "data": {
              "from": contracts[contractkeys[a]].marketing.pair[0],
              "to": contracts[contractkeys[a]].marketing.pair[1]
            },
          },
          "feeds": [
            {
              "bridge": bridge
            }
          ],
          "threshold": contracts[contractkeys[a]].deviationThreshold,
          "precision": contracts[contractkeys[a]].decimals,
          "idleTimer": (contracts[contractkeys[a]].heartbeat==null?
             {"disabled": true,"duration": "0s"}:
             { "duration": contracts[contractkeys[a]].heartbeat }
          ),
          "pollTimer": {
            "period": "1m"
          }
        }
      })
      jobspec.tasks = new Array();
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
      jobspec.tasks.push({
        "type": "ethtx",
        "params": {
        }
      })
    }
    console.log(JSON.stringify(jobspec))
 }
}
