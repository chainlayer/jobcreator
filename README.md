Usage

Checkout and add the directory to your path
chmod +x jobcreator.sh

Go to the reference data directory and checkout the branch your new job is on
jobcreator -j jobpath -b bridgename -o operator

you can change the default operator in jobcreator.sh and omit the -o variable.


TODO
- fluxmonitor job
- make pull requests automagically with hub
