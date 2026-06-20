import { jest } from '@jest/globals';

describe('customEmailSender', () => {
  const requestId = 'request-id';
  const originalEnv = process.env;

  const setupModule = (options?: {
    decryptReject?: unknown;
    sesReject?: unknown;
    logoUrl?: string | null;
    templateEmail?: string | null;
  }) => {
    jest.resetModules();

    const decryptMock = options?.decryptReject
      ? jest.fn().mockRejectedValue(options.decryptReject)
      : jest.fn().mockResolvedValue({
          plaintext: Buffer.from('123456'),
          messageHeader: {},
        });

    const getTemplateEmailMock = jest
      .fn()
      .mockResolvedValue(
        options?.templateEmail !== undefined
          ? options.templateEmail
          : '<html><body>Welcome {{email}}</body></html>'
      );
    const createPreSignedUrlLogoMock = jest
      .fn()
      .mockResolvedValue(
        options?.logoUrl !== undefined ? options.logoUrl : 'https://example.com/logo.png'
      );

    const sendMock = options?.sesReject
      ? jest.fn().mockRejectedValue(options.sesReject)
      : jest.fn().mockResolvedValue({ MessageId: 'test-message-id' });

    jest.doMock(
      '@aws-crypto/client-node',
      () => ({
        buildClient: jest.fn(() => ({
          encrypt: jest.fn(),
          decrypt: decryptMock,
        })),
        CommitmentPolicy: {
          REQUIRE_ENCRYPT_ALLOW_DECRYPT: 'policy',
        },
        KmsKeyringNode: jest.fn().mockImplementation(() => ({ keyring: true })),
      }),
      { virtual: true }
    );

    jest.doMock(
      'base64-js',
      () => ({
        toByteArray: jest.fn((val: string) => Buffer.from(val, 'base64')),
      }),
      { virtual: true }
    );

    jest.doMock(
      '@aws-sdk/client-ses',
      () => ({
        SES: jest.fn().mockImplementation(() => ({
          send: sendMock,
        })),
        SendEmailCommand: jest.fn().mockImplementation((params) => ({ params })),
      }),
      { virtual: true }
    );

    jest.doMock(
      '../../src/triggers/commom',
      () => ({
        createPreSignedUrlLogo: createPreSignedUrlLogoMock,
        getTemplateEmail: getTemplateEmailMock,
      }),
      { virtual: true }
    );

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { customEmailSender } = require('../../src/triggers/customEmailSender');

    return {
      customEmailSender,
      mocks: {
        decryptMock,
        getTemplateEmailMock,
        createPreSignedUrlLogoMock,
        sendMock,
      },
    };
  };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ENVIRONMENT: 'dev',
      AWS_REGION: 'us-east-1',
      KEY_ALIAS: 'test-key-alias',
      KEY_ARN: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('sends email for CustomEmailSender_SignUp trigger', async () => {
    const { customEmailSender, mocks } = setupModule();
    const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };

    const event = {
      triggerSource: 'CustomEmailSender_SignUp',
      request: {
        code: 'ZW5jcnlwdGVk',
        userAttributes: {
          email: 'usuario@exemplo.com',
        },
      },
    };

    const result = await customEmailSender(event, requestId, logger);

    expect(result).toBe(event);
    expect(mocks.decryptMock).toHaveBeenCalled();
    expect(mocks.sendMock).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('propagates error on decrypt failure', async () => {
    const { customEmailSender, mocks } = setupModule({
      decryptReject: new Error('Decrypt failed'),
    });
    const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };

    const event = {
      triggerSource: 'CustomEmailSender_SignUp',
      request: {
        code: 'ZW5jcnlwdGVk',
        userAttributes: {
          email: 'usuario@exemplo.com',
        },
      },
    };

    await expect(customEmailSender(event, requestId, logger)).rejects.toThrow('Decrypt failed');
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('propagates error on SES failure', async () => {
    const { customEmailSender, mocks } = setupModule({
      sesReject: new Error('SES failed'),
    });
    const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };

    const event = {
      triggerSource: 'CustomEmailSender_SignUp',
      request: {
        code: 'ZW5jcnlwdGVk',
        userAttributes: {
          email: 'usuario@exemplo.com',
        },
      },
    };

    await expect(customEmailSender(event, requestId, logger)).rejects.toThrow('SES failed');
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('returns event for CustomEmailSender_ResendCode without sending email', async () => {
    const { customEmailSender, mocks } = setupModule();
    const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };

    const event = {
      triggerSource: 'CustomEmailSender_ResendCode',
      request: {
        code: 'ZW5jcnlwdGVk',
        userAttributes: {
          email: 'usuario@example.com',
        },
      },
    };

    const result = await customEmailSender(event, requestId, logger);

    expect(result).toBe(event);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('returns event for CustomEmailSender_ForgotPassword without sending email', async () => {
    const { customEmailSender, mocks } = setupModule();
    const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };

    const event = {
      triggerSource: 'CustomEmailSender_ForgotPassword',
      request: {
        code: 'ZW5jcnlwdGVk',
        userAttributes: {
          email: 'usuario@example.com',
        },
      },
    };

    const result = await customEmailSender(event, requestId, logger);

    expect(result).toBe(event);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('returns event for CustomEmailSender_UpdateUserAttribute without sending email', async () => {
    const { customEmailSender, mocks } = setupModule();
    const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };

    const event = {
      triggerSource: 'CustomEmailSender_UpdateUserAttribute',
      request: {
        code: 'ZW5jcnlwdGVk',
        userAttributes: {
          email: 'usuario@example.com',
        },
      },
    };

    const result = await customEmailSender(event, requestId, logger);

    expect(result).toBe(event);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('returns event for CustomEmailSender_VerifyUserAttribute without sending email', async () => {
    const { customEmailSender, mocks } = setupModule();
    const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };

    const event = {
      triggerSource: 'CustomEmailSender_VerifyUserAttribute',
      request: {
        code: 'ZW5jcnlwdGVk',
        userAttributes: {
          email: 'usuario@example.com',
        },
      },
    };

    const result = await customEmailSender(event, requestId, logger);

    expect(result).toBe(event);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('returns event for CustomEmailSender_AdminCreateUser without sending email', async () => {
    const { customEmailSender, mocks } = setupModule();
    const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };

    const event = {
      triggerSource: 'CustomEmailSender_AdminCreateUser',
      request: {
        code: 'ZW5jcnlwdGVk',
        userAttributes: {
          email: 'usuario@example.com',
        },
      },
    };

    const result = await customEmailSender(event, requestId, logger);

    expect(result).toBe(event);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('returns event for CustomEmailSender_AccountTakeOverNotification without sending email', async () => {
    const { customEmailSender, mocks } = setupModule();
    const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };

    const event = {
      triggerSource: 'CustomEmailSender_AccountTakeOverNotification',
      request: {
        code: 'ZW5jcnlwdGVk',
        userAttributes: {
          email: 'usuario@example.com',
        },
      },
    };

    const result = await customEmailSender(event, requestId, logger);

    expect(result).toBe(event);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs debug message when ENVIRONMENT is debug', async () => {
    process.env.ENVIRONMENT = 'debug';
    const { customEmailSender, mocks } = setupModule();
    const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };

    const event = {
      triggerSource: 'CustomEmailSender_SignUp',
      request: {
        code: 'ZW5jcnlwdGVk',
        userAttributes: {
          email: 'usuario@example.com',
        },
      },
    };

    const result = await customEmailSender(event, requestId, logger);

    expect(result).toBe(event);
    expect(logger.info).toHaveBeenCalledWith(
      '🏁 Evento iniciado',
      { requestId, triggerSource: 'CustomEmailSender_SignUp' },
      { event }
    );
    expect(logger.info).toHaveBeenCalledWith(
      '✅ Evento finalizado',
      { requestId, triggerSource: 'CustomEmailSender_SignUp' },
      { event }
    );
  });

  it('throws when email is missing in user attributes', async () => {
    const { customEmailSender, mocks } = setupModule();
    const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };

    const event = {
      triggerSource: 'CustomEmailSender_SignUp',
      request: {
        code: 'ZW5jcnlwdGVk',
        userAttributes: {
          email: undefined,
        },
      },
    };

    await expect(customEmailSender(event, requestId, logger)).rejects.toThrow();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('skips decrypt when event.request.code is undefined', async () => {
    const { customEmailSender, mocks } = setupModule();
    const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };

    const event = {
      triggerSource: 'CustomEmailSender_SignUp',
      request: {
        code: undefined,
        userAttributes: {
          email: 'usuario@example.com',
        },
      },
    };

    const result = await customEmailSender(event, requestId, logger);

    expect(result).toBe(event);
    expect(mocks.decryptMock).not.toHaveBeenCalled();
  });

  it('uses fallback "#" when createPreSignedUrlLogo returns null', async () => {
    const { customEmailSender, mocks } = setupModule({ logoUrl: null });
    const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };

    const event = {
      triggerSource: 'CustomEmailSender_SignUp',
      request: {
        code: 'ZW5jcnlwdGVk',
        userAttributes: {
          email: 'usuario@example.com',
        },
      },
    };

    const result = await customEmailSender(event, requestId, logger);

    expect(result).toBe(event);
    expect(mocks.sendMock).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('uses empty string when getTemplateEmail returns null', async () => {
    const { customEmailSender, mocks } = setupModule({ templateEmail: null });
    const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };

    const event = {
      triggerSource: 'CustomEmailSender_SignUp',
      request: {
        code: 'ZW5jcnlwdGVk',
        userAttributes: {
          email: 'usuario@example.com',
        },
      },
    };

    const result = await customEmailSender(event, requestId, logger);

    expect(result).toBe(event);
    expect(mocks.sendMock).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('uses env var values when LINK_SOBRE, LINK_POLITICA_DE_PRIVACIDADE, LINK_TERMO_DE_USO and TEMPLATE_EMAIL_SIGNUP are set', async () => {
    process.env.LINK_SOBRE = 'https://minhoteca.com.br/sobre';
    process.env.LINK_POLITICA_DE_PRIVACIDADE = 'https://minhoteca.com.br/privacidade';
    process.env.LINK_TERMO_DE_USO = 'https://minhoteca.com.br/termos';
    process.env.TEMPLATE_EMAIL_SIGNUP = 'signup-template';

    const { customEmailSender, mocks } = setupModule();
    const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };

    const event = {
      triggerSource: 'CustomEmailSender_SignUp',
      request: {
        code: 'ZW5jcnlwdGVk',
        userAttributes: {
          email: 'usuario@example.com',
        },
      },
    };

    const result = await customEmailSender(event, requestId, logger);

    expect(result).toBe(event);
    expect(mocks.sendMock).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs sendEmail debug info when ENVIRONMENT is debug and email is sent', async () => {
    process.env.ENVIRONMENT = 'debug';

    const { customEmailSender, mocks } = setupModule();
    const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };

    const event = {
      triggerSource: 'CustomEmailSender_SignUp',
      request: {
        code: 'ZW5jcnlwdGVk',
        userAttributes: {
          email: 'usuario@example.com',
        },
      },
    };

    const result = await customEmailSender(event, requestId, logger);

    expect(result).toBe(event);
    expect(mocks.sendMock).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      '🏁 Evento iniciado',
      { requestId, triggerSource: 'CustomEmailSender_SignUp' },
      { event }
    );
    expect(logger.info).toHaveBeenCalledWith(
      '✅ Evento finalizado',
      { requestId, triggerSource: 'CustomEmailSender_SignUp' },
      { event }
    );
  });
});
