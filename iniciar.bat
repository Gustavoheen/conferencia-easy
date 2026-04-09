@echo off
echo Iniciando SysJuros...

:: Inicia MySQL se nao estiver rodando
docker start sysjuros-mysql 2>nul
if errorlevel 1 (
    echo Subindo MySQL via Docker...
    docker compose up -d
    timeout /t 10 /nobreak
)

:: Inicia o servidor dev
echo Servidor em http://localhost:3000
pnpm dev
