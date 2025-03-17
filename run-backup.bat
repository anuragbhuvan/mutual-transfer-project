@echo off
echo Mutual Transfer Project - Google Cloud Backup
cd %~dp0
node cloud-backup.js
echo Backup completed at %date% %time% 