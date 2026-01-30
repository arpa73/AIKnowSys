/**
 * ASCII art banner for aiknowsys CLI
 * Displayed at start of init command for professional first impression
 */

export const banner = `
   ___   ______ _   __                 _____            
  / _ \\ |_   _|| | / /                /  ___|           
 / /_\\ \\  | |  | |/ / _ __   _____  _\\ \`--.  _   _ ___ 
 |  _  |  | |  |    \\| '_ \\ / _ \\ \\/ /\`--. \\| | | / __|
 | | | | _| |_ | |\\  \\ | | | (_) >  < /\\__/ /| |_| \\__ \\
 \\_| |_/ \\___/ \\_| \\_/_| |_|\\___/_/\\_\\\\____/  \\__, |___/
                                                __/ |    
                                               |___/     
`;

/**
 * Display ASCII banner with version
 * @param {Object} log - Logger instance from createLogger()
 * @param {string} version - Package version (from package.json)
 */
export function displayBanner(log, version) {
  log.log('\x1b[36m' + banner + '\x1b[0m'); // Cyan
  log.dim(`                           AI-Powered Development Workflow v${version}`);
  log.blank();
}
