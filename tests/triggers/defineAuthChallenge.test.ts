import { jest } from '@jest/globals';
import { defineAuthChallenge } from '../../src/triggers/defineAuthChallenge';

describe('defineAuthChallenge', () => {
  const logger = {
    info: jest.fn(),
    error: jest.fn(),
  };

  const originalEnv = process.env;
  const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.ENVIRONMENT = 'dev';
  });

  afterAll(() => {
    process.env = originalEnv;
    consoleLogSpy.mockRestore();
  });

  const createEvent = (
    userNotFound = false,
    session: Array<{ challengeName?: string; challengeResult?: boolean }> = []
  ) => ({
    request: {
      userNotFound,
      session,
    },
    response: {},
  });

  it('fails authentication and throws when the user does not exist', async () => {
    const event = createEvent(true);

    await expect(defineAuthChallenge(event as never, logger as never)).rejects.toThrow(
      'User does not exist'
    );

    expect(event.response.issueTokens).toBe(false);
    expect(event.response.failAuthentication).toBe(true);
    expect(logger.error).toHaveBeenCalledWith('Error in defineAuthChallenge', {
      error: expect.any(Error),
    });
  });

  it('fails authentication and throws after 3 failed OTP attempts', async () => {
    const event = createEvent(false, [
      { challengeResult: false },
      { challengeResult: false },
      { challengeResult: false },
    ]);

    await expect(defineAuthChallenge(event as never, logger as never)).rejects.toThrow(
      'Invalid OTP'
    );

    expect(event.response.issueTokens).toBe(false);
    expect(event.response.failAuthentication).toBe(true);
    expect(consoleLogSpy).toHaveBeenCalledWith('wrong OTP even After 3 sessions?');
    expect(logger.error).toHaveBeenCalledWith('Error in defineAuthChallenge', {
      error: expect.any(Error),
    });
  });

  it('does not issue tokens but continues the flow when the correct OTP is provided after SRP_A', async () => {
    const event = createEvent(false, [{ challengeName: 'SRP_A', challengeResult: true }]);

    const result = await defineAuthChallenge(event as never, logger as never);

    expect(result.response.issueTokens).toBe(false);
    expect(result.response.failAuthentication).toBe(false);
    expect(result.response.challengeName).toBe('CUSTOM_CHALLENGE');
    expect(consoleLogSpy).toHaveBeenCalledWith('CORRECT OTP');
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('issues tokens when the correct OTP is provided after a custom challenge', async () => {
    const event = createEvent(false, [
      { challengeName: 'CUSTOM_CHALLENGE', challengeResult: true },
    ]);

    const result = await defineAuthChallenge(event as never, logger as never);

    expect(result.response.issueTokens).toBe(true);
    expect(result.response.failAuthentication).toBe(false);
    expect(result.response.challengeName).toBe('CUSTOM_CHALLENGE');
    expect(consoleLogSpy).toHaveBeenCalledWith('CORRECT OTP');
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('sets up a custom challenge when no correct OTP has been received yet', async () => {
    const event = createEvent(false, []);

    const result = await defineAuthChallenge(event as never, logger as never);

    expect(result.response.issueTokens).toBe(false);
    expect(result.response.failAuthentication).toBe(false);
    expect(result.response.challengeName).toBe('CUSTOM_CHALLENGE');
    expect(consoleLogSpy).toHaveBeenCalledWith('not yet received correct OTP');
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('sets up a custom challenge when the previous OTP was incorrect', async () => {
    const event = createEvent(false, [{ challengeResult: false }]);

    const result = await defineAuthChallenge(event as never, logger as never);

    expect(result.response.issueTokens).toBe(false);
    expect(result.response.failAuthentication).toBe(false);
    expect(result.response.challengeName).toBe('CUSTOM_CHALLENGE');
    expect(consoleLogSpy).toHaveBeenCalledWith('not yet received correct OTP');
    expect(logger.error).not.toHaveBeenCalled();
  });
});
