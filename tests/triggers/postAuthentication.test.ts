import { jest } from '@jest/globals';

describe('postAuthentication', () => {
  const originalEnv = process.env;

  const setupModule = (options?: { cognitoReject?: unknown; httpStatusCode?: number }) => {
    jest.resetModules();

    const cognitoSendMock = options?.cognitoReject
      ? jest.fn().mockRejectedValue(options.cognitoReject)
      : jest.fn().mockResolvedValue({
          $metadata: {
            httpStatusCode: options?.httpStatusCode ?? 200,
          },
        });

    jest.doMock('@aws-sdk/client-cognito-identity-provider', () => ({
      CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({
        send: cognitoSendMock,
      })),
      AdminSetUserPasswordCommand: jest.fn().mockImplementation((params) => ({
        input: params,
      })),
    }));

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { postAuthentication } = require('../../src/triggers/postAuthentication');

    return {
      postAuthentication,
      mocks: {
        cognitoSendMock,
      },
    };
  };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ENVIRONMENT: 'dev',
      AWS_REGION: 'us-east-1',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns event without setting password when custom:newUser is not true', async () => {
    const { postAuthentication, mocks } = setupModule();
    const logger = { info: jest.fn(), error: jest.fn() };

    const event = {
      userPoolId: 'pool-id',
      userName: 'existing-user',
      request: {
        userAttributes: {
          email: 'usuario@exemplo.com',
          'custom:newUser': 'false',
        },
      },
      response: {},
    };

    const result = await postAuthentication(event, logger);

    expect(result).toBe(event);
    expect(mocks.cognitoSendMock).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('returns event without setting password when custom:newUser attribute is missing', async () => {
    const { postAuthentication, mocks } = setupModule();
    const logger = { info: jest.fn(), error: jest.fn() };

    const event = {
      userPoolId: 'pool-id',
      userName: 'existing-user',
      request: {
        userAttributes: {
          email: 'usuario@exemplo.com',
        },
      },
      response: {},
    };

    const result = await postAuthentication(event, logger);

    expect(result).toBe(event);
    expect(mocks.cognitoSendMock).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('sets user password when custom:newUser is true', async () => {
    const { postAuthentication, mocks } = setupModule();
    const logger = { info: jest.fn(), error: jest.fn() };

    const event = {
      userPoolId: 'pool-id',
      userName: 'new-user',
      request: {
        userAttributes: {
          email: 'newuser@exemplo.com',
          'custom:newUser': 'true',
        },
      },
      response: {},
    };

    const result = await postAuthentication(event, logger);

    expect(result).toBe(event);
    expect(mocks.cognitoSendMock).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith('Password set successfully');
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs error when password setting returns non-200 status code', async () => {
    const { postAuthentication, mocks } = setupModule({ httpStatusCode: 400 });
    const logger = { info: jest.fn(), error: jest.fn() };

    const event = {
      userPoolId: 'pool-id',
      userName: 'new-user',
      request: {
        userAttributes: {
          email: 'newuser@exemplo.com',
          'custom:newUser': 'true',
        },
      },
      response: {},
    };

    const result = await postAuthentication(event, logger);

    expect(result).toBe(event);
    expect(mocks.cognitoSendMock).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith('Error setting password', expect.any(Object));
  });

  it('logs and throws when Cognito client fails', async () => {
    const cognitoError = new Error('cognito-failure');
    const { postAuthentication } = setupModule({ cognitoReject: cognitoError });
    const logger = { info: jest.fn(), error: jest.fn() };

    const event = {
      userPoolId: 'pool-id',
      userName: 'new-user',
      request: {
        userAttributes: {
          email: 'newuser@exemplo.com',
          'custom:newUser': 'true',
        },
      },
      response: {},
    };

    await expect(postAuthentication(event, logger)).rejects.toThrow('cognito-failure');
    expect(logger.error).toHaveBeenCalledWith('Error in postAuthentication', {
      error: cognitoError,
    });
  });

  it('logs start message in debug mode', async () => {
    process.env.ENVIRONMENT = 'debug';
    const { postAuthentication } = setupModule();
    const logger = { info: jest.fn(), error: jest.fn() };

    const event = {
      userPoolId: 'pool-id',
      userName: 'user',
      request: {
        userAttributes: {
          email: 'user@example.com',
          'custom:newUser': 'false',
        },
      },
      response: {},
    };

    await postAuthentication(event, logger);

    expect(logger.info).toHaveBeenCalledWith('Starting postAuthentication...');
  });

  it('generates a valid password with sufficient complexity', async () => {
    const { postAuthentication, mocks } = setupModule();
    const logger = { info: jest.fn(), error: jest.fn() };

    const event = {
      userPoolId: 'pool-id',
      userName: 'new-user',
      request: {
        userAttributes: {
          email: 'newuser@exemplo.com',
          'custom:newUser': 'true',
        },
      },
      response: {},
    };

    await postAuthentication(event, logger);

    const callArgs = mocks.cognitoSendMock.mock.calls[0][0];
    const password = callArgs.input.Password;

    expect(password).toBeDefined();
    expect(password.length).toBeGreaterThanOrEqual(8);
  });
});
