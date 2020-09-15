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
          "address": oracleAddress,
          "requesters": [ contractkeys[a], 
                          '0xBd2263cd600749a7072B41C04678f7647ee47e95',
                          '0xC7A524e42d834408Ff001E5471Fac0117B3A9E88',
                          '0xc9d995bc276385e6E9136Dabe1223Db8a1777d2a',
                          '0x88424e492b31D46f9F2e12A3d9187a9C486cA4B8',
                          '0xAAf337687be186caE90Db1230d4C31567BeB32Ef',
                          '0xb96051214aaa35CEA7e95F2f6940bF15AACcc896',
                          '0xabd9290B57A0FBC565D21aDE4311AE6393AeA822'
          ]
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
             { "duration": "24h" }:
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
