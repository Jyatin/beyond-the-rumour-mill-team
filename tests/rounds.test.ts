import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateExperienceRoundsAction } from '../src/server/actions/rounds';
import { getExperienceWithRounds } from '../src/server/queries/rounds';
import { db } from '../src/server/db';
import { user, experiences } from '../src/server/db/schema';

vi.mock('../src/server/auth-helpers', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requireUser: vi.fn().mockResolvedValue({ id: 'user_seed_1', role: 'student' } as any),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getCurrentUser: vi.fn().mockResolvedValue({ id: 'user_seed_1', role: 'student' } as any),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Rounds & Topics & Questions (Phase 2.3)', () => {
  beforeEach(async () => {
    // Insert user first
    await db.insert(user).values({
      id: 'user_seed_1',
      name: 'Seed User',
      email: 'seed@test.com',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).onConflictDoNothing();

    // Make sure we have a test experience owned by user_seed_1
    await db.insert(experiences).values({
      id: 'test_exp_rounds_1',
      companyId: 'google',
      companyName: 'Google',
      role: 'SWE',
      year: 2024,
      type: 'Full-time',
      rounds: 1,
      difficulty: 'Medium',
      studentName: 'Test Student',
      summary: 'Test',
      status: 'published',
      verificationStatus: 'verified',
      authorId: 'user_seed_1',
    }).onConflictDoUpdate({
      target: [experiences.id],
      set: { authorId: 'user_seed_1' }
    });
  });

  it('can add and update nested rounds, topics and questions', async () => {
    const roundsData = [
      {
        roundTypeName: 'Technical',
        title: 'Tech 1',
        topics: ['React', 'JavaScript'],
        questions: [
          { text: 'What is a hook?', topic: 'React', difficulty: 'Medium' }
        ]
      }
    ];

    const res = await updateExperienceRoundsAction({
      experienceId: 'test_exp_rounds_1',
      rounds: roundsData
    });
    expect(res.success).toBe(true);

    const fetched = await getExperienceWithRounds('test_exp_rounds_1');
    expect(fetched.length).toBe(1);
    expect(fetched[0].roundTypeName).toBe('Technical');
    expect(fetched[0].topics).toContain('React');
    expect(fetched[0].questions.length).toBe(1);
    expect(fetched[0].questions[0].text).toBe('What is a hook?');

    // Update to remove round
    await updateExperienceRoundsAction({
      experienceId: 'test_exp_rounds_1',
      rounds: []
    });

    const fetchedAfter = await getExperienceWithRounds('test_exp_rounds_1');
    expect(fetchedAfter.length).toBe(0);
  });

  it('prevents unauthorized edits', async () => {
    // Change auth to another user
    const authHelpers = await import('../src/server/auth-helpers');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(authHelpers.requireUser).mockResolvedValueOnce({ id: 'wrong_user', role: 'student' } as any);

    await expect(
      updateExperienceRoundsAction({
        experienceId: 'test_exp_rounds_1',
        rounds: []
      })
    ).rejects.toThrow('Unauthorized to edit this experience');
  });

  it('prevents cascading deletion of canonical questions', async () => {
    // Add a round with a question
    await updateExperienceRoundsAction({
      experienceId: 'test_exp_rounds_1',
      rounds: [
        {
          roundTypeName: 'Technical',
          title: 'Tech 1',
          topics: ['React'],
          questions: [{ text: 'Question to not delete', topic: 'React', difficulty: 'Medium' }]
        }
      ]
    });

    const fetched = await getExperienceWithRounds('test_exp_rounds_1');
    const canonicalId = fetched[0].questions[0].canonicalId;
    
    // Attempting to delete the canonical question directly should fail due to restrict constraint
    const { interviewQuestions } = await import('../src/server/db/schema');
    const { eq } = await import('drizzle-orm');
    
    await expect(
      db.delete(interviewQuestions).where(eq(interviewQuestions.id, canonicalId))
    ).rejects.toThrow();
  });
});
