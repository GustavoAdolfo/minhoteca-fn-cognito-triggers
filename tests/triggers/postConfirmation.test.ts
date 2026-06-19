import { jest } from '@jest/globals';

describe('postConfirmation', () => {
  const originalEnv = process.env;

  const setupModule = (options?: {
    sesReject?: unknown;
    cognitoReject?: unknown;
    logoUrlValue?: string | null | undefined;
    templateBody?: string | undefined;
  }) => {
    jest.resetModules();

    const sesSendMock = options?.sesReject
      ? jest.fn().mockRejectedValue(options.sesReject)
      : jest.fn().mockResolvedValue({});

    const cognitoSendMock = options?.cognitoReject
      ? jest.fn().mockRejectedValue(options.cognitoReject)
      : jest.fn().mockResolvedValue({ ok: true });

    const hasCustomLogoUrl = Object.prototype.hasOwnProperty.call(options ?? {}, 'logoUrlValue');
    const hasCustomTemplateBody = Object.prototype.hasOwnProperty.call(
      options ?? {},
      'templateBody'
    );

    const createPreSignedUrlLogoMock = jest
      .fn()
      .mockResolvedValue(
        hasCustomLogoUrl ? options?.logoUrlValue : 'https://assets.example.com/logo.png'
      );

    const getTemplateEmailMock = jest
      .fn()
      .mockResolvedValue(
        hasCustomTemplateBody
          ? options?.templateBody
          : 'Olá {{NOME_USUARIO}}, logo {{LOGO_URL}}, sobre {{LINK_SOBRE}}, priv {{LINK_POLITICA_DE_PRIVACIDADE}}, termo {{LINK_TERMO_DE_USO}}'
      );

    jest.doMock('@aws-sdk/client-ses', () => ({
      SES: jest.fn().mockImplementation(() => ({
        send: sesSendMock,
      })),
      SendEmailCommand: jest.fn().mockImplementation((params) => ({
        input: params,
      })),
    }));

    jest.doMock('@aws-sdk/client-cognito-identity-provider', () => ({
      CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({
        send: cognitoSendMock,
      })),
      AdminUpdateUserAttributesCommand: jest.fn().mockImplementation((params) => ({
        input: params,
      })),
    }));

    jest.doMock('../../src/triggers/commom', () => ({
      createPreSignedUrlLogo: createPreSignedUrlLogoMock,
      getTemplateEmail: getTemplateEmailMock,
    }));

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { postConfirmation } = require('../../src/triggers/postConfirmation');

    return {
      postConfirmation,
      mocks: {
        sesSendMock,
        cognitoSendMock,
        createPreSignedUrlLogoMock,
        getTemplateEmailMock,
      },
    };
  };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ENVIRONMENT: 'dev',
      AWS_REGION: 'us-east-1',
      TEMPLATE_EMAIL_CONFIRMATION: 'confirmation-template.html',
      LINK_SOBRE: 'https://example.com/sobre',
      LINK_POLITICA_DE_PRIVACIDADE: 'https://example.com/privacidade',
      LINK_TERMO_DE_USO: 'https://example.com/termos',
      ACKNOWLEDGMENT_FILE_PATH: '/docs/termos-v1.pdf',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('sends confirmation email and updates user attributes in Cognito', async () => {
    const { postConfirmation, mocks } = setupModule();
    const logger = { info: jest.fn(), error: jest.fn() };

    const event = {
      userPoolId: 'pool-id',
      userName: 'username-1',
      request: {
        userAttributes: {
          email: 'usuario@exemplo.com',
        },
      },
      response: {},
    };

    const result = await postConfirmation(event, logger);

    expect(result).toBe(event);
    expect(mocks.createPreSignedUrlLogoMock).toHaveBeenCalledWith(logger);
    expect(mocks.getTemplateEmailMock).toHaveBeenCalledWith('confirmation-template.html', logger);
    expect(mocks.sesSendMock).toHaveBeenCalledTimes(1);
    expect(mocks.cognitoSendMock).toHaveBeenCalledTimes(1);

    const emailCommand = mocks.sesSendMock.mock.calls[0][0];
    const textData = emailCommand.input?.Message?.Body?.Text?.Data;
    expect(textData).toContain('Olá usuario');
    expect(textData).toContain('logo https://assets.example.com/logo.png');
    expect(textData).toContain('sobre https://example.com/sobre');
    expect(textData).toContain('priv https://example.com/privacidade');
    expect(textData).toContain('termo https://example.com/termos');

    const cognitoCommand = mocks.cognitoSendMock.mock.calls[0][0];
    const attrs = cognitoCommand.input?.UserAttributes;
    expect(cognitoCommand.input?.UserPoolId).toBe('pool-id');
    expect(cognitoCommand.input?.Username).toBe('username-1');
    expect(attrs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ Name: 'custom:newUser', Value: 'true' }),
        expect.objectContaining({ Name: 'custom:acknowledgement', Value: 'true' }),
        expect.objectContaining({
          Name: 'custom:acknowledgement_term',
          Value: '/docs/termos-v1.pdf',
        }),
      ])
    );
    expect(attrs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Name: 'custom:acknowledgement_date',
          Value: expect.stringMatching(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} UTC$/),
        }),
      ])
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('does not attempt email send when user email is missing, but still updates attributes', async () => {
    const { postConfirmation, mocks } = setupModule();
    const logger = { info: jest.fn(), error: jest.fn() };

    const event = {
      userPoolId: 'pool-id',
      userName: 'username-1',
      request: {
        userAttributes: {},
      },
      response: {},
    };

    const result = await postConfirmation(event, logger);

    expect(result).toBe(event);
    expect(mocks.createPreSignedUrlLogoMock).not.toHaveBeenCalled();
    expect(mocks.getTemplateEmailMock).not.toHaveBeenCalled();
    expect(mocks.sesSendMock).not.toHaveBeenCalled();
    expect(mocks.cognitoSendMock).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs sendEmail errors and still updates user attributes', async () => {
    const sesError = new Error('ses-failure');
    const { postConfirmation, mocks } = setupModule({ sesReject: sesError });
    const logger = { info: jest.fn(), error: jest.fn() };

    const event = {
      userPoolId: 'pool-id',
      userName: 'username-1',
      request: {
        userAttributes: {
          email: 'usuario@exemplo.com',
        },
      },
      response: {},
    };

    const result = await postConfirmation(event, logger);

    expect(result).toBe(event);
    expect(mocks.sesSendMock).toHaveBeenCalledTimes(1);
    expect(mocks.cognitoSendMock).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith('Error in seneEmail', {
      error: sesError,
    });
  });

  it('logs postConfirmation error when Cognito update fails and still returns event', async () => {
    const cognitoError = new Error('cognito-failure');
    const { postConfirmation, mocks } = setupModule({ cognitoReject: cognitoError });
    const logger = { info: jest.fn(), error: jest.fn() };

    const event = {
      userPoolId: 'pool-id',
      userName: 'username-1',
      request: {
        userAttributes: {
          email: 'usuario@exemplo.com',
        },
      },
      response: {},
    };

    const result = await postConfirmation(event, logger);

    expect(result).toBe(event);
    expect(mocks.cognitoSendMock).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith('Error in postConfirmation', {
      error: cognitoError,
    });
  });

  it('covers debug mode and env fallback branches in sendEmail and Cognito attributes', async () => {
    process.env.ENVIRONMENT = 'debug';
    delete process.env.TEMPLATE_EMAIL_CONFIRMATION;
    delete process.env.LINK_SOBRE;
    delete process.env.LINK_POLITICA_DE_PRIVACIDADE;
    delete process.env.LINK_TERMO_DE_USO;
    delete process.env.ACKNOWLEDGMENT_FILE_PATH;

    const { postConfirmation, mocks } = setupModule({
      logoUrlValue: undefined,
      templateBody:
        'Olá {{NOME_USUARIO}}, logo {{LOGO_URL}}, sobre {{LINK_SOBRE}}, priv {{LINK_POLITICA_DE_PRIVACIDADE}}, termo {{LINK_TERMO_DE_USO}}',
    });
    const logger = { info: jest.fn(), error: jest.fn() };

    const event = {
      userPoolId: 'pool-id',
      userName: 'username-1',
      request: {
        userAttributes: {
          email: 'usuario@exemplo.com',
        },
      },
      response: {},
    };

    const result = await postConfirmation(event, logger);

    expect(result).toBe(event);
    expect(logger.info).toHaveBeenCalledWith('Starting postConfirmation...');
    expect(mocks.getTemplateEmailMock).toHaveBeenCalledWith('', logger);

    const emailCommand = mocks.sesSendMock.mock.calls[0][0];
    const textData = emailCommand.input?.Message?.Body?.Text?.Data;
    expect(textData).toContain('logo #');
    expect(textData).toContain('sobre #');
    expect(textData).toContain('priv #');
    expect(textData).toContain('termo #');

    const cognitoCommand = mocks.cognitoSendMock.mock.calls[0][0];
    const attrs = cognitoCommand.input?.UserAttributes;
    expect(attrs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Name: 'custom:acknowledgement_term',
          Value: '',
        }),
      ])
    );
  });

  it('sends email with undefined body when template is undefined', async () => {
    const { postConfirmation, mocks } = setupModule({
      templateBody: undefined,
    });
    const logger = { info: jest.fn(), error: jest.fn() };

    const event = {
      userPoolId: 'pool-id',
      userName: 'username-1',
      request: {
        userAttributes: {
          email: 'usuario@exemplo.com',
        },
      },
      response: {},
    };

    const result = await postConfirmation(event, logger);

    expect(result).toBe(event);
    expect(mocks.sesSendMock).toHaveBeenCalledTimes(1);
    const emailCommand = mocks.sesSendMock.mock.calls[0][0];
    expect(emailCommand.input?.Message?.Body?.Text?.Data).toBeUndefined();
    expect(emailCommand.input?.Message?.Body?.Html?.Data).toBeUndefined();
    expect(logger.error).not.toHaveBeenCalled();
  });
});
