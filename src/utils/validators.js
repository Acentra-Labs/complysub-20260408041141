export function validateEmail(email) {
  if (!email) return 'Email is required';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return 'Invalid email format';
  return null;
}

export function validatePhone(phone) {
  if (!phone) return null; // optional
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 10) return 'Phone must be at least 10 digits';
  return null;
}

export function validateRequired(value, fieldName) {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} is required`;
  }
  return null;
}

export function validateEIN(ein) {
  if (!ein) return null; // optional at add time
  const re = /^\d{2}-\d{7}$/;
  if (!re.test(ein)) return 'EIN must be in format XX-XXXXXXX';
  return null;
}

export function validateSubForm(data) {
  const errors = {};
  const nameErr = validateRequired(data.company_name, 'Company name');
  if (nameErr) errors.company_name = nameErr;

  const contactErr = validateRequired(data.contact_name, 'Contact name');
  if (contactErr) errors.contact_name = contactErr;

  if (data.email) {
    const emailErr = validateEmail(data.email);
    if (emailErr) errors.email = emailErr;
  }

  if (data.phone) {
    const phoneErr = validatePhone(data.phone);
    if (phoneErr) errors.phone = phoneErr;
  }

  if (data.ein) {
    const einErr = validateEIN(data.ein);
    if (einErr) errors.ein = einErr;
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

export function validateAgentForm(data) {
  const errors = {};
  const nameErr = validateRequired(data.full_name, 'Agent name');
  if (nameErr) errors.full_name = nameErr;

  const emailErr = validateEmail(data.email);
  if (emailErr) errors.email = emailErr;

  const agencyErr = validateRequired(data.agency_name, 'Agency name');
  if (agencyErr) errors.agency_name = agencyErr;

  return Object.keys(errors).length > 0 ? errors : null;
}

export function validateCertForm(data) {
  const errors = {};

  if (!data.coverage_type) errors.coverage_type = 'Coverage type is required';
  if (!data.policy_number) errors.policy_number = 'Policy number is required';
  if (!data.carrier) errors.carrier = 'Carrier is required';
  if (!data.effective_date) errors.effective_date = 'Effective date is required';
  if (!data.expiration_date) errors.expiration_date = 'Expiration date is required';

  if (data.effective_date && data.expiration_date) {
    if (new Date(data.expiration_date) <= new Date(data.effective_date)) {
      errors.expiration_date = 'Expiration must be after effective date';
    }
  }

  if (data.limit_per_occurrence !== undefined && data.limit_per_occurrence < 0) {
    errors.limit_per_occurrence = 'Limit cannot be negative';
  }

  return Object.keys(errors).length > 0 ? errors : null;
}
