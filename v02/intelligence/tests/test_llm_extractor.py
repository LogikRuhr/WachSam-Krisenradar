import json
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from google.auth.exceptions import DefaultCredentialsError

import src.extractors.llm_extractor as llm_module
from src.extractors.llm_extractor import extract_with_llm


MOCK_LLM_RESPONSE = """{
  "title": "Gaspreise steigen erneut",
  "description": "Europäische Gaspreise steigen aufgrund geopolitischer Spannungen.",
  "germany_relevance": {
    "direct": true,
    "systems_affected": ["energie", "industrie"],
    "time_to_impact": "wochen",
    "description": "Direkte Auswirkung auf Heizkosten deutscher Haushalte."
  },
  "methodology_tag": "steep",
  "severity_suggestion": "erhöht",
  "confidence_suggestion": "mittel",
  "possible_cascades": ["Gaspreise → Strompreise → Industriekosten"],
  "haushalts_auswirkungen": ["Heizkosten +15-20%"],
  "buergermassnahmen": ["Heizverträge prüfen"]
}"""


class FakeQuotaError(Exception):
    def __init__(self):
        super().__init__("429 quota exhausted")
        self.code = 429
        self.status = 429


@pytest.fixture(autouse=True)
def reset_llm_runtime_state():
    llm_module.reset_llm_runtime_state()


def _configure_valid_settings(mock_settings):
    mock_settings.GOOGLE_CLOUD_PROJECT = "test-project"
    mock_settings.VERTEX_AI_LOCATION = "europe-west3"
    mock_settings.GEMINI_MODEL_NAME = "gemini-2.5-flash"
    mock_settings.GOOGLE_APPLICATION_CREDENTIALS = __file__


def _configure_genai_client(mock_build_client, mock_build_config, response_text=MOCK_LLM_RESPONSE, side_effect=None):
    mock_response = MagicMock()
    mock_response.text = response_text

    mock_client = MagicMock()
    if side_effect is None:
        mock_client.models.generate_content.return_value = mock_response
    else:
        mock_client.models.generate_content.side_effect = side_effect

    mock_build_client.return_value = mock_client
    mock_build_config.return_value = "generation-config"
    return mock_client


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
async def test_extract_skips_without_project(mock_settings):
    mock_settings.GOOGLE_CLOUD_PROJECT = ""
    result = await extract_with_llm("Test content", "https://example.com", "medien")
    assert result is None


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
@patch("src.extractors.llm_extractor._build_genai_client", create=True)
async def test_extract_skips_placeholder_credentials_before_genai_client(mock_build_client, mock_settings, capsys):
    mock_settings.GOOGLE_CLOUD_PROJECT = "test-project"
    mock_settings.GEMINI_MODEL_NAME = "gemini-2.5-flash"
    mock_settings.GOOGLE_APPLICATION_CREDENTIALS = "/pfad/zu/wachsam-intelligence-key.json"

    result = await extract_with_llm("Test content", "https://example.com", "medien")

    assert result is None
    mock_build_client.assert_not_called()
    assert "GOOGLE_APPLICATION_CREDENTIALS ist ein Placeholder" in capsys.readouterr().out


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
@patch("src.extractors.llm_extractor._build_genai_client", create=True)
async def test_extract_skips_missing_credentials_file_before_genai_client(mock_build_client, mock_settings):
    mock_settings.GOOGLE_CLOUD_PROJECT = "test-project"
    mock_settings.GEMINI_MODEL_NAME = "gemini-2.5-flash"
    mock_settings.GOOGLE_APPLICATION_CREDENTIALS = "C:/does/not/exist/wachsam-intelligence-key.json"

    result = await extract_with_llm("Test content", "https://example.com", "medien")

    assert result is None
    mock_build_client.assert_not_called()


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
@patch("src.extractors.llm_extractor._build_genai_client", create=True)
async def test_extract_skips_without_gemini_model_name(mock_build_client, mock_settings, capsys):
    mock_settings.GOOGLE_CLOUD_PROJECT = "test-project"
    mock_settings.GEMINI_MODEL_NAME = ""
    mock_settings.GOOGLE_APPLICATION_CREDENTIALS = __file__

    result = await extract_with_llm("Test content", "https://example.com", "medien")

    assert result is None
    mock_build_client.assert_not_called()
    assert "GEMINI_MODEL_NAME nicht gesetzt" in capsys.readouterr().out


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
@patch("src.extractors.llm_extractor._build_generation_config", create=True)
@patch("src.extractors.llm_extractor._build_genai_client", create=True)
@patch("google.auth.default")
async def test_extract_uses_adc_when_credentials_path_unset(
    mock_google_auth_default, mock_build_client, mock_build_config, mock_settings
):
    mock_settings.GOOGLE_CLOUD_PROJECT = "test-project"
    mock_settings.VERTEX_AI_LOCATION = "europe-west3"
    mock_settings.GEMINI_MODEL_NAME = "gemini-2.5-flash"
    mock_settings.GOOGLE_APPLICATION_CREDENTIALS = ""
    mock_google_auth_default.return_value = (MagicMock(), "test-project")
    mock_client = _configure_genai_client(mock_build_client, mock_build_config)

    result = await extract_with_llm("Gas prices rising...", "https://example.com", "medien")

    assert result is not None
    assert result.title == "Gaspreise steigen erneut"
    mock_google_auth_default.assert_called_once()
    mock_build_client.assert_called_once()
    mock_client.models.generate_content.assert_called_once()


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
@patch("src.extractors.llm_extractor._build_genai_client", create=True)
@patch("google.auth.default")
async def test_extract_skips_when_credentials_path_unset_and_adc_missing(
    mock_google_auth_default, mock_build_client, mock_settings, capsys
):
    mock_settings.GOOGLE_CLOUD_PROJECT = "test-project"
    mock_settings.GEMINI_MODEL_NAME = "gemini-2.5-flash"
    mock_settings.GOOGLE_APPLICATION_CREDENTIALS = ""
    mock_google_auth_default.side_effect = DefaultCredentialsError("missing adc")

    result = await extract_with_llm("Test content", "https://example.com", "medien")

    assert result is None
    mock_google_auth_default.assert_called_once()
    mock_build_client.assert_not_called()
    assert "Google ADC nicht verfuegbar" in capsys.readouterr().out


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
@patch("src.extractors.llm_extractor._build_generation_config", create=True)
@patch("src.extractors.llm_extractor._build_genai_client", create=True)
async def test_extract_returns_valid_item_with_google_genai(mock_build_client, mock_build_config, mock_settings):
    _configure_valid_settings(mock_settings)
    mock_client = _configure_genai_client(mock_build_client, mock_build_config)

    result = await extract_with_llm("Gas prices rising...", "https://example.com", "medien")

    assert result is not None
    assert result.title == "Gaspreise steigen erneut"
    assert result.germany_relevance.direct is True
    assert result.severity_suggestion == "erhöht"
    assert result.status == "extracted"
    mock_client.models.generate_content.assert_called_once()
    call_kwargs = mock_client.models.generate_content.call_args.kwargs
    assert call_kwargs["model"] == "gemini-2.5-flash"
    assert call_kwargs["config"] == "generation-config"
    assert "https://example.com" in call_kwargs["contents"]
    assert "Gas prices rising..." in call_kwargs["contents"]


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
@patch("src.extractors.llm_extractor._build_generation_config", create=True)
@patch("src.extractors.llm_extractor._build_genai_client", create=True)
async def test_extract_uses_configured_gemini_model(mock_build_client, mock_build_config, mock_settings):
    _configure_valid_settings(mock_settings)
    mock_settings.GEMINI_MODEL_NAME = "gemini-2.5-flash-001"
    mock_client = _configure_genai_client(mock_build_client, mock_build_config)

    result = await extract_with_llm("Gas prices rising...", "https://example.com", "medien")

    assert result is not None
    call_kwargs = mock_client.models.generate_content.call_args.kwargs
    assert call_kwargs["model"] == "gemini-2.5-flash-001"


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
@patch("src.extractors.llm_extractor._build_generation_config", create=True)
@patch("src.extractors.llm_extractor._build_genai_client", create=True)
async def test_extract_handles_invalid_json(mock_build_client, mock_build_config, mock_settings):
    _configure_valid_settings(mock_settings)
    _configure_genai_client(mock_build_client, mock_build_config, response_text="not valid json")

    result = await extract_with_llm("Content", "https://example.com", "medien")

    assert result is None


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
@patch("src.extractors.llm_extractor._build_generation_config", create=True)
@patch("src.extractors.llm_extractor._build_genai_client", create=True)
async def test_extract_retries_quota_error_then_returns_item(
    mock_build_client, mock_build_config, mock_settings, monkeypatch
):
    _configure_valid_settings(mock_settings)
    sleep_calls = []

    async def fake_sleep(seconds):
        sleep_calls.append(seconds)

    monkeypatch.setattr(llm_module, "asyncio", MagicMock(sleep=fake_sleep), raising=False)

    mock_response = MagicMock()
    mock_response.text = MOCK_LLM_RESPONSE
    mock_client = _configure_genai_client(
        mock_build_client,
        mock_build_config,
        side_effect=[FakeQuotaError(), mock_response],
    )

    result = await extract_with_llm("Content", "https://example.com", "medien")

    assert result is not None
    assert result.title == "Gaspreise steigen erneut"
    assert mock_client.models.generate_content.call_count == 2
    assert sleep_calls == [2]


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
@patch("src.extractors.llm_extractor._build_generation_config", create=True)
@patch("src.extractors.llm_extractor._build_genai_client", create=True)
async def test_extract_returns_none_after_repeated_quota_error(
    mock_build_client, mock_build_config, mock_settings, monkeypatch, caplog
):
    _configure_valid_settings(mock_settings)
    sleep_calls = []

    async def fake_sleep(seconds):
        sleep_calls.append(seconds)

    monkeypatch.setattr(llm_module, "asyncio", MagicMock(sleep=fake_sleep), raising=False)
    mock_client = _configure_genai_client(mock_build_client, mock_build_config, side_effect=FakeQuotaError())

    with caplog.at_level("WARNING"):
        result = await extract_with_llm("Content", "https://example.com", "medien")

    assert result is None
    assert mock_client.models.generate_content.call_count == 3
    assert sleep_calls == [2, 4]
    assert "LLM unavailable after retries" in caplog.text


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
@patch("src.extractors.llm_extractor._build_generation_config", create=True)
@patch("src.extractors.llm_extractor._build_genai_client", create=True)
async def test_extract_skips_later_calls_after_quota_exhausted(
    mock_build_client, mock_build_config, mock_settings, monkeypatch
):
    _configure_valid_settings(mock_settings)
    sleep_calls = []

    async def fake_sleep(seconds):
        sleep_calls.append(seconds)

    monkeypatch.setattr(llm_module, "asyncio", MagicMock(sleep=fake_sleep), raising=False)
    mock_client = _configure_genai_client(mock_build_client, mock_build_config, side_effect=FakeQuotaError())

    first = await extract_with_llm("Content", "https://example.com/1", "medien")
    second = await extract_with_llm("Content", "https://example.com/2", "medien")

    assert first is None
    assert second is None
    assert mock_client.models.generate_content.call_count == 3
    assert sleep_calls == [2, 4]


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
@patch("src.extractors.llm_extractor._build_generation_config", create=True)
@patch("src.extractors.llm_extractor._build_genai_client", create=True)
async def test_extract_handles_json_fenced_response(mock_build_client, mock_build_config, mock_settings):
    _configure_valid_settings(mock_settings)
    _configure_genai_client(mock_build_client, mock_build_config, response_text=f"```json\n{MOCK_LLM_RESPONSE}\n```")

    result = await extract_with_llm("Content", "https://example.com", "medien")

    assert result is not None
    assert result.title == "Gaspreise steigen erneut"


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
@patch("src.extractors.llm_extractor._build_generation_config", create=True)
@patch("src.extractors.llm_extractor._build_genai_client", create=True)
async def test_extract_rejects_invalid_severity_from_llm(mock_build_client, mock_build_config, mock_settings, caplog):
    _configure_valid_settings(mock_settings)
    payload = json.loads(MOCK_LLM_RESPONSE)
    payload["severity_suggestion"] = "panik"
    _configure_genai_client(mock_build_client, mock_build_config, response_text=json.dumps(payload))

    with caplog.at_level("WARNING"):
        result = await extract_with_llm("Content", "https://example.com", "medien")

    assert result is None
    assert "LLM schema validation failed" in caplog.text


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
@patch("src.extractors.llm_extractor._build_generation_config", create=True)
@patch("src.extractors.llm_extractor._build_genai_client", create=True)
async def test_extract_rejects_unknown_system_from_llm(mock_build_client, mock_build_config, mock_settings, caplog):
    _configure_valid_settings(mock_settings)
    payload = json.loads(MOCK_LLM_RESPONSE)
    payload["germany_relevance"]["systems_affected"] = ["weltraum"]
    _configure_genai_client(mock_build_client, mock_build_config, response_text=json.dumps(payload))

    with caplog.at_level("WARNING"):
        result = await extract_with_llm("Content", "https://example.com", "medien")

    assert result is None
    assert "LLM schema validation failed" in caplog.text


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
@patch("src.extractors.llm_extractor._build_generation_config", create=True)
@patch("src.extractors.llm_extractor._build_genai_client", create=True)
async def test_extract_never_accepts_published_status_from_llm(mock_build_client, mock_build_config, mock_settings):
    _configure_valid_settings(mock_settings)
    payload = json.loads(MOCK_LLM_RESPONSE)
    payload["status"] = "published"
    _configure_genai_client(mock_build_client, mock_build_config, response_text=json.dumps(payload))

    result = await extract_with_llm("Content", "https://example.com", "medien")

    assert result is not None
    assert result.status == "extracted"


def test_prompt_declares_version_and_exact_kanon_values():
    from src.extractors.prompts import SYSTEM_PROMPT, WACHSAM_EXTRACT_PROMPT_VERSION

    assert WACHSAM_EXTRACT_PROMPT_VERSION == "rss-evidence-v1"
    assert "rss-evidence-v1" in SYSTEM_PROMPT
    assert '"beobachten"' in SYSTEM_PROMPT
    assert '"gesellschaft"' in SYSTEM_PROMPT


def test_extractor_no_longer_references_deprecated_vertexai_generative_models():
    source = Path(llm_module.__file__).read_text(encoding="utf-8")

    assert "vertexai.generative_models" not in source
    assert "import vertexai" not in source
