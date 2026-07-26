# PostgreSQL & Supabase Row-Level Security (RLS) Documentation

## Overview
Row-Level Security (RLS) ensures that the database engine itself rejects unauthorized reads, inserts, updates, and deletes. Even if API backend checks or JWT tokens are bypassed, PostgreSQL enforces record-level isolation at the database layer.

---

## 🏛️ Protected Tables & RLS Status

| Table Name | RLS Enabled | Supporting Indexes Created |
| :--- | :---: | :--- |
| `users` | 🟢 YES | `idx_users_role` |
| `students` | 🟢 YES | `idx_students_user_id`, `idx_students_branch_id` |
| `companies` | 🟢 YES | `idx_company_contacts_company_id`, `idx_company_contacts_email` |
| `placement_drives` | 🟢 YES | `idx_placement_drives_company_id` |
| `drive_applications` | 🟢 YES | `idx_drive_applications_student_id`, `idx_drive_applications_drive_id` |
| `placements` | 🟢 YES | `idx_placements_student_id`, `idx_placements_company_id` |
| `resumes` | 🟢 YES | `idx_resumes_student_id` |
| `notifications` | 🟢 YES | `idx_notifications_user_id` |
| `audit_logs` | 🟢 YES | `idx_audit_logs_user_id` |

---

## 🛠️ Reusable SQL Helper Functions

To ensure high query performance and prevent redundant table joins inside RLS policies, the following `STABLE SECURITY DEFINER` functions are created:

1. **`public.current_user_role()`**:
   Returns the normalized role string of `auth.uid()` (e.g. `'admin'`, `'tpo'`, `'faculty'`, `'student'`, `'recruiter'`).
2. **`public.current_student_id()`**:
   Returns the `id` from `public.students` matching `user_id = auth.uid()`.
3. **`public.current_company_id()`**:
   Returns the `company_id` from `public.company_contacts` matching the authenticated user's email.
4. **`public.current_department_id()`**:
   Returns the `branch_id` from `public.students` matching `user_id = auth.uid()`.

---

## 🛡️ Granular Policy Matrix per Operation

### 1. `users` Table Policies
- `users_select_policy`: `current_user_role() IN ('admin', 'tpo') OR id = auth.uid()`
- `users_insert_policy`: `current_user_role() IN ('admin', 'tpo') OR id = auth.uid()`
- `users_update_policy`: `current_user_role() IN ('admin', 'tpo') OR id = auth.uid()`
- `users_delete_policy`: `current_user_role() IN ('admin')`

### 2. `students` Table Policies
- `students_select_policy`: `current_user_role() IN ('admin', 'tpo') OR (current_user_role() = 'faculty' AND branch_id = current_department_id()) OR user_id = auth.uid()`
- `students_insert_policy`: `current_user_role() IN ('admin', 'tpo')`
- `students_update_policy`: `current_user_role() IN ('admin', 'tpo') OR user_id = auth.uid()`
- `students_delete_policy`: `current_user_role() IN ('admin', 'tpo')`

### 3. `companies` Table Policies
- `companies_select_policy`: `current_user_role() IN ('admin', 'tpo', 'faculty', 'student') OR id = current_company_id()`
- `companies_insert_policy`: `current_user_role() IN ('admin', 'tpo')`
- `companies_update_policy`: `current_user_role() IN ('admin', 'tpo') OR id = current_company_id()`
- `companies_delete_policy`: `current_user_role() IN ('admin')`

### 4. `placement_drives` Table Policies
- `drives_select_policy`: `current_user_role() IN ('admin', 'tpo', 'faculty', 'student') OR company_id = current_company_id()`
- `drives_insert_policy`: `current_user_role() IN ('admin', 'tpo') OR company_id = current_company_id()`
- `drives_update_policy`: `current_user_role() IN ('admin', 'tpo') OR company_id = current_company_id()`
- `drives_delete_policy`: `current_user_role() IN ('admin', 'tpo')`

### 5. `drive_applications` Table Policies
- `applications_select_policy`: `current_user_role() IN ('admin', 'tpo') OR student_id = current_student_id() OR drive_id IN (SELECT id FROM placement_drives WHERE company_id = current_company_id())`
- `applications_insert_policy`: `current_user_role() IN ('admin', 'tpo') OR student_id = current_student_id()`
- `applications_update_policy`: `current_user_role() IN ('admin', 'tpo') OR drive_id IN (SELECT id FROM placement_drives WHERE company_id = current_company_id())`
- `applications_delete_policy`: `current_user_role() IN ('admin', 'tpo') OR student_id = current_student_id()`

---

## 🚀 Performance Considerations
- All policy predicate columns (`user_id`, `branch_id`, `company_id`, `student_id`, `drive_id`, `role`) possess B-Tree indexes.
- Helper functions are marked `STABLE` so PostgreSQL caches results within the scope of a single SQL statement execution.
