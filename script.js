document.addEventListener('DOMContentLoaded', function() {
    const textContent = document.getElementById('text-content');
    const loading = document.getElementById('loading');
    
    let zineContent = '';
    
    // Parse content and make TOC clickable
    function parseContent(content) {
        const lines = content.split('\n');
        let processedLines = [];
        let inTOC = false;
        let tocStarted = false;
        const chapters = new Map();
        
        // First pass: find all chapters and sections
        lines.forEach((line, index) => {
            if (line.includes('Table of Contents')) {
                inTOC = true;
                tocStarted = true;
            }
            
            // Check for chapter patterns
            const chapterMatch = line.match(/^(CH\d+[a-z]?:|__CH\d+\.|CH\d+\.)/);
            if (chapterMatch) {
                const chapterKey = line.trim();
                chapters.set(chapterKey, `chapter-${index}`);
            }
            
            // Check for section headers (double underscores)
            const sectionMatch = line.match(/^__(.+?)__$/);
            if (sectionMatch && !line.includes('Table of Contents')) {
                const sectionKey = sectionMatch[1].trim();
                chapters.set(sectionKey, `section-${index}`);
            }
        });
        
        // Second pass: process content
        inTOC = false;
        tocStarted = false;
        
        lines.forEach((line, index) => {
            if (line.includes('Table of Contents')) {
                inTOC = true;
                tocStarted = true;
                processedLines.push(`<span id="toc">${line}</span>`);
                return;
            }
            
            // Process TOC entries
            if (inTOC && line.trim() !== '') {
                let processed = false;
                
                // Look for matches in chapters map
                for (const [key, anchor] of chapters) {
                    if (line.includes(key.replace(/^__|__$/g, '').replace(/^CH\d+\.|^CH\d+:/, 'CH'))) {
                        processedLines.push(`<a href="#${anchor}" class="toc-link">${line}</a>`);
                        processed = true;
                        break;
                    }
                }
                
                if (!processed) {
                    processedLines.push(line);
                }
            } else if (line.match(/^(CH\d+[a-z]?:|__CH\d+\.|CH\d+\.)/)) {
                // Add anchor to chapters
                const anchor = chapters.get(line.trim());
                processedLines.push(`<span id="${anchor}" class="chapter-header">${line}</span>`);
            } else if (line.match(/^__(.+?)__$/)) {
                // Add anchor to section headers
                const anchor = chapters.get(line.match(/^__(.+?)__$/)[1].trim());
                processedLines.push(`<span id="${anchor}" class="section-header">${line}</span>`);
            } else {
                processedLines.push(line);
            }
            
            // End of TOC detection
            if (tocStarted && line.trim() === '' && processedLines.filter(l => l.includes('<a href="#')).length > 5) {
                inTOC = false;
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