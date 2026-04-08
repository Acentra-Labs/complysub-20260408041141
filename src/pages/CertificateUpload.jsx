import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useToast } from '../components/Toast';
import { getSubById } from '../utils/helpers';
import { validateCertForm } from '../utils/validators';

export default function CertificateUpload() {
  const { subId } = useParams();
  const navigate = useNavigate();
  const { addCertificate } = useData();
  const toast = useToast();

  const sub = getSubById(subId);
  const [errors, setErrors] = useState({});
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [form, setForm] = useState({
    coverage_type: 'gl',
    policy_number: '',
    carrier: '',
    limit_per_occurrence: 1000000,
    limit_aggregate: 2000000,
    effective_date: '',
    expiration_date: '',
    additional_insured: false,
    is_ghost_policy: false,
  });

  if (!sub) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Subcontractor not found.</p>
        <Link to="/dashboard" className="text-primary-600 text-sm hover:underline mt-2 inline-block">Back</Link>
      </div>
    );
  }

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type === 'application/pdf') {
      setFile(f);
    } else {
      toast.error('Please upload a PDF file');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validateCertForm(form);
    if (errs) {
      setErrors(errs);
      return;
    }

    addCertificate({
      sub_id: subId,
      ...form,
      file_url: file ? `/certs/${file.name}` : null,
      uploaded_by: null,
    });

    toast.success(`${form.coverage_type === 'gl' ? 'General Liability' : "Workers' Comp"} certificate uploaded!`);
    navigate(`/sub/${subId}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <nav className="text-sm text-gray-500">
        <Link to="/dashboard" className="hover:text-primary-600">Dashboard</Link>
        <span className="mx-2">/</span>
        <Link to={`/sub/${subId}`} className="hover:text-primary-600">{sub.company_name}</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">Upload Certificate</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900">Upload Certificate</h1>
      <p className="text-sm text-gray-500">Upload a certificate of insurance for {sub.company_name}</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* File upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Certificate PDF</label>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
              isDragging ? 'border-primary-400 bg-primary-50' : file ? 'border-success-300 bg-success-50' : 'border-gray-300'
            }`}
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <svg className="w-8 h-8 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-900">{file.name}</span>
                <button type="button" onClick={() => setFile(null)} className="text-sm text-danger-600 hover:underline">Remove</button>
              </div>
            ) : (
              <div>
                <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <label className="cursor-pointer">
                  <span className="text-sm text-primary-600 font-medium hover:underline">Choose file</span>
                  <span className="text-sm text-gray-500"> or drag and drop</span>
                  <input type="file" accept=".pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Coverage type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Coverage Type *</label>
          <div className="flex gap-3">
            {[
              { value: 'gl', label: 'General Liability' },
              { value: 'wc', label: "Workers' Compensation" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update('coverage_type', opt.value)}
                className={`flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                  form.coverage_type === opt.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {errors.coverage_type && <p className="text-xs text-danger-600 mt-1">{errors.coverage_type}</p>}
        </div>

        {/* Policy details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Policy Number *</label>
            <input
              type="text"
              value={form.policy_number}
              onChange={(e) => update('policy_number', e.target.value)}
              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.policy_number ? 'border-danger-500' : 'border-gray-300'}`}
            />
            {errors.policy_number && <p className="text-xs text-danger-600 mt-1">{errors.policy_number}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Carrier *</label>
            <input
              type="text"
              value={form.carrier}
              onChange={(e) => update('carrier', e.target.value)}
              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.carrier ? 'border-danger-500' : 'border-gray-300'}`}
            />
            {errors.carrier && <p className="text-xs text-danger-600 mt-1">{errors.carrier}</p>}
          </div>
        </div>

        {/* Limits */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Limit Per Occurrence ($)</label>
            <input
              type="number"
              value={form.limit_per_occurrence}
              onChange={(e) => update('limit_per_occurrence', Number(e.target.value))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aggregate Limit ($)</label>
            <input
              type="number"
              value={form.limit_aggregate}
              onChange={(e) => update('limit_aggregate', Number(e.target.value))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date *</label>
            <input
              type="date"
              value={form.effective_date}
              onChange={(e) => update('effective_date', e.target.value)}
              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.effective_date ? 'border-danger-500' : 'border-gray-300'}`}
            />
            {errors.effective_date && <p className="text-xs text-danger-600 mt-1">{errors.effective_date}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date *</label>
            <input
              type="date"
              value={form.expiration_date}
              onChange={(e) => update('expiration_date', e.target.value)}
              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.expiration_date ? 'border-danger-500' : 'border-gray-300'}`}
            />
            {errors.expiration_date && <p className="text-xs text-danger-600 mt-1">{errors.expiration_date}</p>}
          </div>
        </div>

        {/* Checkboxes */}
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.additional_insured}
              onChange={(e) => update('additional_insured', e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Additional insured endorsement included</span>
          </label>
          {sub.is_sole_proprietor && form.coverage_type === 'wc' && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_ghost_policy}
                onChange={(e) => update('is_ghost_policy', e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Ghost policy (no covered employees)</span>
            </label>
          )}
        </div>

        {/* Compliance check */}
        {form.coverage_type === 'gl' && form.limit_per_occurrence < 1000000 && form.limit_per_occurrence > 0 && (
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
            <p className="text-sm text-warning-700">
              Per occurrence limit is below the $1,000,000 minimum required by Idaho industry standard.
            </p>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate(`/sub/${subId}`)}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Upload Certificate
          </button>
        </div>
      </form>
    </div>
  );
}
