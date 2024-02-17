/** 
 * @param {NS} ns 
 * @param {Target} Server hostname of the target
*/
export async function main(ns) {
  await ns.weaken(ns.args[0]);
}