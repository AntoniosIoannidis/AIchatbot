try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    # If python-dotenv isn't installed or .env not present, proceed using
    # existing environment variables.
    pass

import os

# Read supabase values from environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")


def get_supabase_credentials():
    """Return supabase credentials read from environment variables.

    Returns a dict with keys 'url' and 'anon_key'. Values will be None if not set.
    """
    return {"url": SUPABASE_URL, "anon_key": SUPABASE_ANON_KEY}
