// ---------------------
// This is the first hacking control script
// made it is no longer used and is kept for
// reference purposes.
// ---------------------

/** @param {NS} ns */
export async function main(ns) {
  const hackerLevel = ns.getPlayer().skills.hacking;
  const RAM_REQUIREMENT = 1.75;

  let destinationNodes = ["home"];
  let visited = [];
  let targetNodes = [];
  let target = null;
  let nodeLevel = -1;
  let ram = -1;

  ns.tail();

  ns.disableLog('disableLog');
  ns.disableLog('sleep');
  ns.disableLog('getServerSecurityLevel');
  ns.disableLog('getServerMoneyAvailable');
  ns.disableLog('exec');
  ns.disableLog('scp');
  ns.disableLog('scan');
  ns.disableLog('getServerRequiredHackingLevel');
  ns.disableLog('getServerMaxRam');
  ns.disableLog('getServerMaxMoney');
  ns.disableLog('getServerMinSecurityLevel');

  while (destinationNodes.length > 0) {
    target = destinationNodes.pop();

    for (let node of ns.scan(target)) {
      if (!visited.includes(node)) {
        nodeLevel = Number(ns.getServerRequiredHackingLevel(node));
        if (hackerLevel > nodeLevel) {
          ram = ns.getServerMaxRam(node);
          if (ram > 0) {
            if (!ns.hasRootAccess(node)) ns.print(' --- No access on server: [' + node + ']');
            targetNodes.push({
              host: node,
              level: nodeLevel,
              threads: Math.floor(ram / RAM_REQUIREMENT),
              access: ns.hasRootAccess(node)
            });
          }
        }
        destinationNodes.push(node);
      }
    }

    visited.push(target);
  }

  targetNodes = targetNodes.sort((a, b) => b.level - a.level);
  if (ns.args[0]) target = ns.args[0]
  else target = targetNodes.filter(e => e.access)[0].host;

  ns.tprint('Starting Control Server | Targeting: ' + target)

  ns.tprint('Transfering weaken-target.js, grow-target.js, hack-target.js to all controlled servers.');
  targetNodes.forEach(server => {
    if (server.access && server.host !== 'home') {
      ns.scp('weaken-target.js', server.host);
      ns.scp('grow-target.js', server.host);
      ns.scp('hack-target.js', server.host);
    } else ns.print('> Error: No Access to [' + server.host + ']');
  });

  let thresholds = {
    money: ns.getServerMaxMoney(target),
    security: ns.getServerMinSecurityLevel(target)
  };

  // Maybe track the time it takes for each action and delay the sleep based on that

  let activeScripts;
  let elapsedTime = 0;
  let runningScript = '';
  let timeRequired = 0;
  let threads = targetNodes.reduce((acc, v) => acc + v.threads, 0)
  while (true) {
    const targetSecurity = ns.getServerSecurityLevel(target);
    const targetMoney = ns.getServerMoneyAvailable(target);
    for (let node of targetNodes) {
      activeScripts = ns.ps(node.host);
      // Get the names of all the scripts
      let scriptList = '';
      activeScripts.forEach(script => scriptList += script.filename + ' [' + script.threads + '], ');

      if (activeScripts.length <= 0) {
        elapsedTime = 0;
        if (targetSecurity > thresholds.security + 5) {
          runningScript = 'weaken-target.js';
          timeRequired = ns.getWeakenTime(target);
          ns.exec("weaken-target.js", node.host, node.threads, target);
        } else if (targetMoney < thresholds.money * 0.9) {
          runningScript = 'grow-target.js';
          timeRequired = ns.getGrowTime(target);
          ns.exec("grow-target.js", node.host, node.threads, target);
        } else {
          runningScript = 'hack-target.js';
          timeRequired = ns.getHackTime(target);
          ns.exec("hack-target.js", node.host, node.threads, target);
        }
      }
    };

    ns.clearLog();

    ns.print('Target: ' + target);
    ns.print('Running Script: ' + runningScript + ' [' + threads + ']');
    ns.print('\nTarget Money: ' + (targetMoney / 1000000).toFixed(2) + 'M / ' + (thresholds.money / 1000000).toFixed(2) + 'M');
    ns.print('Security: ' + targetSecurity.toFixed(1) + ' / ' + thresholds.security);
    ns.print('Required Time: ' + formatTime(Math.ceil(timeRequired / 1000)));

    const progress = timeRequired > 0 ? Math.floor((elapsedTime / Math.ceil(timeRequired / 1000)) * 100) : 0;
    let progressBar = '';
    for (let i = 0; i < 25; i++) {
      if (i < (progress / 4)) progressBar += '-'
      else progressBar += ' '
    }

    ns.print('\n' + formatTime(elapsedTime) + ' | ' + progress + '%' + ' [' + progressBar + ']')

    elapsedTime++;

    await ns.sleep(1000);
  }
}

const formatTime = (time) => {
  return Math.floor(time / 60).toString().padStart(2, '0') + ':' + (time % 60).toString().padStart(2, '0')
}