// OpenAI API Configuration
const OPENAI_API_KEY = ''; // This should be set securely
const API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

// State management
let currentChapter = 'brainstorming';
let uploadedFiles = [];
let webSources = [];

// Chapter prompts
const chapterPrompts = {
    brainstorming: "Bantu saya brainstorming untuk skripsi dengan topik: ",
    bab1: "Buatkan pendahuluan skripsi yang mencakup latar belakang, rumusan masalah, tujuan penelitian, dan manfaat penelitian dengan topik: ",
    bab2: "Buatkan tinjauan pustaka dan landasan teori untuk skripsi dengan topik: ",
    bab3: "Buatkan metodologi penelitian yang mencakup jenis penelitian, populasi dan sampel, teknik pengumpulan data, dan analisis data untuk skripsi dengan topik: ",
    bab4: "Buatkan hasil penelitian dan pembahasan untuk skripsi dengan topik: ",
    bab5: "Buatkan kesimpulan dan saran untuk skripsi dengan topik: "
};

// Initialize UI elements
document.addEventListener('DOMContentLoaded', () => {
    initializeTabButtons();
    initializeFileUpload();
    initializeWebSourceInput();
    initializeOutputControls();
});

function initializeTabButtons() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active state from all tabs
            tabs.forEach(t => {
                t.classList.remove('bg-primary', 'text-white');
                t.classList.add('text-gray-700');
            });
            
            // Set active state on clicked tab
            tab.classList.add('bg-primary', 'text-white');
            tab.classList.remove('text-gray-700');
            
            // Update current chapter
            currentChapter = tab.dataset.tab;
            
            // Clear the output area
            document.getElementById('outputArea').value = '';
        });
    });
}

async function generateThesisContent() {
    const outputLength = document.querySelector('input[type="text"]').value || '500';
    const approachType = document.querySelector('select').value;
    const outputArea = document.getElementById('outputArea');
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    // Show loading state
    loadingOverlay.classList.remove('hidden');
    
    try {
        // Clear previous content
        outputArea.value = '';
        
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: `Anda adalah asisten yang ahli dalam menulis skripsi akademik dalam bahasa Indonesia. 
                                Gunakan pendekatan ${approachType} dan batasi output sekitar ${outputLength} kata.`
                    },
                    {
                        role: "user",
                        content: constructPrompt()
                    }
                ],
                temperature: 0.7,
                max_tokens: parseInt(outputLength) * 2
            })
        });

        const data = await response.json();
        if (data.choices && data.choices[0]) {
            outputArea.value = data.choices[0].message.content;
        } else {
            throw new Error('Invalid response format');
        }
    } catch (error) {
        console.error('Error:', error);
        outputArea.value = 'Terjadi kesalahan saat menghasilkan konten. Silakan coba lagi.';
    } finally {
        // Hide loading state
        loadingOverlay.classList.add('hidden');
    }
}

function constructPrompt() {
    let basePrompt = chapterPrompts[currentChapter];
    let context = '';

    // Add context from uploaded files
    if (uploadedFiles.length > 0) {
        context += '\n\nBerdasarkan sumber-sumber berikut:\n';
        uploadedFiles.forEach(file => {
            context += `- ${file.name}\n`;
        });
    }

    // Add context from web sources
    if (webSources.length > 0) {
        context += '\n\nDengan referensi web:\n';
        webSources.forEach(url => {
            context += `- ${url}\n`;
        });
    }

    return basePrompt + context;
}

function initializeFileUpload() {
    const fileInput = document.getElementById('fileUpload');
    const dropZone = document.querySelector('.border-dashed');

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-blue-500');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('border-blue-500');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-blue-500');
        
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    });

    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        handleFiles(files);
    });
}

function handleFiles(files) {
    files.forEach(file => {
        if (!uploadedFiles.some(f => f.name === file.name)) {
            uploadedFiles.push(file);
            updateFileList();
        }
    });
}

function initializeWebSourceInput() {
    const urlInput = document.querySelector('input[type="url"]');
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && urlInput.value) {
            webSources.push(urlInput.value);
            urlInput.value = '';
            updateWebSourceList();
        }
    });
}

function initializeOutputControls() {
    const generateBtn = document.getElementById('generateBtn');
    const btnText = generateBtn.innerHTML;
    
    generateBtn.addEventListener('click', async () => {
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generating...';
        generateBtn.classList.add('opacity-75');
        
        try {
            await generateThesisContent();
        } catch (error) {
            console.error('Error generating content:', error);
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerHTML = btnText;
            generateBtn.classList.remove('opacity-75');
        }
    });
}

function updateFileList() {
    const fileListContainer = document.createElement('div');
    fileListContainer.className = 'mt-2';
    
    uploadedFiles.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'text-sm text-gray-600';
        fileItem.textContent = file.name;
        fileListContainer.appendChild(fileItem);
    });

    const existingList = document.querySelector('.file-list');
    if (existingList) {
        existingList.remove();
    }
    
    fileListContainer.classList.add('file-list');
    document.querySelector('.border-dashed').after(fileListContainer);
}

function updateWebSourceList() {
    const sourceListContainer = document.createElement('div');
    sourceListContainer.className = 'mt-2';
    
    webSources.forEach(url => {
        const urlItem = document.createElement('div');
        urlItem.className = 'text-sm text-gray-600';
        urlItem.textContent = url;
        sourceListContainer.appendChild(urlItem);
    });

    const existingList = document.querySelector('.web-source-list');
    if (existingList) {
        existingList.remove();
    }
    
    sourceListContainer.classList.add('web-source-list');
    document.querySelector('input[type="url"]').after(sourceListContainer);
}