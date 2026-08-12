import re

WEAK_WORDS = [
    "very", "really", "quite", "basically", "actually", "just", "thing",
    "stuff", "nice", "good", "bad", "a lot", "kind of", "sort of", "literally",
]

LONG_SENTENCE_WORD_COUNT = 35
MAX_ISSUES_RETURNED = 12


def _split_sentences(text: str) -> list[str]:
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    return [s.strip() for s in sentences if s.strip()]


def _is_passive(sentence: str) -> bool:
    # auxiliary "be" verb followed by a past participle (-ed, or common irregulars)
    return bool(re.search(r"\b(is|are|was|were|been|being|be)\s+\w+(ed|en)\b", sentence, re.IGNORECASE))


def _weak_words_in(sentence: str) -> list[str]:
    lower = sentence.lower()
    return [w for w in WEAK_WORDS if re.search(rf"\b{re.escape(w)}\b", lower)]


def analyze_writing(text: str) -> dict:
    """
    Flags unclear, weak, repetitive, or passive sentences with a plain-language
    reason for each - never rewrites the sentence for the user, only explains
    the issue, since a rewrite could double as an AI-detection evasion tool.
    """
    sentences = _split_sentences(text)
    feedback = []

    previous_first_word = None
    for sentence in sentences:
        issues = []

        if _is_passive(sentence):
            issues.append("Written in passive voice - active voice is usually clearer and more direct.")

        weak = _weak_words_in(sentence)
        if weak:
            issues.append(f"Vague word(s) used: {', '.join(weak)} - consider being more specific.")

        word_count = len(sentence.split())
        if word_count > LONG_SENTENCE_WORD_COUNT:
            issues.append(f"Long sentence ({word_count} words) - consider splitting it for readability.")

        first_word = sentence.split()[0].lower() if sentence.split() else ""
        if previous_first_word and first_word == previous_first_word and len(first_word) > 2:
            issues.append(f"Starts with the same word as the previous sentence ('{first_word}') - repetitive rhythm.")
        previous_first_word = first_word

        if issues:
            feedback.append({"sentence": sentence, "issues": issues})

    return {
        "sentence_count": len(sentences),
        "flagged_count": len(feedback),
        "feedback": feedback[:MAX_ISSUES_RETURNED],
    }
