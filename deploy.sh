#!/bin/bash

# Script de Deploy Automático - Primeiro Olhar 🧩
# Alvo: Oracle Cloud Always Free (Ubuntu/Debian)

echo "🚀 Iniciando setup do servidor..."

# 1. Atualizar Sistema
sudo apt-get update && sudo apt-get upgrade -y

# 2. Instalar Docker se não existir
if ! [ -x "$(command -v docker)" ]; then
    echo "🐳 Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
fi

# 3. Instalar Docker Compose se não existir
if ! [ -x "$(command -v docker-compose)" ]; then
    echo "📦 Instalando Docker Compose..."
    sudo apt-get install -y docker-compose
fi

# 4. Instalar Nginx
echo "🌐 Instalando Nginx..."
sudo apt-get install -y nginx

# 5. Configurar Firewall (Oracle Cloud exige abertura no OS também)
echo "🛡️ Configurando Firewall..."
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw --force enable

# 6. Preparar diretórios
mkdir -p ~/app
cd ~/app

# 7. Atualizar e Subir (Se já houver repositório)
if [ -d ".git" ]; then
    echo "🔄 Atualizando código do repositório..."
    git pull origin main
    echo "🐳 Reiniciando containers com as novas configurações..."
    sudo docker-compose -f docker-compose.prod.yml up -d --build
fi

echo "✅ Ambiente preparado!"
echo "⚠️  Se for a primeira vez, clone seu repositório neste diretório e rode:"
echo "   sudo docker-compose -f docker-compose.prod.yml up -d --build"
