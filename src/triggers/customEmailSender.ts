import b64 from 'base64-js';
import { CustomEmailSenderTriggerEvent } from 'aws-lambda';
import { LogService } from '@gustavoadolfo/minhoteca-core-layer';
import { buildClient, CommitmentPolicy, KmsKeyringNode } from '@aws-crypto/client-node';
import { SES, SendEmailCommand } from '@aws-sdk/client-ses';
import { createPreSignedUrlLogo, getTemplateEmail } from './commom';

const ses = new SES();

const sendEmailSignUp = async (
  code: string,
  to: string | null | undefined,
  userName: string
): Promise<void> => {
  const logoUrl = await createPreSignedUrlLogo();
  const template = process.env.TEMPLATE_EMAIL_SIGNUP ?? '';
  let emailTemplate = await getTemplateEmail(template);
  emailTemplate = (emailTemplate ?? '')
    .replace('{####}', code)
    .replace(/{{NOME_USUARIO}}/g, userName)
    .replace(/{{LOGO_URL}}/g, logoUrl ?? '#')
    .replace(/{{LINK_SOBRE}}/g, process.env.LINK_SOBRE ?? '#')
    .replace(/{{LINK_POLITICA_DE_PRIVACIDADE}}/g, process.env.LINK_POLITICA_DE_PRIVACIDADE ?? '#')
    .replace(/{{LINK_TERMO_DE_USO}}/g, process.env.LINK_TERMO_DE_USO ?? '#');
  await sendEmail(emailTemplate, to ?? '', logoUrl ?? '#');
};

const sendEmail = async (templateData: string, to: string, logoUrl: string): Promise<void> => {
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

  await ses.send(new SendEmailCommand(eParams));
};

const customEmailSender = async (
  event: CustomEmailSenderTriggerEvent,
  requestId: string,
  logger: LogService
): Promise<CustomEmailSenderTriggerEvent> => {
  const triggerSource = event.triggerSource;

  logger.info('🏁 Evento iniciado', { requestId, triggerSource }, { event });

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
      event.request.userAttributes.email.split('@')[0]
    );
  } else if (event.triggerSource === 'CustomEmailSender_ResendCode') {
    logger.warn('⚠️ Trigger source não tratado', { triggerSource, requestId }, { event });
  } else if (event.triggerSource === 'CustomEmailSender_ForgotPassword') {
    logger.warn('⚠️ Trigger source não tratado', { triggerSource, requestId }, { event });
  } else if (event.triggerSource === 'CustomEmailSender_UpdateUserAttribute') {
    logger.warn('⚠️ Trigger source não tratado', { triggerSource, requestId }, { event });
  } else if (event.triggerSource === 'CustomEmailSender_VerifyUserAttribute') {
    logger.warn('⚠️ Trigger source não tratado', { triggerSource, requestId }, { event });
  } else if (event.triggerSource === 'CustomEmailSender_AdminCreateUser') {
    logger.warn('⚠️ Trigger source não tratado', { triggerSource, requestId }, { event });
  } else if (event.triggerSource === 'CustomEmailSender_AccountTakeOverNotification') {
    logger.warn('⚠️ Trigger source não tratado', { triggerSource, requestId }, { event });
  } else {
    logger.warn('⚠️ Trigger source não tratado', { triggerSource, requestId }, { event });
  }

  logger.info('✅ Evento finalizado', { requestId, triggerSource }, { event });

  return event;
};

export { customEmailSender };
