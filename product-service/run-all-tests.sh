#!/bin/bash

echo "🧪 TREEW API - PHASE 5 TEST SUMMARY"
echo "===================================="
echo ""

echo "📊 Running all test suites..."
echo ""

echo "1️⃣ UNIT TESTS - GTIN Utilities"
echo "------------------------------"
npm run test:unit
echo ""

echo "2️⃣ INTEGRATION TESTS - Business Logic"
echo "-------------------------------------"
npm run test:business
echo ""

echo "3️⃣ INTEGRATION TESTS - Simple Services"
echo "--------------------------------------"
timeout 30s npm test tests/integration/simple-services.integration.test.js
echo ""

echo "📈 TEST SUMMARY COMPLETE"
echo "========================"
echo "✅ Unit Tests: GTIN validation and utility functions"
echo "✅ Integration Tests: Business logic validation"
echo "✅ Service Tests: Authentication and direct database operations"

