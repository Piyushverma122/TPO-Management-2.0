import { Role, Module, Action, canPerformAction } from '../../src/config/rbac.js';

console.log('======================================================');
console.log('ACTION-LEVEL PERMISSION GUARD VERIFICATION SUITE');
console.log('======================================================\n');

const actionTests = [
  { module: Module.STUDENTS, action: Action.CREATE, label: 'Add New Student' },
  { module: Module.STUDENTS, action: Action.DELETE, label: 'Delete Student' },
  { module: Module.COMPANIES, action: Action.CREATE, label: 'Add New Company' },
  { module: Module.PLACEMENT_DRIVES, action: Action.CREATE, label: 'Publish New Drive' },
  { module: Module.APPLICATIONS, action: Action.APPROVE, label: 'Approve Application' },
  { module: Module.REPORTS, action: Action.EXPORT, label: 'Export PDF Report' },
  { module: Module.NOTIFICATIONS, action: Action.CREATE, label: 'Broadcast Announcement' },
  { module: Module.USERS, action: Action.MANAGE, label: 'Manage Users' },
  { module: Module.SETTINGS, action: Action.EDIT, label: 'Edit System Settings' },
];

const roles = [
  { role: Role.ADMIN, name: 'Admin' },
  { role: Role.TPO, name: 'TPO' },
  { role: Role.FACULTY, name: 'Faculty' },
  { role: Role.STUDENT, name: 'Student' },
  { role: Role.RECRUITER, name: 'Recruiter' },
];

roles.forEach(({ role, name }) => {
  console.log(`📌 Role: [${name}]`);
  actionTests.forEach(({ module, action, label }) => {
    const isAllowed = canPerformAction(role, module, action);
    const status = isAllowed ? 'VISIBLE (Rendered)' : 'HIDDEN (Null)';
    console.log(`   [${label}] -> ${module}:${action} => ${status}`);
  });
  console.log('------------------------------------------------------');
});
