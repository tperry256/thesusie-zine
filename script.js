document.addEventListener('DOMContentLoaded', function() {
    const textContent = document.getElementById('text-content');
    const loading = document.getElementById('loading');
    
    let zineContent = '';
    
    // Parse content and make TOC clickable
    function parseContent(content) {
        const lines = content.split('\n');
        let processedLines = [];
        let inTOC = false;
        let tocEnded = false;
        const tocToContent = new Map();
        
        // First pass: build mapping between TOC entries and actual content headers
        lines.forEach((line, index) => {
            // Find all section headers with double underscores
            const sectionMatch = line.match(/^__(.+?)__$/);
            if (sectionMatch) {
                const sectionText = sectionMatch[1].trim();
                
                // Map different variations
                if (sectionText.includes('CH')) {
                    // Extract chapter number and title
                    const chNum = sectionText.match(/CH(\d+)/);
                    if (chNum) {
                        tocToContent.set(`CH${chNum[1]}`, index);
                        tocToContent.set(sectionText, index);
                    }
                }
                tocToContent.set(sectionText, index);
            }
        });
        
        // Second pass: process content
        lines.forEach((line, index) => {
            if (line.includes('Table of Contents')) {
                inTOC = true;
                processedLines.push(`<span id="toc">${line}</span>`);
                return;
            }
            
            // End TOC detection - empty line after entries
            if (inTOC && line.trim() === '' && !tocEnded) {
                tocEnded = true;
                inTOC = false;
            }
            
            // Process TOC entries
            if (inTOC && line.trim() !== '') {
                let processed = false;
                
                // Try to find matching content
                for (const [key, contentIndex] of tocToContent) {
                    // Check if TOC line contains the chapter/section identifier
                    const tocChapter = line.match(/CH\d+/);
                    const keyChapter = key.match(/CH\d+/);
                    
                    if (tocChapter && keyChapter && tocChapter[0] === keyChapter[0]) {
                        processedLines.push(`<a href="#section-${contentIndex}" class="toc-link">${line}</a>`);
                        processed = true;
                        break;
                    } else if (line.trim() === key || line.includes(key)) {
                        processedLines.push(`<a href="#section-${contentIndex}" class="toc-link">${line}</a>`);
                        processed = true;
                        break;
                    }
                }
                
                if (!processed) {
                    processedLines.push(line);
                }
            } else if (line.match(/^__(.+?)__$/)) {
                // Add anchor to section headers
                processedLines.push(`<span id="section-${index}" class="section-header">${line}</span>`);
            } else {
                processedLines.push(line);
            }
        });
        
        return processedLines.join('\n');
    }
    
    // Load zine content
    async function loadContent() {
        try {
            const response = await fetch('tsm.txt');
            if (response.ok) {
                zineContent = await response.text();
                displayContent();
            } else {
                loading.style.display = 'none';
                textContent.textContent = 'Error loading zine content.';
            }
        } catch (error) {
            console.error('Error loading content:', error);
            loading.style.display = 'none';
            textContent.textContent = 'Error loading content. Please make sure tsm.txt is in the same directory.';
        }
    }
    
    function displayContent() {
        loading.style.display = 'none';
        textContent.innerHTML = parseContent(zineContent);
        setupClickHandlers();
    }
    
    // Setup click handlers for TOC links
    function setupClickHandlers() {
        const tocLinks = document.querySelectorAll('.toc-link');
        tocLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }
    
    // Create and add back to top button
    const backToTopBtn = document.createElement('button');
    backToTopBtn.innerHTML = '↑ Table of Contents';
    backToTopBtn.id = 'back-to-top';
    backToTopBtn.style.display = 'none';
    document.body.appendChild(backToTopBtn);
    
    // Show/hide back to top button based on scroll
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.style.display = 'block';
        } else {
            backToTopBtn.style.display = 'none';
        }
    });
    
    // Back to top button click handler
    backToTopBtn.addEventListener('click', function() {
        const tocElement = document.getElementById('toc');
        if (tocElement) {
            tocElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    
    // Load content when page loads
    loadContent();
});