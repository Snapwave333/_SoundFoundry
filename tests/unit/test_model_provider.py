"""
Unit tests for model providers
"""
import pytest
from unittest.mock import Mock, patch
from app.services.model_provider import ModelProvider
from app.services.fal_provider import FALProvider
from app.services.replicate_provider import ReplicateProvider


class TestModelProvider:
    """Test abstract ModelProvider interface"""

    def test_provider_interface(self):
        """Test that providers implement required methods"""
        # This would fail if providers don't implement generate()
        assert hasattr(FALProvider, "generate")
        assert hasattr(ReplicateProvider, "generate")


class TestFALProvider:
    """Test FAL provider"""

    @pytest.fixture
    def provider(self):
        with patch.dict("os.environ", {"FAL_API_KEY": "test_key"}):
            return FALProvider()

    def test_init_requires_api_key(self):
        """Test that FAL provider requires API key"""
        with patch.dict("os.environ", {}, clear=True):
            with pytest.raises(ValueError):
                FALProvider()


class TestReplicateProvider:
    """Test Replicate provider"""

    @pytest.fixture
    def provider(self):
        with patch.dict("os.environ", {"REPLICATE_API_TOKEN": "test_token"}):
            return ReplicateProvider()

    def test_init_requires_token(self):
        """Test that Replicate provider requires token"""
        with patch.dict("os.environ", {}, clear=True):
            with pytest.raises(ValueError):
                ReplicateProvider()

