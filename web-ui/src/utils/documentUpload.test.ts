import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadDocument } from './documentUpload';
import { submissionApiClient } from '../api/clients';

vi.mock('../api/clients', () => ({
  submissionApiClient: {
    submissions: {
      getPresignedUploadUrl: vi.fn(),
      getDocuments: vi.fn(),
      getSubmission: vi.fn(),
    },
  },
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('uploadDocument', () => {
  const setUploading = vi.fn();
  const setDocuments = vi.fn();
  const setRealSubmission = vi.fn();
  const showSuccess = vi.fn();
  const showError = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows error if file is not pdf', async () => {
    const file = new File([''], 'test.txt', { type: 'text/plain' });
    await uploadDocument('sub1', file, setUploading, setDocuments, setRealSubmission, showSuccess, showError);
    expect(showError).toHaveBeenCalledWith('Only PDF files are allowed.');
    expect(setUploading).not.toHaveBeenCalled();
  });

  it('shows error if uploadUrl is missing', async () => {
    const file = new File([''], 'test.pdf', { type: 'application/pdf' });
    (submissionApiClient.submissions.getPresignedUploadUrl as any).mockResolvedValue({ data: {} });
    await uploadDocument('sub1', file, setUploading, setDocuments, setRealSubmission, showSuccess, showError);
    expect(setUploading).toHaveBeenCalledWith(true);
    expect(showError).toHaveBeenCalledWith('Failed to upload file.');
    expect(setUploading).toHaveBeenCalledWith(false);
  });

  it('shows error if S3 upload fails', async () => {
    const file = new File([''], 'test.pdf', { type: 'application/pdf' });
    (submissionApiClient.submissions.getPresignedUploadUrl as any).mockResolvedValue({ data: { uploadUrl: 'http://test.com' } });
    mockFetch.mockResolvedValue({ ok: false });
    await uploadDocument('sub1', file, setUploading, setDocuments, setRealSubmission, showSuccess, showError);
    expect(showError).toHaveBeenCalledWith('Failed to upload file.');
  });

  it('succeeds and updates state on success', async () => {
    const file = new File([''], 'test.pdf', { type: 'application/pdf' });
    (submissionApiClient.submissions.getPresignedUploadUrl as any).mockResolvedValue({ data: { uploadUrl: 'http://test.com' } });
    mockFetch.mockResolvedValue({ ok: true });
    (submissionApiClient.submissions.getDocuments as any).mockResolvedValue({ data: [{ id: 'doc1' }] });
    (submissionApiClient.submissions.getSubmission as any).mockResolvedValue({ data: { id: 'sub1' } });

    await uploadDocument('sub1', file, setUploading, setDocuments, setRealSubmission, showSuccess, showError);
    
    expect(setDocuments).toHaveBeenCalledWith([{ id: 'doc1' }]);
    expect(setRealSubmission).toHaveBeenCalledWith({ id: 'sub1' });
    expect(showSuccess).toHaveBeenCalledWith('File uploaded successfully!');
  });
});
