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

export interface SubmissionMatchResponse {
  /**
   * The unique identifier of the submission
   * @example "sub-123e4567-e89b-12d3-a456"
   */
  submissionId: string;
  status: "MATCHED" | "FAILED";
  /**
   * Failure reason, only present when status is FAILED
   * @example "No available reviewers"
   */
  reason?: string | null;
  numberOfExaminers?: number;
  /** Cognito sub UUIDs of the submitters (as stored in DynamoDB) */
  submitterIds: string[];
  /** Cognito usernames of the submitters, resolved from the submitterIds */
  submitterUsernames: string[];
  /** @format date-time */
  matchedAt: string;
  matches?: MatchEntry[];
}

export interface MatchEntry {
  /**
   * Cognito sub (UUID) of the assigned reviewer
   * @example "123e4567-e89"
   */
  examinerId: string;
  /**
   * Cognito username of the assigned reviewer
   * @example "Marcel"
   */
  examinerUsername: string;
  /** @format date-time */
  assignedAt: string;
}

export interface ExaminerMatchResponse {
  /**
   * Cognito sub UUID of the examiner (resolved from the username path parameter)
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  examinerId: string;
  /**
   * Cognito username of the examiner (from the path parameter)
   * @example "Marcel"
   */
  examinerUsername: string;
  assignments: AssignmentEntry[];
}

export interface AssignmentEntry {
  /**
   * The unique identifier of the assigned submission
   * @example "sub-123e4567-e89b-12d3-a456"
   */
  submissionId: string;
  /** @format date-time */
  assignedAt: string;
}

export interface ErrorResponse {
  message: string;
  code?: string;
  /** @format date-time */
  timestamp?: string;
}

export interface CognitoErrorResponse {
  /**
   * Amazon Verified Permissions error message returned by Cognito when access is denied due to insufficient permissions. This typically indicates that the Requester is not in the correct Cognito group.
   * @example "User is not authorized to access this resource with an explicit deny in an identity-based policy"
   */
  Message: string;
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
  public baseUrl: string = "/api/matching";
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
 * @title Matching Service API
 * @version 1.0.0
 * @baseUrl /api/matching
 *
 * API for managing reviewer-submission matches and Cognito reviewer proxy operations.
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  matches = {
    /**
     * No description
     *
     * @tags matches
     * @name GetMatchesBySubmission
     * @summary Returns all matched reviewers and matching status for a submission
     * @request GET:/matches/submissions/{submissionId}
     */
    getMatchesBySubmission: (
      submissionId: string,
      params: RequestParams = {},
    ) =>
      this.request<
        SubmissionMatchResponse,
        CognitoErrorResponse | ErrorResponse
      >({
        path: `/matches/submissions/${submissionId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description The path parameter is the human-readable Cognito username (e.g. 'Marcel'). The service resolves it to the internal Cognito sub UUID for DynamoDB queries and access-control checks.
     *
     * @tags matches
     * @name GetMatchesByExaminer
     * @summary Returns all submissions assigned to a specific examiner
     * @request GET:/matches/examiners/{examinerUsername}
     */
    getMatchesByExaminer: (
      examinerUsername: string,
      params: RequestParams = {},
    ) =>
      this.request<ExaminerMatchResponse, CognitoErrorResponse | ErrorResponse>(
        {
          path: `/matches/examiners/${examinerUsername}`,
          method: "GET",
          format: "json",
          ...params,
        },
      ),
  };
}
