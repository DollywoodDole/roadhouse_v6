@echo off
cd /d "%~dp0"
venv\Scripts\python social_manager.py --live >> logs\social_manager.log 2>&1
