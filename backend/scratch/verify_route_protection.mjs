import { Role, Module, canAccessModule, hasRole } from '../../src/config/rbac.js';

console.log('======================================================');
console.log('FRONTEND ROUTE GUARD VERIFICATION SUITE');
console.log('======================================================\n');

const routesToTest = [
  { path: '/dashboard', module: Module.DASHBOARD },
  { path: '/students', module: Module.STUDENTS },
  { path: '/companies', module: Module.COMPANIES },
  { path: '/drives', module: Module.PLACEMENT_DRIVES },
  { path: '/applications', module: Module.APPLICATIONS },
  { path: '/interviews', module: Module.INTERVIEWS },
  { path: '/reports', module: Module.REPORTS },
  { path: '/users', module: Module.USERS },
  { path: '/settings', module: Module.SETTINGS },
];

const roles = [
  { role: Role.ADMIN, name: 'Admin' },
  { role: Role.TPO, name: 'TPO' },
  { role: Role.FACULTY, name: 'Faculty' },
  { role: Role.STUDENT, name: 'Student' },
  { role: Role.RECRUITER, name: 'Recruiter' },
];

roles.forEach(({ role, name }) => {
  console.log(`📌 Testing User Role: [${name}]`);
  routesToTest.forEach(({ path, module }) => {
    const isAllowed = canAccessModule(role, module);
    const actionResult = isAllowed ? 'Render Component Page' : 'Redirect -> /403';
    console.log(`   Route '${path}' (${module}): ${actionResult}`);
  });
  console.log('------------------------------------------------------');
});
