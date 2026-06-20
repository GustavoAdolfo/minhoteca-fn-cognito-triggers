import {
  CognitoIdentityProviderClient,
  AdminSetUserPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { PostAuthenticationTriggerEvent } from 'aws-lambda';
import { LogService } from '@gustavoadolfo/minhoteca-core-layer';

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

const generatePassword = () => {
  const symbols = '!@#$%&*()+^><;~{[}]=_-)(';
  const alphaUpper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const alphaLower = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  let password = '';
  while (password.length < 8) {
    const char1 =
      symbols[Math.floor(Math.random() * symbols.length)] ??
      symbols[Math.floor(Math.random() * symbols.length)];
    const char2 =
      alphaUpper[Math.floor(Math.random() * symbols.length)] ??
      alphaUpper[Math.floor(Math.random() * symbols.length)];
    const char3 =
      alphaLower[Math.floor(Math.random() * symbols.length)] ??
      alphaLower[Math.floor(Math.random() * symbols.length)];
    const char4 =
      numbers[Math.floor(Math.random() * symbols.length)] ??
      numbers[Math.floor(Math.random() * symbols.length)];
    password += `${char1 ?? ''}${char2 ?? ''}${char3 ?? ''}${char4 ?? ''}`;
  }

  return password;
};

const postAuthentication = async (
  event: PostAuthenticationTriggerEvent,
  requestId: string,
  logger: LogService
): Promise<PostAuthenticationTriggerEvent> => {
  const triggerSource = event.triggerSource;

  logger.info('🏁 Evento iniciado', { requestId, triggerSource }, { event });

  if (event.request.userAttributes['custom:newUser'] === 'true') {
    // TODO: SE O ATRIBUTO NEWUSER = TRUE
    const command = new AdminSetUserPasswordCommand({
      UserPoolId: event.userPoolId,
      Username: event.userName,
      Password: generatePassword(),
      Permanent: true,
    });
    const response = await client.send(command);
    if (response.$metadata.httpStatusCode === 200) {
      logger.info('Password set successfully');
    } else {
      logger.error('Error setting password', { response });
    }

    logger.info('✅ Evento finalizado', { requestId, triggerSource }, { event });
    return event;
  }

  logger.info('✅ Evento finalizado', { requestId, triggerSource }, { event });
  return event;
};

export { postAuthentication };
