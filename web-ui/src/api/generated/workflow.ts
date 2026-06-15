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

/** The anonymity and communication rules of a workflow plugin */
export interface WorkflowRulesDto {
  /** Whether the author's identity is hidden from reviewers */
  authorAnonymous: boolean;
  /** Whether the reviewer's identity is hidden from the author */
  reviewerAnonymous: boolean;
  /** Whether direct chat between author and reviewer is allowed */
  authorReviewerChatAllowed: boolean;
  defaultNumberOfReviewers: number;
  defaultNumberOfAuthors: number;
}

/** A registered workflow plugin with its metadata and rules */
export interface WorkflowPluginDto {
  /** Human-readable title of the workflow plugin */
  title: string;
  /** Unique name of the workflow plugin */
  name: string;
  /** Human-readable description of the workflow plugin */
  description: string;
  /** The anonymity and communication rules of a workflow plugin */
  rules: WorkflowRulesDto;
  defaultNumberOfReviewers: number;
  defaultNumberOfAuthors: number;
  feedbackFormTemplate: ReviewQuestionDto[];
}

export interface ReviewQuestionDto {
  id: string;
  text: string;
  type: "TEXT" | "RATING" | "MULTIPLE_CHOICE" | "SCALE";
  maxPoints: number;
  required: boolean;
  options?: string[];
}

export interface ReviewResponseDto {
  questionId: string;
  textValue?: string;
  numericValue?: number;
  selectedOption?: string;
}

export interface SubmitReviewRequest {
  responses: ReviewResponseDto[];
}

export interface SubmitReviewResponseDto {
  totalPoints: number;
  maxPossiblePoints: number;
  percentage: number;
  summary: string;
}

export interface ReviewStatusDto {
  submissionId: string;
  totalExpected: number;
  receivedCount: number;
  complete: boolean;
}

export interface SubmittedReviewDto {
  submissionId: string;
  reviewerId: string;
  responses: ReviewResponseDto[];
  totalPoints: number;
  maxPossiblePoints: number;
  percentage: number;
  gradeSummary: string;
  /** @format date-time */
  submittedAt: string;
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
  public baseUrl: string = "/api/workflow";
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
                ? {"Content-Type": type}
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
 * @title Workflow Service API
 * @version 0.0.1-SNAPSHOT
 * @baseUrl /api/workflow
 *
 * REST API for the Workflow Service – exposes available review workflow plugins and their rules.
 */
export class Api<
    SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  plugins = {
    /**
     * @description Returns an array of all registered workflow plugins with their metadata and rules.
     *
     * @tags Workflow Plugins
     * @name ListPlugins
     * @summary List all available workflow plugins
     * @request GET:/plugins
     */
    listPlugins: (params: RequestParams = {}) =>
        this.request<WorkflowPluginDto[], any>({
          path: `/plugins`,
          method: "GET",
          format: "json",
          ...params,
        }),

    /**
     * @description Returns the metadata and rules for the workflow plugin identified by its name.
     *
     * @tags Workflow Plugins
     * @name GetPlugin
     * @summary Get details of a specific workflow plugin
     * @request GET:/plugins/{pluginName}
     */
    getPlugin: (pluginName: string, params: RequestParams = {}) =>
        this.request<WorkflowPluginDto, void>({
          path: `/plugins/${pluginName}`,
          method: "GET",
          format: "json",
          ...params,
        }),

    /**
     * @description Returns the anonymity and communication rules for the workflow plugin identified by its name.
     *
     * @tags Workflow Plugins
     * @name GetPluginRules
     * @summary Get the rules of a specific workflow plugin
     * @request GET:/plugins/{pluginName}/rules
     */
    getPluginRules: (pluginName: string, params: RequestParams = {}) =>
        this.request<WorkflowRulesDto, void>({
          path: `/plugins/${pluginName}/rules`,
          method: "GET",
          format: "json",
          ...params,
        }),
  };
  submissions = {
    /**
     * @description Returns the anonymity and communication rules for the workflow plugin associated with the given submission ID.
     *
     * @tags Workflow Rules
     * @name GetRulesForSubmission
     * @summary Get the rules for a specific submission
     * @request GET:/submissions/{submissionId}/rules
     */
    getRulesForSubmission: (submissionId: string, params: RequestParams = {}) =>
        this.request<WorkflowRulesDto, void>({
          path: `/submissions/${submissionId}/rules`,
          method: "GET",
          format: "json",
          ...params,
        }),

    /**
     * No description
     *
     * @tags Workflow Reviews
     * @name GetFeedbackFormForSubmission
     * @summary Get the feedback form for a submission
     * @request GET:/submissions/{submissionId}/feedback-form
     */
    getFeedbackFormForSubmission: (
        submissionId: string,
        params: RequestParams = {},
    ) =>
        this.request<ReviewQuestionDto[], any>({
          path: `/submissions/${submissionId}/feedback-form`,
          method: "GET",
          format: "json",
          ...params,
        }),

    /**
     * No description
     *
     * @tags Workflow Reviews
     * @name SubmitReview
     * @summary Submit a review
     * @request POST:/submissions/{submissionId}/reviews
     */
    submitReview: (
        submissionId: string,
        data: SubmitReviewRequest,
        params: RequestParams = {},
    ) =>
        this.request<SubmitReviewResponseDto, any>({
          path: `/submissions/${submissionId}/reviews`,
          method: "POST",
          body: data,
          type: ContentType.Json,
          format: "json",
          ...params,
        }),

    /**
     * No description
     *
     * @tags Workflow Reviews
     * @name GetReviewsForSubmission
     * @summary Get all reviews for a submission
     * @request GET:/submissions/{submissionId}/reviews
     */
    getReviewsForSubmission: (
        submissionId: string,
        params: RequestParams = {},
    ) =>
        this.request<SubmittedReviewDto[], any>({
          path: `/submissions/${submissionId}/reviews`,
          method: "GET",
          format: "json",
          ...params,
        }),

    /**
     * No description
     *
     * @tags Workflow Reviews
     * @name GetReviewStatus
     * @summary Get review status for a submission
     * @request GET:/submissions/{submissionId}/reviews/status
     */
    getReviewStatus: (submissionId: string, params: RequestParams = {}) =>
        this.request<ReviewStatusDto, any>({
          path: `/submissions/${submissionId}/reviews/status`,
          method: "GET",
          format: "json",
          ...params,
        }),
  };
}
