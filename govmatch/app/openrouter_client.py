import json
import logging
from typing import Optional, List, Dict, Any
import httpx
from app.config import settings

logger = logging.getLogger(__name__)


class OpenRouterClient:
    """Client for OpenRouter API to extract rules from PDF text and format outputs"""
    
    SYSTEM_PROMPT = """You convert government scheme PDFs into a compact eligibility rules JSON. 
Return only valid JSON. No explanations."""

    USER_PROMPT_TEMPLATE = """You are an expert at extracting government scheme eligibility rules from policy documents.

TASK: Convert the following government scheme document into structured JSON eligibility rules.

DOCUMENT TEXT:
{pdf_text}

INSTRUCTIONS:
1. Identify the scheme name and create a simple scheme_id (lowercase, underscores)
2. Extract ALL eligibility criteria (age, income, occupation, caste, gender, location, etc.)
3. Convert criteria into structured conditions with operators
4. List required documents mentioned in the text
5. Summarize benefits and application process

OUTPUT FORMAT (JSON only, no explanations):
{
  "scheme_id": "scheme_name_simplified",
  "scheme_name": "Official Scheme Name from Document",
  "eligibility": {
    "all": [
      {"attribute": "age", "op": ">=", "value": 18, "reason_if_fail": "Must be 18 or older"},
      {"attribute": "income", "op": "<=", "value": 200000, "reason_if_fail": "Annual income must not exceed 2 lakh"}
    ],
    "any": [
      {"attribute": "caste", "op": "in", "value": ["SC", "ST", "OBC"], "reason_if_fail": "Must belong to reserved category"}
    ],
    "disqualifiers": [
      {"attribute": "has_government_job", "op": "==", "value": true, "reason": "Government employees not eligible"}
    ]
  },
  "required_inputs": ["age", "gender", "occupation", "income", "caste", "state"],
  "required_documents": ["aadhaar_card", "income_certificate", "caste_certificate"],
  "benefit_outline": "Brief description of benefits provided",
  "next_steps": "How to apply for this scheme"
}

OPERATORS: ==, !=, >, >=, <, <=, truthy, falsy, in, not_in, between
ATTRIBUTES: age, gender, occupation, income, caste, state, is_student, is_farmer, has_land, etc.

Extract rules even if document is unclear - make reasonable assumptions based on context."""

    @staticmethod
    async def extract_rules(pdf_text: str) -> Optional[dict]:
        """Extract rules from PDF text using OpenRouter API"""
        try:
            headers = {
                "Authorization": f"Bearer {settings.openrouter_api_key}",
                "HTTP-Referer": "govconnect.local",
                "X-Title": "GovMatch Rules Extraction",
                "Content-Type": "application/json"
            }
            
            user_prompt = OpenRouterClient.USER_PROMPT_TEMPLATE.format(pdf_text=pdf_text)
            
            payload = {
                "model": settings.rules_model,
                "messages": [
                    {"role": "system", "content": OpenRouterClient.SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.1,
                "max_tokens": 4000
            }
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{settings.openrouter_base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )
                
                if response.status_code != 200:
                    logger.error(f"OpenRouter API error: {response.status_code} - {response.text}")
                    return None
                
                result = response.json()
                
                if "choices" not in result or not result["choices"]:
                    logger.error("No choices in OpenRouter response")
                    return None
                
                content = result["choices"][0]["message"]["content"].strip()
                
                # Try to parse JSON from the response
                try:
                    # Sometimes the response might have markdown formatting
                    if content.startswith("```json"):
                        content = content.replace("```json", "").replace("```", "").strip()
                    elif content.startswith("```"):
                        content = content.replace("```", "").strip()
                    
                    rules_json = json.loads(content)
                    logger.info(f"Successfully extracted rules for scheme: {rules_json.get('scheme_id', 'unknown')}")
                    return rules_json
                    
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse JSON from OpenRouter response: {e}")
                    logger.error(f"Raw content: {content}")
                    return None
                
        except Exception as e:
            logger.error(f"OpenRouter API call failed: {e}")
            return None

    @staticmethod
    async def format_eligibility_text(eligible_schemes: List[Dict[str, Any]], near_misses: List[Dict[str, Any]]) -> str:
        """Ask the LLM to render a concise, readable text summary from eligibility results."""
        try:
            headers = {
                "Authorization": f"Bearer {settings.openrouter_api_key}",
                "HTTP-Referer": "govconnect.local",
                "X-Title": "GovMatch Summary",
                "Content-Type": "application/json"
            }
            system = (
                "You are a helpful assistant who explains government scheme eligibility results "
                "to normal users in plain, simple text. "
                "Do not output JSON, arrays, brackets, quotes, or code fences. "
                "Avoid technical terms like 'missing:' or 'None of required alternatives met'. "
                "Instead, explain clearly why the user is eligible or not in friendly sentences. "
                "Follow this exact style:\n\n"
                "Matched Schemes\n"
                "<Scheme Name>\n"
                "You are eligible because: <plain reasons>\n"
                "Required Documents: <comma-separated list>\n"
                "How to Apply: <next steps in simple language>\n\n"
                "Near Misses\n"
                "<Scheme Name>: You are not eligible because <plain explanation>\n"
            )
            example = (
                "Matched Schemes\n"
                "Example Scholarship A\n"
                "You are eligible because: you meet the age and income criteria, and you are a current student.\n"
                "Required Documents: aadhaar_card, income_certificate\n"
                "How to Apply: Submit your application on the official portal and upload the required documents.\n\n"
                "Near Misses\n"
                "Example Scheme B: You are not eligible because your age is outside the allowed range.\n"
            )

            user_payload = {
                "eligible_schemes": eligible_schemes,
                "near_misses": near_misses,
                "format_example": example
            }

            payload = {
                "model": settings.rules_model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": json.dumps(user_payload, ensure_ascii=False)}
                ],
                "temperature": 0.1,
                "max_tokens": 1200
            }

            async with httpx.AsyncClient(timeout=45.0) as client:
                resp = await client.post(
                    f"{settings.openrouter_base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )
                if resp.status_code != 200:
                    logger.error(f"OpenRouter summary error: {resp.status_code} - {resp.text}")
                    return ""
                data = resp.json()
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                if content.startswith("```"):
                    content = content.strip("`").strip()
                if content.startswith("{") or content.startswith("["):
                    try:
                        parsed = json.loads(content)
                        lines = ["Matched Schemes"]
                        for s in parsed.get("eligible_schemes", []):
                            name = s.get("scheme_name") or s.get("scheme_id", "Scheme")
                            reasons = "; ".join(s.get("reasons", []))
                            docs = ", ".join(s.get("required_documents", []))
                            next_steps = s.get("next_steps", "")
                            lines += [name, f"You are eligible because: {reasons}", f"Required Documents: {docs}", f"How to Apply: {next_steps}", ""]
                        lines.append("Near Misses")
                        for n in parsed.get("near_misses", []):
                            lines.append(f"{n.get('scheme_id','scheme')}: You are not eligible because {', '.join(n.get('failed_conditions', []))}")
                        content = "\n".join(lines)
                    except Exception:
                        pass
                return content
        except Exception as e:
            logger.error(f"Summary formatting failed: {e}")
            return ""
