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
echo "🎉 Setup complete!"
echo ""
echo "To start:"
echo "  Bash/Mac/Linux: ./run.sh"
echo "  Or manually: npm run dev:backend (terminal 1) + npm run dev:frontend (terminal 2)"
