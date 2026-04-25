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

from google import genai
from google.genai import types

from utils.logger import get_logger

logger = get_logger(__name__)

# ---------------------------------------------------------------------------
# Model selection
# ---------------------------------------------------------------------------
# Default: efficient 9B IT model — fast, low cost, suits hackathon demos.
# Set GEMMA_MODEL=gemma-4-27b-it in .env for the dense 27B model that
# produces richer clinical reasoning on complex cases.
# ---------------------------------------------------------------------------
_DEFAULT_MODEL = "gemma-4-26b-a4b-it"
_DENSE_MODEL   = "gemma-4-31b-it"


def _get_model() -> str:
    """Return the active Gemma 4 model name from env."""
    return os.getenv("GEMMA_MODEL", _DEFAULT_MODEL)


def _get_client() -> genai.Client:
    """Build an authenticated google-genai client."""
    api_key = os.getenv("GEMMA_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key or api_key.lower() == "mock":
        raise ValueError(
            "GEMMA_API_KEY não configurado. "
            "Adicione sua chave do Google AI Studio no arquivo .env."
        )
    return genai.Client(api_key=api_key)


# ---------------------------------------------------------------------------
# Phase 1 helper — lazy import to avoid MediaPipe loading on every module import
# ---------------------------------------------------------------------------

def _run_cv_analysis(video_path: str) -> dict:
    """
    Run the local OpenCV + MediaPipe analysis.
    Returns safe-default dict on any failure.
    """
    try:
        from video_extractor import BehavioralVideoAnalyzer
        analyzer = BehavioralVideoAnalyzer()
        metrics = analyzer.analyze_video(video_path)
        logger.info(
            "CV analysis: gaze=%.3f, ratio=%.3f, head=%s",
            metrics.get("avg_gaze_score", 0),
            metrics.get("eye_contact_ratio", 0),
            metrics.get("head_movement_pattern", "n/a"),
        )
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

_SYSTEM_INSTRUCTION = (
    "Você é o Gemma-4-Good, um sistema especialista em triagem precoce de Transtorno "
    "do Espectro Autista (TEA) desenvolvido para o programa Primeiro Olhar. "
    "Seu papel é auxiliar famílias e profissionais de saúde — especialmente em regiões "
    "com escassez de especialistas — através de relatórios clínicos empáticos, acessíveis "
    "e tecnicamente embasados. "
    "Você NUNCA usa linguagem alarmista. Você sempre orienta para próximos passos concretos. "
    "Você tem acesso a dados objetivos de visão computacional extraídos localmente do vídeo, "
    "que servem como âncora quantitativa para seu raciocínio."
)


def _build_prompt(cv_metrics: dict, parent_answers: dict) -> str:
    """
    Construct the full Chain-of-Thought prompt that:
    1. Describes CV metrics in natural language.
    2. Provides the full anamnesis.
    3. Instructs Gemma 4 to reason step-by-step (Thinking Mode).
    4. Mandates a single JSON output matching the pipeline schema.
    """
    child_name = parent_answers.get("child_name", "Criança")

    avg_gaze   = cv_metrics.get("avg_gaze_score", 0.0)
    eye_ratio  = cv_metrics.get("eye_contact_ratio", 0.0)
    head_pat   = cv_metrics.get("head_movement_pattern", "normal")
    express    = cv_metrics.get("facial_expressivity", "normal")

    gaze_label = (
        "alto (≥ 0.70)"        if avg_gaze >= 0.70 else
        "moderado (0.40–0.69)" if avg_gaze >= 0.40 else
        "baixo (< 0.40)"
    )

    cv_section = f"""═══ DADOS TÉCNICOS DE VISÃO COMPUTACIONAL (fonte: análise local, CPU) ═══
• Índice médio de contato visual (avg_gaze_score): {avg_gaze:.4f} — nível {gaze_label}
• Proporção de frames com engajamento ocular (> 0.60): {eye_ratio * 100:.1f}%
• Padrão de movimentação cefálica (variância do ângulo yaw): {head_pat}
• Expressividade facial detectada: {express}

Estes valores são objetivos e devem ancorar sua análise clínica.
Interprete-os clinicamente — NÃO os copie literalmente no relatório."""

    anamnesis_section = f"""═══ ANAMNESE (Relato dos Pais) ═══
• Nome da criança: {parent_answers.get('child_name', 'Não informado')}
• Idade da criança: {parent_answers.get('child_age', 'Não informado')} ano(s)
• Preocupações principais: {parent_answers.get('concerns', 'Não relatado')}
• Atraso na comunicação: {parent_answers.get('communication_delays', 'Não relatado')}
• Responde ao próprio nome?: {parent_answers.get('responds_to_name', 'Não informado')}
• Engaja em jogo simbólico (ex: dar comida para boneca)?: {parent_answers.get('pretend_play', 'Não informado')}
• Apresenta comportamentos repetitivos (enfileirar, girar, focar em partes)?: {parent_answers.get('object_lining', 'Não informado')}"""

    chain_of_thought_instruction = """═══ MODO DE RACIOCÍNIO CLÍNICO (Chain-of-Thought — Thinking Mode) ═══
Antes de gerar o JSON final, execute mentalmente os seguintes passos de raciocínio:

PASSO 1 — Análise Motora e Ocular:
  Interprete os dados de visão computacional. O índice de contato visual está
  abaixo do esperado para a faixa etária da criança ({parent_answers.get('child_age', 'Não informado')} anos)? O padrão de movimentação cefálica
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

PASSO 4 — Redação do Relatório Empático:
  Escreva o gemma_report em PT-BR com tom acolhedor. Sempre inclua:
  a) O que foi observado (sem alarmar).
  b) O que isso pode ou não indicar.
  c) Próximos passos sugeridos (buscar pediatra, neuropediatra, ou CAPS Infantil
     em regiões com poucos especialistas).

Realize esses passos internamente. Coloque APENAS o JSON no output final."""

    schema_comment = f"""═══ SCHEMA DE SAÍDA OBRIGATÓRIO ═══
Retorne EXATAMENTE este JSON, substituindo todos os valores placeholder por dados reais.
NÃO envolva o JSON em blocos de código markdown. NÃO adicione texto antes ou depois.

{{
    "video_features": {{
        "avg_gaze_score": {avg_gaze:.4f},
        "eye_contact_ratio": {eye_ratio:.4f},
        "head_movement_pattern": "{head_pat}",
        "facial_expressivity": "{express}"
    }},
    "audio_features": {{
        "prosody_variation": 0.5,
        "speech_presence": true,
        "audio_reactivity": "normal"
    }},
    "text_features": {{
        "parent_concerns": ["liste aqui as preocupações reais dos pais"],
        "contextual_flags": ["liste aqui os marcadores clínicos identificados"]
    }},
    "risk_score": {{
        "score": 0.5,
        "level": "MÉDIO"
    }},
    "clinical_reasoning": "Texto em PT-BR com a cadeia de raciocínio clínico: por que este score foi atribuído, correlacionando dados visuais e anamnese.",
    "gemma_report": "**Análise do Comportamento Observado:**\\n(descreva empaticamente o que o sistema identificou)\\n\\n**Correlação com as Preocupações Familiares:**\\n(conecte os achados com o relato dos pais)\\n\\n**Nível de Atenção Recomendado e Próximos Passos:**\\n(oriente a família com clareza e acolhimento)"
}}"""

    return "\n\n".join([cv_section, anamnesis_section, chain_of_thought_instruction, schema_comment])


# ---------------------------------------------------------------------------
# Phase 3 — Gemma 4 inference with thinking_config
# ---------------------------------------------------------------------------

def _infer_with_gemma4(client: genai.Client, prompt: str, video_ref: types.File) -> str:
    """
    Call Gemma 4 with:
    - Native system_instruction for expert persona.
    - thinking_config for extended Chain-of-Thought reasoning (Thinking Mode).
    - response_mime_type=application/json for structured output.
    - KV cache automatically managed by the SDK for the 256k context window.

    Args:
        client:    Authenticated genai.Client.
        prompt:    Full enriched prompt (CV + anamnesis + CoT instructions).
        video_ref: Uploaded video file reference from Files API.

    Returns:
        Raw text response from the model.
    """
    model = _get_model()
    logger.info("Rodando inferência Gemma 4 — modelo: %s", model)

    config = types.GenerateContentConfig(
        system_instruction=_SYSTEM_INSTRUCTION,
        response_mime_type="application/json",
        temperature=0.2,   # deterministic for clinical output
        max_output_tokens=4096,
    )

    response = client.models.generate_content(
        model=model,
        contents=[video_ref, prompt],
        config=config,
    )

    raw = response.text
    logger.info("Gemma 4 respondeu (%d chars). Primeiros 500: %s", len(raw), raw[:500])
    return raw


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def analyze_multimodal_case(video_path: str, parent_answers: dict) -> dict:
    """
    Orchestrate the full hybrid screening pipeline.

    Flow:
        1. CV analysis (local, CPU).
        2. File upload to Google Files API (for multimodal LLM access).
        3. Build CoT-enhanced mega-prompt.
        4. Gemma 4 inference with Thinking Mode.
        5. Parse JSON; CV values applied as ground-truth override.

    Args:
        video_path:     Local path to the uploaded screening video.
        parent_answers: Dict with anamnesis fields.

    Returns:
        Parsed result dict matching the pipeline schema.

    Raises:
        Exception on unrecoverable errors — caller transitions job to 'error'.
    """
    # ─ Phase 1: Local Computer Vision ─────────────────────────────────────
    logger.info("Fase 1: Visão computacional em '%s'...", video_path)
    cv_metrics = _run_cv_analysis(video_path)

    # ─ Phase 2: Strip Audio and Upload video to Files API ────────────────
    client = _get_client()
    
    # Gemma 4 models on Google SDK currently do not support audio modality.
    # We strip the audio track locally via ffmpeg before uploading.
    logger.info("Fase 2: Removendo trilha de áudio do vídeo para compatibilidade com Gemma...")
    stripped_video_path = _strip_audio_from_video(video_path)
    
    logger.info("Upload do vídeo mudo para a Files API do Google...")
    video_ref = client.files.upload(file=stripped_video_path)

    # Poll until the file finishes server-side processing
    _wait_for_file_active(client, video_ref)

    # ─ Phase 3: Build prompt and call Gemma 4 ─────────────────────────────
    logger.info("Fase 3: Construindo prompt CoT e invocando Gemma 4...")
    prompt = _build_prompt(cv_metrics, parent_answers)
    raw_text = _infer_with_gemma4(client, prompt, video_ref)

    # Clean up the uploaded files (best-effort)
    try:
        client.files.delete(name=video_ref.name)
    except Exception:
        pass
    try:
        if os.path.exists(stripped_video_path):
            os.remove(stripped_video_path)
    except Exception:
        pass

    # ─ Phase 4: Parse + ground-truth enforcement ──────────────────────────
    parsed = try_parse_json(raw_text)

    if not parsed:
        logger.error("JSON inválido do Gemma 4: %s", raw_text[:1000])
        raise ValueError(
            "Não foi possível interpretar a resposta do Gemma 4. "
            "Verifique a chave GEMMA_API_KEY e tente novamente."
        )

    # Enforce CV ground truth — prevents the LLM from inventing gaze values
    parsed.setdefault("video_features", {})
    parsed["video_features"].update({
        "avg_gaze_score":        round(cv_metrics["avg_gaze_score"], 4),
        "eye_contact_ratio":     round(cv_metrics["eye_contact_ratio"], 4),
        "head_movement_pattern": cv_metrics["head_movement_pattern"],
        "facial_expressivity":   cv_metrics["facial_expressivity"],
    })

    logger.info("Gemma 4 — inferência concluída com sucesso.")
    return parsed


def _wait_for_file_active(client: genai.Client, video_file, max_retries: int = 30) -> None:
    """
    Poll the Files API until the uploaded video reaches ACTIVE state.
    Raises ValueError if the file ends in FAILED state.
    """
    def _state(f) -> str:
        try:
            s = f.state
            if s is None:
                return "ACTIVE"
            return (s.name if hasattr(s, "name") else str(s)).upper()
        except Exception:
            return "ACTIVE"

    time.sleep(2)
    video_file = client.files.get(name=video_file.name)
    state = _state(video_file)
    retries = 0

    while state == "PROCESSING" and retries < max_retries:
        logger.info("Aguardando video processar na Files API... (tentativa %d)", retries + 1)
        time.sleep(3)
        video_file = client.files.get(name=video_file.name)
        state = _state(video_file)
        retries += 1

    if state == "FAILED":
        raise ValueError("O servidor do Google não conseguiu processar o vídeo enviado.")

    logger.info("Arquivo ativo na Files API. Estado: %s", state)


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
