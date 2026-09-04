from ultralytics import YOLO
import cv2
import json

model = YOLO("yolo26n.pt")

video = cv2.VideoCapture("vehicle_sample.mp4")

fps = video.get(cv2.CAP_PROP_FPS)
frame_no = 0
tracking_data = []

while True:
    ret, frame = video.read()

    if not ret:
        break

    frame_no += 1

    if frame_no % 5 != 0:
        continue

    results = model.track(
        frame,
        tracker="bytetrack.yaml",
        persist=True,
        verbose=False
    )

    for result in results:
        if result.boxes.id is not None:

            ids = result.boxes.id
            classes = result.boxes.cls
            confidences = result.boxes.conf

            for i in range(len(ids)):

                class_id = int(classes[i])

                if class_id == 0:
                    object_name = "person"
                elif class_id == 2:
                    object_name = "car"
                elif class_id == 3:
                    object_name = "motorcycle"
                elif class_id == 5:
                    object_name = "bus"
                elif class_id == 7:
                    object_name = "truck"
                else:
                    continue

                tracking_data.append({
                    "timestamp_seconds": round(frame_no / fps, 2),
                    "object": object_name,
                    "track_id": int(ids[i]),
                    "confidence": round(float(confidences[i]), 2)
                })

video.release()

with open("tracking_results.json", "w") as f:
    json.dump(tracking_data, f, indent=4)

print("Tracking JSON created!")
print("Total tracking records:", len(tracking_data))
print("Saved as: tracking_results.json")