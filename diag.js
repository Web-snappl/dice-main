const fs = require('fs');
const { execSync } = require('child_process');

try {
    const status = execSync('git status').toString();
    fs.writeFileSync('/Users/mikolajszczyrba/Desktop/websnap/dice-main/diag_status.txt', status);
} catch (e) {
    fs.writeFileSync('/Users/mikolajszczyrba/Desktop/websnap/dice-main/diag_error.txt', e.message);
}
