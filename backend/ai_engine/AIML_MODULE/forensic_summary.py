import json

with open("combined_detection_results.json", "r") as f:
    data = json.load(f)

persons = 0
vehicles = 0
events = len(data)

for item in data:
    if item["class"] == "person":
        persons += item["count"]

    elif item["class"] in ["car", "motorcycle", "bus", "truck"]:
        vehicles += item["count"]

summary = {
    "total_events": events,
    "person_detections": persons,
    "vehicle_detections": vehicles,
    "status": "AI analysis completed"
}

with open("forensic_summary.json", "w") as f:
    json.dump(summary, f, indent=4)

print("AI Forensic Summary created!")
print("Total events:", events)
print("Person detections:", persons)
print("Vehicle detections:", vehicles)
print("Saved as: forensic_summary.json")