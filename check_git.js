const { exec } = require('child_process');
const fs = require('fs');

exec('git status && git branch -vv && git remote -v', (error, stdout, stderr) => {
    const output = `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}\n\nERROR:\n${error}`;
    fs.writeFileSync('git_status.log', output);
});
