import tempfile
import os
import cv2 as cv
import numpy as np
import pickle
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS  

app = Flask(__name__)
CORS(app)

# Load model
with open("hybrid_model.pkl", "rb") as f:
    model = pickle.load(f)

# Preprocess image
def preprocess_image(image_path):
    img = cv.imread(image_path)
    gray = cv.cvtColor(img, cv.COLOR_BGR2GRAY)
    resized = cv.resize(gray, (290, 290))
    flat = resized.flatten().reshape(1, -1)
    return flat

@app.route("/")
def serve_index():
    return send_from_directory("static", "index.html")

@app.route("/<path:path>")
def serve_static_file(path):
    return send_from_directory("static", path)

@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    image = request.files["image"]

    # Create a temporary file path without opening it
    fd, temp_path = tempfile.mkstemp(suffix=".jpg")
    os.close(fd)  # Close the file descriptor to allow saving
    try:
        image.save(temp_path)
        input_data = preprocess_image(temp_path)
        prediction = model.predict(input_data)[0]
        result = "Glaucoma" if prediction == 1 else "No Glaucoma"
    finally:
        os.remove(temp_path)  # Clean up the temp file

    return jsonify({
        "result": result
    })

if __name__ == "__main__":
    app.run(debug=True)
