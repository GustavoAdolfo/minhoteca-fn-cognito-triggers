import { preAuthenticaton } from '../../src/triggers/preAuthentication';

describe('preAuthenticaton', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns the same event when environment is not debug', async () => {
    process.env.ENVIRONMENT = 'prod';
    const logger = {
      info: jest.fn(),
      error: jest.fn(),
    };

    const event = {
      request: {
        userAttributes: {
          email: 'usuario@exemplo.com',
        },
      },
      response: {},
    };

    const result = await preAuthenticaton(event as never, logger as never);

    expect(result).toBe(event);
    expect(logger.info).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs start message and returns the same event when environment is debug', async () => {
    process.env.ENVIRONMENT = 'debug';
    const logger = {
      info: jest.fn(),
      error: jest.fn(),
    };

    const event = {
      request: {
        userAttributes: {
          email: 'usuario@exemplo.com',
        },
      },
      response: {},
    };

    const result = await preAuthenticaton(event as never, logger as never);

    expect(result).toBe(event);
    expect(logger.info).toHaveBeenCalledWith('Starting preAuthenticaton...');
    expect(logger.error).not.toHaveBeenCalled();
  });
});
