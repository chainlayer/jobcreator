Usage

Checkout and add the directory to your path
copy the sample .env file and edit the parameters
chmod +x jobcreator.sh

Go to the reference data directory and checkout the branch your new job is on
jobcreator -j jobpath -b bridgename -o operator

you can change the default operator in the env file and omit the -o variable.

CHANGES
- fluxmonitor job

TODO
- make pull requests automagically with hub

