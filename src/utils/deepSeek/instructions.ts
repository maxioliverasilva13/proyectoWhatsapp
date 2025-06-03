import * as fs from 'fs';
import * as path from 'path';

export const instructions = fs.readFileSync(
  path.join(__dirname, 'instrucciones.txt'),
  'utf-8'
);