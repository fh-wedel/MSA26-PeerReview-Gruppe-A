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

export interface CreateSubmissionRequest {
    configurationId: string;
    title: string;
}

export interface UpdateSubmissionRequest {
    title?: string;
}

export interface PresignedUrlRequest {
    fileName: string;
    contentType: string;
}

export interface PresignedUrlResponse {
    uploadUrl?: string;
    documentId?: string;
    s3Key?: string;
}

export interface Submission {
    submissionId?: string;
    configurationId?: string;
    authorId?: string;
    title?: string;
    status?: "DRAFT" | "SUBMITTED" | "READY_FOR_REVIEW";
    /** @format date-time */
    createdAt?: string;
    /** @format date-time */
    updatedAt?: string;
    /** @format date-time */
    submittedAt?: string;
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
    public baseUrl: string = "/api/submission";
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
 * @title Submission Service API
 * @version 1.0.0
 * @baseUrl /api/submission
 *
 * API for managing document submissions in the PeerReview system
 */
export class Api<
    SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
    status = {
        /**
         * No description
         *
         * @name GetStatus
         * @summary Service health status
         * @request GET:/status
         */
        getStatus: (params: RequestParams = {}) =>
            this.request<string, any>({
                path: `/status`,
                method: "GET",
                ...params,
            }),
    };
    time = {
        /**
         * No description
         *
         * @name GetTime
         * @summary Server time with auth info
         * @request GET:/time
         */
        getTime: (params: RequestParams = {}) =>
            this.request<string, any>({
                path: `/time`,
                method: "GET",
                ...params,
            }),
    };
    configurations = {
        /**
         * No description
         *
         * @name CreateConfiguration
         * @summary Create submission configuration (proxied to configuration-service)
         * @request POST:/configurations
         */
        createConfiguration: (data: object, params: RequestParams = {}) =>
            this.request<object, any>({
                path: `/configurations`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @name GetGradingForm
         * @summary Get grading form for a configuration (proxied to configuration-service)
         * @request GET:/configurations/{id}/grading-form
         */
        getGradingForm: (id: string, params: RequestParams = {}) =>
            this.request<object, any>({
                path: `/configurations/${id}/grading-form`,
                method: "GET",
                format: "json",
                ...params,
            }),
    };
    submissions = {
        /**
         * No description
         *
         * @name CreateSubmission
         * @summary Create a new submission draft
         * @request POST:/submissions
         */
        createSubmission: (
            data: CreateSubmissionRequest,
            params: RequestParams = {},
        ) =>
            this.request<Submission, any>({
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
         * @name UpdateSubmission
         * @summary Update submission draft details
         * @request PUT:/submissions/{id}
         */
        updateSubmission: (
            id: string,
            data: UpdateSubmissionRequest,
            params: RequestParams = {},
        ) =>
            this.request<Submission, any>({
                path: `/submissions/${id}`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @name GetPresignedUploadUrl
         * @summary Generate presigned S3 upload URL for a document
         * @request POST:/submissions/{id}/presigned-url
         */
        getPresignedUploadUrl: (
            id: string,
            data: PresignedUrlRequest,
            params: RequestParams = {},
        ) =>
            this.request<PresignedUrlResponse, any>({
                path: `/submissions/${id}/presigned-url`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @name SubmitSubmission
         * @summary Finalize and submit the submission
         * @request POST:/submissions/{id}/submit
         */
        submitSubmission: (id: string, params: RequestParams = {}) =>
            this.request<Submission, any>({
                path: `/submissions/${id}/submit`,
                method: "POST",
                format: "json",
                ...params,
            }),
    };
}
