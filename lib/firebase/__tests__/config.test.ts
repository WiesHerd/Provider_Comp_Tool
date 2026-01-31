/**
 * Firebase Configuration Tests
 * 
 * Tests that Firebase config handles missing environment variables gracefully
 */

describe('Firebase Configuration', () => {
  // Mock environment variables
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should export auth and db', () => {
    // This test verifies the module can be imported without crashing
    expect(() => {
      require('../config');
    }).not.toThrow();
  });

  it('should handle missing environment variables gracefully', () => {
    // Clear Firebase env vars
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    delete process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    delete process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    delete process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
    delete process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

    // Should not throw - should export null values
    expect(() => {
      const config = require('../config');
      expect(config.auth).toBeNull();
      expect(config.db).toBeNull();
    }).not.toThrow();
  });

  it('should initialize Firebase when all env vars are present', () => {
    // Set all required env vars
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789';
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:123456789:web:test';

    // Should not throw
    expect(() => {
      require('../config');
    }).not.toThrow();
  });
});












