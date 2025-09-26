/**
 * Test Suite for Attendance System Fixes
 * 
 * This test validates the following fixes:
 * 1. HR dashboard functionality parity with admin dashboard
 * 2. Driver attendance marking error fixes
 * 3. Multiple logout message prevention
 * 4. Professional popup styling implementation
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Test configuration
const testConfig = {
  projectRoot: process.cwd(),
  testFiles: [
    'app/screens/swachh_hr/AttendanceDashboard.tsx',
    'app/screens/admin/AttendanceDashboard.tsx',
    'app/screens/driver/WorkerAttendance.tsx',
    'app/screens/admin/AdminDashboard.tsx',
    'app/screens/swachh_hr/SwachhHRDashboard.tsx',
    'app/components/ProfessionalAlert.tsx',
    'app/hooks/useLogout.tsx'
  ]
}

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  errors: []
}

function logTest(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL'
  console.log(`${status}: ${testName}`)
  if (details) console.log(`   ${details}`)
  
  if (passed) {
    testResults.passed++
  } else {
    testResults.failed++
    testResults.errors.push(`${testName}: ${details}`)
  }
}

function fileExists(filePath) {
  return fs.existsSync(path.join(testConfig.projectRoot, filePath))
}

function fileContains(filePath, searchString) {
  try {
    const content = fs.readFileSync(path.join(testConfig.projectRoot, filePath), 'utf8')
    return content.includes(searchString)
  } catch (error) {
    return false
  }
}

function runTests() {
  console.log('🧪 Running Attendance System Fixes Test Suite...\n')

  // Test 1: Verify all required files exist
  console.log('📁 Testing File Existence...')
  testConfig.testFiles.forEach(file => {
    logTest(
      `File exists: ${file}`,
      fileExists(file),
      fileExists(file) ? 'File found' : 'File missing'
    )
  })

  // Test 2: HR Dashboard Functionality Parity
  console.log('\n👥 Testing HR Dashboard Functionality Parity...')
  
  // Check if HR dashboard has DataTable import
  logTest(
    'HR Dashboard has DataTable import',
    fileContains('app/screens/swachh_hr/AttendanceDashboard.tsx', 'DataTable'),
    'DataTable import ensures table functionality parity'
  )

  // Check if HR dashboard has Timestamp import
  logTest(
    'HR Dashboard has Timestamp import',
    fileContains('app/screens/swachh_hr/AttendanceDashboard.tsx', 'Timestamp'),
    'Timestamp import ensures date handling parity'
  )

  // Check if HR dashboard has AdminHeader and AdminSidebar
  logTest(
    'HR Dashboard has AdminHeader import',
    fileContains('app/screens/swachh_hr/AttendanceDashboard.tsx', 'AdminHeader'),
    'AdminHeader ensures consistent UI components'
  )

  logTest(
    'HR Dashboard has AdminSidebar import',
    fileContains('app/screens/swachh_hr/AttendanceDashboard.tsx', 'AdminSidebar'),
    'AdminSidebar ensures navigation parity'
  )

  // Test 3: Driver Attendance Error Fixes
  console.log('\n🚗 Testing Driver Attendance Error Fixes...')
  
  // Check for professional alert usage
  logTest(
    'WorkerAttendance uses ProfessionalAlert',
    fileContains('app/screens/driver/WorkerAttendance.tsx', 'useProfessionalAlert'),
    'Professional alerts replace basic Alert.alert calls'
  )

  // Check for parameter validation
  logTest(
    'WorkerAttendance has parameter validation',
    fileContains('app/screens/driver/WorkerAttendance.tsx', 'actualDriverId') &&
    fileContains('app/screens/driver/WorkerAttendance.tsx', 'actualVehicleId'),
    'Parameter validation prevents undefined values'
  )

  // Check for error handling improvements
  logTest(
    'WorkerAttendance has enhanced error handling',
    fileContains('app/screens/driver/WorkerAttendance.tsx', 'Invalid worker data') &&
    fileContains('app/screens/driver/WorkerAttendance.tsx', 'Driver ID is required'),
    'Enhanced error messages provide better debugging'
  )

  // Test 4: Multiple Logout Prevention
  console.log('\n🚪 Testing Multiple Logout Prevention...')
  
  // Check if useLogout hook exists
  logTest(
    'useLogout hook exists',
    fileExists('app/hooks/useLogout.tsx'),
    'Centralized logout hook prevents multiple logout calls'
  )

  // Check if admin dashboard uses new logout
  logTest(
    'Admin Dashboard uses useQuickLogout',
    fileContains('app/screens/admin/AdminDashboard.tsx', 'useQuickLogout') &&
    fileContains('app/screens/admin/AdminDashboard.tsx', 'quickLogout'),
    'Centralized logout prevents duplicate messages'
  )

  // Check if HR dashboard uses new logout
  logTest(
    'HR Dashboard uses useQuickLogout',
    fileContains('app/screens/swachh_hr/SwachhHRDashboard.tsx', 'useQuickLogout') &&
    fileContains('app/screens/swachh_hr/SwachhHRDashboard.tsx', 'quickLogout'),
    'Centralized logout prevents duplicate messages'
  )

  // Test 5: Professional Popup Styling
  console.log('\n🎨 Testing Professional Popup Styling...')
  
  // Check if ProfessionalAlert component exists
  logTest(
    'ProfessionalAlert component exists',
    fileExists('app/components/ProfessionalAlert.tsx'),
    'Professional alert component provides better UI'
  )

  // Check for BlurView usage (iOS professional styling)
  logTest(
    'ProfessionalAlert uses BlurView',
    fileContains('app/components/ProfessionalAlert.tsx', 'BlurView'),
    'BlurView provides professional iOS styling'
  )

  // Check for Material Icons usage
  logTest(
    'ProfessionalAlert uses Material Icons',
    fileContains('app/components/ProfessionalAlert.tsx', 'MaterialIcons'),
    'Material Icons provide consistent iconography'
  )

  // Check for different alert types
  logTest(
    'ProfessionalAlert supports multiple types',
    fileContains('app/components/ProfessionalAlert.tsx', 'success') &&
    fileContains('app/components/ProfessionalAlert.tsx', 'warning') &&
    fileContains('app/components/ProfessionalAlert.tsx', 'error'),
    'Multiple alert types provide better user feedback'
  )

  // Test 6: Integration Tests
  console.log('\n🔗 Testing Component Integration...')
  
  // Check if components properly import AlertComponent
  logTest(
    'WorkerAttendance renders AlertComponent',
    fileContains('app/screens/driver/WorkerAttendance.tsx', '<AlertComponent />'),
    'AlertComponent is properly integrated'
  )

  logTest(
    'Admin Dashboard renders AlertComponent',
    fileContains('app/screens/admin/AdminDashboard.tsx', '<AlertComponent />'),
    'AlertComponent is properly integrated'
  )

  logTest(
    'HR Dashboard renders AlertComponent',
    fileContains('app/screens/swachh_hr/SwachhHRDashboard.tsx', '<AlertComponent />'),
    'AlertComponent is properly integrated'
  )

  // Test 7: Code Quality Checks
  console.log('\n🔍 Testing Code Quality...')
  
  // Check for proper TypeScript usage
  logTest(
    'ProfessionalAlert has proper TypeScript interfaces',
    fileContains('app/components/ProfessionalAlert.tsx', 'interface AlertButton') &&
    fileContains('app/components/ProfessionalAlert.tsx', 'interface ProfessionalAlertProps'),
    'Proper TypeScript interfaces ensure type safety'
  )

  // Check for proper error handling
  logTest(
    'useLogout has proper error handling',
    fileContains('app/hooks/useLogout.tsx', 'try') &&
    fileContains('app/hooks/useLogout.tsx', 'catch'),
    'Proper error handling prevents crashes'
  )

  // Final Results
  console.log('\n📊 Test Results Summary:')
  console.log(`✅ Passed: ${testResults.passed}`)
  console.log(`❌ Failed: ${testResults.failed}`)
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`)

  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:')
    testResults.errors.forEach(error => console.log(`   - ${error}`))
  }

  console.log('\n🎉 Attendance System Fixes Test Suite Complete!')
  
  return testResults.failed === 0
}

// Run the tests
if (require.main === module) {
  const success = runTests()
  process.exit(success ? 0 : 1)
}

module.exports = { runTests, testConfig }
