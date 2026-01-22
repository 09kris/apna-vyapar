#!/bin/bash
# Quick Start Guide - Apna Vyapar Backend (MySQL + Sequelize)

echo "🚀 Apna Vyapar Backend - Quick Start Guide"
echo "==========================================="
echo ""

# Check if MySQL is running
echo "1️⃣  Checking MySQL status..."
mysql --version > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "⚠️  MySQL client not found. Make sure MySQL server is running!"
    echo "   Windows: Start MySQL from Services"
    echo "   Mac: brew services start mysql"
    echo "   Linux: sudo systemctl start mysql"
else
    echo "✅ MySQL client found"
fi

echo ""
echo "2️⃣  Checking Node.js & npm..."
node --version
npm --version

echo ""
echo "3️⃣  Dependencies status..."
if [ -d "node_modules" ]; then
    echo "✅ node_modules found"
else
    echo "📦 Installing dependencies..."
    npm install
fi

echo ""
echo "4️⃣  TypeScript compilation..."
if [ -d "dist" ]; then
    echo "✅ dist folder exists (latest build)"
else
    echo "🔨 Building TypeScript..."
    npm run build
fi

echo ""
echo "5️⃣  Environment configuration..."
if [ -f ".env" ]; then
    echo "✅ .env file found"
else
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Update .env with your MySQL credentials:"
    echo "   DB_HOST=localhost"
    echo "   DB_PORT=3306"
    echo "   DB_USER=root"
    echo "   DB_PASSWORD=your_password"
fi

echo ""
echo "6️⃣  MySQL Database..."
echo "   Database: apna_vyapar"
echo "   Tables: Will be auto-created on first run"
echo "   Default credentials: root / password"

echo ""
echo "✅ READY TO START!"
echo ""
echo "🎯 Next Step: Run the server"
echo "   npm run dev"
echo ""
echo "📚 Documentation:"
echo "   - MIGRATION_COMPLETE.md - Full migration details"
echo "   - MIGRATION_CHECKLIST.md - Completion checklist"
echo ""
echo "🌐 Server will run on: http://localhost:5000"
echo "📖 API endpoints: http://localhost:5000/api/*"
echo ""
