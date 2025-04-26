import fs from 'fs';
import { writeFile } from 'node:fs/promises';

const data = fs.readFileSync(process.argv[2], 'utf-8');
const posts = JSON.parse(data).reverse();

const outputFile = `${new Date().getTime()}_reversed.json`;
writeFile(`dump/${outputFile}`, JSON.stringify(posts, null, 2));
