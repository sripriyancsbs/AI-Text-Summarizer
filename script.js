// ========================================
// AI TEXT SUMMARIZER
// ========================================

// ---------------- API ----------------

const API_KEY = "YOUR_HUGGINGFACE_API_KEY";

const API_URL = "https://router.huggingface.co/v1/chat/completions";


// ---------------- HTML ELEMENTS ----------------

const inputText = document.getElementById("inputText");
const output = document.getElementById("output");

const summarizeBtn = document.getElementById("summarizeBtn");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");

const loading = document.getElementById("loading");

const charCount = document.getElementById("charCount");
const wordCount = document.getElementById("wordCount");

const summaryType = document.getElementById("summaryType");

const themeBtn = document.getElementById("themeBtn");

const fileInput = document.getElementById("fileInput");
const fileName = document.getElementById("fileName");


// ---------------- PDF JS ----------------

pdfjsLib.GlobalWorkerOptions.workerSrc =
"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

// ========================================
// DARK MODE
// ========================================

themeBtn.addEventListener("click", () => {

    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {

        themeBtn.innerHTML = "☀️ Light Mode";

    } else {

        themeBtn.innerHTML = "🌙 Dark Mode";

    }

});


// ========================================
// CHARACTER & WORD COUNT
// ========================================

inputText.addEventListener("input", () => {

    const text = inputText.value;

    charCount.innerHTML =
        "Characters : " + text.length;

    const words =
        text.trim() === ""
            ? 0
            : text.trim().split(/\s+/).length;

    wordCount.innerHTML =
        "Words : " + words;

});


// ========================================
// CLEAR BUTTON
// ========================================

clearBtn.addEventListener("click", () => {

    inputText.value = "";

    output.innerHTML =
        "Your summarized text will appear here...";

    charCount.innerHTML =
        "Characters : 0";

    wordCount.innerHTML =
        "Words : 0";

    fileName.innerHTML =
        "No file selected";

});


// ========================================
// COPY BUTTON
// ========================================

copyBtn.addEventListener("click", async () => {

    const summary = output.innerText;

    if (
        summary === "" ||
        summary === "Your summarized text will appear here..."
    ) {

        alert("Nothing to copy!");

        return;

    }

    await navigator.clipboard.writeText(summary);

    copyBtn.innerHTML = "✅ Copied";

    setTimeout(() => {

        copyBtn.innerHTML = "📋 Copy Summary";

    }, 2000);

});

// ========================================
// FILE UPLOAD (TXT & PDF)
// ========================================

fileInput.addEventListener("change", async (event) => {

    const file = event.target.files[0];

    if (!file) {

        fileName.innerHTML = "No file selected";

        return;

    }

    fileName.innerHTML = file.name;

    // ---------- TXT ----------

    if (file.name.toLowerCase().endsWith(".txt")) {

        const reader = new FileReader();

        reader.onload = function (e) {

            inputText.value = e.target.result;

            inputText.dispatchEvent(
                new Event("input")
            );

        };

        reader.readAsText(file);

        return;

    }

    // ---------- PDF ----------

    if (file.name.toLowerCase().endsWith(".pdf")) {

        const reader = new FileReader();

        reader.onload = async function () {

            try {

                const typedArray =
                    new Uint8Array(reader.result);

                const pdf =
                    await pdfjsLib
                        .getDocument({
                            data: typedArray
                        })
                        .promise;

                let extractedText = "";

                for (let i = 1; i <= pdf.numPages; i++) {

                    const page =
                        await pdf.getPage(i);

                    const content =
                        await page.getTextContent();

                    const pageText =
                        content.items
                            .map(item => item.str)
                            .join(" ");

                    extractedText += pageText + "\n\n";

                }

                inputText.value = extractedText;

                inputText.dispatchEvent(
                    new Event("input")
                );

            }

            catch (error) {

                console.error(error);

                alert("Unable to read PDF.");

            }

        };

        reader.readAsArrayBuffer(file);

        return;

    }

    alert("Only TXT and PDF files are supported.");

});

// ========================================
// SUMMARIZE BUTTON
// ========================================

summarizeBtn.addEventListener("click", async () => {

    const text = inputText.value.trim();

    if (text === "") {

        alert("Please enter some text.");

        return;

    }

    let prompt = "";

    switch (summaryType.value) {

        case "short":

            prompt = `
Summarize the following text in one short paragraph.

Rules:
- Maximum 80 words
- Use simple English
- Rewrite in your own words

Text:
${text}
`;
            break;

        case "bullet":

            prompt = `
Summarize the following text into exactly 5 bullet points.

Text:
${text}
`;
            break;

        case "simple":

            prompt = `
Explain the following text like you are teaching a 10-year-old child.

Text:
${text}
`;
            break;

        case "professional":

            prompt = `
Write a professional executive summary.

Maximum 120 words.

Text:
${text}
`;
            break;

        case "keypoints":

            prompt = `
Extract only the important key points from the following text.

Text:
${text}
`;
            break;

        default:

            prompt = text;

    }

    loading.style.display = "block";

    output.innerHTML = "Generating summary...";

    try {

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {

                "Authorization": `Bearer ${API_KEY}`,

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                model: "meta-llama/Llama-3.1-8B-Instruct",

                messages: [

                    {
                        role: "system",
                        content: "You are a professional AI text summarizer."
                    },

                    {
                        role: "user",
                        content: prompt
                    }

                ],

                max_tokens: 300,

                temperature: 0.5

            })

        });

        const data = await response.json();

        console.log(data);

                // HTTP Error

        if (!response.ok) {

            throw new Error(
                `HTTP Error : ${response.status}`
            );

        }

        // API Error

        if (data.error) {

            output.innerHTML =
                "❌ " + data.error.message;

            return;

        }

        // No AI Response

        if (!data.choices ||
            data.choices.length === 0) {

            output.innerHTML =
                "⚠️ No response received.";

            return;

        }

        // Show Summary

        output.innerHTML =
            data.choices[0].message.content;

    }

    catch (error) {

        console.error(error);

        output.innerHTML =
            "❌ Something went wrong. Please try again.";

    }

    finally {

        loading.style.display = "none";

    }

});