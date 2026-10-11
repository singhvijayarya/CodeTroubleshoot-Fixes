# Run

## Book application

Requires Node.js 22.

```powershell
cd nodejs
npm install
npm run db:init
npm start
```

Open http://localhost:3000

## Handwriting application

Requires Python 3.11 and Tesseract OCR.

Install Tesseract for Windows from https://github.com/UB-Mannheim/tesseract/wiki

The application looks for `C:\Program Files\Tesseract-OCR\tesseract.exe`.

Set `TESSERACT_CMD` to the executable path if Tesseract is installed somewhere else.

```powershell
cd python
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open http://localhost:8000







# Scribe — Handwriting Recognition Troubleshooting & Improvements

## Overview

Scribe is a handwriting recognition application that allows users to upload an image of handwritten text, process it using OCR (Optical Character Recognition), view the recognized text, copy it, and download it as a text file.

While testing the original application, I focused on more than just getting the project to run. I wanted to make sure that the complete workflow—from selecting an image to downloading the recognized text—worked reliably and produced sensible results.

During troubleshooting, I identified issues in image preprocessing, OCR pipeline integration, file handling, and frontend error handling. I addressed these issues while keeping the existing application structure and user experience intact.

## Problems Identified and Solutions Applied

### 1. Image Resizing and Aspect Ratio

**Problem:** The original image resizing function forced every image into an `800 × 600` resolution. This could stretch or compress handwriting, changing the shape of letters and making recognition more difficult.

**Solution:** I updated the resizing logic to preserve the original aspect ratio and avoid unnecessarily enlarging smaller images.

**Why it matters:** Handwriting can be sensitive to distortion. Preserving the proportions of the original image helps retain its natural appearance before OCR processing.

**File:** `app/preprocessing/image_ops.py`

### 2. Image Preprocessing for OCR

**Problem:** The original preprocessing step used inverted thresholding, producing black backgrounds with white handwriting. Depending on the input image and OCR configuration, this can make recognition less reliable.

**Solution:** I changed the thresholding operation to produce the conventional black-text-on-white-background format.

**Why it matters:** A consistent image format gives the OCR engine a more suitable input for recognizing handwritten characters.

**File:** `app/preprocessing/image_ops.py`

### 3. OCR Pipeline Integration

**Problem:** The preprocessing output and OCR preparation function were not connected consistently. The pipeline passed its arguments in an order that did not match the intended use of the original and processed images.

**Solution:** I corrected the argument order and updated the OCR preparation step to use the preprocessed image.

**Why it matters:** Each processing stage must receive the correct data. Otherwise, the application may successfully return a result that does not accurately reflect the uploaded handwriting.

**File:** `app/services/pipeline.py`

### 4. Text Download and File Reading

**Problem:** The original `read_result()` function opened the saved text file in `w+` mode. This mode allows writing and truncates an existing file when it is opened, which can erase the recognized text before it is read.

**Solution:** I changed the file-opening mode to `r`, which reads the existing file without modifying its contents.

**Why it matters:** Recognized text must remain intact between OCR processing and downloading. This fix addresses the underlying file-handling issue rather than attempting to work around it in the frontend.

**File:** `app/utils/files.py`

### 5. Frontend API Error Handling

**Problem:** The original frontend did not adequately handle network failures, invalid JSON responses, or unexpected server errors. If a request failed before the button was re-enabled, the Process button could remain disabled.

**Solution:** I added error handling around the API request, response parsing, and result validation. A `finally` block restores the button state even when processing fails.

**Why it matters:** A failed request should not leave the interface stuck. Users should receive a useful error message and be able to try again.

**File:** `frontend/static/js/app.js`

### 6. Image Preview Memory Management

**Problem:** Every image selection created a temporary browser object URL. Without releasing previous URLs, repeated image selections could leave unnecessary browser resources allocated.

**Solution:** I added cleanup using `URL.revokeObjectURL()` before creating the next preview URL.

**Why it matters:** This is a small but useful resource-management improvement, especially when users test multiple images in one session.

**File:** `frontend/static/js/app.js`

### 7. Copy and Download User Experience

**Problem:** Clipboard failures were not handled explicitly, and the frontend did not provide clear feedback when copying text failed.

**Solution:** I added success and error messages for the copy operation while retaining the existing clipboard API and download endpoint.

**Why it matters:** Users should know whether their action succeeded instead of having to guess what happened.

**File:** `frontend/static/js/app.js`

## How the Application Works

The application follows a straightforward processing pipeline:

1. **Upload:** The user selects a JPG or PNG image.
2. **Decode:** The backend converts the uploaded bytes into an image.
3. **Resize and preprocess:** The image is resized without distorting its proportions, converted to grayscale, and thresholded.
4. **OCR:** Tesseract extracts text from the prepared image.
5. **Display:** The frontend displays the recognized text, processing time, and processed image.
6. **Copy or download:** The user can copy the result or download it as a `.txt` file.

The existing FastAPI endpoints and HTML structure were retained. The changes focus on correcting processing and file-handling behaviour while making frontend failures easier to recover from.

## Validation and Testing

Testing should cover both normal operation and failure scenarios.

| Test case | Expected behaviour |
|---|---|
| Upload a valid handwritten image | Image preview appears |
| Process a supported image | Recognized text and processing time are displayed |
| Process a multi-line sample | Text is returned across multiple lines where recognized |
| Copy recognized text | Text is copied or an error is displayed |
| Download recognized text | A `.txt` file containing the saved result is returned |
| Submit an invalid image | A meaningful error is displayed |
| Simulate a network or server failure | The error is displayed and the Process button is re-enabled |
| Select multiple images consecutively | The latest preview appears and previous object URLs are released |

The existing sample-image tests and the manual browser workflow should be run before describing the entire application as fully verified.

## Outcome

The troubleshooting work addressed several important reliability issues without redesigning the application.

The main improvements are:

- More consistent image dimensions without aspect-ratio distortion.
- A conventional binary image format for OCR input.
- Correct data flow between preprocessing and recognition.
- Safe reading of saved text files, preventing accidental truncation during download.
- Better recovery from frontend API failures.
- Cleaner image-preview resource management.
- Clearer feedback when copying recognized text.

The goal was not to add unnecessary complexity, but to make the existing application more dependable, easier to troubleshoot, and more straightforward to use.

## Conclusion

This exercise reinforced an important lesson: an application can appear to work while still containing problems in its underlying logic. Reliable troubleshooting means tracing the complete flow of data, identifying the root cause of each issue, applying a focused fix, and validating the result.

Scribe's improvements follow that approach by addressing specific problems in image processing, OCR integration, file handling, and frontend error recovery while preserving the original application's core functionality.



# Book Catalog — Node.js Troubleshooting & Improvements

## Overview

The Node.js book catalog application provides a browser interface and API for managing books, categories, inventory, and dashboard statistics.

During troubleshooting, I reviewed the Node.js application code, API routes, database repositories, frontend JavaScript and styles, and the existing tests. I found and fixed issues affecting book updates, category filtering, stock adjustments, search, dashboard totals, numeric validation, and the layout on narrow screens.

## Problems Identified and Solutions Applied

### 1. Book Update Field Order

**Problem:** The update controller passed the price and published year in the wrong order. This caused valid updates to fail validation or assign incorrect values.

**Solution:** I corrected the argument order so the published year and price reach the service in the expected positions.

**Why it matters:** Editing a book should save the values entered by the user without confusing a year for a price.

**File:** `nodejs/src/controllers/bookController.js`

### 2. Category Filtering

**Problem:** Selecting a category excluded books in that category instead of showing them.

**Solution:** I changed the repository condition to match the selected category.

**Why it matters:** The category dropdown should return only books belonging to the selected category.

**File:** `nodejs/src/repositories/bookRepository.js`

### 3. Decreasing Inventory

**Problem:** A negative stock adjustment increased the book quantity rather than decreasing it.

**Solution:** I applied the adjustment directly to the current quantity and retained the insufficient-stock check so the quantity cannot go below zero.

**Why it matters:** Stock controls must update inventory in the direction requested and must not permit negative stock.

**File:** `nodejs/src/services/stockService.js`

### 4. Dedicated Book Search Route

**Problem:** The `/:id` route was registered before `/search`, so requests to `/api/books/search` could be handled as requests for a book whose ID was `search`.

**Solution:** I registered the search route before the parameterized ID route.

**Why it matters:** Express checks routes in registration order. More specific paths must be registered before routes that match arbitrary path segments.

**File:** `nodejs/src/routes/books.js`

### 5. Dashboard Copy Total

**Problem:** The dashboard total excluded books with exactly one copy in stock.

**Solution:** I changed the total to sum all book quantities.

**Why it matters:** The “Copies in stock” figure should include every available copy, including the last copy of a title.

**File:** `nodejs/src/repositories/statsRepository.js`

### 6. Search Box Query and Stale Results

**Problem:** The search input used the previous query value, which could make results lag one keystroke behind. Concurrent requests could also finish out of order and replace newer results with older ones.

**Solution:** I made the search use the current input value and ignore responses from earlier requests once a newer search has started.

**Why it matters:** The displayed results should correspond to the text currently in the search box.

**File:** `nodejs/frontend/js/app.js`

### 7. Numeric Input Range Validation

**Problem:** Extremely large quantities or stock adjustments could exceed JavaScript's safe integer range, and a very large price could overflow when rounded.

**Solution:** I restricted quantities and adjustments to safe integers, rejected IDs that cannot be represented safely, and added a range check after rounding prices.

**Why it matters:** Values that JavaScript cannot represent reliably should be rejected rather than silently stored or calculated inaccurately.

**File:** `nodejs/src/middleware/validate.js`

### 8. Narrow-Screen Layout

**Problem:** The toolbar and table used fixed minimum widths that could make the whole page overflow on smaller screens.

**Solution:** I allowed the toolbar to wrap and made the table container scroll horizontally when the table is wider than the available space.

**Why it matters:** On a narrow screen, the page itself should remain within the viewport while the table remains accessible.

**File:** `nodejs/frontend/css/styles.css`

## Validation and Testing

Regression tests were added for the corrected update field order, category filtering, stock decreases, unsafe numeric values, dashboard copy totals, and the dedicated search route.

| Check | Result |
|---|---|
| Node.js Jest test suite | 17 tests passed |
| JavaScript syntax checks | All 18 JavaScript files passed |
| Editor diagnostics for modified JavaScript files | No errors found |
| Dedicated search endpoint | Returned the matching book |
| Search box in browser | Displayed results for the current query |
| Narrow viewport at 375px | Page did not overflow horizontally; the table scrolls within its container |

Node.js may print an experimental SQLite warning when running the tests. This is a runtime warning and did not cause the test suite to fail.

## Outcome

The troubleshooting work corrected the confirmed Node.js issues while keeping the existing application structure and user interface intact. The fixes improve the accuracy of book editing, category filtering, inventory changes, search, dashboard totals, numeric input handling, and small-screen usability.