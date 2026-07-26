import { Role } from '../../src/config/rbac.js';
import { getDynamicSidebar } from '../../src/config/sidebar.js';

const rolesToTest = [
  { role: Role.ADMIN, name: 'Admin' },
  { role: Role.TPO, name: 'TPO' },
  { role: Role.FACULTY, name: 'Faculty' },
  { role: Role.STUDENT, name: 'Student' },
  { role: Role.RECRUITER, name: 'Recruiter' },
];

console.log('======================================================');
console.log('DYNAMIC SIDEBAR ROLE VERIFICATION REPORT');
console.log('======================================================\n');

rolesToTest.forEach(({ role, name }) => {
  const items = getDynamicSidebar(role);
  const titles = items.map((i) => i.title);
  console.log(`📌 Role: [${name}]`);
  console.log(`   Visible Items (${titles.length}):`, titles.join(', '));
  console.log('------------------------------------------------------');
});
