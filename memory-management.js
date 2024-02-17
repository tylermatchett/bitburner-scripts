import { DELAY, disableLogs, getServerMemory, saveServerMemory, getAllControlledServers } from 'utils.js';

/** @param {NS} ns */
export async function main(ns) {

  const servers = getAllControlledServers(ns);

  disableLogs(ns, [
    'getServerMaxRam',
    'scan',
    'getServerRequiredHackingLevel',
    'sleep'
  ]);
  
  ns.clearLog();
  ns.tail();

  while(true) {
    let freedThreads = 0;
    let serversAffected = 0;
    servers.forEach(node => {
      let server = getServerMemory(ns, node.host);// JSON.parse(ns.read('memory/' + node.host + '-controller.txt'));
      if (server && server.processes.length > 0) {
        
        let removeable = [];
        // Check which need to be handled
        server.processes.forEach(process => {
          if (Date.now() > (process.start + process.runtime)) {
            removeable.push(process.id);
            server.activeThreads -= process.threads;
            freedThreads += process.threads;
          }
        })

        if (removeable.length > 0) {
          serversAffected++;
          // Remove any that need to be removed
          server.processes = server.processes.filter(e => !removeable.includes(e.id));
          server.activeThreads = Math.max(server.activeThreads, 0);

          saveServerMemory(ns, server)
        }
      }
    })
    if (freedThreads > 0) ns.print(new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    }) + '\n   ' + freedThreads + ' threads freed')

    await ns.sleep(DELAY);
  }
}