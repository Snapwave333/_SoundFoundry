"""
Content policy service for filtering disallowed prompts
"""
import re
from typing import List, Tuple


class ContentPolicy:
    """Service for enforcing content policy"""

    # Blocked patterns
    BLOCKED_CELEBRITIES = [
        "taylor swift",
        "beyonce",
        "justin bieber",
        "drake",
        "ariana grande",
        # Add more as needed
    ]

    BLOCKED_TRADEMARKS = [
        "disney",
        "marvel",
        "star wars",
        "harry potter",
        # Add more as needed
    ]

    def check_prompt(self, prompt: str) -> Tuple[bool, str]:
        """
        Check if prompt violates content policy
        Returns (allowed, reason)
        """
        prompt_lower = prompt.lower()

        # Check for celebrity cloning
        for celebrity in self.BLOCKED_CELEBRITIES:
            if celebrity in prompt_lower:
                return (
                    False,
                    f"Content policy violation: Cannot use celebrity names like '{celebrity}'",
                )

        # Check for trademarked content
        for trademark in self.BLOCKED_TRADEMARKS:
            if trademark in prompt_lower:
                return (
                    False,
                    f"Content policy violation: Cannot use trademarked content like '{trademark}'",
                )

        # Check for explicit content keywords
        explicit_keywords = ["explicit", "nsfw", "adult"]
        for keyword in explicit_keywords:
            if keyword in prompt_lower:
                return (
                    False,
                    "Content policy violation: Explicit content not allowed",
                )

        return True, ""

    def check_lyrics(self, lyrics: str) -> Tuple[bool, str]:
        """Check if lyrics violate content policy"""
        return self.check_prompt(lyrics)


# Singleton instance
_content_policy: ContentPolicy = None


def get_content_policy() -> ContentPolicy:
    """Get or create content policy instance"""
    global _content_policy
    if _content_policy is None:
        _content_policy = ContentPolicy()
    return _content_policy

