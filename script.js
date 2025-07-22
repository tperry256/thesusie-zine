document.addEventListener('DOMContentLoaded', function() {
    const textContent = document.getElementById('text-content');
    const loading = document.getElementById('loading');
    
    let zineContent = '';
    
    // Extract keywords from a paragraph
    function extractKeywords(text) {
        if (!text || text.length < 20) return null;
        
        // Remove common words and get significant terms
        const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
                          'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 
                          'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
                          'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
                          'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
                          'them', 'their', 'my', 'your', 'our', 'me', 'him', 'her'];
        
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3 && !stopWords.includes(word));
        
        // Get most significant word (first substantial word)
        if (words.length > 0) {
            // Prefer capitalized words from original text
            const matches = text.match(/\b[A-Z][a-z]+/g);
            if (matches && matches.length > 0) {
                return matches[0];
            }
            return words[0].charAt(0).toUpperCase() + words[0].slice(1);
        }
        return null;
    }
    
    // Build enhanced TOC and parse content
    function parseContent(content) {
        const lines = content.split('\n');
        let processedLines = [];
        let enhancedTOC = [];
        let currentSection = null;
        let paragraphCount = 0;
        let inTOC = false;
        let tocEnded = false;
        const sections = new Map();
        
        // First pass: analyze structure
        let currentParagraph = [];
        lines.forEach((line, index) => {
            // Detect sections
            const sectionMatch = line.match(/^__(.+?)__$/);
            if (sectionMatch) {
                const sectionText = sectionMatch[1].trim();
                currentSection = {
                    title: sectionText,
                    index: index,
                    paragraphs: []
                };
                sections.set(sectionText, currentSection);
            }
            
            // Build paragraphs
            if (currentSection && !sectionMatch) {
                if (line.trim() === '') {
                    if (currentParagraph.length > 0) {
                        const paragraphText = currentParagraph.join(' ');
                        const keyword = extractKeywords(paragraphText);
                        if (keyword) {
                            currentSection.paragraphs.push({
                                keyword: keyword,
                                index: index - currentParagraph.length,
                                text: paragraphText
                            });
                        }
                        currentParagraph = [];
                    }
                } else {
                    currentParagraph.push(line);
                }
            }
        });
        
        // Second pass: build enhanced TOC
        let tocHtml = ['<div class="enhanced-toc">'];
        tocHtml.push('<h3>Table of Contents</h3>');
        
        // Original TOC entries
        lines.forEach((line, index) => {
            if (line.includes('Table of Contents')) {
                inTOC = true;
                return;
            }
            
            if (inTOC && line.trim() === '' && !tocEnded) {
                tocEnded = true;
                inTOC = false;
            }
            
            if (inTOC && line.trim() !== '') {
                // Find matching section
                let matchedSection = null;
                for (const [sectionTitle, section] of sections) {
                    const chapterMatch = line.match(/CH(\d+)/);
                    const sectionChapterMatch = sectionTitle.match(/CH(\d+)/);
                    
                    if (chapterMatch && sectionChapterMatch && 
                        chapterMatch[1] === sectionChapterMatch[1]) {
                        matchedSection = section;
                        break;
                    }
                }
                
                if (matchedSection) {
                    tocHtml.push(`<div class="toc-section">`);
                    tocHtml.push(`<a href="#section-${matchedSection.index}" class="toc-main-link">${line}</a>`);
                    
                    // Add keywords as sub-links
                    if (matchedSection.paragraphs.length > 0) {
                        tocHtml.push('<div class="toc-keywords">');
                        matchedSection.paragraphs.forEach((para, i) => {
                            tocHtml.push(`<a href="#para-${matchedSection.index}-${i}" class="toc-keyword" data-keyword="${para.keyword}">${para.keyword}</a>`);
                        });
                        tocHtml.push('</div>');
                    }
                    tocHtml.push('</div>');
                } else {
                    tocHtml.push(`<div class="toc-section">${line}</div>`);
                }
            }
        });
        
        tocHtml.push('</div>');
        
        // Third pass: process content with paragraph IDs
        processedLines.push(tocHtml.join('\n'));
        
        currentSection = null;
        let sectionParaCount = 0;
        currentParagraph = [];
        let currentParagraphStartIndex = 0;
        
        lines.forEach((line, index) => {
            const sectionMatch = line.match(/^__(.+?)__$/);
            if (sectionMatch) {
                // Flush current paragraph if any
                if (currentParagraph.length > 0) {
                    const paraId = currentSection ? `para-${currentSection.index}-${sectionParaCount}` : '';
                    processedLines.push(`<p id="${paraId}">${currentParagraph.join('\n')}</p>`);
                    currentParagraph = [];
                }
                
                const sectionText = sectionMatch[1].trim();
                currentSection = sections.get(sectionText);
                sectionParaCount = 0;
                processedLines.push(`<span id="section-${index}" class="section-header">${line}</span>`);
            } else if (line.trim() === '') {
                if (currentParagraph.length > 0) {
                    const paraId = currentSection ? `para-${currentSection.index}-${sectionParaCount}` : '';
                    processedLines.push(`<p id="${paraId}">${currentParagraph.join('\n')}</p>`);
                    sectionParaCount++;
                    currentParagraph = [];
                }
                processedLines.push('');
            } else {
                currentParagraph.push(line);
            }
        });
        
        // Flush last paragraph
        if (currentParagraph.length > 0) {
            const paraId = currentSection ? `para-${currentSection.index}-${sectionParaCount}` : '';
            processedLines.push(`<p id="${paraId}">${currentParagraph.join('\n')}</p>`);
        }
        
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
        // Handle main section links
        const mainLinks = document.querySelectorAll('.toc-main-link');
        mainLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
        
        // Handle keyword links
        const keywordLinks = document.querySelectorAll('.toc-keyword');
        keywordLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const keyword = this.getAttribute('data-keyword');
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    // Clear previous highlights
                    document.querySelectorAll('.keyword-highlight').forEach(el => {
                        el.classList.remove('keyword-highlight');
                    });
                    
                    // Scroll to paragraph
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    // Highlight the keyword in the paragraph
                    setTimeout(() => {
                        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                        targetElement.innerHTML = targetElement.innerHTML.replace(regex, 
                            match => `<span class="keyword-highlight">${match}</span>`);
                    }, 500);
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