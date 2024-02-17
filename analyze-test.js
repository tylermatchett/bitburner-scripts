import { disableLogs, AVAILABLE_THREADS } from 'utils.js'
/** @param {NS} ns */
export async function main(ns) {
  if (!ns.args[0]) {
    ns.tprint('No target specified.')
    return;
  }
  const target = ns.args[0];

  disableLogs([
    'disableLog',
    'getServerMaxMoney',
    'getServerMoneyAvailable',
    'getServerMinSecurityLevel',
    'getServerSecurityLevel'
  ])

  ns.clearLog();
  ns.tail();

  const targetMoney = ns.getServerMaxMoney(target);
  const availableMoney = ns.getServerMoneyAvailable(target);

  ns.print('\nHack Analysis');
  const hackThreads = Math.ceil(ns.hackAnalyzeThreads(target, availableMoney));
  const hackSecurity = ns.hackAnalyzeSecurity(hackThreads, target);
  ns.print('Available Money: ' + (availableMoney/1000000).toFixed(2) + 'M');
  ns.print('Threads: ' + hackThreads);
  ns.print('Security Increase: ' + hackSecurity.toFixed(2));

  const growthThreads = Math.ceil(ns.growthAnalyze(target, availableMoney > 0 ? targetMoney / availableMoney : targetMoney));
  ns.print('\nGrowth Analysis');
  ns.print('Threads: ' + growthThreads);
  const addedSecurity = ns.growthAnalyzeSecurity(growthThreads, target);
  ns.print('Security Increase: ' + addedSecurity.toFixed(2));

  const currentSecurity = ns.getServerSecurityLevel(target);
  const minSecurity = ns.getServerMinSecurityLevel(target);
  const weakenThreads = Math.ceil((currentSecurity + addedSecurity - minSecurity) / ns.weakenAnalyze(1));
  ns.print('\nWeaken Analysis');
  ns.print('Analyze: ' + ns.weakenAnalyze(1))
  ns.print('Threads: ' + weakenThreads);
  ns.print('Reduction: ' + (currentSecurity + addedSecurity - minSecurity).toFixed(2));

  // We have all we need, now figure out the ratio
  const totalNeeded = weakenThreads + growthThreads;
  let totalWeakenThreads = Math.ceil((weakenThreads / totalNeeded) * AVAILABLE_THREADS);
  let totalGrowThreads = AVAILABLE_THREADS - totalWeakenThreads;

  const targetWeaken = (totalWeakenThreads > weakenThreads ? weakenThreads : totalWeakenThreads)
  const targetGrow = (totalGrowThreads > growthThreads ? growthThreads : totalGrowThreads)
  const totalGrowAndWeaken = targetGrow + targetWeaken
  const targetHack = ((AVAILABLE_THREADS - totalGrowAndWeaken > 0) ? (
    (AVAILABLE_THREADS - totalGrowAndWeaken > hackThreads) ?
      hackThreads : AVAILABLE_THREADS - totalGrowAndWeaken
    ) : 0)

  let executionDetails = [
    {
      type: 'grow',
      threads: targetGrow,
      time: (targetGrow > 0) ? Math.ceil(ns.getGrowTime(target) / 1000) : 0,
      launch: 0,
    },
    {
      type: 'weaken',
      threads: targetWeaken,
      time: (targetWeaken > 0) ? Math.ceil(ns.getWeakenTime(target) / 1000) : 0,
      launch: 0,
    },
    {
      type: 'hack',
      threads: targetHack,
      time: (targetHack > 0) ? Math.ceil(ns.getWeakenTime(target) / 1000) : 0,
      launch: 0,
    }
  ]

  executionDetails.sort((a,b) => { return b.time - a.time})
    ns.print('\nThreads Target');
    let longestTime = executionDetails[0].time;
    executionDetails.forEach(script => {
    script.launch = longestTime - script.time;
    if (script.threads > 0)
      ns.print(script.type.padEnd(8) + script.threads.toString().padEnd(9) + (script.time + 's').padEnd(6) + script.launch);
  })
  
  ns.print('\n');
}
