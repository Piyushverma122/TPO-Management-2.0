const { authorizeModule } = require('../middleware/authorize');
const { Module, Action, Role } = require('../config/rbac');
const supabase = require('../config/supabase');

async function runBackendRbacVerification() {
  console.log('======================================================');
  console.log('STARTING BACKEND RBAC AUTHORIZATION VERIFICATION');
  console.log('======================================================\n');

  const testMatrix = [
    { role: Role.ADMIN, module: Module.STUDENTS, action: Action.DELETE, expected: 200, label: 'Admin delete student' },
    { role: Role.TPO, module: Module.STUDENTS, action: Action.DELETE, expected: 403, label: 'TPO delete student (Denied)' },
    { role: Role.STUDENT, module: Module.USERS, action: Action.VIEW, expected: 403, label: 'Student view users (Denied)' },
    { role: Role.RECRUITER, module: Module.PLACEMENT_DRIVES, action: Action.CREATE, expected: 200, label: 'Recruiter create drive' },
    { role: Role.FACULTY, module: Module.COMPANIES, action: Action.VIEW, expected: 403, label: 'Faculty view companies (Denied)' },
    { role: Role.TPO, module: Module.COMPANIES, action: Action.CREATE, expected: 200, label: 'TPO create company' },
  ];

  for (const t of testMatrix) {
    let statusCode = 200;
    let responseBody = null;

    await new Promise((resolve) => {
      const req = {
        user: { id: 'test-user-id', role: t.role },
        ip: '127.0.0.1',
        originalUrl: `/api/v1/test/${t.module}/${t.action}`,
        headers: {},
      };

      const res = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(body) {
          responseBody = body;
          resolve();
          return this;
        },
      };

      const middleware = authorizeModule(t.module, t.action);
      middleware(req, res, () => {
        statusCode = 200;
        resolve();
      });
    });

    const pass = statusCode === t.expected;
    console.log(`📌 Test [${t.label}]: ${pass ? 'PASS' : 'FAIL'} (Expected Status: ${t.expected}, Got: ${statusCode})`);
    if (statusCode === 403) {
      console.log(`   Returned 403 Body:`, JSON.stringify(responseBody));
    }
  }

  // Check Audit Logs
  const { data: auditEntries } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('action', 'ACCESS_DENIED')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('\n======================================================');
  console.log('AUDIT LOG ENTRIES CREATED FOR ACCESS_DENIED FAILURES:');
  console.log('======================================================');
  console.table(auditEntries?.map((a) => ({ id: a.id, action: a.action, details: a.details, created_at: a.created_at })));
}

runBackendRbacVerification();
