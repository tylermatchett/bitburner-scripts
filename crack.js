import { getAllServers } from 'utils.js'

/** Cycles through all the servers and cracks them if they haven't been cracked yet.
 * @param {NS} ns */
export async function main(ns) {
  let servers = getAllServers(ns);
  let availablePrograms = 0;
  
  servers.forEach(server => {
    availablePrograms = 0;
    if (!server.access) {
      if (ns.fileExists('BruteSSH.exe')) {
        ns.brutessh(server.host);
        availablePrograms++;
      }
      if (ns.fileExists('FTPCrack.exe')) {
        ns.ftpcrack(server.host);
        availablePrograms++;
      }
      if (ns.fileExists('relaySMTP.exe')) {
        ns.relaysmtp(server.host);
        availablePrograms++;
      }
      if (ns.fileExists('SQLInject.exe')) {
        ns.sqlinject(server.host);
        availablePrograms++;
      }
      if (ns.fileExists('HTTPWorm.exe')) {
        ns.httpworm(server.host);
        availablePrograms++;
      }

      if (ns.getServerNumPortsRequired(server.host) <= availablePrograms)
        ns.nuke(server.host);
    }
  })
}