from ultralytics import YOLO

model = YOLO("yolo26n.pt")

model.track(
    source="vehicle_sample.mp4",
    tracker="bytetrack.yaml",
    save=True,
    verbose=False
)

print("Object tracking completed!")
print("Tracked video saved in the runs folder.")