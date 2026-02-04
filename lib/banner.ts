/**
 * ASCII art banner for aiknowsys CLI
 * Displayed at start of init command for professional first impression
 */

// Logger interface (matches createLogger return type)
interface Logger {
  log(...args: unknown[]): void;
  dim(message: string): void;
  blank(): void;
}

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
 * @param log - Logger instance from createLogger()
 * @param version - Package version (from package.json)
 */
export function displayBanner(log: Logger, version: string): void {
  log.log('\x1b[32m' + banner + '\x1b[0m'); // Green
  log.dim(`                           AI-Powered Development Workflow v${version}`);
  log.blank();
}
