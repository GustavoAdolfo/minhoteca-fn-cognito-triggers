import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { PreSignUpTriggerEvent } from 'aws-lambda';
import { Logger } from 'winston';

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

const preSignUp = async (
  event: PreSignUpTriggerEvent,
  logger: Logger
): Promise<PreSignUpTriggerEvent> => {
  if (process.env['ENVIRONMENT']?.toLowerCase() === 'debug') {
    logger.info('preSignUp - starting');
  }
  const input = {
    UserPoolId: event.userPoolId,
    AttributesToGet: ['email', 'sub'],
    Filter: `"email"^="${event.request.userAttributes.email}"`,
  };
  try {
    // if (process.env['ENVIRONMENT']?.toLowerCase() === 'debug') {
    //   logger.info('preSignUp', { input });
    // }
    const command = new ListUsersCommand(input);
    const response = await client.send(command);
    // if (process.env['ENVIRONMENT']?.toLowerCase() === 'debug') {
    //   logger.info('preSignUp', { response });
    // }

    if (response?.Users && response?.Users.length > 0) {
      logger.info('Usuário já existe', { user: response.Users });
      throw new Error('E-mail já cadastrado');
    }

    event.response.autoConfirmUser = false;
    event.response.autoVerifyEmail = false;
    event.response.autoVerifyPhone = false;
  } catch (error) {
    logger.error('Error in preSignUp', { error });
  }

  return event;
};

export { preSignUp };
