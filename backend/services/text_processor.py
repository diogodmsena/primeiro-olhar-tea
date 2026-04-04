import time

def process_text(parent_answers: dict) -> dict:
    """
    Mock extracting features from parent's form.
    """
    time.sleep(0.5)
    
    # Just returning some static extractions for MVP speed
    return {
        "parent_concerns": ["contato visual", "fala atrasada"],
        "contextual_flags": ["risco social", "risco comunicacional"]
    }
