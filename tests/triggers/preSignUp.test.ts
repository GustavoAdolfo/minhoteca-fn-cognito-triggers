import { jest } from '@jest/globals';

describe('preSignUp', () => {
  const requestId = 'request-id';
  const originalEnv = process.env;

  const setupModule = (options?: {
    users?: Array<Record<string, unknown>>;
    sendReject?: unknown;
  }) => {
    jest.resetModules();

    const sendMock = options?.sendReject
      ? jest.fn().mockRejectedValue(options.sendReject)
      : jest.fn().mockResolvedValue({
          Users: options?.users ?? [],
        });

    const listUsersCommandMock = jest.fn().mockImplementation((input) => ({ input }));

    jest.doMock('@aws-sdk/client-cognito-identity-provider', () => ({
      CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({
        send: sendMock,
      })),
      ListUsersCommand: listUsersCommandMock,
    }));

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { preSignUp } = require('../../src/triggers/preSignUp');

    return {
      preSignUp,
      mocks: {
        sendMock,
        listUsersCommandMock,
      },
    };
  };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ENVIRONMENT: 'prod',
      AWS_REGION: 'us-east-1',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('sets auto confirmation flags to false when no user exists with the same email', async () => {
    const { preSignUp, mocks } = setupModule({ users: [] });
    const logger = {
      info: jest.fn(),
      error: jest.fn(),
    };

    const event = {
      userPoolId: 'pool-id',
      request: {
        userAttributes: {
          email: 'usuario@exemplo.com',
        },
      },
      response: {},
    };

    const result = await preSignUp(event, requestId, logger);

    expect(result).toBe(event);
    expect(mocks.listUsersCommandMock).toHaveBeenCalledWith({
      UserPoolId: 'pool-id',
      AttributesToGet: ['email', 'sub'],
      Filter: '"email"^="usuario@exemplo.com"',
    });
    expect(mocks.sendMock).toHaveBeenCalledTimes(1);
    expect(result.response.autoConfirmUser).toBe(false);
    expect(result.response.autoVerifyEmail).toBe(false);
    expect(result.response.autoVerifyPhone).toBe(false);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs duplicate user case and throws', async () => {
    const users = [{ Username: 'existing-user' }];
    const { preSignUp, mocks } = setupModule({ users });
    const logger = {
      info: jest.fn(),
      error: jest.fn(),
    };

    const event = {
      userPoolId: 'pool-id',
      request: {
        userAttributes: {
          email: 'usuario@exemplo.com',
        },
      },
      response: {},
    };

    await expect(preSignUp(event, requestId, logger)).rejects.toThrow('E-mail já cadastrado');

    expect(mocks.sendMock).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      'Usuário já existe',
      { requestId, triggerSource: undefined, user: users },
      { event }
    );
    expect(logger.error).not.toHaveBeenCalled();
    expect(event.response.autoConfirmUser).toBeUndefined();
  });

  it('rethrows when Cognito list users call fails', async () => {
    const sendError = new Error('cognito-list-failure');
    const { preSignUp, mocks } = setupModule({ sendReject: sendError });
    const logger = {
      info: jest.fn(),
      error: jest.fn(),
    };

    const event = {
      userPoolId: 'pool-id',
      request: {
        userAttributes: {
          email: 'usuario@exemplo.com',
        },
      },
      response: {},
    };

    await expect(preSignUp(event, requestId, logger)).rejects.toThrow('cognito-list-failure');

    expect(mocks.sendMock).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs start message in debug environment', async () => {
    process.env.ENVIRONMENT = 'debug';

    const { preSignUp } = setupModule({ users: [] });
    const logger = {
      info: jest.fn(),
      error: jest.fn(),
    };

    const event = {
      userPoolId: 'pool-id',
      request: {
        userAttributes: {
          email: 'usuario@exemplo.com',
        },
      },
      response: {},
    };

    await preSignUp(event, requestId, logger);

    expect(logger.info).toHaveBeenCalledWith(
      '🏁 Evento iniciado',
      { requestId, triggerSource: undefined },
      { event }
    );
    expect(logger.info).toHaveBeenCalledWith(
      '✅ Evento finalizado',
      { requestId, triggerSource: undefined },
      { event }
    );
  });
});
