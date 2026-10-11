const input = document.querySelector("#image-input");
const preview = document.querySelector("#preview");
const processButton = document.querySelector("#process");
const message = document.querySelector("#message");
const resultPanel = document.querySelector("#result-panel");
const resultText = document.querySelector("#result-text");
const timing = document.querySelector("#timing");
const processed = document.querySelector("#processed");
const copyButton = document.querySelector("#copy-text");
const downloadButton = document.querySelector("#download-text");

let selectedFile = null;
let resultId = null;
let previewUrl = null;

input.addEventListener("change", () => {
    const file = input.files && input.files[0];

    selectedFile = file || null;
    resultId = null;

    resultPanel.hidden = true;
    message.textContent = "";

    // Release the previous preview URL to avoid unnecessary memory use.
    if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        previewUrl = null;
    }

    if (!selectedFile) {
        preview.removeAttribute("src");
        preview.hidden = true;
        processButton.disabled = true;
        return;
    }

    previewUrl = URL.createObjectURL(selectedFile);
    preview.src = previewUrl;
    preview.hidden = false;
    processButton.disabled = false;
});

processButton.addEventListener("click", async () => {
    if (!selectedFile) {
        return;
    }

    const fileToProcess = selectedFile;

    processButton.disabled = true;
    message.textContent = "";

    const body = new FormData();
    body.append("file", fileToProcess);

    try {
        const response = await fetch("/api/recognize", {
            method: "POST",
            body
        });

        let data;

        try {
            data = await response.json();
        } catch {
            throw new Error("The server returned an invalid response.");
        }

        if (!response.ok) {
            throw new Error(data?.error || "Request failed.");
        }

        if (
            !data ||
            typeof data.id !== "string" ||
            typeof data.text !== "string" ||
            typeof data.processing_ms !== "number"
        ) {
            throw new Error("The server returned an invalid response.");
        }

        // Ignore a result if the user selected another image meanwhile.
        if (selectedFile !== fileToProcess) {
            return;
        }

        resultId = data.id;
        resultText.value = data.text;
        timing.textContent = `${data.processing_ms} ms`;

        processed.src =
            `/api/results/${encodeURIComponent(data.id)}/processed.png?t=${Date.now()}`;

        processed.hidden = false;
        resultPanel.hidden = false;

    } catch (error) {
        message.textContent =
            error instanceof Error
                ? error.message
                : "Unable to process the image. Please try again.";

    } finally {
        // Always restore the button, including after network/API failures.
        processButton.disabled = !selectedFile;
    }
});

copyButton.addEventListener("click", async () => {
    try {
        await navigator.clipboard.writeText(resultText.value);
        message.textContent = "Text copied successfully.";
    } catch {
        message.textContent =
            "Unable to copy text. Check clipboard permissions.";
    }
});

downloadButton.addEventListener("click", () => {
    if (!resultId) {
        return;
    }

    window.location.href =
        `/api/results/${encodeURIComponent(resultId)}/download`;
});
