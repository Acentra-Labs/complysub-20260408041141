import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../components/Toast';
import { validateSubForm, validateAgentForm } from '../utils/validators';

const STEPS = ['Company Info', 'W-9 Upload', 'Agent Info', 'Review'];

export default function AddSubcontractor() {
  const { user, isConsultant } = useAuth();
  const { generalContractors, subcontractors, addSubcontractor } = useData();
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});

  const [companyData, setCompanyData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    ein: '',
    entity_type: 'LLC',
    is_sole_proprietor: false,
  });

  const [w9File, setW9File] = useState(null);

  const [agentData, setAgentData] = useState({
    full_name: '',
    email: '',
    phone: '',
    agency_name: '',
  });

  const [selectedGC, setSelectedGC] = useState(
    isConsultant ? '' : user?.gc_id || ''
  );

  // Check for existing sub
  const existingSub = companyData.company_name.length > 3
    ? subcontractors.find(
        (s) =>
          s.company_name.toLowerCase() === companyData.company_name.toLowerCase() ||
          (companyData.ein && s.ein === companyData.ein)
      )
    : null;

  const updateCompany = (field, value) => {
    setCompanyData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'entity_type' && value === 'Sole Proprietor' ? { is_sole_proprietor: true } : {}),
      ...(field === 'entity_type' && value !== 'Sole Proprietor' ? { is_sole_proprietor: false } : {}),
    }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const updateAgent = (field, value) => {
    setAgentData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleNext = () => {
    if (step === 0) {
      const errs = validateSubForm(companyData);
      if (errs) {
        setErrors(errs);
        return;
      }
    }
    if (step === 2) {
      if (agentData.full_name || agentData.email) {
        const errs = validateAgentForm(agentData);
        if (errs) {
          setErrors(errs);
          return;
        }
      }
    }
    setErrors({});
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = () => {
    if (isConsultant && !selectedGC) {
      toast.error('Please select a General Contractor');
      return;
    }

    const gcId = isConsultant ? selectedGC : user?.gc_id;
    const newSub = addSubcontractor(companyData, gcId);
    toast.success(`${newSub.company_name} has been added successfully!`);
    navigate(`/sub/${newSub.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500">
        <Link to="/dashboard" className="hover:text-primary-600">Dashboard</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">Add Subcontractor</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900">Add New Subcontractor</h1>

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                i < step
                  ? 'bg-success-500 text-white'
                  : i === step
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {i < step ? '\u2713' : i + 1}
            </div>
            <span className={`text-sm hidden sm:block ${i === step ? 'text-primary-700 font-medium' : 'text-gray-500'}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-gray-200 hidden sm:block" />}
          </div>
        ))}
      </div>

      {/* Existing sub warning */}
      {existingSub && step === 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <p className="text-sm font-medium text-primary-700">Existing subcontractor found</p>
          <p className="text-sm text-primary-600 mt-1">
            "{existingSub.company_name}" is already in the system. Agent info will be auto-populated.
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Step 0: Company Info */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Company Information</h2>
            {isConsultant && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign to General Contractor *</label>
                <select
                  value={selectedGC}
                  onChange={(e) => setSelectedGC(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select GC...</option>
                  {generalContractors.map((gc) => (
                    <option key={gc.id} value={gc.id}>{gc.company_name}</option>
                  ))}
                </select>
              </div>
            )}
            <FormField label="Company Name *" value={companyData.company_name} onChange={(v) => updateCompany('company_name', v)} error={errors.company_name} />
            <FormField label="Contact Name *" value={companyData.contact_name} onChange={(v) => updateCompany('contact_name', v)} error={errors.contact_name} />
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Email" value={companyData.email} onChange={(v) => updateCompany('email', v)} error={errors.email} type="email" />
              <FormField label="Phone" value={companyData.phone} onChange={(v) => updateCompany('phone', v)} error={errors.phone} type="tel" />
            </div>
            <FormField label="Address" value={companyData.address} onChange={(v) => updateCompany('address', v)} />
            <div className="grid grid-cols-2 gap-4">
              <FormField label="EIN" value={companyData.ein} onChange={(v) => updateCompany('ein', v)} error={errors.ein} placeholder="XX-XXXXXXX" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
                <select
                  value={companyData.entity_type}
                  onChange={(e) => updateCompany('entity_type', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="LLC">LLC</option>
                  <option value="S-Corp">S-Corp</option>
                  <option value="Corporation">Corporation</option>
                  <option value="Sole Proprietor">Sole Proprietor</option>
                  <option value="Partnership">Partnership</option>
                </select>
              </div>
            </div>
            {companyData.is_sole_proprietor && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm text-purple-700">
                  Sole proprietors are personally exempt from workers' comp under Idaho Code 72-223.
                  Ghost policy tracking will be available.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 1: W-9 Upload */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">W-9 Upload</h2>
            <p className="text-sm text-gray-500">
              Upload a W-9 form. In the production version, the system will auto-extract name, EIN, and address.
            </p>
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                w9File ? 'border-success-300 bg-success-50' : 'border-gray-300 hover:border-primary-300'
              }`}
            >
              {w9File ? (
                <div>
                  <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{w9File.name}</p>
                  <button
                    onClick={() => setW9File(null)}
                    className="text-sm text-danger-600 hover:underline mt-2"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <label className="cursor-pointer">
                    <span className="text-sm text-primary-600 font-medium hover:underline">Choose file</span>
                    <span className="text-sm text-gray-500"> or drag and drop</span>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => setW9File(e.target.files?.[0] || null)}
                    />
                  </label>
                  <p className="text-xs text-gray-400 mt-2">PDF up to 10MB</p>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400">
              W-9 upload is optional at this stage. You can skip and add it later.
            </p>
          </div>
        )}

        {/* Step 2: Agent Info */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Insurance Agent Information</h2>
            <p className="text-sm text-gray-500">
              Enter the insurance agent's details. The system will send certificate requests to this agent.
            </p>
            <FormField label="Agent Name *" value={agentData.full_name} onChange={(v) => updateAgent('full_name', v)} error={errors.full_name} />
            <FormField label="Agency Name *" value={agentData.agency_name} onChange={(v) => updateAgent('agency_name', v)} error={errors.agency_name} />
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Agent Email *" value={agentData.email} onChange={(v) => updateAgent('email', v)} error={errors.email} type="email" />
              <FormField label="Agent Phone" value={agentData.phone} onChange={(v) => updateAgent('phone', v)} type="tel" />
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-900">Review & Submit</h2>

            <ReviewSection title="Company Information">
              <ReviewRow label="Company" value={companyData.company_name} />
              <ReviewRow label="Contact" value={companyData.contact_name} />
              <ReviewRow label="Email" value={companyData.email || '—'} />
              <ReviewRow label="Phone" value={companyData.phone || '—'} />
              <ReviewRow label="Address" value={companyData.address || '—'} />
              <ReviewRow label="EIN" value={companyData.ein || '—'} />
              <ReviewRow label="Entity Type" value={companyData.entity_type} />
            </ReviewSection>

            <ReviewSection title="W-9">
              <ReviewRow label="File" value={w9File ? w9File.name : 'Not uploaded'} />
            </ReviewSection>

            <ReviewSection title="Insurance Agent">
              <ReviewRow label="Agent" value={agentData.full_name || '—'} />
              <ReviewRow label="Agency" value={agentData.agency_name || '—'} />
              <ReviewRow label="Email" value={agentData.email || '—'} />
              <ReviewRow label="Phone" value={agentData.phone || '—'} />
            </ReviewSection>

            {isConsultant && (
              <ReviewSection title="Assignment">
                <ReviewRow
                  label="General Contractor"
                  value={
                    generalContractors.find((g) => g.id === selectedGC)?.company_name || 'None selected'
                  }
                />
              </ReviewSection>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-4 border-t border-gray-200">
          {step > 0 ? (
            <button
              onClick={handleBack}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              &larr; Back
            </button>
          ) : (
            <div />
          )}
          {step < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Next &rarr;
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-success-600 text-white text-sm font-medium rounded-lg hover:bg-success-700 transition-colors"
            >
              Add Subcontractor
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, error, type = 'text', placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
          error ? 'border-danger-500' : 'border-gray-300'
        }`}
      />
      {error && <p className="text-xs text-danger-600 mt-1">{error}</p>}
    </div>
  );
}

function ReviewSection({ title, children }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
      <dl className="space-y-1.5">{children}</dl>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  );
}
