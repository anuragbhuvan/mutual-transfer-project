#!/bin/bash
echo "Mutual Transfer Project - Google Cloud Backup"
cd "$(dirname "$0")"
node cloud-backup.js
echo "Backup completed at $(date)" 