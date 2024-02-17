import { DELAY, getAllControlledServers, getServerMemory } from 'utils.js'

/** Used to monitor the memory usage of all servers.
 * We can evaluate if we are able to launch additional
 * attacks or if we need to wait for more memory.
 * @param {NS} ns */
export async function main(ns) {
  ns.disableLog('sleep');

  const servers = getAllControlledServers(ns);

  let maxThreads = 0;
  let minThreads = 1000000000000;
  let average = []

  while(true) {
    let threadsTotal = 0;
    let threadsUsed = 0;

    servers.forEach(node => {
      threadsTotal += node.threads;
      const memory = getServerMemory(ns, node.host);
      if (memory) threadsUsed += memory.activeThreads;
    })

    minThreads = Math.min(minThreads, threadsUsed);
    maxThreads = Math.max(maxThreads, threadsUsed);
    average.push(threadsUsed);

    if (average.length > 60) average.shift()

    ns.tail();
    ns.clearLog();
    ns.print("Usage Monitor:" +
      "\nServers: " + servers.length +
      "\nCapacity: " + Math.round((threadsUsed / threadsTotal) * 100) + "%" +
      "\nUsage: " + threadsUsed +
      "\nAverage: " + Math.round(average.reduce((a,v) => a + v, 0) / average.length) +
      "\nMin: " + minThreads + ' [' + Math.round((minThreads / threadsTotal) * 100) + '%]' +
      "\nMax: " + maxThreads + ' [' + Math.round((maxThreads / threadsTotal) * 100) + '%]');

    await ns.sleep(DELAY);
  }
}
