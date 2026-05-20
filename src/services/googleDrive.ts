import { getAccessToken } from './auth';

export const createManualInDrive = async (manualContent: string) => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Not authenticated');
  }

  const fileMetadata = {
    name: 'U.G.O. Quantum OS: Manual de Despliegue y Operación',
    mimeType: 'application/vnd.google-apps.document',
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
  form.append('file', new Blob([manualContent], { type: 'text/markdown' }));

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error('Failed to create document in Drive');
  }

  return await response.json();
};
