import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { PreTokenGenerationTriggerEvent } from 'aws-lambda';
import { LogService } from '@gustavoadolfo/minhoteca-core-layer';

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

const preTokenGeneration = async (
  event: PreTokenGenerationTriggerEvent,
  requestId: string,
  logger: LogService
): Promise<PreTokenGenerationTriggerEvent> => {
  const triggerSource = event.triggerSource;

  logger.info('🏁 Evento iniciado', { requestId, triggerSource }, { event });

  const input = {
    UserPoolId: event.userPoolId,
    // AttributesToGet: ["email", "sub", "custom:borrowApproved"],
    Filter: `"sub"^="${event.request.userAttributes.sub}"`,
  };

  const command = new ListUsersCommand(input);
  const response = await client.send(command);

  let canBorrow = false;
  if (response.Users && response.Users.length > 0) {
    canBorrow =
      response?.Users[0]?.Attributes?.find((attr) => attr.Name === 'custom:borrowApproved')
        ?.Value === 'true';
  }

  event.response.claimsOverrideDetails = {
    claimsToAddOrOverride: {
      borrowApproved: String(canBorrow),
    },
  };

  logger.info('✅ Evento finalizado', { requestId, triggerSource }, { event });

  return event;
};

export { preTokenGeneration };
