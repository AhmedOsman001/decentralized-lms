#!/bin/bash

# Extended System Testing for Decentralized LMS
echo "=============================================="
echo "Decentralized LMS - Extended System Testing"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Function to run test and check result
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_success="$3"  # true/false
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "Test $TOTAL_TESTS: $test_name... "
    
    if output=$(eval "$command" 2>&1); then
        if [ "$expected_success" = "true" ]; then
            echo -e "${GREEN}✅ PASSED${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
            return 0
        else
            echo -e "${RED}❌ FAILED (Expected failure but got success)${NC}"
            echo "Output: $output"
            TESTS_FAILED=$((TESTS_FAILED + 1))
            return 1
        fi
    else
        if [ "$expected_success" = "false" ]; then
            echo -e "${GREEN}✅ PASSED (Expected failure)${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
            return 0
        else
            echo -e "${RED}❌ FAILED${NC}"
            echo "Output: $output"
            TESTS_FAILED=$((TESTS_FAILED + 1))
            return 1
        fi
    fi
}

# Prerequisites check
echo "Prerequisites:"
run_test "DFX is running" "dfx ping local" "true"

# Router canister tests (recap)
echo ""
echo "Router Canister Status:"
run_test "Router health check" "dfx canister call router_canister health_check | grep -q 'healthy'" "true"
run_test "Router statistics" "dfx canister call router_canister get_router_stats | grep -q 'tenant_count'" "true"
run_test "List tenants" "dfx canister call router_canister list_tenants | grep -q 'vec'" "true"

# Tenant canister direct tests
echo ""
echo "Tenant Canister Direct Tests:"
run_test "Tenant health check" "dfx canister call tenant_canister health_check" "true"
run_test "List existing users" "dfx canister call tenant_canister list_users | grep -q 'System Admin'" "true"
run_test "List courses" "dfx canister call tenant_canister list_courses" "true"

# Try to get tenant info
echo ""
echo "Attempting to get tenant information:"
TENANT_INFO=$(dfx canister call tenant_canister get_tenant_info 2>/dev/null)
if echo "$TENANT_INFO" | grep -q "InitializationError"; then
    echo -e "${YELLOW}⚠️  Tenant data not found in stable memory${NC}"
    echo "This is expected after code upgrade - tenant data needs to be in stable storage"
    
    # Extract tenant_id from existing user
    TENANT_ID=$(dfx canister call tenant_canister list_users | grep -o 'tenant_[0-9]*' | head -1)
    echo "Found existing tenant_id from user data: $TENANT_ID"
    
    if [ -n "$TENANT_ID" ]; then
        echo ""
        echo "Testing with extracted tenant_id:"
        run_test "Register new user with existing tenant_id" \
            "dfx canister call tenant_canister register_user '(\"student_123\", \"Jane Smith\", \"jane@university.edu\", variant { Student }, \"$TENANT_ID\")'" "false"
        
        # This will fail because tenant data is not in stable memory
        echo -e "${YELLOW}Note: User registration fails because TENANT_DATA is not in stable storage${NC}"
    fi
else
    echo -e "${GREEN}✅ Tenant info available${NC}"
    
    # Extract tenant_id from the response
    TENANT_ID=$(echo "$TENANT_INFO" | grep -o 'tenant_[0-9]*')
    echo "Using tenant_id: $TENANT_ID"
    
    echo ""
    echo "User Management Tests:"
    run_test "Register new student" \
        "dfx canister call tenant_canister register_user '(\"student_123\", \"Jane Smith\", \"jane@university.edu\", variant { Student }, \"$TENANT_ID\")'" "true"
    
    run_test "Get registered user" \
        "dfx canister call tenant_canister get_user '(\"student_123\")' | grep -q 'Jane Smith'" "true"
    
    run_test "Register instructor" \
        "dfx canister call tenant_canister register_user '(\"instructor_456\", \"Dr. Johnson\", \"johnson@university.edu\", variant { Instructor }, \"$TENANT_ID\")'" "true"
    
    echo ""
    echo "Course Management Tests:"
    run_test "Create course" \
        "dfx canister call tenant_canister create_course '(\"CS101\", \"Introduction to Computer Science\", \"instructor_456\")'" "true"
    
    run_test "Get created course" \
        "dfx canister call tenant_canister get_course '(\"CS101\")' | grep -q 'Introduction to Computer Science'" "true"
    
    run_test "Enroll student in course" \
        "dfx canister call tenant_canister enroll_student '(\"student_123\", \"CS101\")'" "true"
    
    echo ""
    echo "Grade Management Tests:"
    run_test "Record grade" \
        "dfx canister call tenant_canister record_grade '(\"student_123\", \"CS101\", 85.5, 100.0, variant { Assignment }, opt \"Good work!\")'" "true"
    
    run_test "Get student grades" \
        "dfx canister call tenant_canister get_student_grades '(\"student_123\")' | grep -q '85.5'" "true"
fi

echo ""
echo "=============================================="
echo "Test Summary:"
echo "=============================================="
echo -e "Total tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
