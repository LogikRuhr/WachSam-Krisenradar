import json
import sys
from types import SimpleNamespace

import pytest
from unittest.mock import patch, MagicMock

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


@pytest.fixture(autouse=True)
def reset_llm_runtime_state():
    llm_module.reset_llm_runtime_state()


def _configure_valid_settings(mock_settings):
    mock_settings.GOOGLE_CLOUD_PROJECT = "test-project"
    mock_settings.VERTEX_AI_LOCATION = "europe-west3"
    mock_settings.GEMINI_MODEL_ID = "gemini-flash-latest"
    mock_settings.GOOGLE_APPLICATION_CREDENTIALS = __file__


class FakeQuotaError(Exception):
    code = 429


def _install_fake_genai(monkeypatch, fake_client):
    fake_types = SimpleNamespace(
        GenerateContentConfig=MagicMock(
            side_effect=lambda **kwargs: SimpleNamespace(**kwargs)
        )
    )
    fake_genai = SimpleNamespace(Client=MagicMock(return_value=fake_client))
    fake_google = SimpleNamespace(genai=fake_genai)
    fake_google_genai = SimpleNamespace(types=fake_types)

    monkeypatch.setitem(sys.modules, "google", fake_google)
    monkeypatch.setitem(sys.modules, "google.genai", fake_google_genai)
    monkeypatch.setitem(sys.modules, "google.genai.types", fake_types)
    return fake_genai, fake_types


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
async def test_extract_skips_without_project(mock_settings):
    mock_settings.GOOGLE_CLOUD_PROJECT = ""
    result = await extract_with_llm("Test content", "https://example.com", "medien")
    assert result is None


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
async def test_extract_skips_placeholder_credentials_before_client_init(mock_settings, capsys, monkeypatch):
    mock_settings.GOOGLE_CLOUD_PROJECT = "test-project"
    mock_settings.GOOGLE_APPLICATION_CREDENTIALS = "/pfad/zu/wachsam-intelligence-key.json"
    fake_client = MagicMock()
    fake_genai, _ = _install_fake_genai(monkeypatch, fake_client)

    result = await extract_with_llm("Test content", "https://example.com", "medien")

    assert result is None
    fake_genai.Client.assert_not_called()
    assert "GOOGLE_APPLICATION_CREDENTIALS ist ein Placeholder" in capsys.readouterr().out


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
async def test_extract_skips_missing_credentials_file_before_client_init(mock_settings, monkeypatch):
    mock_settings.GOOGLE_CLOUD_PROJECT = "test-project"
    mock_settings.GOOGLE_APPLICATION_CREDENTIALS = "C:/does/not/exist/wachsam-intelligence-key.json"
    fake_client = MagicMock()
    fake_genai, _ = _install_fake_genai(monkeypatch, fake_client)

    result = await extract_with_llm("Test content", "https://example.com", "medien")

    assert result is None
    fake_genai.Client.assert_not_called()


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
async def test_extract_returns_valid_item(mock_settings, monkeypatch):
    _configure_valid_settings(mock_settings)

    mock_response = MagicMock()
    mock_response.text = MOCK_LLM_RESPONSE

    fake_client = MagicMock()
    fake_client.models.generate_content.return_value = mock_response
    fake_genai, fake_types = _install_fake_genai(monkeypatch, fake_client)

    result = await extract_with_llm("Gas prices rising...", "https://example.com", "medien")

    assert result is not None
    assert result.title == "Gaspreise steigen erneut"
    assert result.germany_relevance.direct is True
    assert result.severity_suggestion == "erhöht"
    assert result.status == "extracted"
    fake_genai.Client.assert_called_once_with(
        vertexai=True,
        project="test-project",
        location="europe-west3",
    )
    fake_types.GenerateContentConfig.assert_called_once()
    config = fake_types.GenerateContentConfig.call_args.kwargs
    assert config["response_mime_type"] == "application/json"
    assert "response_json_schema" in config
    assert fake_client.models.generate_content.call_args.kwargs["model"] == "gemini-flash-latest"


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
async def test_extract_handles_invalid_json(mock_settings, monkeypatch):
    _configure_valid_settings(mock_settings)

    mock_response = MagicMock()
    mock_response.text = "not valid json"
    fake_client = MagicMock()
    fake_client.models.generate_content.return_value = mock_response
    _install_fake_genai(monkeypatch, fake_client)

    result = await extract_with_llm("Content", "https://example.com", "medien")

    assert result is None


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
async def test_extract_retries_quota_error_then_returns_item(mock_settings, monkeypatch):
    _configure_valid_settings(mock_settings)
    sleep_calls = []

    async def fake_sleep(seconds):
        sleep_calls.append(seconds)

    monkeypatch.setattr(llm_module, "asyncio", MagicMock(sleep=fake_sleep), raising=False)

    mock_response = MagicMock()
    mock_response.text = MOCK_LLM_RESPONSE
    fake_client = MagicMock()
    fake_client.models.generate_content.side_effect = [FakeQuotaError("quota"), mock_response]
    _install_fake_genai(monkeypatch, fake_client)

    result = await extract_with_llm("Content", "https://example.com", "medien")

    assert result is not None
    assert result.title == "Gaspreise steigen erneut"
    assert fake_client.models.generate_content.call_count == 2
    assert sleep_calls == [2]


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
async def test_extract_returns_none_after_repeated_resource_exhausted(
    mock_settings, monkeypatch, caplog
):
    _configure_valid_settings(mock_settings)
    sleep_calls = []

    async def fake_sleep(seconds):
        sleep_calls.append(seconds)

    monkeypatch.setattr(llm_module, "asyncio", MagicMock(sleep=fake_sleep), raising=False)

    fake_client = MagicMock()
    fake_client.models.generate_content.side_effect = FakeQuotaError("quota")
    _install_fake_genai(monkeypatch, fake_client)

    with caplog.at_level("WARNING"):
        result = await extract_with_llm("Content", "https://example.com", "medien")

    assert result is None
    assert fake_client.models.generate_content.call_count == 3
    assert sleep_calls == [2, 4]
    assert "LLM unavailable after retries" in caplog.text


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
async def test_extract_skips_later_calls_after_quota_exhausted(
    mock_settings, monkeypatch
):
    _configure_valid_settings(mock_settings)
    sleep_calls = []

    async def fake_sleep(seconds):
        sleep_calls.append(seconds)

    monkeypatch.setattr(llm_module, "asyncio", MagicMock(sleep=fake_sleep), raising=False)

    fake_client = MagicMock()
    fake_client.models.generate_content.side_effect = FakeQuotaError("quota")
    _install_fake_genai(monkeypatch, fake_client)

    first = await extract_with_llm("Content", "https://example.com/1", "medien")
    second = await extract_with_llm("Content", "https://example.com/2", "medien")

    assert first is None
    assert second is None
    assert fake_client.models.generate_content.call_count == 3
    assert sleep_calls == [2, 4]


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
async def test_extract_handles_json_fenced_response(mock_settings, monkeypatch):
    _configure_valid_settings(mock_settings)

    mock_response = MagicMock()
    mock_response.text = f"```json\n{MOCK_LLM_RESPONSE}\n```"
    fake_client = MagicMock()
    fake_client.models.generate_content.return_value = mock_response
    _install_fake_genai(monkeypatch, fake_client)

    result = await extract_with_llm("Content", "https://example.com", "medien")

    assert result is not None
    assert result.title == "Gaspreise steigen erneut"


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
async def test_extract_rejects_invalid_severity_from_llm(mock_settings, caplog, monkeypatch):
    _configure_valid_settings(mock_settings)
    payload = json.loads(MOCK_LLM_RESPONSE)
    payload["severity_suggestion"] = "panik"

    mock_response = MagicMock()
    mock_response.text = json.dumps(payload)
    fake_client = MagicMock()
    fake_client.models.generate_content.return_value = mock_response
    _install_fake_genai(monkeypatch, fake_client)

    with caplog.at_level("WARNING"):
        result = await extract_with_llm("Content", "https://example.com", "medien")

    assert result is None
    assert "LLM schema validation failed" in caplog.text


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
async def test_extract_rejects_unknown_system_from_llm(mock_settings, caplog, monkeypatch):
    _configure_valid_settings(mock_settings)
    payload = json.loads(MOCK_LLM_RESPONSE)
    payload["germany_relevance"]["systems_affected"] = ["weltraum"]

    mock_response = MagicMock()
    mock_response.text = json.dumps(payload)
    fake_client = MagicMock()
    fake_client.models.generate_content.return_value = mock_response
    _install_fake_genai(monkeypatch, fake_client)

    with caplog.at_level("WARNING"):
        result = await extract_with_llm("Content", "https://example.com", "medien")

    assert result is None
    assert "LLM schema validation failed" in caplog.text


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
async def test_extract_never_accepts_published_status_from_llm(mock_settings, monkeypatch):
    _configure_valid_settings(mock_settings)
    payload = json.loads(MOCK_LLM_RESPONSE)
    payload["status"] = "published"

    mock_response = MagicMock()
    mock_response.text = json.dumps(payload)
    fake_client = MagicMock()
    fake_client.models.generate_content.return_value = mock_response
    _install_fake_genai(monkeypatch, fake_client)

    result = await extract_with_llm("Content", "https://example.com", "medien")

    assert result is not None
    assert result.status == "extracted"


def test_prompt_declares_version_and_exact_kanon_values():
    from src.extractors.prompts import SYSTEM_PROMPT, WACHSAM_EXTRACT_PROMPT_VERSION

    assert WACHSAM_EXTRACT_PROMPT_VERSION == "rss-evidence-v1"
    assert "rss-evidence-v1" in SYSTEM_PROMPT
    assert '"beobachten"' in SYSTEM_PROMPT
    assert '"gesellschaft"' in SYSTEM_PROMPT
