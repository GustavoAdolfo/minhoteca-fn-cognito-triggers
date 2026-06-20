import { SES, SendEmailCommand } from '@aws-sdk/client-ses';
import {
  CognitoIdentityProviderClient,
  AdminUpdateUserAttributesCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { PostConfirmationTriggerEvent } from 'aws-lambda';
import { LogService } from '@gustavoadolfo/minhoteca-core-layer';
import { createPreSignedUrlLogo, getTemplateEmail } from './commom';

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

const ses = new SES();

const sendEmail = async (to: string, user: string): Promise<void> => {
  const logoUrl = await createPreSignedUrlLogo();
  const template = process.env.TEMPLATE_EMAIL_CONFIRMATION ?? '';
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
        Data: 'Está tudo pronto para começar suas aventuras literárias.',
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
      ],
    },
    Source: process.env.EMAIL_PRINCIPAL ?? '',
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

const postConfirmation = async (
  event: PostConfirmationTriggerEvent,
  requestId: string,
  logger: LogService
): Promise<PostConfirmationTriggerEvent> => {
  const triggerSource = event.triggerSource;

  logger.info('🏁 Evento iniciado', { requestId, triggerSource }, { event });

  if (event.request.userAttributes.email) {
    await sendEmail(
      event.request.userAttributes.email,
      event.request.userAttributes.email.split('@')[0]
    );
  }

  const acknowledgementDate = new Date();

  const input = {
    UserPoolId: event.userPoolId,
    Username: event.userName,
    UserAttributes: [
      {
        Name: 'custom:newUser',
        Value: 'true',
      },
      {
        Name: 'custom:acknowledgement_date',
        Value: acknowledgementDate.toISOString().replace('T', ' ').split('.')[0] + ' UTC',
      },
      {
        Name: 'custom:acknowledgement',
        Value: 'true',
      },
      {
        Name: 'custom:acknowledgement_term',
        Value: process.env.ACKNOWLEDGMENT_FILE_PATH ?? '',
      },
    ],
    ClientMetadata: {
      // ClientMetadataType
      //"<keys>": "STRING_VALUE",
    },
  };
  const command = new AdminUpdateUserAttributesCommand(input);
  const response = await client.send(command);

  logger.info('✅ Evento finalizado', { requestId, triggerSource }, { event, response });

  // TODO: SALVAR NUMA BASE A DATA E O CONTEÚDO DO ACEITE DOS TERMOS DE USO PARA O USUÁRIO

  return event;
};

export { postConfirmation };
