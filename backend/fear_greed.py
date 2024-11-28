import requests

def fetch_fear_greed_index():
    url = "https://production.dataviz.cnn.io/index/fearandgreed/graphdata"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
    }
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        data = response.json()
        if "fear_and_greed" in data:
            fear_greed_data = data["fear_and_greed"]

            # Round numerical values to two decimal places for better readability
            return {
                "score": round(fear_greed_data.get("score", 0), 2),
                "rating": fear_greed_data.get("rating"),
                "timestamp": fear_greed_data.get("timestamp"),
                "previous_close": round(fear_greed_data.get("previous_close", 0), 2),
                "previous_1_week": round(fear_greed_data.get("previous_1_week", 0), 2),
                "previous_1_month": round(fear_greed_data.get("previous_1_month", 0), 2),
                "previous_1_year": round(fear_greed_data.get("previous_1_year", 0), 2),
            }
        else:
            raise Exception("Failed to parse Fear & Greed Index data")
    else:
        raise Exception(f"Failed to fetch data: {response.status_code}")
