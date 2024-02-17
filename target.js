/** Evaluates the value of each server and prints out a list of details
 * for each server the player can hack.
 * @param {NS} ns */
export async function main(ns) {
  const hackerLevel = ns.getPlayer().skills.hacking;

  let destinationNodes = ["home"];
  let visited = [];
  let targetNodes = [];
  let target = null;

  while (destinationNodes.length > 0) {
    target = destinationNodes.pop();

    for (let node of ns.scan(target)) {
      if (!visited.includes(node)) {
        const ram = ns.getServerMaxRam(node);
        const nodeLevel = Number(ns.getServerRequiredHackingLevel(node));
        if (hackerLevel > nodeLevel && ram > 0) {
          const maxMoney = ns.getServerMaxMoney(node);
          const availableMoney = ns.getServerMoneyAvailable(node);
          if (!ns.hasRootAccess(node)) ns.tprint('No access on server: [' + node + ']');
          else if (maxMoney > 0)
            targetNodes.push({
              host: node,
              level: nodeLevel,
              threads: Math.floor(ram / 1.75),
              access: ns.hasRootAccess(node),
              maxMoney,
              availableMoney: Math.floor(availableMoney),
              security: ns.getServerSecurityLevel(node),
              minSecurity: ns.getServerMinSecurityLevel(node)
            });
        }
        destinationNodes.push(node);
      }
    }

    visited.push(target);
  }

  targetNodes.sort((a, b) => b.level - a.level);

  let debugText = '\n\n--- Value Table ---';
  debugText += ('\nServer').padEnd(21);
  debugText += ('Lvl').padEnd(5);
  debugText += ('Threads').padEnd(9);
  debugText += ('Sec').padEnd(9);
  debugText += ('MinSec').padEnd(9);
  debugText += ('Max Money').padEnd(16);
  debugText += ('Available Money').padEnd(16);
  debugText += ('Percent').padEnd(9);
  debugText += ('');
  targetNodes.forEach(node => {
    debugText += '\n' + node.host.padEnd(20);
    debugText += node.level.toString().padEnd(5);
    debugText += node.threads.toString().padEnd(9);
    debugText += node.security.toFixed(1).toString().padEnd(9);
    debugText += node.minSecurity.toString().padEnd(9);
    debugText += node.maxMoney.toString().padEnd(16);
    debugText += node.availableMoney.toString().padEnd(16);
    debugText += (Math.floor((node.availableMoney / node.maxMoney) * 100) + '%').toString().padEnd(9);
    debugText += (!node.access) ? '[No Root]' : ''
  })

  /*
  const newMoney = (oldMoney + threads) * Math.min(1 + (0.03 /currentSecurity) , 1.0035) **
  (threads * (serverGrowth / 100) * player.mults.hacking_grow * coreBonus * 1)
 
  coreBonus: 6.25% (1.0625) per core
  */
  // targetValue: Math.round(maxMoney * Math.min(1 + (0.03 / minSecurityLevel), 1.0035)
  // ** ((growth / 100) * ns.getPlayer().mults.hacking_grow))


  /*targetNodes = targetNodes.sort((a,b) => b.level - a.level);
  target = targetNodes.filter(e => e.access)[0].host;*/

  ns.tprint(debugText + '\n');
}