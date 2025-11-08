/**
 * Test fixtures for credential detection
 * These are FAKE credentials for testing purposes only
 */

export const FAKE_CREDENTIALS = {
  apiKey: 'api_key=sk_test_1234567890abcdefghijklmnopqrstuvwxyz',
  awsAccessKey: 'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE',
  awsSecretKey: 'AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  jwt: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  password: 'password="MySecretPassword123!"',
  privateKey: `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z
-----END RSA PRIVATE KEY-----`,
  genericSecret: 'secret: my-secret-value-12345',
};

export const SAFE_STRINGS = {
  comment: '// This is a comment about API keys',
  placeholder: 'api_key=YOUR_API_KEY_HERE',
  documentation: 'Set your API_KEY environment variable',
  variable: 'const apiKey = process.env.API_KEY;',
};
