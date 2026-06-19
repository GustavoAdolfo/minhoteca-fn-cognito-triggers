import b64 from 'base64-js';
import { CustomEmailSenderTriggerEvent } from 'aws-lambda';
import { Logger } from 'winston';
// @ts-expect-error - Mocked in tests
import { buildClient, CommitmentPolicy, KmsKeyringNode } from '@aws-crypto/client-node';
import { SES, SendEmailCommand } from '@aws-sdk/client-ses';
import { createPreSignedUrlLogo, getTemplateEmail } from './commom';

const ses = new SES();

const sendEmailSignUp = async (
  code: string,
  to: string | null | undefined,
  userName: string,
  logger: Logger
): Promise<void> => {
  const logoUrl = await createPreSignedUrlLogo(logger);
  const template = process.env.TEMPLATE_EMAIL_SIGNUP ?? '';
  let emailTemplate = await getTemplateEmail(template, logger);
  emailTemplate = (emailTemplate ?? '')
    .replace('{####}', code)
    .replace(/{{NOME_USUARIO}}/g, userName)
    .replace(/{{LOGO_URL}}/g, logoUrl ?? '#')
    .replace(/{{LINK_SOBRE}}/g, process.env.LINK_SOBRE ?? '#')
    .replace(/{{LINK_POLITICA_DE_PRIVACIDADE}}/g, process.env.LINK_POLITICA_DE_PRIVACIDADE ?? '#')
    .replace(/{{LINK_TERMO_DE_USO}}/g, process.env.LINK_TERMO_DE_USO ?? '#');
  await sendEmail(emailTemplate, to ?? '', logoUrl ?? '#', logger);
};

const sendEmail = async (
  templateData: string,
  to: string,
  logoUrl: string,
  logger: Logger
): Promise<void> => {
  const eParams = {
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Body: {
        Text: {
          Data: templateData,
        },
        Html: {
          Data: templateData,
        },
      },
      Subject: {
        Data: 'Boas vindas à Minhoteca!',
      },
      Headers: [
        {
          Name: 'reply-to',
          Value: 'nao-responda@minhoteca.com.br',
        },
      ],
      Attachments: [
        {
          Name: 'logo.png',
          Data: logoUrl,
          ContentType: 'image/png',
        },
        // {
        //   Name: "termos-de-uso.pdf",
        //   Data: "https://minhoteca.com.br/termos-de-uso.pdf",
        //   ContentType: "application/pdf",
        // }
      ],
    },
    Source: 'minhoteca@livrosviajantes.com.br',
    ReplyToAddresses: ['no-reply@minhoteca.com.br'],
    Attachments: [
      {
        Name: 'logo.png',
        Data: logoUrl,
        ContentType: 'image/png',
      },
    ],
  };

  if (process.env['ENVIRONMENT']?.toLowerCase() === 'debug') {
    logger.info('sendEmail - 2', { eParams });
  }
  await ses.send(new SendEmailCommand(eParams));
};

const customEmailSender = async (
  event: CustomEmailSenderTriggerEvent,
  logger: Logger
): Promise<CustomEmailSenderTriggerEvent> => {
  if (process.env['ENVIRONMENT']?.toLowerCase() === 'debug') {
    logger.info('Starting customEmailSender...');
  }

  let plainTextCode: string = '';

  const { decrypt } = buildClient(CommitmentPolicy.REQUIRE_ENCRYPT_ALLOW_DECRYPT);
  const generatorKeyId = process.env.KEY_ALIAS;
  const keyIds = [process.env.KEY_ARN ?? ''];
  const keyring = new KmsKeyringNode({ generatorKeyId, keyIds });
  if (event.request.code) {
    const { plaintext } = await decrypt(keyring, b64.toByteArray(event.request.code));
    plainTextCode = plaintext.toString();
  }

  if (event.triggerSource === 'CustomEmailSender_SignUp') {
    await sendEmailSignUp(
      plainTextCode,
      event.request.userAttributes.email,
      event.request.userAttributes.email.split('@')[0],
      logger
    );
  } else if (event.triggerSource === 'CustomEmailSender_ResendCode') {
  } else if (event.triggerSource === 'CustomEmailSender_ForgotPassword') {
  } else if (event.triggerSource === 'CustomEmailSender_UpdateUserAttribute') {
  } else if (event.triggerSource === 'CustomEmailSender_VerifyUserAttribute') {
  } else if (event.triggerSource === 'CustomEmailSender_AdminCreateUser') {
  } else if (event.triggerSource === 'CustomEmailSender_AccountTakeOverNotification') {
  } else {
  }
  return event;
};

export { customEmailSender };
