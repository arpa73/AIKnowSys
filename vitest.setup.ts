import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Set PROJECT_ROOT for all tests so getPackageDir() returns correct path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
process.env.PROJECT_ROOT = resolve(__dirname);
