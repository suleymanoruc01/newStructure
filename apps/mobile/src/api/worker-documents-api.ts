import {
  workerDocumentCreateResponseSchema,
  workerDocumentCreateSchema,
  workerDocumentDownloadResponseSchema,
  workerDocumentsListResponseSchema,
  workerDocumentResponseSchema,
  type WorkerDocumentCreateBody,
} from '@parton/api-contracts';

import { apiRequest } from './client';

export async function listWorkerDocuments(accessToken: string) {
  return apiRequest('/workers/me/documents', workerDocumentsListResponseSchema, {
    accessToken,
  });
}

export async function createWorkerDocumentUpload(
  accessToken: string,
  body: WorkerDocumentCreateBody,
) {
  workerDocumentCreateSchema.parse(body);
  return apiRequest('/workers/me/documents', workerDocumentCreateResponseSchema, {
    method: 'POST',
    body,
    accessToken,
  });
}

export async function completeWorkerDocumentUpload(
  accessToken: string,
  documentId: string,
) {
  return apiRequest(
    `/workers/me/documents/${documentId}/complete`,
    workerDocumentResponseSchema,
    {
      method: 'POST',
      accessToken,
    },
  );
}

export async function getWorkerDocumentDownloadUrl(
  accessToken: string,
  documentId: string,
) {
  return apiRequest(
    `/workers/me/documents/${documentId}/download-url`,
    workerDocumentDownloadResponseSchema,
    { accessToken },
  );
}

export async function putFileToPresignedUrl(
  uploadUrl: string,
  fileUri: string,
  contentType: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(new Error(`Yükleme başarısız (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error('Yükleme ağ hatası'));
    xhr.send({ uri: fileUri, type: contentType, name: 'upload' } as unknown as Blob);
  });
}
