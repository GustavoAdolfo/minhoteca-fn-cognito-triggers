import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { PreSignUpTriggerEvent } from 'aws-lambda';
import { LogService } from '@gustavoadolfo/minhoteca-core-layer';

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

const preSignUp = async (
  event: PreSignUpTriggerEvent,
  requestId: string,
  logger: LogService
): Promise<PreSignUpTriggerEvent> => {
  const triggerSource = event.triggerSource;

  logger.info('🏁 Evento iniciado', { requestId, triggerSource }, { event });

  const input = {
    UserPoolId: event.userPoolId,
    AttributesToGet: ['email', 'sub'],
    Filter: `"email"^="${event.request.userAttributes.email}"`,
  };

  const command = new ListUsersCommand(input);
  const response = await client.send(command);

  if (response?.Users && response?.Users.length > 0) {
    logger.info('Usuário já existe', { requestId, triggerSource, user: response.Users }, { event });
    throw new Error('E-mail já cadastrado');
  }

  event.response.autoConfirmUser = false;
  event.response.autoVerifyEmail = false;
  event.response.autoVerifyPhone = false;

  logger.info('✅ Evento finalizado', { requestId, triggerSource }, { event });
  return event;
};

export { preSignUp };
