#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

source $DIR/.env

if ! command -v node &> /dev/null
then
    echo "node could not be found, node is needed to run this program"
    exit
fi

if ! command -v jq &> /dev/null
then
    echo "jq could not be found, jq is needed to run this program"
    exit
fi

if ! command -v curl &> /dev/null
then
    echo "curl could not be found, curl is needed to run this program"
    exit
fi

if ! command -v git &> /dev/null
then
    echo "git could not be found, git is needed to run this program"
    exit
fi

repodir=`git rev-parse --show-toplevel 2>/dev/null`
reponame=`basename ${repodir} 2>/dev/null`
if [ "$reponame" != "reference-data-directory" ]
then
    echo "you are not in the reference data directory!"
    exit
fi

# Dont deploy by default
DEPLOY=0
TEST=0

# Parse options
POSITIONAL=()
while [[ $# -gt 0 ]]
do
key="$1"

case $key in
    -j|--job)
    JOB="$2"
    shift # past argument
    shift # past value
    ;;
    -v|--version)
    VERSION="$2"
    shift # past argument
    shift # past value
    ;;
    -o|--operator)
    OPERATOR="$2"
    shift # past argument
    shift # past value
    ;;
    -d|--deploy)
    DEPLOY=1
    shift # past argument
    shift # past value
    ;;
    -t|--test)
    TEST=1
    shift # past argument
    shift # past value
    ;;
    *)    # unknown option
    POSITIONAL+=("$1") # save it in an array for later
    shift # past argument
    ;;
esac
done
set -- "${POSITIONAL[@]}" # restore positional parameters

if [ -z "$JOB" ]
then
  echo "No job supplied, please supply the path of the Job"
  echo "Usage: jobcreator.sh -j jobname -v version [-d deploy] [-o operator]"
  exit
fi
if [ -z "$VERSION" ]
then
  echo "No version supplied, please supply the version of the Job (2=runlog 3=fluxmonitor)"
  echo "Usage: jobcreator.sh -j jobname -v version [-d deploy] [-o operator]"
  exit
fi

node ${DIR}/jobcreator-web.js "${JOB}" $VERSION $OPERATOR $PWD/directory.json >jobspec-web
if [ ! -s jobspec-web ]
then
  echo "Jobspec file is empty, please check if this job actually exists on this branch"
  exit
fi
node ${DIR}/jobcreator-runlog.js "${JOB}" $VERSION $OPERATOR $PWD/directory.json >jobspec-runlog
if [ ! -s jobspec-runlog ]
then
  echo "Jobspec file is empty, please check if this job actually exists on this branch"
  exit
fi

if [ $DEPLOY -eq 0 ] 
then
  if [ $TEST -eq 1 ]
  then
    cat jobspec-web|jq
  fi
  cat jobspec-runlog|jq
else

rm -f cookiefile
TEMP=`curl -s -c cookiefile -X POST   -H 'Content-Type: application/json' -d '{"email":"'${USERNAME}'", "PASSWORD":"'${PASSWORD}'"}' ${NODEURL}/sessions`
LOGIN=`echo $TEMP|jq -r '.data.attributes.authenticated'`
if [ "$LOGIN" != "true" ]
then
  echo "Login failed with $TEMP"
  exit
fi

echo "logged in creating job with jobid: "
echo "creating webjob"
TEMP=`curl -s -b cookiefile -c cookiefile -H 'content-type: application/json' --data @jobspec-web ${NODEURL}/v2/specs`
WEBJOB=`echo $TEMP|jq -r '.data.id'`
if [ "$WEBJOB" == "null" ]
then
  echo "Failed with $TEMP"; exit
fi

echo "testing"
TEMP=`curl -X POST -s -b cookiefile -c cookiefile -H 'content-type: application/json' ${NODEURL}/v2/specs/${WEBJOB}/runs`
WEBRUN=`echo ${TEMP}|jq -r '.data.id'`
if [ "$WEBRUN" == "null" ]
then
  echo "Failed with ${TEMP}"; exit
fi

echo "created jobrun ${WEBRUN} for job ${WEBJOB}.. Sleeping 5 seconds"
sleep 5

TEMP=`curl -s -c cookiefile -b cookiefile ${NODEURL}/v2/runs/${WEBRUN}`
STATUS=`echo $TEMP|jq -r '.data.attributes.status'`

if [ "$STATUS" != "completed" ]
then
  echo "Error occured please check node.. Error: $TEMP"
else
  echo "Job successful, creating real job "
  RUNJOB=`curl -s -b cookiefile -c cookiefile -H 'content-type: application/json' --data @jobspec-runlog ${NODEURL}/v2/specs|jq -r '.data.id'`
  echo "Created runlog job $RUNJOB"
  #node ${DIR}/jobupdater.js $JOB $VERSION $RUNJOB $OPERATOR $PWD/directory.json
  #go run cmd/json-fmt/main.go directory.json
  #go run cmd/validate_directory/main.go
fi

# Cleanup
rm jobspec-web
rm jobspec-runlog
rm cookiefile
fi
