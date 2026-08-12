import enum


class PlanType(str, enum.Enum):
    free = "free"
    pro = "pro"


class DocumentSourceType(str, enum.Enum):
    pasted_text = "pasted_text"
    pdf = "pdf"
    docx = "docx"
    image = "image"
    handwriting = "handwriting"


class CheckType(str, enum.Enum):
    text = "text"
    image = "image"


class CheckStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class ConfidenceBand(str, enum.Enum):
    low = "low"
    moderate = "moderate"
    high = "high"


class MatchSourceType(str, enum.Enum):
    web = "web"
    own_submission = "own_submission"
    reference_corpus = "reference_corpus"


class SubscriptionProvider(str, enum.Enum):
    none = "none"
    razorpay = "razorpay"
    cashfree = "cashfree"


class SubscriptionStatus(str, enum.Enum):
    none = "none"
    active = "active"
    cancelled = "cancelled"
    past_due = "past_due"


class OtpPurpose(str, enum.Enum):
    email_verification = "email_verification"
    password_reset = "password_reset"
