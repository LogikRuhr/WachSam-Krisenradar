import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    POSTGRES_URL: str = "postgresql://wachsam:wachsam_dev@localhost:5432/wachsam"

    GOOGLE_CLOUD_PROJECT: str = ""
    VERTEX_AI_LOCATION: str = "europe-west3"

    DESTATIS_USERNAME: str = ""
    DESTATIS_PASSWORD: str = ""

    GIE_API_KEY: str = ""
    EIA_API_KEY: str = ""

    GOOGLE_APPLICATION_CREDENTIALS: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
