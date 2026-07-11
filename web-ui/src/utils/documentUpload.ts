import { submissionApiClient } from '../api/clients';

export const uploadDocument = async (
  submissionId: string,
  file: File,
  setUploading: (val: boolean) => void,
  setDocuments: (docs: any[]) => void,
  setRealSubmission: (sub: any) => void,
  showSuccess: (msg: string) => void,
  showError: (msg: string) => void
) => {
  if (file.type !== 'application/pdf') {
    showError('Only PDF files are allowed.');
    return;
  }

  setUploading(true);
  try {
    const urlRes = await submissionApiClient.submissions.getPresignedUploadUrl(submissionId, {
      fileName: file.name,
      contentType: file.type,
    });

    const { uploadUrl } = urlRes.data;
    if (!uploadUrl) throw new Error('No upload URL returned');

    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!putRes.ok) {
      throw new Error('S3 upload failed');
    }

    const docsRes = await submissionApiClient.submissions.getDocuments(submissionId);
    setDocuments(docsRes.data || []);
    
    const subRes = await submissionApiClient.submissions.getSubmission(submissionId);
    setRealSubmission(subRes.data);

    showSuccess('File uploaded successfully!');
  } catch (e) {
    console.error('Failed to upload file', e);
    showError('Failed to upload file.');
  } finally {
    setUploading(false);
  }
};
