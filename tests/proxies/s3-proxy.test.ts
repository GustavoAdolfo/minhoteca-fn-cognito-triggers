import { jest } from '@jest/globals';
import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  createPreSignedUrlGet,
  createPreSignedUrlPut,
  getDataFromS3File,
  getTextFileFromS3File,
} from '../../src/proxies/s3-proxy';

describe('s3 proxy helpers', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses ENDPOINT_LOCAL_S3 when ENVIRONMENT is local', async () => {
    const originalEnvironment = process.env['ENVIRONMENT'];
    const originalEndpointLocal = process.env['ENDPOINT_LOCAL_S3'];

    process.env['ENVIRONMENT'] = 'local';
    process.env['ENDPOINT_LOCAL_S3'] = 'http://localhost:4566';

    let localCreatePreSignedUrlPut: typeof createPreSignedUrlPut;

    jest.isolateModules(() => {
      jest
        .spyOn(require('@aws-sdk/s3-request-presigner'), 'getSignedUrl')
        .mockResolvedValue('https://localhost/signed');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      ({
        createPreSignedUrlPut: localCreatePreSignedUrlPut,
      } = require('../../src/proxies/s3-proxy'));
    });

    const result = await localCreatePreSignedUrlPut!('bucket', 'key.png', 'image/png');
    expect(result).toBe('https://localhost/signed');

    process.env['ENVIRONMENT'] = originalEnvironment;
    process.env['ENDPOINT_LOCAL_S3'] = originalEndpointLocal;
  });

  it('creates a signed URL for uploads with the correct command parameters', async () => {
    const signedUrl = 'https://example.com/upload';
    jest
      .spyOn(require('@aws-sdk/s3-request-presigner'), 'getSignedUrl')
      .mockResolvedValue(signedUrl);

    const result = await createPreSignedUrlPut('bucket-test', 'images/avatar.png', 'image/png');

    expect(result).toBe(signedUrl);
    expect(getSignedUrl).toHaveBeenCalledWith(
      expect.any(S3Client),
      expect.objectContaining({
        input: expect.objectContaining({
          Bucket: 'bucket-test',
          Key: 'images/avatar.png',
          ContentType: 'image/png',
        }),
      }),
      expect.objectContaining({ expiresIn: 60 * 60 })
    );
  });

  it('creates a signed URL for downloads with the correct command parameters', async () => {
    const signedUrl = 'https://example.com/download';
    jest
      .spyOn(require('@aws-sdk/s3-request-presigner'), 'getSignedUrl')
      .mockResolvedValue(signedUrl);

    const result = await createPreSignedUrlGet(
      'bucket-test',
      'files/report.pdf',
      'application/pdf'
    );

    expect(result).toBe(signedUrl);
    expect(getSignedUrl).toHaveBeenCalledWith(
      expect.any(S3Client),
      expect.objectContaining({
        input: expect.objectContaining({
          Bucket: 'bucket-test',
          Key: 'files/report.pdf',
          ResponseContentType: 'application/pdf',
        }),
      }),
      expect.objectContaining({ expiresIn: 7 * 24 * 60 * 60 })
    );
  });

  it('returns parsed JSON data from an S3 object when the payload is a list', async () => {
    jest.spyOn(S3Client.prototype, 'send').mockResolvedValue({
      Body: {
        transformToString: jest.fn().mockResolvedValue('["first","second"]'),
      },
    } as never);

    const result = await getDataFromS3File('bucket-test', 'data/items.json');

    expect(result).toEqual(['first', 'second']);
  });

  it('returns null when the S3 payload is empty', async () => {
    jest.spyOn(S3Client.prototype, 'send').mockResolvedValue({
      Body: {
        transformToString: jest.fn().mockResolvedValue(''),
      },
    } as never);

    const result = await getDataFromS3File('bucket-test', 'data/empty.json');

    expect(result).toBeNull();
  });

  it('returns the file content as text', async () => {
    jest.spyOn(S3Client.prototype, 'send').mockResolvedValue({
      Body: {
        transformToString: jest.fn().mockResolvedValue('hello from s3'),
      },
    } as never);

    const result = await getTextFileFromS3File('bucket-test', 'templates/email.txt');

    expect(result).toBe('hello from s3');
  });

  it('returns a plain object from S3 when the payload is not iterable', async () => {
    jest.spyOn(S3Client.prototype, 'send').mockResolvedValue({
      Body: {
        transformToString: jest.fn().mockResolvedValue('{"key":"value"}'),
      },
    } as never);

    const result = await getDataFromS3File('bucket-test', 'data/object.json');

    expect(result).toEqual({ key: 'value' });
  });

  it('returns null when Body is undefined in getDataFromS3File', async () => {
    jest.spyOn(S3Client.prototype, 'send').mockResolvedValue({
      Body: undefined,
    } as never);

    const result = await getDataFromS3File('bucket-test', 'data/missing.json');

    expect(result).toBeNull();
  });

  it('throws and logs when createPreSignedUrlGet fails', async () => {
    const error = new Error('presign failure');
    jest.spyOn(require('@aws-sdk/s3-request-presigner'), 'getSignedUrl').mockRejectedValue(error);

    await expect(
      createPreSignedUrlGet('bucket-test', 'files/bad.pdf', 'application/pdf')
    ).rejects.toThrow('presign failure');
  });

  it('throws and logs when getDataFromS3File fails', async () => {
    const error = new Error('s3 read error');
    jest.spyOn(S3Client.prototype, 'send').mockRejectedValue(error);

    await expect(getDataFromS3File('bucket-test', 'data/fail.json')).rejects.toThrow(
      's3 read error'
    );
  });

  it('throws and logs when getTextFileFromS3File fails', async () => {
    const error = new Error('s3 text error');
    jest.spyOn(S3Client.prototype, 'send').mockRejectedValue(error);

    await expect(getTextFileFromS3File('bucket-test', 'templates/fail.txt')).rejects.toThrow(
      's3 text error'
    );
  });
});
