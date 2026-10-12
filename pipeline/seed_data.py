"""Remote-only seed entrypoint. Reviewed baseline data is tracked in data/raw."""
from normalize import normalize
if __name__ == "__main__":
    normalize()
