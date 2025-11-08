/**
 * Unit tests for manage_secrets tool
 */

import { manageSecrets } from '../tools/manage-secrets';
import * as secretsManager from '../utils/secrets-manager';

// Mock keytar
jest.mock('keytar', () => ({
  setPassword: jest.fn(),
  getPassword: jest.fn(),
  deletePassword: jest.fn(),
  findCredentials: jest.fn(),
}));

describe('manage_secrets tool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('store action', () => {
    it('should store a secret successfully', async () => {
      jest.spyOn(secretsManager, 'isKeychainAvailable').mockResolvedValue(true);
      jest.spyOn(secretsManager, 'storeSecret').mockResolvedValue(undefined);

      const result = await manageSecrets({
        action: 'store',
        key: 'api_key',
        value: 'secret123',
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('store');
      expect(result.key).toBe('api_key');
      expect(result.message).toContain('stored successfully');
    });

    it('should fail when keychain unavailable', async () => {
      jest.spyOn(secretsManager, 'isKeychainAvailable').mockResolvedValue(false);

      const result = await manageSecrets({
        action: 'store',
        key: 'api_key',
        value: 'secret123',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('not available');
    });

    it('should fail when key or value missing', async () => {
      jest.spyOn(secretsManager, 'isKeychainAvailable').mockResolvedValue(true);

      const result = await manageSecrets({
        action: 'store',
        key: 'api_key',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('required');
    });
  });

  describe('retrieve action', () => {
    it('should retrieve a secret successfully', async () => {
      jest.spyOn(secretsManager, 'isKeychainAvailable').mockResolvedValue(true);
      jest.spyOn(secretsManager, 'retrieveSecret').mockResolvedValue('secret123');

      const result = await manageSecrets({
        action: 'retrieve',
        key: 'api_key',
      });

      expect(result.success).toBe(true);
      expect(result.value).toBe('secret123');
    });
  });

  describe('rotate action', () => {
    it('should rotate a secret successfully', async () => {
      jest.spyOn(secretsManager, 'isKeychainAvailable').mockResolvedValue(true);
      jest.spyOn(secretsManager, 'rotateSecret').mockResolvedValue(undefined);

      const result = await manageSecrets({
        action: 'rotate',
        key: 'api_key',
        value: 'newsecret456',
        rotationDays: 30,
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('rotate');
    });
  });

  describe('delete action', () => {
    it('should delete a secret successfully', async () => {
      jest.spyOn(secretsManager, 'isKeychainAvailable').mockResolvedValue(true);
      jest.spyOn(secretsManager, 'deleteSecret').mockResolvedValue(undefined);

      const result = await manageSecrets({
        action: 'delete',
        key: 'api_key',
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('delete');
    });
  });

  describe('list action', () => {
    it('should list all secrets successfully', async () => {
      jest.spyOn(secretsManager, 'isKeychainAvailable').mockResolvedValue(true);
      jest.spyOn(secretsManager, 'listSecrets').mockResolvedValue([
        {
          key: 'api_key',
          metadata: {
            description: 'API Key',
            createdBy: 'user',
            createdAt: '2025-01-01',
            rotationDays: 90,
            accessCount: 5,
            rotationDue: '2025-04-01',
          },
        },
      ]);

      const result = await manageSecrets({
        action: 'list',
      });

      expect(result.success).toBe(true);
      expect(result.secrets).toHaveLength(1);
      expect(result.secrets![0].key).toBe('api_key');
    });
  });
});
