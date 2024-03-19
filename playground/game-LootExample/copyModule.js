const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const copyFile = promisify(fs.copyFile);
const readdir = promisify(fs.readdir);
const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);

const copyDir = async (srcDir, destDir) => {
  try {
    await mkdir(destDir, { recursive: true });
    const files = await readdir(srcDir, { withFileTypes: true });
    for (const file of files) {
      const srcFilePath = path.join(srcDir, file.name);
      const destFilePath = path.join(destDir, file.name);
      if (file.isDirectory()) {
        await copyDir(srcFilePath, destFilePath);
      } else {
        await copyFile(srcFilePath, destFilePath);
      }
    }
  } catch (err) {
    console.error(`Error copying directory from ${srcDir} to ${destDir}: ${err}`);
  }
};

const main = async () => {
  // Copy "module/circuits" to "game/packages/circuits"
  await copyDir('../module/circuits', 'packages/circuits');

  // Copy everything from "module/client/*" to "game/packages/client/src/gribi/*"
  await copyDir('../module/client', 'packages/client/src/gribi');

  // Copy everything from "module/contracts/*" to "game/packages/contracts/src/gribi/*"
  await copyDir('../module/contracts', 'packages/contracts/src/gribi');
};

main().then(() => console.log('Copy completed.'));
