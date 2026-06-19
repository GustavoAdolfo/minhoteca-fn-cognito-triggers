import { ConfigServiceClient } from '@aws-sdk/client-config-service';
import { optionsConfiguration, reviewOptions } from './commom';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  GetObjectCommandOutput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createLogger, format, transports } from 'winston';

const { timestamp, label, combine } = format;
const formatoLog = combine(
  label({ label: 'minhoteca-s3-proxy' }),
  timestamp(),
  format.splat(),
  format.json()
);
const logger = createLogger({
  level: 'info',
  format: formatoLog,
  transports: [new transports.Console()],
});

const region = process.env.AWS_REGION ?? 'us-east-1';
const endpoint = ['debug', 'local'].includes(process.env['ENVIRONMENT']?.toLowerCase() ?? '')
  ? process.env.ENDPOINT_LOCAL_S3
  : process.env.ENDPOINT;

const defineS3Client = (options: ConfigServiceClient): S3Client => {
  const config = reviewOptions(options);
  return new S3Client(config);
};

export async function createPreSignedUrlPut(
  bucketName: string,
  objectName: string,
  contentType: string
): Promise<string> {
  const config = optionsConfiguration(region, endpoint);
  const client = defineS3Client(config);
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectName,
    ContentType: contentType,
  });
  const url = await getSignedUrl(client, command, {
    expiresIn: 60 * 60,
  });
  return url;
}

export async function createPreSignedUrlGet(
  bucketName: string,
  objectName: string,
  contentType: string
): Promise<string> {
  try {
    const config = optionsConfiguration(region, endpoint);
    const client = defineS3Client(config);
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectName,
      ResponseContentType: contentType,
    });
    const url = await getSignedUrl(client, command, {
      expiresIn: 7 * 24 * 60 * 60,
    });
    return url;
  } catch (error) {
    logger.error('createPreSignedUrlGet', error);
    throw error;
  }
}

// export async function getUseTermsDocument() {
//   const bucketName = process.env.BUCKET_DOCUMENTS ?? '';
//   const objectName = process.env.USE_TERMS_DOCUMENT_PATH;
//   const config = optionsConfiguration(region, endpoint);
//   const client = defineS3Client(config);
//   const command = new GetObjectCommand({
//     Bucket: bucketName,
//     Key: objectName,
//   });
//   const response = await client.send(command);
//   loggerInspect('getUseTermsDocument', { response });
//   const document = await response.Body?.transformToString();
//   return document;
// }

export async function getDataFromS3File(bucketName: string, keyFile: string) {
  try {
    const config = optionsConfiguration(region, endpoint);
    const client = defineS3Client(config);
    const cmd = new GetObjectCommand({
      Bucket: bucketName,
      Key: keyFile,
    });
    const content: GetObjectCommandOutput = await client.send(cmd);
    const data = await content.Body?.transformToString();
    if (!data) {
      return null;
    }
    const list = JSON.parse(data);
    if (typeof list[Symbol.iterator] === 'function') {
      const result = Object.entries(list)
        .map((item) => item[1])
        .filter((value) => value !== undefined);
      return result;
    }
    return list ?? null;
  } catch (error) {
    logger.error('getDataFromS3File', error);
    throw error;
  }
}

export async function getTextFileFromS3File(bucketName: string, keyFile: string) {
  try {
    const config = optionsConfiguration(region, endpoint);
    const client = defineS3Client(config);
    const cmd = new GetObjectCommand({
      Bucket: bucketName,
      Key: keyFile,
    });
    const content: GetObjectCommandOutput = await client.send(cmd);
    const fileContent = await content.Body?.transformToString();
    return fileContent;
  } catch (error) {
    logger.error('getDataFromS3File', error);
    throw error;
  }
}
