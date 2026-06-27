import base64
import json
import logging
import os

import boto3


LOGGER = logging.getLogger()
LOGGER.setLevel(logging.INFO)

S3_CLIENT = boto3.client("s3")
BEDROCK_CLIENT = boto3.client("bedrock-runtime")

MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20240620-v1:0")
BUCKET_NAME = os.environ["RESPONSE_DOCUMENTS_BUCKET"]


def _strip_json_fence(text: str) -> str:
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


def handler(event, _context):
    submission_id = event.get("submissionId", "unknown")
    review_result_id = event.get("reviewResultId", "unknown")
    document_s3_key = event.get("documentS3Key")
    criteria_json = event.get("criteriaJson")

    if not document_s3_key:
        raise ValueError("documentS3Key is required")
    if not criteria_json:
        raise ValueError("criteriaJson is required")

    LOGGER.info(
        "Processing Bedrock proxy request for submission=%s reviewResultId=%s",
        submission_id,
        review_result_id,
    )

    document = S3_CLIENT.get_object(Bucket=BUCKET_NAME, Key=document_s3_key)
    pdf_bytes = document["Body"].read()
    if not pdf_bytes:
        raise ValueError(f"Document at key '{document_s3_key}' is empty.")

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
        "Analyze the provided document thoroughly against the criteria and output the JSON response."
    )

    request_payload = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 4096,
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

    bedrock_response = BEDROCK_CLIENT.invoke_model(
        modelId=MODEL_ID,
        contentType="application/json",
        accept="application/json",
        body=json.dumps(request_payload),
    )

    body = json.loads(bedrock_response["body"].read())
    content = body.get("content") or []
    if not content:
        raise RuntimeError("Bedrock returned no content.")

    generated_review_json = _strip_json_fence(content[0].get("text", ""))
    if not generated_review_json:
        raise RuntimeError("Bedrock returned empty review JSON text.")

    return {"generatedReviewJson": generated_review_json}
