#!/usr/bin/env python
"""
Verification script to check setup before starting services
"""
import os
import sys
from dotenv import load_dotenv

def redact(s):
    """Redact sensitive values"""
    if not s:
        return "None"
    if len(s) > 12:
        return s[:6] + "..." + s[-4:]
    return str(bool(s))

def main():
    load_dotenv()
    
    print("=" * 60)
    print("SoundFoundry Setup Verification")
    print("=" * 60)
    
    # Check fal-client
    try:
        import fal_client
        fal_version = getattr(fal_client, "__version__", "unknown")
        print(f"✅ fal-client: version={fal_version}")
    except ImportError:
        print("❌ fal-client: NOT INSTALLED")
        sys.exit(1)
    
    # Check environment variables
    print("\nEnvironment Variables:")
    fal_key = os.getenv("FAL_KEY") or os.getenv("FAL_API_KEY")
    print(f"  FAL_KEY: {redact(fal_key)}")
    
    replicate_token = os.getenv("REPLICATE_API_TOKEN")
    print(f"  REPLICATE_API_TOKEN: {redact(replicate_token)}")
    
    music_provider = os.getenv("MUSIC_PROVIDER", "fal")
    print(f"  MUSIC_PROVIDER: {music_provider}")
    
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    print(f"  REDIS_URL: {redis_url}")
    
    # Check providers
    print("\nProvider Checks:")
    
    # FAL
    try:
        if fal_key:
            os.environ["FAL_KEY"] = fal_key
        from app.services.fal_provider import FALProvider
        fal_provider = FALProvider()
        print("  ✅ FAL: OK")
    except Exception as e:
        print(f"  ❌ FAL: FAILED - {str(e)[:100]}")
    
    # Replicate
    try:
        from app.services.replicate_provider import ReplicateProvider
        replicate_provider = ReplicateProvider()
        print("  ✅ Replicate: OK")
    except Exception as e:
        print(f"  ❌ Replicate: FAILED - {str(e)[:100]}")
    
    print("\n" + "=" * 60)
    print("Verification complete. Start services when ready.")
    print("=" * 60)

if __name__ == "__main__":
    main()

