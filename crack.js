import { getAllServers } from 'utils.js'

/** Cycles through all the servers and cracks them if they haven't been cracked yet.
 * @param {NS} ns */
export async function main(ns) {
  let servers = getAllServers(ns);

  servers.forEach(server => {
    if (!server.access) {
      ns.brutessh(server.host);
      ns.relaysmtp(server.host);
      ns.sqlinject(server.host);
      ns.httpworm(server.host);
      ns.ftpcrack(server.host);
      ns.nuke(server.host);
    }
  })
}