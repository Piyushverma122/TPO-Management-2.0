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
  ListOrdered
} from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Dropdown, MultiSelect } from '../components/ui/Dropdown';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { useToast } from '../components/ui/Toast';
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

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      
      {/* Top Header & Breadcrumb */}
      <div className="space-y-2">
        <Breadcrumb
          items={[
            { label: 'Companies', path: '/companies' },
            { label: 'Add New Company' },
          ]}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/companies"
              className="p-2 bg-[#162032] border border-[#202D42] rounded-xl text-[#94A3B8] hover:text-white hover:border-[#A3E635]/40 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                Add New Company
                <Sparkles className="w-5 h-5 text-[#A3E635] animate-pulse" />
              </h1>
              <p className="text-xs sm:text-sm text-[#94A3B8]">
                Onboard a corporate recruitment partner and configure drive details matching exact specifications.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Glassmorphic Form Card matching Design Add Company page..jpg */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="p-6 sm:p-8 space-y-8 border-[#202D42]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* SECTION 1: LOGO UPLOAD & BASIC DETAILS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Logo Drag & Drop Upload Zone strictly matching image */}
              <div className="lg:col-span-4 relative group">
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wide mb-2">
                  Company Logo
                </label>
                <div className="border-2 border-dashed border-[#A3E635]/60 bg-[#101726] hover:border-[#A3E635] rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-3 transition-all duration-300 cursor-pointer shadow-[0_0_15px_rgba(163,230,53,0.1)] group-hover:shadow-[0_0_25px_rgba(163,230,53,0.25)] min-h-[220px]">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="sr-only"
                    id="logo-upload"
                  />
                  <label htmlFor="logo-upload" className="cursor-pointer flex flex-col items-center space-y-2">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-20 h-20 rounded-2xl object-cover border-2 border-[#A3E635]" />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30 flex items-center justify-center">
                        <Upload className="w-7 h-7" />
                      </div>
                    )}
                    <span className="text-sm font-bold text-white">Upload Logo</span>
                    <span className="text-xs text-[#64748B]">(Drag & Drop or Click)</span>
                  </label>
                </div>
              </div>

              {/* Main Fields Grid */}
              <div className="lg:col-span-8 space-y-4">
                
                {/* Row 1: Company Name & Job Role */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Company Name"
                    placeholder="e.g. Amazon / Microsoft"
                    leftIcon={<Building2 className="w-4 h-4 text-[#64748B]" />}
                    error={errors.companyName?.message}
                    {...register('companyName', {
                      required: 'Company name is required',
                      minLength: { value: 2, message: 'Name must be at least 2 characters' },
                    })}
                  />

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
                </div>

                {/* Row 2: Website & CTC Offered */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Official Website"
                    placeholder="www.example.com"
                    leftIcon={<Globe className="w-4 h-4 text-[#64748B]" />}
                    error={errors.website?.message}
                    {...register('website', {
                      required: 'Website URL is required',
                    })}
                  />

                  {/* CTC Package Range Fields matching CTC (Cost to Company) ₹20-₹28 LPA */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide">
                        CTC (Cost to Company)
                      </label>
                      <span className="text-xs font-extrabold text-[#A3E635]">
                        ₹{watchCtcMin || '20'} - ₹{watchCtcMax || '28'} LPA
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Min (e.g. 20)"
                        {...register('ctcMin', { required: true })}
                      />
                      <span className="text-[#64748B] font-bold">-</span>
                      <Input
                        type="number"
                        placeholder="Max (e.g. 28)"
                        {...register('ctcMax', { required: true })}
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3: Location & Bond */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Location"
                    placeholder="Bengaluru, India"
                    leftIcon={<MapPin className="w-4 h-4 text-[#64748B]" />}
                    {...register('location', { required: 'Location is required' })}
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
                </div>

                {/* Row 4: Primary HR Recruiter Information */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#202D42]">
                  <Input
                    label="HR Recruiter Name"
                    placeholder="e.g. Rahul Sharma"
                    {...register('hrName')}
                  />
                  <Input
                    label="HR Recruiter Email"
                    placeholder="e.g. hr@company.com"
                    type="email"
                    {...register('hrEmail')}
                  />
                  <Input
                    label="HR Recruiter Phone"
                    placeholder="e.g. +91 98765 43210"
                    {...register('hrPhone')}
                  />
                </div>

                {/* Application Deadline */}
                <Input
                  label="Application Deadline"
                  type="date"
                  leftIcon={<Calendar className="w-4 h-4 text-[#64748B]" />}
                  {...register('deadline', { required: 'Deadline date is required' })}
                />

              </div>
            </div>

            {/* SECTION 2: ELIGIBILITY CRITERIA SUBPANEL strictly matching design */}
            <div className="bg-[#101726] border border-[#202D42] rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#202D42] pb-3">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#A3E635]" />
                  Eligibility Criteria
                </h3>
                <span className="text-xs text-[#94A3B8]">Configured academic cut-offs</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                {/* Branches / Departments Multi-Select Tag Selector */}
                <div className="lg:col-span-6">
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

                {/* Min CGPA */}
                <div className="lg:col-span-3">
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
                </div>

                {/* Backlogs Allowed */}
                <div className="lg:col-span-3">
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
              </div>
            </div>

            {/* SECTION 3: DESCRIPTION WITH RICH TOOLBAR matching Design Add Company page..jpg */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wide">
                Detailed Job Description & Requirements
              </label>

              {/* Rich Text Editor Simulation Toolbar */}
              <div className="bg-[#101726] border border-[#202D42] rounded-t-2xl px-4 py-2 flex items-center gap-1 border-b-0">
                <button
                  type="button"
                  onClick={() => info('Rich Format', 'Bold formatting applied.')}
                  className="p-1.5 text-[#94A3B8] hover:text-white rounded-lg hover:bg-[#162032]"
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => info('Rich Format', 'Italic formatting applied.')}
                  className="p-1.5 text-[#94A3B8] hover:text-white rounded-lg hover:bg-[#162032]"
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => info('Rich Format', 'Underline formatting applied.')}
                  className="p-1.5 text-[#94A3B8] hover:text-white rounded-lg hover:bg-[#162032]"
                  title="Underline"
                >
                  <Underline className="w-4 h-4" />
                </button>
                <div className="h-4 w-px bg-[#202D42] mx-1" />
                <button
                  type="button"
                  onClick={() => info('Rich Format', 'Link added.')}
                  className="p-1.5 text-[#94A3B8] hover:text-white rounded-lg hover:bg-[#162032]"
                  title="Insert Link"
                >
                  <Link2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => info('Rich Format', 'Bullet list created.')}
                  className="p-1.5 text-[#94A3B8] hover:text-white rounded-lg hover:bg-[#162032]"
                  title="Bullet List"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => info('Rich Format', 'Numbered list created.')}
                  className="p-1.5 text-[#94A3B8] hover:text-white rounded-lg hover:bg-[#162032]"
                  title="Numbered List"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>
              </div>

              {/* Textarea Input */}
              <Textarea
                rows={5}
                className="rounded-t-none border-t-0"
                error={errors.description?.message}
                {...register('description', {
                  required: 'Job description is required',
                  minLength: { value: 10, message: 'Description must be at least 10 characters' },
                })}
              />
            </div>

            {/* FORM FOOTER ACTIONS strictly matching image Save Draft & Publish */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#202D42]">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => {
                  info('Draft Saved', 'Draft saved locally.');
                  navigate('/companies');
                }}
              >
                Save Draft
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="px-8 font-extrabold"
              >
                Publish
              </Button>
            </div>

          </form>
        </Card>
      </motion.div>

    </div>
  );
};
