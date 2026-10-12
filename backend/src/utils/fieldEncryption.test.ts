describe('fieldEncryption', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.PAYOUT_FIELD_ENCRYPTION_KEY = 'test-encryption-key-32chars!!!';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // Dynamic import to pick up env changes
  async function getModule() {
    // Clear module cache
    jest.resetModules();
    return import('./fieldEncryption');
  }

  it('encrypts and decrypts a string round-trip', async () => {
    const mod = await getModule();
    const plaintext = 'EG1234567890123456';
    const encrypted = mod.encryptSensitiveField(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(mod.decryptSensitiveField(encrypted)).toBe(plaintext);
  });

  it('produces different ciphertexts for the same input (random IV)', async () => {
    const mod = await getModule();
    const a = mod.encryptSensitiveField('test');
    const b = mod.encryptSensitiveField('test');
    expect(a).not.toBe(b);
  });

  it('throws when encryption key is not set', async () => {
    delete process.env.PAYOUT_FIELD_ENCRYPTION_KEY;
    const mod = await getModule();
    expect(() => mod.encryptSensitiveField('test')).toThrow('PAYOUT_FIELD_ENCRYPTION_KEY');
  });

  it('maskIban masks the middle of an IBAN', async () => {
    const mod = await getModule();
    expect(mod.maskIban('EG12 3456 7890 1234 5678')).toBe('EG12****5678');
  });

  it('maskIban returns **** for short IBANs', async () => {
    const mod = await getModule();
    expect(mod.maskIban('EG12')).toBe('****');
  });

  it('isPayoutFieldEncryptionConfigured returns true when key is set', async () => {
    const mod = await getModule();
    expect(mod.isPayoutFieldEncryptionConfigured()).toBe(true);
  });
});
