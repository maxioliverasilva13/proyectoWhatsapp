const fs = require('fs');

export const instructions = fs.readFileSync('./instrucciones.txt', 'utf-8');
