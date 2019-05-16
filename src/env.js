import dotenv from 'dotenv';
import fs from 'fs';

const exists = fs.existsSync(`${__dirname}/../.env`);
if (exists) {
  dotenv.config({
    path: `${__dirname}/../.env`,
  });
}
