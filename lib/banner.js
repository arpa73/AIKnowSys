/**
 * ASCII art banner for aiknowsys CLI
 * Displayed at start of init command for professional first impression
 */

export const banner = `
   █████████   █████ █████   ████                                      █████████                    
  ███░░░░░███ ░░███ ░░███   ███░                                      ███░░░░░███                   
 ░███    ░███  ░███  ░███  ███    ████████    ██████  █████ ███ █████░███    ░░░  █████ ████  █████ 
 ░███████████  ░███  ░███████    ░░███░░███  ███░░███░░███ ░███░░███ ░░█████████ ░░███ ░███  ███░░  
 ░███░░░░░███  ░███  ░███░░███    ░███ ░███ ░███ ░███ ░███ ░███ ░███  ░░░░░░░░███ ░███ ░███ ░░█████ 
 ░███    ░███  ░███  ░███ ░░███   ░███ ░███ ░███ ░███ ░░███████████   ███    ░███ ░███ ░███  ░░░░███
 █████   █████ █████ █████ ░░████ ████ █████░░██████   ░░████░████   ░░█████████  ░░███████  ██████ 
░░░░░   ░░░░░ ░░░░░ ░░░░░   ░░░░ ░░░░ ░░░░░  ░░░░░░     ░░░░ ░░░░     ░░░░░░░░░    ░░░░░███ ░░░░░░  
                                                                                   ███ ░███         
                                                                                  ░░██████          
                                                                                   ░░░░░░           
`;

/**
 * Display ASCII banner with version
 * @param {Object} log - Logger instance from createLogger()
 * @param {string} version - Package version (from package.json)
 */
export function displayBanner(log, version) {
  log.log('\x1b[32m' + banner + '\x1b[0m'); // Green
  log.dim(`                           AI-Powered Development Workflow v${version}`);
  log.blank();
}
