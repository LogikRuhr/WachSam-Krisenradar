import pytest
from unittest.mock import patch, MagicMock
from google.api_core.exceptions import ResourceExhausted

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


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
async def test_extract_skips_without_project(mock_settings):
    mock_settings.GOOGLE_CLOUD_PROJECT = ""
    result = await extract_with_llm("Test content", "https://example.com", "medien")
    assert result is None


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
@patch("src.extractors.llm_extractor._init_vertex")
async def test_extract_returns_valid_item(mock_init, mock_settings):
    mock_settings.GOOGLE_CLOUD_PROJECT = "test-project"
    mock_settings.VERTEX_AI_LOCATION = "europe-west3"

    mock_response = MagicMock()
    mock_response.text = MOCK_LLM_RESPONSE

    mock_model = MagicMock()
    mock_model.generate_content.return_value = mock_response

    mock_gm_module = MagicMock()
    mock_gm_module.GenerativeModel.return_value = mock_model

    with patch.dict("sys.modules", {"vertexai.generative_models": mock_gm_module}):
        result = await extract_with_llm("Gas prices rising...", "https://example.com", "medien")

    assert result is not None
    assert result.title == "Gaspreise steigen erneut"
    assert result.germany_relevance.direct is True
    assert result.severity_suggestion == "erhöht"
    assert result.status == "extracted"


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
@patch("src.extractors.llm_extractor._init_vertex")
async def test_extract_handles_invalid_json(mock_init, mock_settings):
    mock_settings.GOOGLE_CLOUD_PROJECT = "test-project"

    mock_response = MagicMock()
    mock_response.text = "not valid json"
    mock_model = MagicMock()
    mock_model.generate_content.return_value = mock_response

    mock_gm_module = MagicMock()
    mock_gm_module.GenerativeModel.return_value = mock_model

    with patch.dict("sys.modules", {"vertexai.generative_models": mock_gm_module}):
        result = await extract_with_llm("Content", "https://example.com", "medien")

    assert result is None


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
@patch("src.extractors.llm_extractor._init_vertex")
async def test_extract_retries_resource_exhausted_then_returns_item(mock_init, mock_settings, monkeypatch):
    mock_settings.GOOGLE_CLOUD_PROJECT = "test-project"
    sleep_calls = []

    async def fake_sleep(seconds):
        sleep_calls.append(seconds)

    monkeypatch.setattr(llm_module, "asyncio", MagicMock(sleep=fake_sleep), raising=False)

    mock_response = MagicMock()
    mock_response.text = MOCK_LLM_RESPONSE
    mock_model = MagicMock()
    mock_model.generate_content.side_effect = [ResourceExhausted("quota"), mock_response]

    mock_gm_module = MagicMock()
    mock_gm_module.GenerativeModel.return_value = mock_model

    with patch.dict("sys.modules", {"vertexai.generative_models": mock_gm_module}):
        result = await extract_with_llm("Content", "https://example.com", "medien")

    assert result is not None
    assert result.title == "Gaspreise steigen erneut"
    assert mock_model.generate_content.call_count == 2
    assert sleep_calls == [2]


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
@patch("src.extractors.llm_extractor._init_vertex")
async def test_extract_returns_none_after_repeated_resource_exhausted(
    mock_init, mock_settings, monkeypatch, caplog
):
    mock_settings.GOOGLE_CLOUD_PROJECT = "test-project"
    sleep_calls = []

    async def fake_sleep(seconds):
        sleep_calls.append(seconds)

    monkeypatch.setattr(llm_module, "asyncio", MagicMock(sleep=fake_sleep), raising=False)

    mock_model = MagicMock()
    mock_model.generate_content.side_effect = ResourceExhausted("quota")

    mock_gm_module = MagicMock()
    mock_gm_module.GenerativeModel.return_value = mock_model

    with caplog.at_level("WARNING"):
        with patch.dict("sys.modules", {"vertexai.generative_models": mock_gm_module}):
            result = await extract_with_llm("Content", "https://example.com", "medien")

    assert result is None
    assert mock_model.generate_content.call_count == 3
    assert sleep_calls == [2, 4]
    assert "LLM unavailable after retries" in caplog.text


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
@patch("src.extractors.llm_extractor._init_vertex")
async def test_extract_handles_json_fenced_response(mock_init, mock_settings):
    mock_settings.GOOGLE_CLOUD_PROJECT = "test-project"

    mock_response = MagicMock()
    mock_response.text = f"```json\n{MOCK_LLM_RESPONSE}\n```"
    mock_model = MagicMock()
    mock_model.generate_content.return_value = mock_response

    mock_gm_module = MagicMock()
    mock_gm_module.GenerativeModel.return_value = mock_model

    with patch.dict("sys.modules", {"vertexai.generative_models": mock_gm_module}):
        result = await extract_with_llm("Content", "https://example.com", "medien")

    assert result is not None
    assert result.title == "Gaspreise steigen erneut"
