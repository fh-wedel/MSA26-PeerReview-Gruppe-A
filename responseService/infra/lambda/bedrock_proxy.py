import base64
import json
import logging
import os
import time

import boto3
from botocore.exceptions import ClientError


LOGGER = logging.getLogger()
LOGGER.setLevel(logging.INFO)

S3_CLIENT = boto3.client("s3")
BEDROCK_CLIENT = boto3.client("bedrock-runtime")

MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "eu.anthropic.claude-sonnet-4-5-20250929-v1:0")
PRIMARY_BUCKET_NAME = os.environ["RESPONSE_DOCUMENTS_BUCKET"]
FALLBACK_BUCKET_NAME = os.environ.get("SUBMISSION_DOCUMENTS_BUCKET")


def _strip_json_fence(text: str) -> str:
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


def _extract_question_ids(criteria_json: str) -> tuple[list[str], list[str]]:
    try:
        parsed = json.loads(criteria_json)
    except Exception:
        return [], []

    if not isinstance(parsed, list):
        return [], []

    question_ids: list[str] = []
    required_ids: list[str] = []
    for item in parsed:
        if not isinstance(item, dict):
            continue
        raw_id = item.get("id")
        if not isinstance(raw_id, str) or not raw_id.strip():
            continue
        qid = raw_id.strip()
        question_ids.append(qid)
        if bool(item.get("required")):
            required_ids.append(qid)

    return question_ids, required_ids


def _extract_first_json_object(text: str) -> dict:
    cleaned = _strip_json_fence(text)

    # Fast path: full payload is already JSON.
    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass

    # Fallback: extract first JSON object from surrounding prose.
    decoder = json.JSONDecoder()
    for index, char in enumerate(cleaned):
        if char != "{":
            continue
        try:
            candidate, _end = decoder.raw_decode(cleaned[index:])
            if isinstance(candidate, dict):
                return candidate
        except Exception:
            continue

    raise RuntimeError("Could not parse a JSON object from Bedrock text response.")


def _to_answer_string(value) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, (int, float, bool)):
        return str(value)
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False)
    return str(value)


def _add_answer_item(raw_item, out_answers: list[dict[str, str]]) -> None:
    if not isinstance(raw_item, dict):
        return

    raw_qid = raw_item.get("questionId") or raw_item.get("question_id") or raw_item.get("id")
    if not isinstance(raw_qid, str) or not raw_qid.strip():
        return

    answer_value = (
        raw_item.get("answer")
        if raw_item.get("answer") is not None
        else raw_item.get("value")
        if raw_item.get("value") is not None
        else raw_item.get("grade")
        if raw_item.get("grade") is not None
        else raw_item.get("score")
        if raw_item.get("score") is not None
        else raw_item.get("comment")
    )
    answer_text = _to_answer_string(answer_value)
    if not answer_text:
        return

    out_answers.append({"questionId": raw_qid.strip(), "answer": answer_text})


def _extract_answers_from_payload(payload: dict, question_ids: list[str]) -> list[dict[str, str]]:
    candidates: list[dict[str, str]] = []

    direct_answers = payload.get("answers")
    if isinstance(direct_answers, list):
        for item in direct_answers:
            _add_answer_item(item, candidates)
    elif isinstance(direct_answers, dict):
        for qid, value in direct_answers.items():
            answer_text = _to_answer_string(value)
            if isinstance(qid, str) and qid.strip() and answer_text:
                candidates.append({"questionId": qid.strip(), "answer": answer_text})

    for key in ("gradingCriteria", "criteria", "reviewAnswers", "questions"):
        values = payload.get(key)
        if isinstance(values, list):
            for item in values:
                _add_answer_item(item, candidates)

    if question_ids:
        for qid in question_ids:
            if qid in payload:
                answer_text = _to_answer_string(payload.get(qid))
                if answer_text:
                    candidates.append({"questionId": qid, "answer": answer_text})

    # De-duplicate by questionId, keep first non-empty answer.
    deduped: dict[str, str] = {}
    for candidate in candidates:
        qid = candidate["questionId"]
        if qid not in deduped:
            deduped[qid] = candidate["answer"]

    answers = [{"questionId": qid, "answer": ans} for qid, ans in deduped.items() if ans]

    # Keep only valid question ids when available to avoid downstream "unknown questionId" failures.
    if question_ids:
        allowed = set(question_ids)
        answers = [entry for entry in answers if entry["questionId"] in allowed]

    return answers


def _normalize_generated_review(raw_text: str, criteria_json: str) -> str:
    question_ids, _required_ids = _extract_question_ids(criteria_json)
    parsed = _extract_first_json_object(raw_text)

    nested_candidates = []
    for nested_key in ("review", "result", "output", "data"):
        nested_value = parsed.get(nested_key)
        if isinstance(nested_value, dict):
            nested_candidates.append(nested_value)

    merged_candidates = [parsed, *nested_candidates]

    answers: list[dict[str, str]] = []
    for candidate in merged_candidates:
        answers = _extract_answers_from_payload(candidate, question_ids)
        if answers:
            break

    if not answers:
        raise RuntimeError("Model response could not be normalized to a non-empty answers array.")

    review_comments = None
    for key in ("reviewComments", "comments", "summary", "overallFeedback", "feedback"):
        value = parsed.get(key)
        if value is None:
            for nested in nested_candidates:
                value = nested.get(key)
                if value is not None:
                    break
        text = _to_answer_string(value)
        if text:
            review_comments = text
            break
    if not review_comments:
        review_comments = "AI review generated successfully."

    final_grade = None
    for key in ("finalGrade", "grade", "overallGrade", "totalGrade"):
        value = parsed.get(key)
        if value is None:
            for nested in nested_candidates:
                value = nested.get(key)
                if value is not None:
                    break
        text = _to_answer_string(value)
        if text:
            final_grade = text
            break

    normalized = {
        "finalGrade": final_grade,
        "reviewComments": review_comments,
        "answers": answers,
    }
    return json.dumps(normalized, ensure_ascii=False)


def _load_document_bytes(document_s3_key: str, preferred_bucket_name: str | None = None) -> bytes:
    bucket_candidates = []
    if preferred_bucket_name:
        bucket_candidates.append(preferred_bucket_name)
    if PRIMARY_BUCKET_NAME not in bucket_candidates:
        bucket_candidates.append(PRIMARY_BUCKET_NAME)
    if (
        FALLBACK_BUCKET_NAME
        and FALLBACK_BUCKET_NAME != PRIMARY_BUCKET_NAME
        and FALLBACK_BUCKET_NAME not in bucket_candidates
    ):
        bucket_candidates.append(FALLBACK_BUCKET_NAME)

    last_error = None
    for bucket_name in bucket_candidates:
        try:
            LOGGER.info("Trying to fetch document key '%s' from bucket '%s'", document_s3_key, bucket_name)
            response = S3_CLIENT.get_object(Bucket=bucket_name, Key=document_s3_key)
            body = response["Body"].read()
            if not body:
                raise ValueError(f"Document at key '{document_s3_key}' in bucket '{bucket_name}' is empty.")
            return body
        except ClientError as exc:
            error_code = exc.response.get("Error", {}).get("Code")
            if error_code == "NoSuchKey":
                last_error = exc
                continue
            raise

    if last_error is not None:
        raise last_error
    raise RuntimeError(f"Could not resolve document key '{document_s3_key}' from configured buckets.")


def handler(event, _context):
    submission_id = event.get("submissionId", "unknown")
    review_result_id = event.get("reviewResultId", "unknown")
    document_s3_key = event.get("documentS3Key")
    document_s3_bucket = event.get("documentS3Bucket")
    criteria_json = event.get("criteriaJson")

    if not document_s3_key:
        raise ValueError("documentS3Key is required")
    if not criteria_json:
        raise ValueError("criteriaJson is required")
    question_ids, required_ids = _extract_question_ids(criteria_json)

    LOGGER.info(
        "Processing Bedrock proxy request for submission=%s reviewResultId=%s using modelOrProfileId=%s bucketHint=%s",
        submission_id,
        review_result_id,
        MODEL_ID,
        document_s3_bucket,
    )

    s3_start = time.time()
    pdf_bytes = _load_document_bytes(document_s3_key, document_s3_bucket)
    LOGGER.info("Loaded %d bytes from S3 in %.2fs", len(pdf_bytes), time.time() - s3_start)

    system_prompt = (
        "You are an expert AI peer reviewer evaluating a scientific or academic submission. "
        "Your task is to analyze the document content and provide grades and feedback according to "
        "the EXACT provided JSON grading criteria schema. You must return ONLY a JSON object that "
        "matches the expected response schema. Do not include any other text, markdown formatting "
        "blocks, or explanations outside the JSON."
    )

    user_prompt = (
        "Here is the grading criteria and format you must follow:\n"
        f"{criteria_json}\n\n"
        "Return ONLY valid JSON with this exact top-level structure:\n"
        "{\n"
        '  "finalGrade": "string or null",\n'
        '  "reviewComments": "string",\n'
        '  "answers": [\n'
        '    {"questionId": "string", "answer": "string"}\n'
        "  ]\n"
        "}\n"
        f"Allowed questionId values: {question_ids}\n"
        f"Required questionId values that must be answered: {required_ids}\n"
        "The answers array must be non-empty. Do not add markdown, code fences, or explanatory text."
    )

    request_payload = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 4096,
        "temperature": 0,
        "system": system_prompt,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "document",
                        "source": {
                            "type": "base64",
                            "media_type": "application/pdf",
                            "data": base64.b64encode(pdf_bytes).decode("utf-8"),
                        },
                    },
                    {"type": "text", "text": user_prompt},
                ],
            }
        ],
    }

    bedrock_start = time.time()
    LOGGER.info("Invoking Bedrock model/profile '%s'", MODEL_ID)
    bedrock_response = BEDROCK_CLIENT.invoke_model(
        modelId=MODEL_ID,
        contentType="application/json",
        accept="application/json",
        body=json.dumps(request_payload),
    )
    LOGGER.info("Bedrock invocation completed in %.2fs", time.time() - bedrock_start)

    body = json.loads(bedrock_response["body"].read())
    content = body.get("content") or []
    if not content:
        raise RuntimeError("Bedrock returned no content.")

    text_parts = []
    for item in content:
        if isinstance(item, dict):
            text = item.get("text")
            if isinstance(text, str) and text.strip():
                text_parts.append(text)

    raw_text = "\n".join(text_parts).strip()
    if not raw_text:
        raise RuntimeError("Bedrock returned empty review JSON text.")

    LOGGER.info("Bedrock raw text preview: %s", raw_text[:1500].replace("\n", "\\n"))
    generated_review_json = _normalize_generated_review(raw_text, criteria_json)
    LOGGER.info("Normalized review JSON preview: %s", generated_review_json[:1500].replace("\n", "\\n"))

    return {"generatedReviewJson": generated_review_json}
