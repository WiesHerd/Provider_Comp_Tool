#!/bin/bash
# Firebase Setup Script
# Run this to set up Firebase for your project

echo "🔥 Firebase Setup Script"
echo "========================"
echo ""

# Check if firebase-tools is installed
if ! command -v firebase &> /dev/null; then
    echo "📦 Installing Firebase CLI..."
    npm install -g firebase-tools
else
    echo "✅ Firebase CLI is already installed"
fi

echo ""
echo "🔐 Step 1: Login to Firebase"
echo "This will open your browser to authenticate..."
firebase login

echo ""
echo "📋 Step 2: List your projects"
firebase projects:list

echo ""
echo "🎯 Step 3: Initialize Firebase"
echo "When prompted:"
echo "  - Select: Firestore and Authentication"
echo "  - Choose: Use existing project → CompLens"
echo "  - Accept defaults for rules/indexes files"
firebase init

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Get your config: firebase apps:sdkconfig WEB"
echo "2. Add config to .env.local"
echo "3. Enable Auth in Firebase Console"
echo "4. Create Firestore database in Console"












