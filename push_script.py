import subprocess
import os

print("Starting python git push...")
try:
    # First, configure email/name just in case
    # subprocess.run(['git', 'config', 'user.email', 'bot@example.com'])
    # subprocess.run(['git', 'config', 'user.name', 'Antigravity Bot'])

    # Add
    subprocess.run(['git', 'add', '.'], check=True)
    
    # Commit
    subprocess.run(['git', 'commit', '-m', 'chore: force push via python'], capture_output=True)
    
    # Push
    print("Pushing...")
    # Timeout 30s
    p = subprocess.run(['git', 'push', 'origin', 'main'], capture_output=True, text=True, timeout=30)
    print("STDOUT:", p.stdout)
    print("STDERR:", p.stderr)
    print("Return Code:", p.returncode)

    # Write to file too
    with open('python_push_log.txt', 'w') as f:
        f.write(f"STDOUT: {p.stdout}\nSTDERR: {p.stderr}\nCode: {p.returncode}\n")
        
except subprocess.TimeoutExpired:
    print("TIMEOUT EXPIRED - Likely password prompt")
    with open('python_push_log.txt', 'w') as f:
        f.write("TIMEOUT")
except Exception as e:
    print(f"ERROR: {e}")
    with open('python_push_log.txt', 'w') as f:
        f.write(f"ERROR: {e}")
