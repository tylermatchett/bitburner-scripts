// ---------------------
// This is the current attack script that is used
// There are still many improvements that can be made
// to this script, but it is functional for now.
// ---------------------

import { Scripts, DELAY, formatMoney,
  getAllControlledServers, disableLogs, generateID,
  formatTime, getServerMemory, saveServerMemory } from 'utils.js';

/** @param {NS} ns */
export async function main(ns) {
  if (!ns.args[0]) {
    ns.tprint("Need to provide a target.");
    return;
  }

  disableLogs(ns, [
    "disableLog",
    "sleep",
    "getServerSecurityLevel",
    "getServerMoneyAvailable",
    "exec",
    "scp",
    "scan",
    "getServerRequiredHackingLevel",
    "getServerMaxRam",
    "getServerMaxMoney",
    "getServerMinSecurityLevel",
  ]);

  ns.clearLog();
  ns.tprint("--- Starting Control Server ---");

  const servers = getAllControlledServers(ns);
  const TOTAL_THREADS = servers.reduce((a, v) => a + v.threads, 0);
  ns.tprint(
    " Controlled Servers: " +
      servers.length +
      " [" +
      TOTAL_THREADS +
      " Threads]"
  );

  const target = ns.args[0];
  ns.tprint(" Targeting: " + target);

  transferScripts(ns, servers, [Scripts.Weaken, Scripts.Grow, Scripts.Hack]);

  // Prep Target
  ns.tail();
  while (true) {
    // Temporary, needs to be replaced with an intelligent attack
    await prepTarget(ns, servers, target, TOTAL_THREADS);
    await attackTarget(ns, servers, target, TOTAL_THREADS);

    await ns.sleep(DELAY);
  }

  ns.tprint("------");
}

const attackTarget = async (ns, servers, target, TOTAL_THREADS) => {
  ns.clearLog();
  ns.print("Target: " + target);
  ns.print("Status: Attacking Server");

  const availableMoney = ns.getServerMoneyAvailable(target);
  let hackThreads = Math.ceil(ns.hackAnalyzeThreads(target, availableMoney));
  const totalThreads = hackThreads;
  const runtime = ns.getHackTime(target);

  let elapsedTime = 0;
  let progress = 0;

  // Hack Target
  servers.forEach((node) => {
    let serverData = getServerMemory(ns, node.host)
    if (hackThreads > 0 && (serverData.totalThreads - serverData.activeThreads) > 0) {
      
      let threads = Math.min(node.threads, serverData.totalThreads - serverData.activeThreads);
      
      if (hackThreads < threads) threads = hackThreads;
      
      ns.exec(Scripts.Hack, node.host, threads, target);
      
      serverData.activeThreads += threads;
      serverData.processes.push({
        id: generateID(),
        start: Date.now(),
        runtime: runtime,
        threads: threads
      })
      saveServerMemory(ns, serverData);
      hackThreads -= threads;
    }
  });

  while (elapsedTime <= runtime) {
    progress = elapsedTime / runtime;
    ns.clearLog();
    ns.print("Target: " + target);
    ns.print("Status: Attacking Server");
    ns.print("Threads: " + totalThreads);
    ns.print("Money: " + formatMoney(availableMoney, 6, 2));
    ns.print("Runtime: " + formatTime(Math.ceil(runtime / 1000)));
    let progressBar = "";
    for (let i = 0; i < 20; i++) {
      if (i < progress * 20) progressBar += "|";
      else progressBar += "-";
    }
    ns.print(
      "\n" +
        formatTime(elapsedTime / 1000) +
        " | " +
        Math.floor(progress * 100) +
        "% [" +
        progressBar +
        "]"
    );

    elapsedTime += DELAY;
    await ns.sleep(DELAY);
  }

  return;
};

const prepTarget = async (ns, servers, target, TOTAL_THREADS) => {
  // We want to maximize money and minimize the security
  let currentSecurity = ns.getServerSecurityLevel(target);
  let availableMoney = ns.getServerMoneyAvailable(target);
  const minSecurity = ns.getServerMinSecurityLevel(target);
  const maxMoney = ns.getServerMaxMoney(target);

  let activeScripts = [];

  while (currentSecurity > minSecurity + 5 || availableMoney < maxMoney * 0.9) {
    let growthThreads =
      Math.ceil(
        ns.growthAnalyze(
          target,
          availableMoney > 0 ? maxMoney / availableMoney : maxMoney
        )
      ) * 2;
    growthThreads = growthThreads > 0 ? Math.max(growthThreads, 500) : 0;
    const addedSecurityFromGrow = ns.growthAnalyzeSecurity(
      growthThreads,
      target
    );

    let weakenThreads =
      Math.ceil(
        (currentSecurity + addedSecurityFromGrow - minSecurity) /
          ns.weakenAnalyze(1)
      ) * 2;
    weakenThreads = weakenThreads > 0 ? Math.max(weakenThreads, 1000) : 0;

    // figure out the total threads then launch attack
    // Grow then Weaken so the grow security adds in first
    const totalNeeded = weakenThreads + growthThreads;
    let totalWeakenThreads = Math.ceil(
      (weakenThreads / totalNeeded) * TOTAL_THREADS
    );
    let totalGrowThreads = TOTAL_THREADS - totalWeakenThreads;

    const targetWeaken = Math.min(totalWeakenThreads, weakenThreads);
    const targetGrow = Math.min(totalGrowThreads, growthThreads);

    if (targetWeaken > 0)
      activeScripts.push({
        name: Scripts.Weaken,
        threads: targetWeaken,
        time: ns.getWeakenTime(target),
      });

    if (targetGrow > 0)
      activeScripts.push({
        name: Scripts.Grow,
        threads: targetGrow,
        time: ns.getGrowTime(target),
      });

    activeScripts.sort((a, b) => {
      return b.time - a.time;
    });

    if (activeScripts.length > 0) {
      await runPrepAttack(ns, servers, target, activeScripts);
      activeScripts = [];
    }

    await ns.sleep(DELAY);

    availableMoney = ns.getServerMoneyAvailable(target);
    currentSecurity = ns.getServerSecurityLevel(target);
  }

  return;
};

const runPrepAttack = async (ns, servers, target, scripts) => {
  const minSecurity = ns.getServerMinSecurityLevel(target);
  const maxMoney = ns.getServerMaxMoney(target);

  let currentSecurity = ns.getServerSecurityLevel(target);
  let availableMoney = ns.getServerMoneyAvailable(target);

  const totalTime = scripts[0].time;
  let elapsedTime = 0;

  let serverUsage = [];
  let memoryUsage = [];
  servers.forEach((node) => {
    serverUsage.push({
      host: node.host.toString(),
      threads: node.threads
    });
    memoryUsage.push({
      host: node.host.toString(),
      usage: 0
    })
  })

  // Read from file to pull the usage
  let readData = ns.read('server-memory-controller.txt');
  if (readData)
    serverUsage = JSON.parse(readData);

  // Grow is 3.2x hackTime and Weaken is 4x, so weaken always takes longer
  scripts.forEach((script) => {
    let remainingThreads = script.threads;
    // TODO: Adjust for when we do not have enough threads? get a split between the total threads
    // maybe also check for available slots or active scripts
    servers.forEach((node) => {
      let serverData = getServerMemory(ns, node.host)
      if (remainingThreads > 0 && (serverData.totalThreads - serverData.activeThreads) > 0) {
        // get the max threads we can run
        let threads = Math.min(serverUsage.find(e => e.host === node.host.toString()).threads, node.threads);
        if (remainingThreads < node.threads) threads = remainingThreads;

        // See what is already running
        ns.exec(script.name, node.host, threads, target);
        
        serverData.activeThreads += threads;
        serverData.processes.push({
          id: generateID(),
          start: Date.now(),
          runtime: script.time,
          threads: threads
        })
        saveServerMemory(ns, serverData);
        remainingThreads -= threads;
      }
    });
  });

  while (elapsedTime <= totalTime) {
    elapsedTime += DELAY;
    const progress = elapsedTime / totalTime;
    let progressBar = "";
    for (let i = 0; i < 20; i++) {
      if (i < progress * 20) progressBar += "|";
      else progressBar += "-";
    }

    currentSecurity = ns.getServerSecurityLevel(target);
    availableMoney = ns.getServerMoneyAvailable(target);

    ns.clearLog();
    ns.print("Target: " + target);
    ns.print("Status: Preparing Server");
    ns.print("Money: " + formatMoney(availableMoney, 6, 2) + " / " + formatMoney(maxMoney, 6, 2));
    ns.print("Security: " + currentSecurity.toFixed(1) + " / " + minSecurity.toFixed(1));
    ns.print("Runtime: " + formatTime(Math.ceil(totalTime / 1000)));
    ns.print("\n" + "Script".padEnd(20) + "Threads".padEnd(10) + "Runtime");
    scripts.forEach((script) => {
      ns.print(
        script.name.padEnd(20) +
          script.threads.toString().padEnd(10) +
          formatTime(Math.ceil(script.time / 1000))
      );
    });
    ns.print(
      "\n" +
        formatTime(elapsedTime / 1000) +
        " | " +
        Math.ceil(progress * 100) +
        "% [" +
        progressBar +
        "]"
    );

    await ns.sleep(DELAY);
  }

  return;
};

const transferScripts = (ns, servers) => {
  ns.tprint(
    " Transfering weaken-target.js, grow-target.js, hack-target.js to " +
      servers.length +
      " servers."
  );

  servers.forEach((server) => {
    Object.values(Scripts).forEach((script) => {
      ns.scp(script, server.host);
    });
  });
};






