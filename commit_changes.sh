
#!/bin/bash
echo "Adding files..." > git_debug.log
git add apps/api/src/admin/services/users.service.ts apps/web-admin/src/pages/UsersPage.tsx apps/web-admin/src/index.css apps/web-client/src/index.css >> git_debug.log 2>&1

echo "Status after add:" >> git_debug.log
git status >> git_debug.log 2>&1

echo "Committing..." >> git_debug.log
git commit -m "fix(admin): resolve balance display issue and update background color" >> git_debug.log 2>&1

echo "Pushing..." >> git_debug.log
git push origin main >> git_debug.log 2>&1

echo "Done." >> git_debug.log
