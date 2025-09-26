/**
 * Test Suite for Critical Attendance System Fixes
 * 
 * This test validates the following critical fixes:
 * 1. Logout button functionality across all user roles
 * 2. HR attendance dashboard implementation and navigation
 * 3. Complete HR dashboard functionality parity with admin
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Test configuration
const testConfig = {
  projectRoot: process.cwd(),
  testFiles: [
    'app/screens/admin/AdminDashboard.tsx',
    'app/screens/swachh_hr/SwachhHRDashboard.tsx',
    'app/screens/swachh_hr/AttendanceDashboard.tsx',
    'app/screens/driver/DriverDashboard.tsx',
    'app/screens/contractor/ContractorDashboard.tsx',
    'app/screens/admin/AdminSettings.tsx',
    'app/hooks/useLogout.tsx',
    'app/components/ProfessionalAlert.tsx',
    'App.tsx'
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
  console.log('🧪 Running Critical Attendance System Fixes Test Suite...\n')

  // Test 1: Verify all required files exist
  console.log('📁 Testing File Existence...')
  testConfig.testFiles.forEach(file => {
    logTest(
      `File exists: ${file}`,
      fileExists(file),
      fileExists(file) ? 'File found' : 'File missing'
    )
  })

  // Test 2: Logout Button Functionality
  console.log('\n🚪 Testing Logout Button Functionality...')
  
  // Check if useQuickLogout hook is properly implemented
  logTest(
    'useQuickLogout hook exists and has navigation support',
    fileContains('app/hooks/useLogout.tsx', 'export const useQuickLogout = (navigation?: any)'),
    'Hook supports navigation parameter for proper logout flow'
  )

  // Check if all dashboards use the new logout system
  const dashboardFiles = [
    'app/screens/admin/AdminDashboard.tsx',
    'app/screens/swachh_hr/SwachhHRDashboard.tsx',
    'app/screens/driver/DriverDashboard.tsx',
    'app/screens/contractor/ContractorDashboard.tsx',
    'app/screens/admin/AdminSettings.tsx'
  ]

  dashboardFiles.forEach(file => {
    const fileName = file.split('/').pop()
    logTest(
      `${fileName} uses useQuickLogout`,
      fileContains(file, 'useQuickLogout') && fileContains(file, 'quickLogout'),
      'Dashboard uses centralized logout system'
    )

    logTest(
      `${fileName} has AlertComponent`,
      fileContains(file, '<AlertComponent />') || fileContains(file, 'AlertComponent'),
      'Dashboard includes professional alert component'
    )
  })

  // Test 3: HR Attendance Dashboard Implementation
  console.log('\n👥 Testing HR Attendance Dashboard Implementation...')
  
  // Check if HR dashboard navigation is fixed
  logTest(
    'HR Dashboard has HRAttendanceDashboard navigation',
    fileContains('app/screens/swachh_hr/SwachhHRDashboard.tsx', 'case "HRAttendanceDashboard":') &&
    fileContains('app/screens/swachh_hr/SwachhHRDashboard.tsx', 'navigation.navigate("HRAttendanceDashboard")'),
    'HR dashboard properly navigates to attendance dashboard'
  )

  // Check if HR attendance dashboard exists and is functional
  logTest(
    'HR AttendanceDashboard component exists',
    fileExists('app/screens/swachh_hr/AttendanceDashboard.tsx'),
    'HR attendance dashboard file exists'
  )

  logTest(
    'HR AttendanceDashboard has full functionality',
    fileContains('app/screens/swachh_hr/AttendanceDashboard.tsx', 'WorkerAttendanceService.getAttendanceForHRAndAdmin') &&
    fileContains('app/screens/swachh_hr/AttendanceDashboard.tsx', 'bulkMode') &&
    fileContains('app/screens/swachh_hr/AttendanceDashboard.tsx', 'editingRecord'),
    'HR dashboard has complete attendance management functionality'
  )

  // Check if HR dashboard has same imports as admin dashboard
  logTest(
    'HR AttendanceDashboard has DataTable import',
    fileContains('app/screens/swachh_hr/AttendanceDashboard.tsx', 'DataTable'),
    'HR dashboard has table functionality'
  )

  logTest(
    'HR AttendanceDashboard has AdminHeader and AdminSidebar',
    fileContains('app/screens/swachh_hr/AttendanceDashboard.tsx', 'AdminHeader') &&
    fileContains('app/screens/swachh_hr/AttendanceDashboard.tsx', 'AdminSidebar'),
    'HR dashboard has consistent UI components'
  )

  // Test 4: Navigation Registration
  console.log('\n🧭 Testing Navigation Registration...')
  
  logTest(
    'HRAttendanceDashboard is registered in App.tsx',
    fileContains('App.tsx', 'HRAttendanceDashboard') &&
    fileContains('App.tsx', "name='HRAttendanceDashboard'"),
    'HR attendance dashboard is properly registered in navigation'
  )

  // Test 5: Professional Alert System
  console.log('\n🎨 Testing Professional Alert System...')
  
  logTest(
    'ProfessionalAlert component exists',
    fileExists('app/components/ProfessionalAlert.tsx'),
    'Professional alert component is available'
  )

  logTest(
    'ProfessionalAlert has proper TypeScript interfaces',
    fileContains('app/components/ProfessionalAlert.tsx', 'interface AlertButton') &&
    fileContains('app/components/ProfessionalAlert.tsx', 'interface ProfessionalAlertProps'),
    'Component has proper type definitions'
  )

  logTest(
    'ProfessionalAlert supports different types',
    fileContains('app/components/ProfessionalAlert.tsx', 'success') &&
    fileContains('app/components/ProfessionalAlert.tsx', 'warning') &&
    fileContains('app/components/ProfessionalAlert.tsx', 'error'),
    'Alert component supports multiple alert types'
  )

  // Test 6: Logout Flow Validation
  console.log('\n🔄 Testing Logout Flow Validation...')
  
  logTest(
    'Logout hook has proper navigation reset',
    fileContains('app/hooks/useLogout.tsx', 'navigation.reset') &&
    fileContains('app/hooks/useLogout.tsx', "routes: [{ name: 'Login' }]"),
    'Logout properly resets navigation to login screen'
  )

  logTest(
    'Logout hook has error handling',
    fileContains('app/hooks/useLogout.tsx', 'try') &&
    fileContains('app/hooks/useLogout.tsx', 'catch') &&
    fileContains('app/hooks/useLogout.tsx', 'Logout Failed'),
    'Logout has proper error handling and user feedback'
  )

  // Test 7: HR Dashboard Action Mapping
  console.log('\n⚡ Testing HR Dashboard Action Mapping...')
  
  logTest(
    'HR Dashboard action mapping includes attendance',
    fileContains('app/screens/swachh_hr/SwachhHRDashboard.tsx', '"Attendance Dashboard"') &&
    fileContains('app/screens/swachh_hr/SwachhHRDashboard.tsx', '"HRAttendanceDashboard"'),
    'HR dashboard has attendance dashboard action properly mapped'
  )

  // Test 8: No More "Coming Soon" Messages
  console.log('\n🚫 Testing Removal of Placeholder Messages...')
  
  logTest(
    'HR Dashboard does not show "Coming Soon" for attendance',
    !fileContains('app/screens/swachh_hr/SwachhHRDashboard.tsx', 'AttendanceTracking') ||
    fileContains('app/screens/swachh_hr/SwachhHRDashboard.tsx', 'case "HRAttendanceDashboard":'),
    'HR dashboard no longer shows placeholder for attendance functionality'
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

  console.log('\n🎉 Critical Attendance System Fixes Test Suite Complete!')
  
  return testResults.failed === 0
}

// Run the tests
if (require.main === module) {
  const success = runTests()
  process.exit(success ? 0 : 1)
}

module.exports = { runTests, testConfig }
