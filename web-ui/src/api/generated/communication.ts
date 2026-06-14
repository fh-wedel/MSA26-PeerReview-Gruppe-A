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

export interface UserDto {
    /** Cognito sub UUID — use this as recipientId when sending a message */
    sub: string;
    /** Human-readable Cognito username */
    username: string;
}

export interface UserListResponse {
    users: UserDto[];
}

export interface ChatContext {
    /** GENERAL for an open thread; SUBMISSION for a submission-specific thread */
    type: "GENERAL" | "SUBMISSION";
    /** Required when type is SUBMISSION. Any string identifier (typically a UUID). */
    submissionId?: string | null;
}

export interface SendMessageRequest {
    /** Cognito sub UUID of the recipient */
    recipientId: string;
    chatContext: ChatContext;
    /**
     * The message text
     * @minLength 1
     * @maxLength 4096
     */
    body: string;
}

export interface ChatSummary {
    chatId?: string;
    /** Cognito sub UUID of the other participant */
    otherParticipantId?: string;
    chatType?: "GENERAL" | "SUBMISSION";
    submissionId?: string | null;
    /** @format date-time */
    lastMessageAt?: string;
    /** @format date-time */
    createdAt?: string;
}

export interface ChatListResponse {
    chats: ChatSummary[];
}

export interface Message {
    messageId?: string;
    /** Cognito sub UUID of the sender */
    senderId?: string;
    body?: string;
    /** @format date-time */
    sentAt?: string;
}

export interface ChatDetailResponse {
    chatId?: string;
    /** Cognito sub UUID of participant A (lower UUID alphabetically) */
    participantA?: string;
    /** Cognito sub UUID of participant B (higher UUID alphabetically) */
    participantB?: string;
    chatType?: "GENERAL" | "SUBMISSION";
    submissionId?: string | null;
    /** @format date-time */
    createdAt?: string;
    /** Messages ordered newest-first */
    messages?: Message[];
    /** Cursor for loading the next (older) page of messages. Null when no more messages exist. */
    nextToken?: string | null;
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
    public baseUrl: string = "/api/communication";
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
 * @title Communication Service API
 * @version 1.0.0
 * @baseUrl /api/communication
 *
 * Provides bidirectional messaging between authenticated users.
 * All authenticated users can initiate chats with any other user.
 * Chat visibility is strictly limited to the two participants.
 */
export class Api<
    SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
    users = {
        /**
         * @description Proxies a search to Cognito to allow the Web-UI to find recipients by username when initiating a new chat. Returns matching users' sub UUIDs and usernames. This endpoint will be extracted to a dedicated User Management Service in a future iteration.
         *
         * @tags Users
         * @name SearchUsers
         * @summary Search for users by username
         * @request GET:/users
         */
        searchUsers: (
            query?: {
                /** Username prefix or substring to filter by */
                search?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<UserListResponse, void>({
                path: `/users`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),
    };
    chats = {
        /**
         * @description Returns all chat threads in which the authenticated user (identified by x-auth-principal-id header) is a participant. No pagination — the number of chats per user is expected to remain small.
         *
         * @tags Chats
         * @name ListChats
         * @summary List all chats for the authenticated user
         * @request GET:/chats
         */
        listChats: (params: RequestParams = {}) =>
            this.request<ChatListResponse, void>({
                path: `/chats`,
                method: "GET",
                format: "json",
                ...params,
            }),

        /**
         * @description Sends a message to a recipient within a given chat context (GENERAL or SUBMISSION-specific). The backend derives a deterministic chatId from the sorted participant pair and context string — the chat is created atomically on the first message if it does not yet exist. The senderId is always taken from the x-auth-principal-id header, never from the request body, preventing impersonation.
         *
         * @tags Chats
         * @name SendMessage
         * @summary Send a message (creates chat implicitly if it does not exist)
         * @request POST:/chats/messages
         */
        sendMessage: (data: SendMessageRequest, params: RequestParams = {}) =>
            this.request<ChatDetailResponse, void>({
                path: `/chats/messages`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Returns the chat metadata and a page of messages, ordered newest-first. Default page size is 100 messages. Use nextToken to load older messages (scroll-up pagination). Returns 403 if the caller is not a participant. Web-UI note: load page 1 on chat open; fetch older pages using the returned nextToken when the user scrolls to the top of the message list.
         *
         * @tags Chats
         * @name GetChat
         * @summary Get a chat thread with paginated message history
         * @request GET:/chats/{chatId}
         */
        getChat: (
            chatId: string,
            query?: {
                /** Pagination cursor returned from a previous response (for loading older messages) */
                nextToken?: string;
                /**
                 * Number of messages to return per page
                 * @min 1
                 * @max 200
                 * @default 100
                 */
                limit?: number;
            },
            params: RequestParams = {},
        ) =>
            this.request<ChatDetailResponse, void>({
                path: `/chats/${chatId}`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),
    };
}
