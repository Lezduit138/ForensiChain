from ultralytics import YOLO
import cv2
import json

model = YOLO("yolo26n.pt")

video = cv2.VideoCapture("vehicle_sample.mp4")

fps = video.get(cv2.CAP_PROP_FPS)

events = []
frame_no = 0

classes = {
    0: "person",
    1: "bicycle",
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck"
}

while True:
    ret, frame = video.read()

    if not ret:
        break

    frame_no += 1

    # Every 5th frame
    if frame_no % 5 != 0:
        continue

    results = model(frame, verbose=False)

    detected = {}

    for result in results:
        for box in result.boxes:

            class_id = int(box.cls[0])
            confidence = float(box.conf[0])

            if class_id in classes:
                name = classes[class_id]

                if name not in detected:
                    detected[name] = {
                        "count": 0,
                        "confidence": 0
                    }

                detected[name]["count"] += 1
                detected[name]["confidence"] = max(
                    detected[name]["confidence"],
                    confidence
                )

    timestamp = round(frame_no / fps, 2)

    for name, data in detected.items():

        events.append({
            "timestamp_seconds": timestamp,
            "event": name + "_detected",
            "class": name,
            "count": data["count"],
            "confidence": round(data["confidence"], 2)
        })

video.release()

with open("combined_detection_results.json", "w") as f:
    json.dump(events, f, indent=4)

print("Combined detection completed!")
print("Total events:", len(events))
print("Saved as: combined_detection_results.json")