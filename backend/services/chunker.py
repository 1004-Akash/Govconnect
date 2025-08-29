def chunk_text(text: str, max_chunk_size: int = 500) -> list:
    """Splits text into chunks of max_chunk_size words."""
    # TODO: Implement better chunking logic
    words = text.split()
    return [" ".join(words[i:i+max_chunk_size]) for i in range(0, len(words), max_chunk_size)]
