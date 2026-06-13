import { Api as ConfigApi } from './generated/configuration';
import { Api as MatchingApi } from './generated/matching';

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
