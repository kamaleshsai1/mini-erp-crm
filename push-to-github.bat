@echo off
echo ========================================================
echo Pushing Mini ERP + CRM Portal to GitHub: kamaleshsai1
echo ========================================================
cd /d "C:\Users\shesh\.gemini\antigravity-ide\scratch\mini-erp-crm"
git branch -M main
git remote set-url origin https://github.com/kamaleshsai1/mini-erp-crm.git
git push -u origin main
echo ========================================================
echo Done! Check your repository at:
echo https://github.com/kamaleshsai1/mini-erp-crm
echo ========================================================
pause
