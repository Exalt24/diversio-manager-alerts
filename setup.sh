#!/bin/bash
set -e

echo "🚀 Setting up Diversio Manager Alerts..."
echo ""

echo "📦 Setting up backend..."
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py load_seed_data
echo "✅ Backend ready"
cd ..

echo ""
echo "📦 Setting up frontend..."
cd frontend
npm install
echo "✅ Frontend ready"
cd ..

echo ""
echo "📦 Installing root dependencies..."
npm install
echo "✅ Root dependencies installed"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start (choose one):"
echo "  1. npm run dev        (one terminal, both servers)"
echo "  2. ./run.sh           (bash script)"
echo "  3. Manual (see README)"
