import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  Building2,
  Upload,
  Globe,
  MapPin,
  DollarSign,
  Calendar,
  Briefcase,
  Award,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Bold,
  Italic,
  Underline,
  Link2,
  List,
  ListOrdered,
  Mail,
  FileText,
} from 'lucide-react';

import { Card } from '../components/app/Card';
import { Button } from '../components/app/Button';
import { Input, Textarea } from '../components/app/Input';
import { Dropdown, MultiSelect } from '../components/app/Dropdown';
import { Breadcrumb } from '../components/app/Breadcrumb';
import { useToast } from '../components/app/Toast';
import { createCompany } from '../api/company.api';

export interface AddCompanyFormValues {
  companyName: string;
  jobRole: string;
  website: string;
  ctcMin: string;
  ctcMax: string;
  location: string;
  bond: string;
  deadline: string;
  minCgpa: string;
  maxBacklogs: string;
  departments: string[];
  description: string;
  hrName?: string;
  hrEmail?: string;
  hrPhone?: string;
}

export const AddCompany: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: toastError, info } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddCompanyFormValues>({
    defaultValues: {
      companyName: '',
      jobRole: 'Software Engineer I',
      website: 'https://',
      ctcMin: '12',
      ctcMax: '25',
      location: 'Bengaluru, India',
      bond: 'None',
      deadline: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      minCgpa: '6.0',
      maxBacklogs: '0',
      departments: ['Computer Science', 'IT'],
      description:
        'We are seeking talented engineers for full-stack software development.',
      hrName: '',
      hrEmail: '',
      hrPhone: '',
    },
  });

  const watchCtcMin = watch('ctcMin');
  const watchCtcMax = watch('ctcMax');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
      success('Logo Uploaded', `${file.name} loaded successfully.`);
    }
  };

  const onSubmit = async (data: AddCompanyFormValues) => {
    setIsLoading(true);
    try {
      const minPackage = parseFloat(data.ctcMin) || 0;
      const maxPackage = parseFloat(data.ctcMax) || minPackage;

      await createCompany({
        name: data.companyName,
        industry: 'Technology & Services',
        website: data.website,
        tier: maxPackage >= 25 ? 'Super Dream' : maxPackage >= 15 ? 'Dream' : 'Standard',
        status: 'Active',
        avg_package: minPackage,
        highest_package: maxPackage,
        min_cgpa: parseFloat(data.minCgpa) || 6.0,
        max_backlogs: parseInt(data.maxBacklogs) || 0,
        description: data.description,
        headquarters: data.location,
        hr_name: data.hrName || undefined,
        hr_email: data.hrEmail || undefined,
        hr_phone: data.hrPhone || undefined,
      });

      setIsLoading(false);
      success(
        'Company Published Successfully!',
        `${data.companyName} (${data.jobRole}) has been listed for placement drive.`
      );
      navigate('/companies');
    } catch (err: any) {
      setIsLoading(false);
      const errMsg = err.response?.data?.message || 'Failed to create company record.';
      toastError('Creation Error', errMsg);
    }
  };

  const watchName = watch('companyName');
  const watchRole = watch('jobRole');
  const watchLocation = watch('location');
  const watchDeadline = watch('deadline');
  const watchDepartments = watch('departments') || [];
  const watchMinCgpa = watch('minCgpa');
  const watchBond = watch('bond');

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Top Header & Breadcrumb */}
      <div className="space-y-3">
        <Breadcrumb
          items={[
            { label: 'Companies', path: '/companies' },
            { label: 'Add New Company' },
          ]}
        />
        <div className="flex items-start gap-3">
          <Link
            to="/companies"
            aria-label="Back to companies"
            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">Add New Company</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Onboard a recruitment partner and configure the drive details.
            </p>
          </div>
        </div>
      </div>

      <motion.form
        onSubmit={handleSubmit(onSubmit)}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
      >
        {/* ============ LEFT: FORM SECTIONS ============ */}
        <div className="lg:col-span-8 space-y-6">
          {/* Company details */}
          <FormSection icon={<Building2 className="w-4 h-4" />} title="Company details" desc="Who is recruiting and where they are based.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Company Name"
                placeholder="e.g. Amazon / Microsoft"
                leftIcon={<Building2 className="w-4 h-4 text-muted-foreground" />}
                error={errors.companyName?.message}
                {...register('companyName', {
                  required: 'Company name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' },
                })}
              />
              <Input
                label="Official Website"
                placeholder="www.example.com"
                leftIcon={<Globe className="w-4 h-4 text-muted-foreground" />}
                error={errors.website?.message}
                {...register('website', {
                  required: 'Website URL is required',
                })}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Location"
                  placeholder="Bengaluru, India"
                  leftIcon={<MapPin className="w-4 h-4 text-muted-foreground" />}
                  {...register('location', { required: 'Location is required' })}
                />
              </div>
            </div>
          </FormSection>

          {/* Role & compensation */}
          <FormSection icon={<Briefcase className="w-4 h-4" />} title="Role & compensation" desc="Position, package range, bond and last date to apply.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller
                name="jobRole"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    label="Job Role"
                    options={[
                      { label: 'Software Engineer I', value: 'Software Engineer I' },
                      { label: 'Data Engineer', value: 'Data Engineer' },
                      { label: 'Full Stack Developer', value: 'Full Stack Developer' },
                      { label: 'DevOps & Cloud Engineer', value: 'DevOps Engineer' },
                      { label: 'Product Analyst', value: 'Product Analyst' },
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              <Controller
                name="bond"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    label="Bond Requirement"
                    options={[
                      { label: 'None', value: 'None' },
                      { label: '1 Year', value: '1 Year' },
                      { label: '2 Years', value: '2 Years' },
                      { label: '3 Years', value: '3 Years' },
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />

              {/* CTC Package Range */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    CTC (Cost to Company)
                  </label>
                  <span className="text-xs font-medium text-foreground">
                    ₹{watchCtcMin || '20'} - ₹{watchCtcMax || '28'} LPA
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Input type="number" placeholder="Min (e.g. 20)" {...register('ctcMin', { required: true })} />
                  <span className="text-muted-foreground">to</span>
                  <Input type="number" placeholder="Max (e.g. 28)" {...register('ctcMax', { required: true })} />
                </div>
              </div>

              <Input
                label="Application Deadline"
                type="date"
                leftIcon={<Calendar className="w-4 h-4 text-muted-foreground" />}
                {...register('deadline', { required: 'Deadline date is required' })}
              />
            </div>
          </FormSection>

          {/* HR contact */}
          <FormSection icon={<Mail className="w-4 h-4" />} title="HR contact" desc="Primary recruiter for this drive (optional).">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="HR Recruiter Name" placeholder="e.g. Rahul Sharma" {...register('hrName')} />
              <Input label="HR Recruiter Email" placeholder="e.g. hr@company.com" type="email" {...register('hrEmail')} />
              <Input label="HR Recruiter Phone" placeholder="e.g. +91 98765 43210" {...register('hrPhone')} />
            </div>
          </FormSection>

          {/* Eligibility */}
          <FormSection icon={<Award className="w-4 h-4" />} title="Eligibility criteria" desc="Academic cut-offs students must meet to apply.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Controller
                  name="departments"
                  control={control}
                  render={({ field }) => (
                    <MultiSelect
                      label="Eligible Branches / Departments"
                      options={[
                        { label: 'Computer Science', value: 'Computer Science' },
                        { label: 'Information Tech (IT)', value: 'IT' },
                        { label: 'Electrical Eng (EE)', value: 'EE' },
                        { label: 'Electronics (ECE)', value: 'Electronics' },
                        { label: 'Mechanical Eng', value: 'Mechanical' },
                        { label: 'Civil Eng', value: 'Civil' },
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
              <Controller
                name="minCgpa"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    label="Min. CGPA Cut-off"
                    options={[
                      { label: '> 6.0 CGPA', value: '6.0' },
                      { label: '> 7.0 CGPA', value: '7.0' },
                      { label: '> 7.5 CGPA', value: '7.5' },
                      { label: '> 8.0 CGPA', value: '8.0' },
                      { label: '> 8.5 CGPA', value: '8.5' },
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              <Controller
                name="maxBacklogs"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    label="Backlogs Allowed"
                    options={[
                      { label: '0 (No Backlogs)', value: '0' },
                      { label: '<= 1 Active Backlog', value: '1' },
                      { label: '<= 2 Active Backlogs', value: '2' },
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </FormSection>

          {/* Description */}
          <FormSection icon={<FileText className="w-4 h-4" />} title="Job description" desc="Responsibilities, skills and requirements.">
            <div className="space-y-2">
              <div className="flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-1 w-fit">
                {[
                  { icon: Bold, label: 'Bold', msg: 'Bold formatting applied.' },
                  { icon: Italic, label: 'Italic', msg: 'Italic formatting applied.' },
                  { icon: Underline, label: 'Underline', msg: 'Underline formatting applied.' },
                  { icon: Link2, label: 'Insert Link', msg: 'Link added.' },
                  { icon: List, label: 'Bullet List', msg: 'Bullet list created.' },
                  { icon: ListOrdered, label: 'Numbered List', msg: 'Numbered list created.' },
                ].map(({ icon: Icon, label, msg }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => info('Rich Format', msg)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                    title={label}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
              <Textarea
                rows={6}
                error={errors.description?.message}
                {...register('description', {
                  required: 'Job description is required',
                  minLength: { value: 10, message: 'Description must be at least 10 characters' },
                })}
              />
            </div>
          </FormSection>
        </div>

        {/* ============ RIGHT: LOGO + PREVIEW + ACTIONS ============ */}
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          <Card className="p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Company logo</h3>
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="sr-only" id="logo-upload" />
            <label
              htmlFor="logo-upload"
              className="flex min-h-[170px] cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-input bg-muted p-6 text-center transition-colors hover:bg-accent"
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="h-20 w-20 rounded-2xl object-cover" />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-foreground">
                  <Upload className="w-5 h-5" />
                </span>
              )}
              <span className="text-sm font-medium text-foreground">{logoPreview ? 'Change logo' : 'Upload logo'}</span>
              <span className="text-xs text-muted-foreground">PNG or JPG, drag & drop or click</span>
            </label>
          </Card>

          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Live preview</h3>
            <div className="flex items-center gap-3">
              {logoPreview ? (
                <img src={logoPreview} alt="" className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-foreground">
                  {(watchName || 'C').slice(0, 2).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{watchName || 'Company name'}</p>
                <p className="truncate text-xs text-muted-foreground">{watchRole}</p>
              </div>
            </div>
            <dl className="space-y-2 text-xs">
              {[
                ['Package', `₹${watchCtcMin || '-'} - ₹${watchCtcMax || '-'} LPA`],
                ['Location', watchLocation || '-'],
                ['Deadline', watchDeadline || '-'],
                ['Min CGPA', `> ${watchMinCgpa}`],
                ['Bond', watchBond],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 border-t border-border pt-2">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="truncate font-medium text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-1.5">
              {watchDepartments.map((d) => (
                <span key={d} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-foreground">
                  {d}
                </span>
              ))}
            </div>
          </Card>

          <div className="flex flex-col gap-2">
            <Button type="submit" variant="primary" size="lg" isLoading={isLoading} fullWidth>
              Publish Company
            </Button>
            <Button
              type="button"
              variant="tertiary"
              size="lg"
              fullWidth
              onClick={() => {
                info('Draft Saved', 'Draft saved locally.');
                navigate('/companies');
              }}
            >
              Save Draft
            </Button>
          </div>
        </aside>
      </motion.form>
    </div>
  );
};

const FormSection: React.FC<{ icon: React.ReactNode; title: string; desc: string; children: React.ReactNode }> = ({
  icon,
  title,
  desc,
  children,
}) => (
  <Card className="p-6 space-y-5">
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">{icon}</span>
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
    {children}
  </Card>
);
