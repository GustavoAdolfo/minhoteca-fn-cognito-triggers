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
});
