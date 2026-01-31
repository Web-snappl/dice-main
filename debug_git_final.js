const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const logFile = path.resolve(__dirname, 'git_debug_final.log');

function run(cmd) {
    return new Promise((resolve) => {
        exec(cmd, { cwd: __dirname }, (error, stdout, stderr) => {
            const out = `CMD: ${cmd}\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}\nERR: ${error ? error.message : 'null'}\n----------------\n`;
            fs.appendFileSync(logFile, out);
            resolve();
        });
    });
}

async function main() {
    try {
        fs.writeFileSync(logFile, 'START DIAGNOSTIC\n');
        await run('git status');
        await run('git remote -v');
        await run('git branch -vv');
        await run('git log -1');
        await run('ls -la apps/api/src/modules/auth/auth.service.ts');
    } catch (e) {
        fs.appendFileSync(logFile, 'SCRIPT ERROR: ' + e.message);
    }
}

main();
