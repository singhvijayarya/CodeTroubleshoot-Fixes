
import cv2
import numpy as np


def decode_image(data):
    array = np.frombuffer(data, dtype=np.uint8).copy()
    image = cv2.imdecode(array, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError("Invalid image")

    return image


def resize_image(image, max_width=800, max_height=600):
    height, width = image.shape[:2]

    if width <= 0 or height <= 0:
        raise ValueError("Invalid image dimensions")

    # Preserve the original aspect ratio and avoid unnecessary upscaling.
    scale = min(
        max_width / width,
        max_height / height,
        1.0,
    )

    if scale == 1.0:
        return image

    new_width = max(1, int(round(width * scale)))
    new_height = max(1, int(round(height * scale)))

    return cv2.resize(
        image,
        (new_width, new_height),
        interpolation=cv2.INTER_AREA,
    )


def to_grayscale(image):
    if image.ndim == 2:
        return image

    return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)


def preprocess_image(image):
    gray = to_grayscale(image)
    blur = cv2.GaussianBlur(gray, (3, 3), 0)

    # Keep black handwriting on a white background.
    _, binary = cv2.threshold(
        blur,
        0,
        255,
        cv2.THRESH_BINARY + cv2.THRESH_OTSU,
    )

    return binary