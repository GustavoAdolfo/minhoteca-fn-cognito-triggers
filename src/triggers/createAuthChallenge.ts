import { SES, SendEmailCommand } from '@aws-sdk/client-ses';
import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { randomUUID } from 'crypto';
import { CreateAuthChallengeTriggerEvent } from 'aws-lambda';
import { LogService } from '@gustavoadolfo/minhoteca-core-layer';
import { createPreSignedUrlLogo, getTemplateEmail } from './commom';

const ses = new SES();

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

const sendEmail = async (to: string, user: string, code: string): Promise<void> => {
  const logoUrl = await createPreSignedUrlLogo();
  const template = process.env.TEMPLATE_EMAIL_LOGIN ?? '';
  let emailTemplate = await getTemplateEmail(template);
  emailTemplate = emailTemplate?.replace(/{{NOME_USUARIO}}/g, user);
  emailTemplate = emailTemplate?.replace(/{{LOGO_URL}}/g, logoUrl ?? '#');
  emailTemplate = emailTemplate?.replace(/{{LINK_SOBRE}}/g, process.env.LINK_SOBRE ?? '#');
  emailTemplate = emailTemplate?.replace(
    /{{LINK_POLITICA_DE_PRIVACIDADE}}/g,
    process.env.LINK_POLITICA_DE_PRIVACIDADE ?? '#'
  );
  emailTemplate = emailTemplate?.replace(
    /{{LINK_TERMO_DE_USO}}/g,
    process.env.LINK_TERMO_DE_USO ?? '#'
  );
  emailTemplate = emailTemplate?.replace(/{{CONFIRMATION_CODE}}/g, code);

  const eParams = {
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Body: {
        Text: {
          Data: emailTemplate,
        },
        Html: {
          Data: emailTemplate,
        },
      },
      Subject: {
        Data: 'Código para login na Minhoteca',
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

const createAuthChallenge = async (
  event: CreateAuthChallengeTriggerEvent,
  requestId: string,
  logger: LogService
): Promise<CreateAuthChallengeTriggerEvent> => {
  const triggerSource = event.triggerSource;

  logger.info('🏁 Evento iniciado', { requestId, triggerSource }, { event });

  const command = new AdminGetUserCommand({
    UserPoolId: event.userPoolId,
    Username: event.userName,
  });

  const user = await cognitoClient.send(command);
  if (!user) {
    return event;
  }

  // const sub =
  // user.UserAttributes?.filter((item) => item.Name === "sub")[0]?.Value ??
  // "";
  // if(sub != event.request.UserAttributes.sub) {
  //   logger.error("Identificador inválido.");
  //   return event;
  // }

  // event.response.publicChallengeParameters = {
  //   securityQuestion: "token"
  // }
  const code = randomUUID().substring(0, 6);
  if (process.env['ENVIRONMENT']?.toLowerCase() === 'debug') {
    logger.info('code', { code });
  }
  if (event.request.userAttributes.email) {
    await sendEmail(
      event.request.userAttributes.email,
      event.request.userAttributes.email.split('@')[0],
      code
    );
  }

  event.response.privateChallengeParameters = {
    code,
  };

  logger.info('✅ Evento finalizado', { requestId, triggerSource }, { event });

  return event;
};

export { createAuthChallenge };
