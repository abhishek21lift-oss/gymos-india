#!/bin/bash
# ============================================================
# GymOS India — Complete Setup Script
# Run: chmod +x scripts/setup.sh && ./scripts/setup.sh
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${RED}🏋️  GymOS India — Setup Script${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check prerequisites
check_cmd() {
  if ! command -v $1 &> /dev/null; then
    echo -e "${RED}❌ $1 not found. Please install it first.${NC}"
    exit 1
  fi
  echo -e "${GREEN}✅ $1 found${NC}"
}

echo -e "${BLUE}📋 Checking prerequisites...${NC}"
check_cmd node
check_cmd npm
check_cmd docker
check_cmd docker-compose
echo ""

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}❌ Node.js 18+ required. Found: $(node -v)${NC}"
  exit 1
fi

# Start Docker services
echo -e "${BLUE}🐳 Starting PostgreSQL and Redis...${NC}"
docker-compose up -d postgres redis
sleep 5
echo -e "${GREEN}✅ Database services started${NC}"
echo ""

# Backend setup
echo -e "${BLUE}⚙️  Setting up backend...${NC}"
cd backend

if [ ! -f .env ]; then
  cp .env.example .env
  echo -e "${YELLOW}⚠️  Created backend/.env — please update with your credentials${NC}"
fi

npm install --silent
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
echo -e "${GREEN}✅ Backend setup complete${NC}"
cd ..
echo ""

# Frontend setup
echo -e "${BLUE}🎨 Setting up frontend...${NC}"
cd frontend

if [ ! -f .env.local ]; then
  cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_here
EOF
  echo -e "${YELLOW}⚠️  Created frontend/.env.local${NC}"
fi

npm install --silent
echo -e "${GREEN}✅ Frontend setup complete${NC}"
cd ..
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "Start development:"
echo -e "  ${BLUE}Backend:${NC}  cd backend && npm run start:dev"
echo -e "  ${BLUE}Frontend:${NC} cd frontend && npm run dev"
echo ""
echo "Or use Docker:"
echo -e "  ${BLUE}docker-compose up${NC}"
echo ""
echo "Access:"
echo "  🌐 App:     http://localhost:3000"
echo "  🔧 API:     http://localhost:3001/api/docs"
echo "  🗄️  DB:      localhost:5432"
echo ""
echo "Demo Login:"
echo "  📱 Phone:   9876543210"
echo "  🔑 Password: Gym@1234"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
