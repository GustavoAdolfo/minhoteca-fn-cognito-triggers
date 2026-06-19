import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { PreTokenGenerationTriggerEvent } from 'aws-lambda';
import { Logger } from 'winston';

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

const preTokenGeneration = async (
  event: PreTokenGenerationTriggerEvent,
  logger: Logger
): Promise<PreTokenGenerationTriggerEvent> => {
  if (process.env['ENVIRONMENT']?.toLowerCase() === 'debug') {
    logger.info('Starting customEmailSender...');
  }
  let canBorrow = false;
  try {
    const input = {
      UserPoolId: event.userPoolId,
      // AttributesToGet: ["email", "sub", "custom:borrowApproved"],
      Filter: `"sub"^="${event.request.userAttributes.sub}"`,
    };

    const command = new ListUsersCommand(input);
    const response = await client.send(command);

    if (response.Users && response.Users.length > 0) {
      canBorrow =
        response?.Users[0]?.Attributes?.find((attr) => attr.Name === 'custom:borrowApproved')
          ?.Value === 'true';
    }
  } catch (error) {
    logger.error('Error in preTokenGeneration!', { error });
    throw error;
  }

  event.response.claimsOverrideDetails = {
    claimsToAddOrOverride: {
      borrowApproved: String(canBorrow),
    },
  };

  return event;
};

export { preTokenGeneration };
