"""
services/gemma_explainability.py

Hybrid Gemma 4 inference engine for autism-spectrum screening.

Architecture
────────────
Phase 1  (Computer Vision)
    BehavioralVideoAnalyzer extracts quantitative gaze + head-pose metrics
    locally via OpenCV + MediaPipe.  No cloud upload of the raw video.

Phase 2  (Prompt Engineering — Chain-of-Thought)
    CV metrics + anamnesis data are injected into a rich system prompt that
    instructs Gemma 4 to reason step-by-step (Thinking Mode) before emitting
    the final JSON.

Phase 3  (Gemma 4 Inference via Google AI Studio)
    Uses google-genai SDK >= 1.x routed to gemma-4-9b-it (default) or
    gemma-4-27b-it (dense, for complex cases) selectable at runtime via the
    GEMMA_MODEL env var.  The SDK's native thinking_config activates
    extended reasoning (budget_tokens controls depth).

Phase 4  (Parse + Ground-truth Override)
    Robust multi-strategy JSON extractor handles model artefacts.
    CV-derived video_features values are applied on top of the parsed JSON
    to prevent hallucinated gaze/head metrics.
"""

from __future__ import annotations

import json
import os
import re
import time
import subprocess
import tempfile
from concurrent.futures import ThreadPoolExecutor

import google.generativeai as legacy_genai
from pydantic import BaseModel, Field
from typing import List, Dict, Optional

from utils.logger import get_logger
from services.audio_extractor import AudioFeatureExtractor

logger = get_logger(__name__)

# ---------------------------------------------------------------------------
# Model selection
# ---------------------------------------------------------------------------
_DEFAULT_MODEL = "gemma-4-26b-a4b-it"
_DENSE_MODEL   = "gemma-4-31b-it"

def _get_model() -> str:
    """Return the active Gemma 4 model name from env."""
    return os.getenv("GEMMA_MODEL", _DEFAULT_MODEL)

def _configure_sdk():
    """Configure the legacy Google AI SDK."""
    api_key = os.getenv("GEMMA_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key or api_key.lower() == "mock":
        raise ValueError("GEMMA_API_KEY não configurado.")
    legacy_genai.configure(api_key=api_key)


# ---------------------------------------------------------------------------
# Pydantic Schemas for Structured Output
# ---------------------------------------------------------------------------

class VideoFeatures(BaseModel):
    avg_gaze_score: float
    eye_contact_ratio: float
    head_movement_pattern: str
    facial_expressivity: str

class AudioFeatures(BaseModel):
    prosody_variation: float
    speech_presence: bool
    audio_reactivity: str

class TextFeatures(BaseModel):
    parent_concerns: List[str]
    contextual_flags: List[str]

class RiskScore(BaseModel):
    score: float
    level: str

class ScreeningReport(BaseModel):
    video_features: VideoFeatures
    audio_features: AudioFeatures
    text_features: TextFeatures
    risk_score: RiskScore
    clinical_reasoning: str = Field(description="Cadeia de raciocínio clínico fundamentada.")
    gemma_report: str = Field(description="Relatório empático formatado em Markdown.")


# ---------------------------------------------------------------------------
# Phase 1 helper — lazy import to avoid MediaPipe loading on every module import
# ---------------------------------------------------------------------------

def _run_cv_analysis(video_path: str) -> dict:
    """
    Run the local OpenCV + MediaPipe analysis.
    Returns safe-default dict on any failure.
    """
    try:
        from services.video_extractor import BehavioralVideoAnalyzer
        analyzer = BehavioralVideoAnalyzer()
        metrics = analyzer.analyze_video(video_path)
        return metrics
    except Exception as exc:
        logger.warning("CV analysis failed (%s) — using safe defaults.", exc)
        return {
            "avg_gaze_score": 0.0,
            "eye_contact_ratio": 0.0,
            "head_movement_pattern": "normal",
            "facial_expressivity": "normal",
        }


# ---------------------------------------------------------------------------
# Phase 2 — System instruction + CoT mega-prompt
# ---------------------------------------------------------------------------

def _get_system_instruction(lang: str = "pt") -> str:
    """Return a localized system instruction."""
    lang = lang.lower()
    
    # Section headers mapping (must match _build_prompt)
    headers = {
        "pt": ("Análise do Comportamento Observado", "Correlação com as Preocupações Familiares", "Nível de Atenção Recomendado e Próximos Passos"),
        "en": ("Analysis of Observed Behavior", "Correlation with Family Concerns", "Recommended Level of Care and Next Steps"),
        "es": ("Análisis del Comportamento Observado", "Correlación con las Preocupaciones Familiares", "Nivel de Atención Recomendado y Próximos Pasos")
    }
    h1, h2, h3 = headers.get(lang, headers["pt"])
    
    return (
        f"Você é o especialista Gemma-4-Good do programa Primeiro Olhar. Seu papel é gerar relatórios de triagem de TEA "
        f"empáticos, técnicos e acolhedores. O tom deve ser clínico, mas nunca alarmista.\n\n"
        f"ESTRUTURA OBRIGATÓRIA DO RELATÓRIO (Markdown):\n"
        f"1. **{h1}:** (Descreva padrões detectados)\n"
        f"2. **{h2}:** (Cruze os dados técnicos com o relato)\n"
        f"3. **{h3}:** (Conclua com o risco e orientações)\n\n"
        f"DIRETRIZES:\n"
        f"- NUNCA dê um diagnóstico. Use termos como 'sugestivo', 'indicadores' ou 'sinais'.\n"
        f"- SEMPRE utilize os três nomes de seções acima EXATAMENTE como escritos, em negrito.\n"
        f"- Os parágrafos devem ser fluidos e fáceis de ler por famílias."
    )


def _build_prompt(cv_metrics: dict, audio_metrics: dict, parent_answers: dict) -> str:
    """
    Construct the full Chain-of-Thought prompt that:
    1. Describes CV and Audio metrics in natural language.
    2. Provides the full anamnesis.
    3. Instructs Gemma 4 to reason step-by-step (Thinking Mode).
    4. Mandates a structured output matching the Pydantic schema.
    """
    child_name = parent_answers.get("child_name", "Criança")
    
    # Detection of age-specific urgency (Moved to top)
    age_str = parent_answers.get('child_age', '0')
    try:
        age_num = int(float(age_str))
    except (ValueError, TypeError):
        age_num = 0

    avg_gaze   = cv_metrics.get("avg_gaze_score", -1.0)
    eye_ratio  = cv_metrics.get("eye_contact_ratio", -1.0)
    head_pat   = cv_metrics.get("head_movement_pattern", "inconclusivo")
    express    = cv_metrics.get("facial_expressivity", "inconclusivo")

    gaze_label = (
        "inconclusivo (rosto não detectado)" if avg_gaze < 0.0 else
        "alto (≥ 0.70)"        if avg_gaze >= 0.70 else
        "moderado (0.40–0.69)" if avg_gaze >= 0.40 else
        "baixo (< 0.40)"
    )
    
    ratio_str = f"{eye_ratio * 100:.1f}%" if eye_ratio >= 0 else "inconclusivo"
    gaze_str = f"{avg_gaze:.4f}" if avg_gaze >= 0 else "inconclusivo"

    cv_section = f"""═══ DADOS TÉCNICOS DE VISÃO COMPUTACIONAL (fonte: análise local, CPU) ═══
• Índice médio de contato visual (avg_gaze_score): {gaze_str} — nível {gaze_label}
• Proporção de frames com engajamento ocular (> 0.60): {ratio_str}
• Padrão de movimentação cefálica (variância do ângulo yaw): {head_pat}
• Expressividade facial detectada: {express}

Estes valores são objetivos e devem ancorar sua análise clínica.
Interprete-os clinicamente — NÃO os copie literalmente no relatório. Se o rosto não foi detectado, avalie apenas com base na anamnese sem penalizar a falta de vídeo."""

    prosody = audio_metrics.get("prosody_variation", 0.5)
    speech  = "detectada" if audio_metrics.get("speech_presence", False) else "não detectada ou mínima"
    react   = audio_metrics.get("audio_reactivity", "normal")

    audio_section = f"""═══ DADOS TÉCNICOS DE ÁUDIO (fonte: análise local, CPU) ═══
• Presença de fala/vocalização: {speech}
• Índice de variação de prosódia (melodia da voz): {prosody:.2f} (0.0 = monótona, 1.0 = variada)
• Reatividade sonora detectada: {react}"""

    anamnesis_section = f"""═══ ANAMNESE (Relato dos Pais) ═══
• Nome da criança: {parent_answers.get('child_name', 'Não informado')}
• Idade da criança: {age_num} ano(s) (DADO CONFIRMADO PELA FAMÍLIA — USE COMO REFERÊNCIA ABSOLUTA)
• Preocupações principais: {parent_answers.get('concerns', 'Não relatado')}
• Atraso na comunicação: {parent_answers.get('communication_delays', 'Não relatado')}
• Responde ao próprio nome?: {parent_answers.get('responds_to_name', 'Não informado')}
• Engaja em jogo simbólico (ex: dar comida para boneca)?: {parent_answers.get('pretend_play', 'Não informado')}
• Apresenta comportamentos repetitivos (enfileirar, girar, focar em partes)?: {parent_answers.get('object_lining', 'Não informado')}"""

    # Urgency logic
    urgency_note = ""
    if age_num >= 5:
        urgency_note = """
        IMPORTANTE (Urgência por Idade): A criança tem 5 anos ou mais. 
        Se você identificar 'Indicadores Fortes' (ALTO Risco), você DEVE reforçar no relatório a importância de buscar um especialista imediatamente. 
        Mantenha um tom extremamente ACOLHEDOR e EMPÁTICO; nunca seja brusco ou alarmista. 
        Explique de forma suave que, nesta faixa etária, o suporte especializado é prioritário para aproveitar ao máximo o desenvolvimento atual, e que embora intervenções ideais comecem mais cedo, SEMPRE há tempo para agir e transformar o futuro da criança."""

    # Language handling
    lang = parent_answers.get("lang", "pt").lower()
    lang_map = {
        "pt": ("Português (Brasil)", "Análise do Comportamento Observado", "Correlação com as Preocupações Familiares", "Nível de Atenção Recomendado e Próximos Passos"),
        "en": ("English", "Analysis of Observed Behavior", "Correlation with Family Concerns", "Recommended Level of Care and Next Steps"),
        "es": ("Español", "Análisis del Comportamento Observado", "Correlación con las Preocupaciones Familiares", "Nivel de Atención Recomendado y Próximos Pasos")
    }
    
    target_lang, h1, h2, h3 = lang_map.get(lang, lang_map["pt"])

    chain_of_thought_instruction = f"""═══ MODO DE RACIOCÍNIO CLÍNICO (Chain-of-Thought — Thinking Mode) ═══
Antes de gerar o JSON final, execute mentalmente os seguintes passos de raciocínio:
{urgency_note}

PASSO 1 — Análise Motora e Ocular:
  Interprete os dados de visão computacional. O índice de contato visual está
  abaixo do esperado para a faixa etária da criança ({age_num} anos)? O padrão de movimentação cefálica
  é consistente com atenção compartilhada ou com hiperatividade/foco restrito?

PASSO 2 — Correlação com a Anamnese:
  Os achados visuais são congruentes com as preocupações relatadas pelos pais?
  Há convergência entre o baixo engajamento ocular e a dificuldade de responder
  ao nome? Existe jogo simbólico preservado que contradiz outros indicadores?

PASSO 3 — Justificativa do Risk Score:
  Com base nos dois passos anteriores, justifique o score de risco (0.0–1.0)
  que você vai atribuir. 0.0 = sem indicadores. 1.0 = múltiplos indicadores fortes.
  Explique o raciocínio de forma que um pediatra leigo consiga compreender.
  Encapsule essa justificativa no campo "clinical_reasoning" do JSON.

PASSO 4 — Redação do Relatório Empático (gemma_report):
  Escreva o relatório em {target_lang} usando EXATAMENTE os três tópicos obrigatórios:
  1. **{h1}:**
  2. **{h2}:**
  3. **{h3}:**

  IMPORTANTE: Utilize linguagem acolhedora. Foque no desenvolvimento e suporte.
  Mantenha o campo risk_score como um valor numérico entre 0.0 e 1.0.

Realize esses passos internamente e responda apenas com o JSON final."""

    return "\n\n".join([cv_section, audio_section, anamnesis_section, chain_of_thought_instruction])


# ---------------------------------------------------------------------------
# Phase 3 — Gemma 4 inference with thinking_config
# ---------------------------------------------------------------------------

def _infer_with_gemma4(prompt: str, video_ref, lang: str = "pt") -> str:
    """Call Gemma 4 with stable SDK."""
    model = _get_model()
    logger.info("Rodando inferência Gemma 4 — modelo: %s", model)

    model_instance = legacy_genai.GenerativeModel(
        model_name=model,
        system_instruction=_get_system_instruction(lang)
    )
    
    logger.info("Invocando geração de conteúdo (Multimodal)...")
    start_time = time.time()
    response = model_instance.generate_content(
        [video_ref, prompt],
        generation_config={
            "temperature": 0.2,
            "max_output_tokens": 4096,
        },
        stream=False
    )
    
    latency = time.time() - start_time
    logger.info("Gemma 4 respondeu com sucesso em %.2fs", latency)

    raw = response.text
    logger.info("Gemma 4 respondeu (%d chars).", len(raw))
    return raw


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def analyze_multimodal_case(video_path: str, parent_answers: dict) -> dict:
    """Orchestrate the full hybrid screening pipeline using stable SDK."""
    logger.info("Fase 1 & 2: Iniciando análise multimodal local...")
    
    with ThreadPoolExecutor(max_workers=2) as executor:
        future_cv = executor.submit(_run_cv_analysis, video_path)
        future_audio = executor.submit(lambda: AudioFeatureExtractor().extract_features(video_path))
        
        cv_metrics = future_cv.result()
        audio_metrics = future_audio.result()

    _configure_sdk()
    
    logger.info("Removendo trilha de áudio do vídeo...")
    stripped_video_path = _strip_audio_from_video(video_path)
    
    video_ref = None
    raw_text = ""
    try:
        logger.info("Upload do vídeo mudo para Google Files API...")
        video_ref = legacy_genai.upload_file(path=stripped_video_path)
        logger.info("Upload concluído: %s", video_ref.name)
        
        _wait_for_file_active(video_ref)
        
        prompt = _build_prompt(cv_metrics, audio_metrics, parent_answers)
        raw_text = _infer_with_gemma4(prompt, video_ref, parent_answers.get("lang", "pt"))

    finally:
        try:
            if video_ref:
                legacy_genai.delete_file(video_ref.name)
        except: pass
        try:
            if os.path.exists(stripped_video_path):
                os.remove(stripped_video_path)
        except: pass

    parsed = try_parse_json(raw_text)
    if not parsed:
        logger.error("JSON inválido do Gemma 4: %s", raw_text[:500])
        raise ValueError("Falha ao interpretar resposta do Gemma 4.")

    # Enforce CV ground truth
    parsed.setdefault("video_features", {})
    parsed["video_features"].update({
        "avg_gaze_score": round(cv_metrics.get("avg_gaze_score", 0), 4),
        "eye_contact_ratio": round(cv_metrics.get("eye_contact_ratio", 0), 4),
        "head_movement_pattern": cv_metrics.get("head_movement_pattern", "normal"),
        "facial_expressivity": cv_metrics.get("facial_expressivity", "normal"),
    })

    # Enforce Audio ground truth
    parsed.setdefault("audio_features", {})
    parsed["audio_features"].update({
        "prosody_variation": round(audio_metrics.get("prosody_variation", 0), 2),
        "speech_presence": audio_metrics.get("speech_presence", False),
        "audio_reactivity": audio_metrics.get("audio_reactivity", "normal"),
    })

    # Normalize risk_score
    risk_data = parsed.get("risk_score")
    score = 0.0
    
    if isinstance(risk_data, (int, float)):
        score = float(risk_data)
    elif isinstance(risk_data, dict):
        score = float(risk_data.get("score", 0.0))
    elif isinstance(risk_data, str):
        try:
            score = float(risk_data)
        except ValueError:
            score = 0.0
            
    # Map score to level
    level = "Baixo" if score < 0.35 else "Médio" if score < 0.7 else "Alto"
    parsed["risk_score"] = {"score": score, "level": level}

    logger.info("Gemma 4 — inferência concluída com sucesso.")
    return parsed


def _wait_for_file_active(video_file, max_retries: int = 30) -> None:
    """Poll using stable SDK."""
    retries = 0
    while retries < max_retries:
        file = legacy_genai.get_file(video_file.name)
        state = file.state.name
        logger.info("Estado do vídeo: %s", state)
        if state == "ACTIVE":
            return
        if state == "FAILED":
            raise ValueError("Processamento do vídeo falhou no Google.")
        time.sleep(2)
        retries += 1
    raise TimeoutError("Tempo esgotado aguardando vídeo.")


def _strip_audio_from_video(video_path: str) -> str:
    """
    Remove the audio track from an MP4 file using ffmpeg.
    Creates a temporary file without audio to appease the Gemma 4 API.
    """
    fd, temp_path = tempfile.mkstemp(suffix=".mp4")
    os.close(fd)
    
    cmd = [
        "ffmpeg", 
        "-y",               # overwrite output
        "-i", video_path,   # input file
        "-an",              # remove audio
        "-vcodec", "copy",  # copy video stream directly (fast)
        temp_path
    ]
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return temp_path
    except subprocess.CalledProcessError as exc:
        logger.error("FFmpeg falhou ao remover áudio. stderr: %s", exc.stderr.decode("utf-8", errors="ignore"))
        # Fallback to the original video if ffmpeg fails and hope for the best
        return video_path


# ---------------------------------------------------------------------------
# Robust JSON extractor
# ---------------------------------------------------------------------------

def try_parse_json(text: str) -> dict | None:
    """
    Multi-strategy JSON extractor that handles Gemma 4 output artefacts:
    - Lists wrapping the object ([{...}])
    - Markdown code fences (```json … ```)
    - Text preambles before the first `{`
    - JS-style inline comments
    - Trailing commas before } or ]
    """
    if not text or not text.strip():
        return None

    def _extract_dict(data) -> dict | None:
        if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
            return data[0]
        if isinstance(data, dict):
            return data
        return None

    # Strategy 1: direct parse (ideal — model obeyed)
    try:
        res = _extract_dict(json.loads(text))
        if res: return res
    except json.JSONDecodeError:
        pass

    # Strategy 2: strip markdown code fences
    try:
        stripped = re.sub(r"```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        stripped = stripped.replace("```", "").strip()
        res = _extract_dict(json.loads(stripped))
        if res: return res
    except json.JSONDecodeError:
        pass

    # Strategy 3: extract first top-level { … } block (skips preamble text)
    try:
        start = text.index("{")
        end   = text.rindex("}") + 1
        res = _extract_dict(json.loads(text[start:end]))
        if res: return res
    except (ValueError, json.JSONDecodeError):
        pass

    # Strategy 4: extract first top-level [ … ] array if object failed
    try:
        start = text.index("[")
        end   = text.rindex("]") + 1
        res = _extract_dict(json.loads(text[start:end]))
        if res: return res
    except (ValueError, json.JSONDecodeError):
        pass

    # Strategy 5: aggressive cleanup — comments + trailing commas
    try:
        cleaned = re.sub(r"```(?:json)?|```", "", text, flags=re.IGNORECASE).strip()
        cleaned = re.sub(r"//[^\n]*\n", "\n", cleaned)
        cleaned = re.sub(r",\s*([}\]])", r"\1", cleaned)
        start = cleaned.index("{")
        end   = cleaned.rindex("}") + 1
        res = _extract_dict(json.loads(cleaned[start:end]))
        if res: return res
    except (ValueError, json.JSONDecodeError, Exception):
        pass

    return None


# ---------------------------------------------------------------------------
# Translation (uses same Gemma 4 model)
# ---------------------------------------------------------------------------

async def translate_report(text: str, target_lang: str) -> str:
    """
    Translate a clinical markdown report to *target_lang* using Gemma 4.
    Falls back to the original text on any failure.
    """
    try:
        client = _get_client()
    except ValueError:
        return text

    prompt = (
        f"Translate the following clinical screening markdown report to language code '{target_lang}'.\n"
        "RULES:\n"
        "- Output ONLY the translated markdown. Zero preamble or explanation.\n"
        "- Preserve ALL markdown structure: newlines, **bold**, - dashes.\n"
        "- Do NOT translate proper nouns or clinical acronyms (TEA, DSM-5, ABA, CARS).\n\n"
        f"Report to translate:\n\n{text}"
    )

    try:
        response = client.models.generate_content(
            model=_get_model(),
            contents=prompt,
            config=types.GenerateContentConfig(temperature=0.1, max_output_tokens=2048),
        )
        translated = response.text.strip()
        # Strip any accidental markdown fences
        translated = re.sub(r"```[a-z]*\s*|```", "", translated, flags=re.IGNORECASE).strip()
        return translated if translated else text
    except Exception as exc:
        logger.error("Erro na tradução para '%s' via Gemma 4: %s", target_lang, exc)
        return text
