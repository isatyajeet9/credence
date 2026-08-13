from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24  # 1 day

    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    razorpay_webhook_secret: str = ""
    pro_plan_amount_paise: int = 100  # ₹1 for practice — CHANGE TO 49900 before real presentation!

    resend_api_key: str = ""
    email_from: str = "Credence <onboarding@resend.dev>"

    google_client_id: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
