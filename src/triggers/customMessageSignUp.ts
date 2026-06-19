import { SES } from '@aws-sdk/client-ses';
import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import { Agent } from 'http';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { CustomMessageTriggerEvent } from 'aws-lambda';
import { Logger } from 'winston';

const ses = new SES();
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

const getS3Client = () => {
  const config = {
    requestHandler: new NodeHttpHandler({
      httpAgent: new Agent({
        keepAlive: false,
      }),
    }),
    region: process.env.AWS_REGION ?? 'us-east-1',
    maxAttempts: 5,
  };
  return new S3Client(config);
};

async function createPreSignedUrlLogo(logger: Logger): Promise<string> {
  const bucketName = process.env.BUCKET_RESOURCES ?? '';
  const logoImg = process.env.LOGO_IMG ?? '';
  const logoContentType = process.env.LOGO_CONTENT_TYPE ?? '';
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: logoImg,
    ResponseContentType: logoContentType,
  });
  const url = await getSignedUrl(client, command, {
    expiresIn: 7 * 24 * 60 * 60,
  });
  if (process.env['ENVIRONMENT']?.toLowerCase() === 'debug') {
    logger.info('createPreSignedUrlLogo', { url });
  }
  return url;
}

async function getTemplateEmail(): Promise<string | undefined> {
  const bucketName = process.env.BUCKET_TEMPLATES ?? '';
  const templateName = process.env.TEMPLATE_EMAIL ?? '';
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: templateName,
  });
  const response = await client.send(command);
  const body = await response.Body?.transformToString();
  return body;
}

const sendEmail = async (to: string, user: string, logger: Logger): Promise<string> => {
  const logoUrl = await createPreSignedUrlLogo(logger);
  let emailTemplate = await getTemplateEmail();
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
  return emailTemplate ?? '';
};

const customMessageSignUp = async (
  event: CustomMessageTriggerEvent,
  logger: Logger
): Promise<CustomMessageTriggerEvent> => {
  try {
    if (event.triggerSource === 'CustomMessage_SignUp') {
      event.response.emailMessage = await sendEmail(
        event.request.userAttributes.email,
        event.request.userAttributes.email.split('@')[0],
        logger
      );
      event.response.emailSubject = 'Confirme sua conta na Minhoteca';
    }
  } catch (error) {
    logger.error('Error in customMessage', { error });
  }
  return event;
};

export { customMessageSignUp };
