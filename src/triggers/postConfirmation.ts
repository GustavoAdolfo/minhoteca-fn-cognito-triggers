import { SES, SendEmailCommand } from '@aws-sdk/client-ses';
import {
  CognitoIdentityProviderClient,
  AdminUpdateUserAttributesCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { PostConfirmationTriggerEvent } from 'aws-lambda';
import { Logger } from 'winston';
import { createPreSignedUrlLogo, getTemplateEmail } from './commom';

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

const ses = new SES();

const sendEmail = async (to: string, user: string, logger: Logger): Promise<void> => {
  const logoUrl = await createPreSignedUrlLogo(logger);
  const template = process.env.TEMPLATE_EMAIL_CONFIRMATION ?? '';
  let emailTemplate = await getTemplateEmail(template, logger);
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
  try {
    await ses.send(new SendEmailCommand(eParams));
  } catch (error) {
    logger.error('Error in seneEmail', { error });
  }
};

const postConfirmation = async (
  event: PostConfirmationTriggerEvent,
  logger: Logger
): Promise<PostConfirmationTriggerEvent> => {
  if (process.env['ENVIRONMENT']?.toLowerCase() === 'debug') {
    logger.info('Starting postConfirmation...');
  }

  if (event.request.userAttributes.email) {
    await sendEmail(
      event.request.userAttributes.email,
      event.request.userAttributes.email.split('@')[0],
      logger
    );
  }

  const acknowledgementDate = new Date();

  try {
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
    logger.info('AdminUpdateUserAttributesCommand', { response });

    // TODO: SALVAR NO DYNAMODB A DATA E O CONTEÚDO DO ACEITE DOS TERMOS DE USO PARA O USUÁRIO
  } catch (error) {
    logger.error('Error in postConfirmation', { error });
    // throw error;
  }

  return event;
};

export { postConfirmation };
