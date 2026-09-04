import json

with open("forensic_summary.json", "r") as f:
    summary = json.load(f)

with open("ai_timeline.json", "r") as f:
    timeline = json.load(f)

with open("tracking_results.json", "r") as f:
    tracking = json.load(f)

report = {
    "project": "CCTV Forensic AI Analysis",
    "summary": summary,
    "timeline_events": timeline,
    "tracking_records": tracking
}

with open("final_ai_report.json", "w") as f:
    json.dump(report, f, indent=4)

print("Final AI Forensic Report created!")
print("Timeline events:", len(timeline))
print("Tracking records:", len(tracking))
print("Saved as: final_ai_report.json")