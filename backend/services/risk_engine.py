def calculate_risk(video_feats: dict, audio_feats: dict, text_feats: dict) -> dict:
    """
    Risk Scoring Engine (heuristic)
    """
    gaze_weight = 0.35
    expressivity_weight = 0.25
    audio_weight = 0.20
    concerns_weight = 0.20
    
    # Normalizing mocks
    eye_contact = video_feats.get("eye_contact_ratio", 1.0)
    expressivity_score = 0.8 if video_feats.get("facial_expressivity") == "low" else 0.1
    prosody_var = audio_feats.get("prosody_variation", 1.0)
    ctx_flags_count = len(text_feats.get("contextual_flags", []))
    ctx_score = min(ctx_flags_count * 0.5, 1.0)
    
    risk = (
        gaze_weight * (1 - eye_contact) +
        expressivity_weight * (expressivity_score) +
        audio_weight * (1 - prosody_var) +
        concerns_weight * ctx_score
    )
    
    level = "Baixo risco"
    if risk >= 0.34 and risk < 0.67:
        level = "Risco moderado"
    elif risk >= 0.67:
        level = "Risco elevado"
        
    return {
        "score": round(risk, 2),
        "level": level
    }
