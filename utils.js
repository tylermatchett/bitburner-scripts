export const Scripts = {
  Weaken: "weaken-target.js",
  Grow: "grow-target.js",
  Hack: "hack-target.js",
};
export const RAM_REQUIREMENT = 1.75;
export const DELAY = 1000; // ms
export const AVAILABLE_THREADS = 1873164
const currencySymbols = ["", "k", "m", "b", "t", "q", "Q", "s", "S", "o", "n", "e33", "e36", "e39"];

/** @param {NS} ns */
export const getAllServers = (ns) => {
  const hackerLevel = ns.getPlayer().skills.hacking;

  let destinationNodes = ["home"];
  let visited = [];
  let targetNodes = [];
  let target = null;
  let nodeLevel = -1;
  let ram = -1;

  while (destinationNodes.length > 0) {
    target = destinationNodes.pop();

    for (let node of ns.scan(target)) {
      if (!visited.includes(node)) {
        nodeLevel = Number(ns.getServerRequiredHackingLevel(node));
        if (hackerLevel > nodeLevel) {
          ram = ns.getServerMaxRam(node);
          if (ram > 0) {
            targetNodes.push({
              host: node,
              level: nodeLevel,
              threads: Math.floor(ram / RAM_REQUIREMENT),
              access: ns.hasRootAccess(node),
            });
          }
        }
        destinationNodes.push(node);
      }
    }

    visited.push(target);
  }

  targetNodes = targetNodes.sort((a, b) => b.level - a.level);
  return targetNodes;
};

/** @param {NS} ns */
export const getAllControlledServers = (ns) => {
  const hackerLevel = ns.getPlayer().skills.hacking;

  let destinationNodes = ["home"];
  let visited = [];
  let targetNodes = [];
  let target = null;
  let nodeLevel = -1;
  let ram = -1;

  while (destinationNodes.length > 0) {
    target = destinationNodes.pop();

    for (let node of ns.scan(target)) {
      if (!visited.includes(node)) {
        nodeLevel = Number(ns.getServerRequiredHackingLevel(node));
        if (hackerLevel > nodeLevel) {
          ram = ns.getServerMaxRam(node);
          if (ram > 0) {
            if (!ns.hasRootAccess(node))
              ns.print("> No access on server: [" + node + "]");
            targetNodes.push({
              host: node,
              level: nodeLevel,
              threads: Math.floor(ram / RAM_REQUIREMENT),
              access: ns.hasRootAccess(node),
            });
          }
        }
        destinationNodes.push(node);
      }
    }

    visited.push(target);
  }

  targetNodes = targetNodes.sort((a, b) => b.level - a.level);
  return targetNodes.filter((e) => e.access);
};

/** @param {NS} ns */
export const disableLogs = (ns, logsToDisable) => {
  logsToDisable.forEach((log) => ns.disableLog(log));
};

/** @param {time} time */
export const formatTime = (time) => {
  return (
    Math.floor(time / 60)
      .toString()
      .padStart(2, "0") +
    ":" +
    (time % 60).toString().padStart(2, "0")
  );
};

/** Return the available threads on the server
 * @param {NS} ns 
 * @param {Server Name} serverName
*/
export const getServerMemory = (ns, serverName) => {
  if (ns.fileExists('memory/' + serverName + '-controller.txt')) {
    return JSON.parse(ns.read('memory/' + serverName + '-controller.txt'));
  } else {
    const ram = ns.getServerMaxRam(serverName);
    return {
      host: serverName,
      ram: ram,
      totalThreads: Math.floor(ram / RAM_REQUIREMENT),
      activeThreads: 0,
      processes: []
    }
  }
}

/** Saves the current script threads to the server file
 * @param {NS} ns 
 * @param {Server Name} serverName
*/
export const saveServerMemory = (ns, serverData) => {
  ns.write('memory/' + serverData.host + '-controller.txt', JSON.stringify(serverData), "w");
}

export const generateID = () => {
   return Date.now().toString(36) + Math.random().toString(36).substring(2);
}


 /* 
  * CREDIT:
  * These following functions are from another repo
  * User: alainbryden
  * Link: https://github.com/alainbryden/bitburner-scripts/tree/main
  */
/**
 * Return a formatted representation of the monetary amount using scale symbols (e.g. $6.50M)
 * @param {number} number - The number to format
 * @param {number=} maxSignificantDigits - (default: 6) The maximum significant figures you wish to see (e.g. 123, 12.3 and 1.23 all have 3 significant figures)
 * @param {number=} maxDecimal - (default: 3) The maximum decimal places you wish to see, regardless of significant figures. (e.g. 12.3, 1.2, 0.1 all have 1 decimal)
 **/
export const formatMoney = (number, maxSignificantDigits = 6, maxDecimal = 5) => {
    let shortNumber = formatShortNumber(number, maxSignificantDigits, maxDecimal);
    return number >= 0 ? "$" + shortNumber : shortNumber.replace("-", "-$");
}

/**
 * Return a formatted representation of the monetary amount using scale sympols (e.g. 6.50M) 
 * @param {number} number - The number to format
 * @param {number=} maxSignificantDigits - (default: 6) The maximum significant figures you wish to see (e.g. 123, 12.3 and 1.23 all have 3 significant figures)
 * @param {number=} maxDecimal - (default: 3) The maximum decimal places you wish to see, regardless of significant figures. (e.g. 12.3, 1.2, 0.1 all have 1 decimal)
 **/
export function formatShortNumber(number, maxSignificantDigits = 6, maxDecimal = 5) {
    if (Math.abs(number) > 10 ** (3 * currencySymbols.length))
        return number.toExponential(Math.min(maxDecimal, maxSignificantDigits - 1));
    
    for (var i = 0, sign = Math.sign(number), number = Math.abs(number); number >= 1000 && i < currencySymbols.length; i++) number /= 1000;
    
    return ((sign < 0) ? "-" : "") + number.toFixed(Math.max(0, Math.min(maxDecimal, maxSignificantDigits - Math.floor(1 + Math.log10(number))))) + currencySymbols[i];
}
