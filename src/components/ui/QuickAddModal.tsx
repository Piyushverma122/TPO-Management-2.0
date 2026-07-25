import React, { useState } from 'react';
import { Modal } from './Modal';
import { Input } from './Input';
import { Dropdown } from './Dropdown';
import { Button } from './Button';
import { useToast } from './Toast';

export interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose }) => {
  const { success } = useToast();
  const [tab, setTab] = useState<'drive' | 'student'>('drive');

  // Drive form states
  const [companyName, setCompanyName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [ctc, setCtc] = useState('');

  // Student form states
  const [studentName, setStudentName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [branch, setBranch] = useState('Computer Science');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'drive') {
      if (!companyName || !roleTitle) return;
      success('Quick Drive Created', `${companyName} (${roleTitle}) added to recruitment schedule.`);
    } else {
      if (!studentName || !rollNumber) return;
      success('Student Enrolled', `${studentName} (${rollNumber}) added to candidate roster.`);
    }
    onClose();
    setCompanyName('');
    setRoleTitle('');
    setCtc('');
    setStudentName('');
    setRollNumber('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Add Action"
      subtitle="Instantly register a new recruitment drive or student candidate."
    >
      <div className="space-y-4">
        {/* Tab Switcher */}
        <div className="flex bg-[#101726] border border-[#202D42] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setTab('drive')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === 'drive' ? 'bg-[#A3E635] text-[#0B0F17] shadow-[0_0_10px_rgba(163,230,53,0.3)]' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Placement Drive
          </button>
          <button
            type="button"
            onClick={() => setTab('student')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === 'student' ? 'bg-[#A3E635] text-[#0B0F17] shadow-[0_0_10px_rgba(163,230,53,0.3)]' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Student Record
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'drive' ? (
            <>
              <Input
                label="Company Name"
                placeholder="e.g. Microsoft"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
              <Input
                label="Role Title"
                placeholder="e.g. Software Development Engineer"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                required
              />
              <Input
                label="Offered Package (CTC)"
                placeholder="e.g. ₹18 LPA"
                value={ctc}
                onChange={(e) => setCtc(e.target.value)}
              />
            </>
          ) : (
            <>
              <Input
                label="Student Full Name"
                placeholder="e.g. Aditya Sharma"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
              />
              <Input
                label="Roll Number"
                placeholder="e.g. AS2022CS"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                required
              />
              <Dropdown
                label="Branch / Department"
                options={[
                  { label: 'Computer Science', value: 'Computer Science' },
                  { label: 'Electronics', value: 'Electronics' },
                  { label: 'Mechanical', value: 'Mechanical' },
                  { label: 'Civil', value: 'Civil' },
                  { label: 'Information Tech', value: 'Information Tech' },
                ]}
                value={branch}
                onChange={setBranch}
              />
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Confirm Add
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
