/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface UserSummary {
  /** Cognito sub UUID */
  sub: string;
  /** Human-readable Cognito username */
  username: string;
}

export interface UserProfile {
  /** Cognito sub UUID */
  sub: string;
  /** Cognito username */
  username: string;
  /** User email address */
  email?: string;
  /** Whether the user account is enabled */
  enabled?: boolean;
  /** Cognito user status (CONFIRMED, FORCE_CHANGE_PASSWORD, etc.) */
  status?: string;
  /**
   * Account creation timestamp
   * @format date-time
   */
  createdAt?: string;
  /** Cognito groups the user belongs to */
  groups?: string[];
  /** Custom Cognito attributes (keys without the custom: prefix) */
  customAttributes?: Record<string, string>;
}

export interface UserSearchResponse {
  users: UserSummary[];
}

export interface UserProfileListResponse {
  users: UserProfile[];
}

export interface BulkResolveRequest {
  /**
   * List of Cognito sub UUIDs to resolve
   * @maxItems 50
   */
  subs: string[];
}

export interface BulkResolveResponse {
  /** Map of sub UUID → username */
  users?: Record<string, string>;
}

export interface AddGroupMemberRequest {
  /** Cognito username (not sub UUID) of the existing user to add to the group */
  username: string;
  /** Optional custom attributes to set on the user (keys without custom: prefix) */
  customAttributes?: Record<string, string>;
}

export interface UpdateAttributesRequest {
  /** Custom attributes to update (keys without custom: prefix) */
  customAttributes?: Record<string, string>;
}

export interface ErrorResponse {
  message?: string;
  code?: string;
  /** @format date-time */
  timestamp?: string;
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown>
  extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "/api/users";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) =>
    fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter(
      (key) => "undefined" !== typeof query[key],
    );
    return keys
      .map((key) =>
        Array.isArray(query[key])
          ? this.addArrayQueryParam(query, key)
          : this.addQueryParam(query, key),
      )
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.JsonApi]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.Text]: (input: any) =>
      input !== null && typeof input !== "string"
        ? JSON.stringify(input)
        : input,
    [ContentType.FormData]: (input: any) => {
      if (input instanceof FormData) {
        return input;
      }

      return Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData());
    },
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(
    params1: RequestParams,
    params2?: RequestParams,
  ): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (
    cancelToken: CancelToken,
  ): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(
      `${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`,
      {
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== ContentType.FormData
            ? { "Content-Type": type }
            : {}),
        },
        signal:
          (cancelToken
            ? this.createAbortSignal(cancelToken)
            : requestParams.signal) || null,
        body:
          typeof body === "undefined" || body === null
            ? null
            : payloadFormatter(body),
      },
    ).then(async (response) => {
      const r = response as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const responseToParse = responseFormat ? response.clone() : response;
      const data = !responseFormat
        ? r
        : await responseToParse[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
    });
  };
}

/**
 * @title User Service API
 * @version 1.0.0
 * @baseUrl /api/users
 *
 * Centralized proxy for all Cognito user-management interactions.
 * Provides read-only user resolution (used by all services internally)
 * and admin-only user/group management (Admin and ExaminationOfficer only).
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  search = {
    /**
     * @description Returns users whose username starts with or contains the given query string. Replaces the /api/communication/users endpoint previously in the Communication Service. All authenticated users may call this endpoint.
     *
     * @tags Users
     * @name SearchUsers
     * @summary Search for users by username prefix
     * @request GET:/search
     */
    searchUsers: (
      query?: {
        /** Username prefix or substring to filter by. Returns all users if omitted. */
        q?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<UserSearchResponse, void>({
        path: `/search`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),
  };
  sub = {
    /**
     * @description Resolves a Cognito sub UUID to a full UserProfile. Used by all services internally for username resolution. All authenticated users may call this endpoint.
     *
     * @tags Users
     * @name GetUserBySub
     * @summary Get a user by Cognito sub UUID
     * @request GET:/{sub}
     */
    getUserBySub: (sub: string, params: RequestParams = {}) =>
      this.request<UserSummary, void>({
        path: `/${sub}`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  bulk = {
    /**
     * @description Accepts a list of Cognito sub UUIDs and returns a map of sub → username. Used by services to resolve multiple user identities in a single call. All authenticated users may call this endpoint.
     *
     * @tags Users
     * @name BulkResolveUsers
     * @summary Bulk resolve sub UUIDs to usernames
     * @request POST:/bulk
     */
    bulkResolveUsers: (data: BulkResolveRequest, params: RequestParams = {}) =>
      this.request<BulkResolveResponse, void>({
        path: `/bulk`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  groups = {
    /**
     * @description Returns a list of users who are members of the specified Cognito group. Replaces GET /api/matching/examiners for the Reviewer group. Restricted to Admin and ExaminationOfficer.
     *
     * @tags Groups
     * @name ListGroupMembers
     * @summary List all members of a Cognito group
     * @request GET:/groups/{groupName}/members
     */
    listGroupMembers: (groupName: string, params: RequestParams = {}) =>
      this.request<UserProfileListResponse, void>({
        path: `/groups/${groupName}/members`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Promotes an existing Cognito user into the specified group. Replaces POST /api/matching/examiners for the Reviewer group. Restricted to Admin and ExaminationOfficer.
     *
     * @tags Groups
     * @name AddGroupMember
     * @summary Add an existing user to a Cognito group
     * @request POST:/groups/{groupName}/members
     */
    addGroupMember: (
      groupName: string,
      data: AddGroupMemberRequest,
      params: RequestParams = {},
    ) =>
      this.request<UserProfile, void>({
        path: `/groups/${groupName}/members`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Removes the specified user from the Cognito group. Replaces DELETE /api/matching/examiners/{examinerUsername}. Restricted to Admin and ExaminationOfficer.
     *
     * @tags Groups
     * @name RemoveGroupMember
     * @summary Remove a user from a Cognito group
     * @request DELETE:/groups/{groupName}/members/{username}
     */
    removeGroupMember: (
      groupName: string,
      username: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/groups/${groupName}/members/${username}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * @description Updates the custom Cognito attributes (e.g. specialty, availability) for a user. The user must be a member of the specified group. Replaces PATCH /api/matching/examiners/{examinerUsername}. Restricted to Admin and ExaminationOfficer.
     *
     * @tags Groups
     * @name UpdateUserAttributes
     * @summary Update custom attributes of a group member
     * @request PATCH:/groups/{groupName}/members/{username}/attributes
     */
    updateUserAttributes: (
      groupName: string,
      username: string,
      data: UpdateAttributesRequest,
      params: RequestParams = {},
    ) =>
      this.request<UserProfile, void>({
        path: `/groups/${groupName}/members/${username}/attributes`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  username = {
    /**
     * @description Returns the full UserProfile (including custom attributes and group memberships) for a user identified by their Cognito username. Replaces GET /api/matching/examiners/{examinerUsername}. Restricted to Admin and ExaminationOfficer.
     *
     * @tags Groups
     * @name GetUserDetails
     * @summary Get full user details by username
     * @request GET:/{username}/details
     */
    getUserDetails: (username: string, params: RequestParams = {}) =>
      this.request<UserProfile, void>({
        path: `/${username}/details`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
}
