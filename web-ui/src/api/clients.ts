import {Api as ConfigApi} from './generated/configuration';
import {Api as MatchingApi} from './generated/matching';
import {Api as SubmissionApi} from './generated/submission';
import {Api as CommunicationApi} from './generated/communication';
import {Api as WorkflowApi} from './generated/workflow';

const getBaseParams = () => ({
  headers: {
    get Authorization() {
      const token = sessionStorage.getItem('access_token');
      return token ? `Bearer ${token}` : '';
    }
  }
});

export const configApiClient = new ConfigApi({
  baseApiParams: getBaseParams(),
});

export const matchingApiClient = new MatchingApi({
  baseApiParams: getBaseParams(),
});

export const submissionApiClient = new SubmissionApi({
  baseApiParams: getBaseParams(),
});

export const communicationApiClient = new CommunicationApi({
  baseApiParams: getBaseParams(),
});

export const workflowApiClient = new WorkflowApi({
  baseApiParams: getBaseParams(),
});
