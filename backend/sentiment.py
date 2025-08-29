from textblob import TextBlob

def analyze_sentiment(comment):
    if not comment:
        return 'neutral'
    blob = TextBlob(comment)
    polarity = blob.sentiment.polarity
    if polarity > 0.1:
        return 'positive'
    elif polarity < -0.1:
        return 'negative'
    else:
        return 'neutral'
