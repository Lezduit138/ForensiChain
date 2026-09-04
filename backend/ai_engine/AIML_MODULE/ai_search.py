import json

with open("ai_timeline.json", "r") as f:
    data = json.load(f)

search = input("Search object (person/car/bus/etc.): ").lower()

found = 0

print("\n--- SEARCH RESULTS ---")

for item in data:
    if item["class"].lower() == search:
        print(
            "Time:", item["time"],
            "| Event:", item["event"],
            "| Count:", item["count"],
            "| Confidence:", item["confidence"]
        )
        found += 1

print("\nTotal matches:", found)