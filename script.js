function processText() {
    const documentTextInput = document.getElementById('documentText').innerHTML;
    const siteTextInput = document.getElementById('siteText').innerHTML;

    // Extract and store links before any processing
    const documentLinks = extractLinks(documentTextInput);
    const siteLinks = extractLinks(siteTextInput);
    console.log('Document Links:', documentLinks);
    console.log('Site Links:', siteLinks);
    localStorage.setItem('documentLinks', JSON.stringify(documentLinks));
    localStorage.setItem('siteLinks', JSON.stringify(siteLinks));

    // Process and store the text with proper sanitization
    const processedDocumentText = sanitizeAndNormalizeText(documentTextInput);
    const processedSiteText = sanitizeAndNormalizeText(siteTextInput);

    localStorage.setItem('processedDocumentText', processedDocumentText);
    localStorage.setItem('processedSiteText', processedSiteText);
}

function sanitizeAndNormalizeText(html) {
    // Create a temporary div to handle HTML content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // First, convert all line break elements to newlines
    const lineBreakElements = tempDiv.getElementsByTagName('br');
    for (let i = lineBreakElements.length - 1; i >= 0; i--) {
        lineBreakElements[i].replaceWith('\n');
    }

    // Convert block elements to newlines
    const blockElements = tempDiv.getElementsByTagName('p');
    for (let i = blockElements.length - 1; i >= 0; i--) {
        blockElements[i].replaceWith(blockElements[i].textContent + '\n');
    }

    // Get the text content and normalize it
    let text = tempDiv.textContent
        // Normalize line endings
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        // Normalize spaces
        .replace(/\t/g, ' ')
        .replace(/\s+/g, ' ')
        // Remove special characters but keep basic punctuation
        .replace(/[^\x20-\x7E\n]/g, '')
        // Normalize quotes
        .replace(/['']/g, "'")
        .replace(/[""]/g, '"')
        // Remove multiple consecutive newlines
        .replace(/\n\s*\n/g, '\n')
        // Trim each line
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n')
        // Final trim
        .trim();

    return text;
}

function formatArray(lines) {
    let count = 0;
    const formattedLines = new Array(500).fill(null);
    for (let line of lines) {
        if (line && line.trim()) {
            // Remove HTML tags and unwanted characters
            line = line.replace(/<[^>]*>/g, '')
                       .replace(/’|‘/g, "'")
                       .replace(/•|·|•/g, "")
                       .replace(/¨/g, "") // Remove "¨" characters
                       .replace(/\t/g, "") // Remove tabs
                       .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
                       .trim(); // Trim leading and trailing spaces
            formattedLines[count++] = line;
        }
    }
    console.log('Formatted Lines:', formattedLines.filter(line => line !== null));
    return formattedLines.filter(line => line !== null);
}

function formatLinks(text) {
    const urlPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(urlPattern, '<a href="$1" target="_blank">$1</a>');
}

function extractLinks(text) {
    const urlPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    const links = [];
    const matches = text.match(urlPattern);
    if (matches) {
        links.push(...matches);
    }
    return links;
}

function viewProcessedText() {
    processText();
    window.open('processedText.html', '_blank');
}

function viewLinks() {
    processText(); // Ensure text is processed and links are extracted
    window.open('links.html', '_blank');
}

function printLineFromProcessedText(lineNumber) {
    const processedDocumentText = localStorage.getItem('processedDocumentText');
    const processedSiteText = localStorage.getItem('processedSiteText');

    if (processedDocumentText) {
        const documentLines = processedDocumentText.split('\n');
        if (lineNumber >= 0 && lineNumber < documentLines.length) {
            console.log(`Document Text Line ${lineNumber}: ${documentLines[lineNumber]}`);
        } else {
            console.log('Invalid line number for Document Text');
        }
    }

    if (processedSiteText) {
        const siteLines = processedSiteText.split('\n');
        if (lineNumber >= 0 && lineNumber < siteLines.length) {
            console.log(`Site Text Line ${lineNumber}: ${siteLines[lineNumber]}`);
        } else {
            console.log('Invalid line number for Site Text');
        }
    }
}

// Example usage:
const lineNumber = 1; // Change this to the desired line number
printLineFromProcessedText(lineNumber);

function compareTexts(documentText, siteText) {
    const differences = [];
    const maxLength = Math.max(documentText.length, siteText.length);

    for (let i = 0; i < maxLength; i++) {
        if (documentText[i] !== siteText[i]) {
            differences.push({
                line: i,
                document: documentText[i] || '',
                site: siteText[i] || ''
            });
        }
    }

    return differences;
}

function highlightDifferences(differences) {
    const documentOutput = document.getElementById('documentOutput');
    const siteOutput = document.getElementById('siteOutput');

    documentOutput.innerHTML = '';
    siteOutput.innerHTML = '';

    differences.forEach(diff => {
        documentOutput.innerHTML += `<div style="background-color: #ffcccc;">${diff.document}</div>`;
        siteOutput.innerHTML += `<div style="background-color: #ccffcc;">${diff.site}</div>`;
    });
}

function handlePaste(event) {
    event.preventDefault();
    const text = (event.clipboardData || window.clipboardData).getData('text/html') || 
                 (event.clipboardData || window.clipboardData).getData('text/plain');
    
    // Create a temporary div to handle the paste
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    
    // Remove Microsoft Office specific attributes and functions
    const elements = tempDiv.getElementsByTagName('*');
    for (let i = elements.length - 1; i >= 0; i--) {
        const element = elements[i];
        // Remove all on* attributes (like onmouseout)
        const attrs = element.attributes;
        for (let j = attrs.length - 1; j >= 0; j--) {
            if (attrs[j].name.startsWith('on')) {
                element.removeAttribute(attrs[j].name);
            }
        }
        // Remove class attributes that might contain Office-specific classes
        if (element.hasAttribute('class')) {
            element.removeAttribute('class');
        }
    }
    
    // Preserve basic formatting while sanitizing
    const sanitizedText = tempDiv.innerHTML
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<p>/gi, '')
        .replace(/<\/p>/gi, '\n')
        .replace(/<div>/gi, '')
        .replace(/<\/div>/gi, '\n')
        .replace(/\n\s*\n/g, '\n')
        .trim();
    
    document.execCommand('insertHTML', false, sanitizedText);
}

function sanitizeHTML(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Keep only essential tags
    const allowedTags = ['A', 'P', 'BR', 'DIV'];
    const elements = tempDiv.getElementsByTagName('*');
    for (let i = elements.length - 1; i >= 0; i--) {
        const element = elements[i];
        if (!allowedTags.includes(element.tagName)) {
            element.outerHTML = element.innerHTML;
        }
    }

    // Clean up link attributes
    const links = tempDiv.getElementsByTagName('a');
    for (let i = 0; i < links.length; i++) {
        links[i].removeAttribute('style');
        links[i].removeAttribute('class');
    }

    return tempDiv.innerHTML;
}