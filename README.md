# Bitburner Scripts

## Overview

Here are my own scripts I am currently using in a game called Bitburner. If you are interested in the game, check it out here:

> *Bitburner is a programming-based incremental game. Write scripts in JavaScript to automate gameplay, learn skills, play minigames, solve puzzles, and more in this cyberpunk text-based incremental RPG.*

You can find the game on [Steam](https://store.steampowered.com/app/1812820/Bitburner/)

Or play it directly in your [Browser](https://bitburner-official.github.io/)

## Brief Description of the Scripts

- `analyse-text.js` - Just used for testing the analyze funtions before writing `hack-tier-two.js`.
- `crack.js` - Used to cycle through all accessable servers and crack them, there are no checks for available scripts (BruteSSH.exe, etc) so this just tries to run everything before nuking the server.
- `evaluate-network.js` - Used to monitor the network threads and used memory, should be started after everything else so your min/max readouts are an accurate representation. Also needs to be restarted on acquiring new servers/ram.
- `grow-target.js`,`hack-target.js`, & `weaken-target.js` - Are all the base scripts deployed across the many servers to orchestrate the attacks.
- `hack-tier-two.js` - This is the current control server script, this will grow and weaken a target server until it is ready, then launch an attack and continue the cycle.
- `karma.js` - Prints the players current karma into the terminal.
- `memory-management.js` - This monitors and releases all the memory on our server memory management once scripts are completed running. Needs to be restarted on acquiring new servers/ram.
- `purchase-servers.js` - Upgrades all the servers to their max ram with the money you have.
- `target.js` - Prints a list of potential target servers and gives a condensed information readout.
- `utils.js` - A script filled with helper functions.

*In the **old/** folder are older scripts used earlier on, just keeping them around for reference.*

### Attribution

I did take two functions from [alainbryden](https://github.com/alainbryden)'s helper.js, they are marked in my utils.js and you can check out his bitburner scripts here: https://github.com/alainbryden/bitburner-scripts

## ToDo List

We need a script for the following:

1. Stocks script

2. Add backdooring servers to the crack.js

3. A script to start up an attack on all servers currently
    not being attacked

4. Modify the current attack script to cycle batches and
    time them so we can land attacks right after another.
    This will likely require formulas, so we need a new script.

5. Add lock files to the memory management to prevent two
    services from accessing the same file simultaniously.

6. Add job queuing to the memory management to support the lockfile
    for memory management.
