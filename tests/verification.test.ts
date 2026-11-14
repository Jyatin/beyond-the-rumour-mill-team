import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requestWorkEmailVerificationAction, verifyWorkEmailOtpAction } from '../src/server/actions/verification';
import { db } from '../src/server/db';
import { user, companies, alumniProfiles, verificationChallenges } from '../src/server/db/schema';

vi.mock('../src/server/auth-helpers', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requireUser: vi.fn().mockResolvedValue({ id: 'user_seed_1', role: 'student' } as any),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getCurrentUser: vi.fn().mockResolvedValue({ id: 'user_seed_1', role: 'student' } as any),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Evidence & Verification (Phase 2.4)', () => {
  beforeEach(async () => {
    // Clear out old data to prevent test leakage
    await db.delete(verificationChallenges).execute();
    
    // Insert user
    await db.insert(user).values({
      id: 'user_seed_1',
      name: 'Seed User',
      email: 'seed@test.com',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).onConflictDoNothing();

    // Insert company
    await db.insert(companies).values({
      id: 'google_test',
      name: 'Google Test',
      domain: 'google.com',
      industry: 'Tech',
      roles: ['SWE'],
      verificationStatus: 'verified',
      lastVerifiedAt: new Date().toISOString(),
      topTopics: [],
      createdAt: new Date(),
    }).onConflictDoNothing();

    // Insert alumni profile
    await db.insert(alumniProfiles).values({
      id: 'alumni_test_1',
      name: 'Seed User',
      role: 'SWE',
      company: 'Google Test',
      companyId: 'google_test',
      college: 'Test U',
      year: 2024,
      interviewType: 'Full-time',
      avatarBg: 'bg-blue-500',
      quote: 'Test',
      tags: [],
      roundsCount: 0,
      verifiedStatus: 'review', // pending
      responseRate: '100%',
      userId: 'user_seed_1',
      createdAt: new Date(),
    }).onConflictDoNothing();
  });

  it('allows requesting verification with correct domain', async () => {
    const res = await requestWorkEmailVerificationAction({
      employmentId: 'alumni_test_1',
      email: 'student@google.com',
    });
    expect(res.success).toBe(true);
  });

  it('rejects verification request with wrong domain', async () => {
    await expect(
      requestWorkEmailVerificationAction({
        employmentId: 'alumni_test_1',
        email: 'student@yahoo.com',
      })
    ).rejects.toThrow('Email must end with @google.com');
  });

  it('rejects free-mail domains directly if required (handled by company domain)', async () => {
    // If company domain is google.com, gmail.com will fail.
    await expect(
      requestWorkEmailVerificationAction({
        employmentId: 'alumni_test_1',
        email: 'student@gmail.com',
      })
    ).rejects.toThrow('Email must end with @google.com');
  });

  it('rejects verification request for another user', async () => {
    const authHelpers = await import('../src/server/auth-helpers');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(authHelpers.requireUser).mockResolvedValueOnce({ id: 'wrong_user', role: 'student' } as any);

    await expect(
      requestWorkEmailVerificationAction({
        employmentId: 'alumni_test_1',
        email: 'student@google.com',
      })
    ).rejects.toThrow('Unauthorized to verify this employment');
  });

  it('verifies otp and creates evidence', async () => {
    // Get the challenge to know the OTP (we mock hashOtp or grab it directly for test if needed)
    // Actually the action generates a random OTP and we can't get it easily unless we mock.
    // Let's manually insert a known challenge.
    const crypto = await import('crypto');
    const otpHash = crypto.createHash("sha256").update("123456").digest("hex");
    
    await db.insert(verificationChallenges).values({
      id: 'test_challenge_1',
      employmentId: 'alumni_test_1',
      email: 'student@google.com',
      otpHash,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      maxAttempts: 3,
    });

    const res = await verifyWorkEmailOtpAction({
      employmentId: 'alumni_test_1',
      otp: '123456',
    });

    expect(res.success).toBe(true);
    
    // Check evidence was created
    const { getEvidenceForEmployment } = await import('../src/server/queries/verification');
    const ev = await getEvidenceForEmployment('alumni_test_1');
    expect(ev.length).toBeGreaterThan(0);
    expect(ev[0].kind).toBe('work_email');
    expect(ev[0].status).toBe('accepted');

    // 11. Used OTP cannot be reused
    await expect(
      verifyWorkEmailOtpAction({
        employmentId: 'alumni_test_1',
        otp: '123456',
      })
    ).rejects.toThrow('No active verification challenge');
  });

  it('rejects wrong OTP', async () => {
    const crypto = await import('crypto');
    const otpHash = crypto.createHash("sha256").update("654321").digest("hex");
    
    await db.insert(verificationChallenges).values({
      id: 'test_challenge_2',
      employmentId: 'alumni_test_1',
      email: 'student@google.com',
      otpHash,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      maxAttempts: 3,
    });

    await expect(
      verifyWorkEmailOtpAction({
        employmentId: 'alumni_test_1',
        otp: '111111',
      })
    ).rejects.toThrow('Invalid OTP');
  });

  it('rejects expired OTP', async () => {
    const crypto = await import('crypto');
    const otpHash = crypto.createHash("sha256").update("111111").digest("hex");
    
    await db.insert(verificationChallenges).values({
      id: 'test_challenge_3',
      employmentId: 'alumni_test_1',
      email: 'student@google.com',
      otpHash,
      expiresAt: new Date(Date.now() - 1000), // Expired
      maxAttempts: 3,
    });

    await expect(
      verifyWorkEmailOtpAction({
        employmentId: 'alumni_test_1',
        otp: '111111',
      })
    ).rejects.toThrow('OTP expired');
  });

  it('rejects too many attempts', async () => {
    const crypto = await import('crypto');
    const otpHash = crypto.createHash("sha256").update("111111").digest("hex");
    
    await db.insert(verificationChallenges).values({
      id: 'test_challenge_4',
      employmentId: 'alumni_test_1',
      email: 'student@google.com',
      otpHash,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      attempts: 3, // Max attempts
      maxAttempts: 3,
    });

    await expect(
      verifyWorkEmailOtpAction({
        employmentId: 'alumni_test_1',
        otp: '111111',
      })
    ).rejects.toThrow('Too many attempts');
  });

  it('throttles repeated OTP requests', async () => {
    // First request should succeed
    await requestWorkEmailVerificationAction({
      employmentId: 'alumni_test_1',
      email: 'student@google.com',
    });

    // Immediate second request should fail
    await expect(
      requestWorkEmailVerificationAction({
        employmentId: 'alumni_test_1',
        email: 'student@google.com',
      })
    ).rejects.toThrow('Please wait 1 minute before requesting another OTP');
  });

  it('fails safely in production if no email provider is configured', async () => {
    const originalEnv = process.env.NODE_ENV;
    const originalKey = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    
    try {
      await expect(
        requestWorkEmailVerificationAction({
          employmentId: 'alumni_test_1',
          email: 'student@google.com',
        })
      ).rejects.toThrow('Email provider not configured in production');
    } finally {
      process.env.RESEND_API_KEY = originalKey;
      (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
    }
  });
});

