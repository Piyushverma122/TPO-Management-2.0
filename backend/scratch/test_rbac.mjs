import { Role, Module, Action, hasRole, hasPermission, canAccessModule, canPerformAction } from '../../src/config/rbac.js';

console.log('--- TESTING RBAC FOUNDATION UTILITIES ---');

// 1. Test hasRole
console.log('hasRole(Admin, Admin):', hasRole(Role.ADMIN, Role.ADMIN) === true ? 'PASS' : 'FAIL');
console.log('hasRole(Student, [Admin, TPO]):', hasRole(Role.STUDENT, [Role.ADMIN, Role.TPO]) === false ? 'PASS' : 'FAIL');
console.log('hasRole(TPO, [Admin, TPO]):', hasRole(Role.TPO, [Role.ADMIN, Role.TPO]) === true ? 'PASS' : 'FAIL');

// 2. Test canAccessModule
console.log('canAccessModule(Student, Dashboard):', canAccessModule(Role.STUDENT, Module.DASHBOARD) === true ? 'PASS' : 'FAIL');
console.log('canAccessModule(Student, Users):', canAccessModule(Role.STUDENT, Module.USERS) === false ? 'PASS' : 'FAIL');
console.log('canAccessModule(Admin, Settings):', canAccessModule(Role.ADMIN, Module.SETTINGS) === true ? 'PASS' : 'FAIL');

// 3. Test hasPermission / canPerformAction
console.log('canPerformAction(Admin, Students, Delete):', canPerformAction(Role.ADMIN, Module.STUDENTS, Action.DELETE) === true ? 'PASS' : 'FAIL');
console.log('canPerformAction(Student, Applications, Create):', canPerformAction(Role.STUDENT, Module.APPLICATIONS, Action.CREATE) === true ? 'PASS' : 'FAIL');
console.log('canPerformAction(Student, Students, Delete):', canPerformAction(Role.STUDENT, Module.STUDENTS, Action.DELETE) === false ? 'PASS' : 'FAIL');
console.log('canPerformAction(Recruiter, PlacementDrives, Create):', canPerformAction(Role.RECRUITER, Module.PLACEMENT_DRIVES, Action.CREATE) === true ? 'PASS' : 'FAIL');
console.log('canPerformAction(Faculty, Users, View):', canPerformAction(Role.FACULTY, Module.USERS, Action.VIEW) === false ? 'PASS' : 'FAIL');

console.log('--- ALL RBAC FOUNDATION TESTS COMPLETED ---');
