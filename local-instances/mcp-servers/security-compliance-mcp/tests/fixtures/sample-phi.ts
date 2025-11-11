/**
 * Test fixtures for PHI detection
 * These are FAKE PHI data for testing purposes only
 */

export const FAKE_PHI = {
  ssn: 'SSN: 123-45-6789',
  mrn: 'MRN: ABC123456',
  dob: 'Date of Birth: 01/15/1980',
  patientName: 'Patient Name: John Doe',
  email: 'Email: patient.email@example.com',
  phone: 'Phone: (555) 123-4567',
  address: 'Address: 123 Main Street',
  zip: 'ZIP: 12345-6789',
  icdCode: 'ICD Code: E11.9',
  cptCode: 'CPT: 99213',
  prescription: 'Prescription Number: RX789456',
  labResult: 'Lab result: 120 mg/dL',
  insurancePolicy: 'Policy Number: POL123456',
  ipAddress: 'IP Address: 192.168.1.100',
  chartNote: 'Patient is complaining of severe headaches',
  medication: 'amoxicillin 500 mg',
};

export const SAFE_MEDICAL_STRINGS = {
  genericReference: 'The patient should see their doctor',
  testData: 'Test patient: Test User (not real)',
  documentation: 'Store patient MRN in the database',
  comment: '// Get patient date of birth from form',
};

export const MEDICAL_CONTEXT_INDICATORS = {
  keywords: ['patient', 'diagnosis', 'treatment', 'medical record', 'physician', 'healthcare'],
  filePaths: ['/patient-data/', '/medical-records/', '/phi/'],
  variableNames: ['patientName', 'patientDOB', 'patientMRN'],
};
