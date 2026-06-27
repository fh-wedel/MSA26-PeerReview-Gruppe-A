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

export interface CreateConfigurationRequest {
  title: string;
  reviewProcessType: string;
  authorIds: string[];
  /** @min 1 */
  numberOfExaminers?: number;
  /** @format date-time */
  submissionDeadline?: string;
  /** @format date-time */
  reviewDeadline?: string;
  reviewTemplateType: string;
  topicTag: string;
  customReviewerIds?: string[];
}

export interface Configuration {
  submissionId: string;
  title: string;
  reviewProcessType: string;
  authorIds: string[];
  /** @min 1 */
  numberOfExaminers: number;
  /** @format date-time */
  submissionDeadline?: string;
  /** @format date-time */
  reviewDeadline?: string;
  /** @format date-time */
  createdAt?: string;
  reviewTemplateType: string;
  topicTag: string;
}

export interface ReviewQuestionDto {
  id: string;
  text: string;
  type: "TEXT" | "RATING" | "MULTIPLE_CHOICE" | "SCALE";
  maxPoints: number;
  required: boolean;
  options?: string[];
}

export interface ReviewTypeDto {
  title: string;
  name: string;
  description: string;
  /** The anonymity and communication rules of a workflow plugin */
  rules: ReviewRulesDto;
}

export interface ReviewTemplateDto {
  title: string;
  name: string;
  description: string;
  evaluationCriteriaVisibleToAuthors: boolean;
  feedbackFormTemplate: ReviewQuestionDto[];
  minAuthors?: number;
  maxAuthors?: number;
  minReviewers?: number;
  maxReviewers?: number;
  submissionDurationDays?: number;
  reviewDurationDays?: number;
  allowAuthorCustomReviewer: boolean;
}

/** The anonymity and communication rules of a workflow plugin */
export interface ReviewRulesDto {
  /** Whether the author's identity is hidden from reviewers */
  authorAnonymous: boolean;
  /** Whether the reviewer's identity is hidden from the author */
  reviewerAnonymous: boolean;
  /** Whether direct chat between author and reviewer is allowed */
  authorReviewerChatAllowed: boolean;
}

export interface TopicTagDto {
  tagName: string;
  /** @format date-time */
  createdAt?: string;
}

export interface CreateTopicTagRequest {
  /**
   * @minLength 1
   * @maxLength 64
   */
  tagName: string;
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
  public baseUrl: string = "/api/configuration";
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
 * @title Configuration API
 * @version 1.0.0
 * @baseUrl /api/configuration
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  topicTags = {
    /**
     * No description
     *
     * @tags Topic Tags
     * @name ListTopicTags
     * @summary List all topic tags
     * @request GET:/topic-tags
     */
    listTopicTags: (params: RequestParams = {}) =>
      this.request<TopicTagDto[], any>({
        path: `/topic-tags`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Topic Tags
     * @name AddTopicTag
     * @summary Add a new topic tag
     * @request POST:/topic-tags
     */
    addTopicTag: (data: CreateTopicTagRequest, params: RequestParams = {}) =>
      this.request<TopicTagDto, void>({
        path: `/topic-tags`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Topic Tags
     * @name DeleteTopicTag
     * @summary Delete a topic tag
     * @request DELETE:/topic-tags/{tagName}
     */
    deleteTopicTag: (tagName: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/topic-tags/${tagName}`,
        method: "DELETE",
        ...params,
      }),
  };
  submissions = {
    /**
     * No description
     *
     * @tags Submissions
     * @name SubmissionsCreate
     * @summary Create a new submission configuration
     * @request POST:/submissions
     */
    submissionsCreate: (
      data: CreateConfigurationRequest,
      params: RequestParams = {},
    ) =>
      this.request<Configuration, void>({
        path: `/submissions`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Submissions
     * @name SubmissionsList
     * @summary List all configurations
     * @request GET:/submissions
     */
    submissionsList: (params: RequestParams = {}) =>
      this.request<Configuration[], any>({
        path: `/submissions`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Submissions
     * @name SubmissionsDetail
     * @summary Get configuration details by submission ID
     * @request GET:/submissions/{submissionId}
     */
    submissionsDetail: (submissionId: string, params: RequestParams = {}) =>
      this.request<Configuration, void>({
        path: `/submissions/${submissionId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Submissions
     * @name SubmissionDeadlineList
     * @summary Get submission deadline by submission ID
     * @request GET:/submissions/{submissionId}/submission-deadline
     */
    submissionDeadlineList: (
      submissionId: string,
      params: RequestParams = {},
    ) =>
      this.request<string, void>({
        path: `/submissions/${submissionId}/submission-deadline`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Submissions
     * @name ReviewDeadlineList
     * @summary Get review deadline by submission ID
     * @request GET:/submissions/{submissionId}/review-deadline
     */
    reviewDeadlineList: (submissionId: string, params: RequestParams = {}) =>
      this.request<string, void>({
        path: `/submissions/${submissionId}/review-deadline`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Submissions
     * @name AuthorDetail
     * @summary Get all configurations for a specific author
     * @request GET:/submissions/author/{authorId}
     */
    authorDetail: (authorId: string, params: RequestParams = {}) =>
      this.request<Configuration[], any>({
        path: `/submissions/author/${authorId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Returns the anonymity and communication rules for the workflow plugin associated with the given submission ID.
     *
     * @tags Submission Rules
     * @name GetRulesForSubmission
     * @summary Get the rules for a specific submission
     * @request GET:/submissions/{submissionId}/rules
     */
    getRulesForSubmission: (submissionId: string, params: RequestParams = {}) =>
      this.request<ReviewRulesDto, void>({
        path: `/submissions/${submissionId}/rules`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Submission Reviews
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
  };
  reviewTypes = {
    /**
     * @description Returns an array of all registered workflow plugins with their metadata and rules.
     *
     * @tags Review Types
     * @name ListReviewTypes
     * @summary List all available review types
     * @request GET:/review-types
     */
    listReviewTypes: (params: RequestParams = {}) =>
      this.request<ReviewTypeDto[], any>({
        path: `/review-types`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Returns the metadata and rules for the workflow plugin identified by its name.
     *
     * @tags Review Types
     * @name GetReviewType
     * @summary Get details of a specific review type
     * @request GET:/review-types/{typeName}
     */
    getReviewType: (typeName: string, params: RequestParams = {}) =>
      this.request<ReviewTypeDto, void>({
        path: `/review-types/${typeName}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Returns the anonymity and communication rules for the workflow plugin identified by its name.
     *
     * @tags Review Types
     * @name GetReviewTypeRules
     * @summary Get the rules of a specific workflow plugin
     * @request GET:/review-types/{typeName}/rules
     */
    getReviewTypeRules: (typeName: string, params: RequestParams = {}) =>
      this.request<ReviewRulesDto, void>({
        path: `/review-types/${typeName}/rules`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  reviewTemplates = {
    /**
     * No description
     *
     * @tags Review Templates
     * @name ListReviewTemplates
     * @summary List all available review templates
     * @request GET:/review-templates
     */
    listReviewTemplates: (params: RequestParams = {}) =>
      this.request<ReviewTemplateDto[], any>({
        path: `/review-templates`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Review Templates
     * @name GetReviewTemplate
     * @summary Get details of a specific review template
     * @request GET:/review-templates/{templateName}
     */
    getReviewTemplate: (templateName: string, params: RequestParams = {}) =>
      this.request<ReviewTemplateDto, void>({
        path: `/review-templates/${templateName}`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
}
