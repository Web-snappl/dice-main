
#!/bin/bash
echo "=== CURRENT BRANCH ===" > git_diag.log
git rev-parse --abbrev-ref HEAD >> git_diag.log
echo "=== HEAD SHA ===" >> git_diag.log
git rev-parse HEAD >> git_diag.log
echo "=== ORIGIN/MAIN SHA ===" >> git_diag.log
git rev-parse origin/main >> git_diag.log
echo "=== GIT STATUS ===" >> git_diag.log
git status >> git_diag.log
echo "=== REMOTE URL ===" >> git_diag.log
git remote -v >> git_diag.log
echo "=== RECENT LOG ===" >> git_diag.log
git log -n 3 --oneline >> git_diag.log
