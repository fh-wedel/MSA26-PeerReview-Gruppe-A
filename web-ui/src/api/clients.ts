import {Api as ConfigApi, Api as ConfigurationApi} from './generated/configuration';
import {Api as MatchingApi} from './generated/matching';
import {Api as SubmissionApi} from './generated/submission';
import {Api as CommunicationApi} from './generated/communication';
import {Api as UsersApi} from './generated/users';
import {Api as ResponseApi} from './generated/response';
import {fetchWithAuth} from './fetchWrapper';

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
  customFetch: fetchWithAuth,
});

export const matchingApiClient = new MatchingApi({
  baseApiParams: getBaseParams(),
  customFetch: fetchWithAuth,
});

export const submissionApiClient = new SubmissionApi({
  baseApiParams: getBaseParams(),
  customFetch: fetchWithAuth,
});

export const communicationApiClient = new CommunicationApi({
  baseApiParams: getBaseParams(),
  customFetch: fetchWithAuth,
});

export const configurationApiClient = new ConfigurationApi({
  baseApiParams: getBaseParams(),
  customFetch: fetchWithAuth,
});

export const usersApiClient = new UsersApi({
  baseApiParams: getBaseParams(),
  customFetch: fetchWithAuth,
});

export const responseApiClient = new ResponseApi({
  baseApiParams: getBaseParams(),
  customFetch: fetchWithAuth,
});
