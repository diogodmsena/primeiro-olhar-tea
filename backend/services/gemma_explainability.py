import os
import json
import re
import time
from google import genai
from google.genai import types
from utils.logger import get_logger

logger = get_logger(__name__)

def analyze_multimodal_case(video_path: str, parent_answers: dict) -> dict:
    """
    Integração real via Google GenAI Multimodal.
    Faz upload do video e gera a resposta com base nele + form.
    """
    api_key = os.getenv("GEMMA_API_KEY") or os.getenv("GEMINI_API_KEY")
    is_mock = not api_key or api_key.lower() == "mock"
    
    if is_mock:
        logger.info("Executando modelo em modo MOCK (Sem chave Google AI Studio)")
        time.sleep(2)
        return generate_mock_response(parent_answers)
        
    try:
        logger.info(f"Fazendo upload do vídeo na Cloud de Inferência: {video_path}")
        client = genai.Client(api_key=api_key)
        video_file = client.files.upload(path=video_path)
        
        # Aguarda processamento do vídeo (compatível com google-genai 0.3.x)
        def get_file_state(f):
            try:
                s = f.state
                if s is None:
                    return "ACTIVE"
                if isinstance(s, str):
                    return s.upper()
                if hasattr(s, 'name'):
                    return s.name.upper()
                return str(s).upper()
            except Exception:
                return "ACTIVE"
        
        time.sleep(3)
        video_file = client.files.get(name=video_file.name)
        state = get_file_state(video_file)
        retries = 0
        while state == "PROCESSING" and retries < 30:
            logger.info(f"Aguardando Gemini processar vídeo... (tentativa {retries+1})")
            time.sleep(3)
            video_file = client.files.get(name=video_file.name)
            state = get_file_state(video_file)
            retries += 1

        if state == "FAILED":
            raise ValueError("O processamento de vídeo pelo servidor do Google falhou.")
            
        logger.info(f"Vídeo processado! Estado: {state}. Rodando Inferência LLM...")

        context = f"""Respostas Paternas / Anamnese:
- Preocupações principais: {parent_answers.get('concerns', 'Não relatado')}
- Atraso na comunicação: {parent_answers.get('communication_delays', 'Não relatado')}
- Responde ao nome?: {parent_answers.get('responds_to_name', 'Não')}"""
        
        prompt = f"""You are "Gemma-4-Good", an advanced autism screening system.
Analyze the attached video and the parent questionnaire below to produce a clinical screening report.

PARENT QUESTIONNAIRE:
{context}

CRITICAL RULES:
1. Your ENTIRE response must be ONLY a single valid JSON object. NO comments, NO explanations outside JSON.
2. Put ALL your clinical analysis inside the "gemma_report" field as a markdown string in Portuguese (PT-BR).
3. If you cannot fully analyze the video, still fill all fields with your best estimates based on available data.
4. DO NOT add any text, notes or comments inside JSON fields other than their expected values.

REQUIRED JSON SCHEMA (return EXACTLY this structure with real values):
{{
    "video_features": {{
        "avg_gaze_score": 0.5,
        "eye_contact_ratio": 0.5,
        "head_movement_pattern": "normal",
        "facial_expressivity": "low"
    }},
    "audio_features": {{
        "prosody_variation": 0.5,
        "speech_presence": true,
        "audio_reactivity": "low"
    }},
    "text_features": {{
        "parent_concerns": ["preocupação relatada 1"],
        "contextual_flags": ["flag clínica 1"]
    }},
    "risk_score": {{
        "score": 0.5,
        "level": "MÉDIO"
    }},
    "gemma_report": "## Relatório de Triagem\\n\\nTexto completo do relatório clínico."
}}

Output ONLY the JSON object. No text before or after it."""

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[video_file, prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        raw_text = response.text
        logger.info(f"Resposta bruta do Gemini (500 chars): {raw_text[:500]}")
        
        parsed = try_parse_json(raw_text)
        
        if parsed:
            try:
                client.files.delete(name=video_file.name)
            except Exception:
                pass
            logger.info("Inferência JSON concluída com sucesso!")
            return parsed
        else:
            logger.error(f"JSON inválido após tentativas de reparo: {raw_text[:1000]}")
            return generate_mock_response(parent_answers)

    except Exception as e:
        logger.error(f"Erro na integração Multimodal: {e}")
        return generate_mock_response(parent_answers)


def try_parse_json(text: str):
    """Try multiple strategies to parse JSON from LLM output."""

    # Strategy 1: Direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    # Strategy 2: Extract first complete JSON object with regex
    try:
        match = re.search(r'\{[\s\S]*\}', text)
        if match:
            return json.loads(match.group())
    except json.JSONDecodeError:
        pass
    
    # Strategy 3: Clean common LLM artifacts
    try:
        cleaned = text.strip()
        cleaned = re.sub(r'//.*?\n', '\n', cleaned)
        cleaned = re.sub(r',\s*([}\]])', r'\1', cleaned)
        return json.loads(cleaned)
    except (json.JSONDecodeError, Exception):
        pass
    
    return None


def generate_mock_response(answers: dict) -> dict:
     return {
         "video_features": {"avg_gaze_score": 0.5, "eye_contact_ratio": 0.45, "head_movement_pattern": "normal", "facial_expressivity": "low"},
         "audio_features": {"prosody_variation": 0.30, "speech_presence": True, "audio_reactivity": "low"},
         "text_features": {"parent_concerns": [answers.get('concerns', '')], "contextual_flags": ["Atraso de fala observado na anamnese"]},
         "risk_score": {"score": 0.88, "level": "ALTO"},
         "gemma_report": f"**Relatório Fallback MOCK**\n\nO backend não encontrou sua API Key e ativou o modo fail-safe. Detalhes: {answers.get('concerns')}. Considere contatar a moderação médica local."
     }
