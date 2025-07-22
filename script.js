document.addEventListener('DOMContentLoaded', function() {
    const textContent = document.getElementById('text-content');
    const loading = document.getElementById('loading');
    
    let zineContent = '';
    
    // Simple TOC builder
    function buildSimpleTOC(content) {
        const lines = content.split('\n');
        let html = [];
        let inOriginalTOC = false;
        let tocItems = [];
        
        // Find TOC items and chapter locations
        const chapterLocations = new Map();
        
        lines.forEach((line, index) => {
            // Track original TOC
            if (line.includes('Table of Contents')) {
                inOriginalTOC = true;
                console.log('Found TOC start at line', index, ':', line);
            }
            
            // Collect TOC items - be more flexible with chapter detection
            if (inOriginalTOC && line.match(/CH\d+/)) {
                console.log('Found TOC chapter at line', index, ':', line.trim());
                tocItems.push(line.trim());
            }
            
            // End TOC detection - look for first section header after TOC
            if (inOriginalTOC && line.match(/^__(.+?)__$/) && !line.includes('Table of Contents')) {
                inOriginalTOC = false;
                console.log('TOC ended at line', index, 'due to section:', line);
            }
            
            // Find actual chapter headers - look for __CH1. format
            if (line.match(/^__CH\d+\./)) {
                const chapterNum = line.match(/CH(\d+)/);
                if (chapterNum) {
                    console.log('Found chapter header:', line, 'at line', index);
                    chapterLocations.set(`CH${chapterNum[1]}`, index);
                }
            }
        });
        
        // Build new TOC in source order
        html.push('<div class="sleek-toc">');
        html.push('<h2><span class="toc-icon">📚</span> Table of Contents</h2>');
        html.push('<div class="toc-grid">');
        
        console.log('TOC Items found:', tocItems);
        console.log('Chapter locations:', Array.from(chapterLocations.entries()));
        
        // Collect all TOC items with their line numbers to preserve order
        const allTocItems = [];
        
        // Add TOC items (chapters and other entries) in original order
        let tocLineStart = -1;
        let inTocRegion = false;
        
        lines.forEach((line, index) => {
            if (line.includes('Table of Contents')) {
                tocLineStart = index;
                inTocRegion = true;
                return;
            }
            
            // End TOC region when we hit a section header
            if (inTocRegion && line.match(/^__(.+?)__$/) && !line.includes('Table of Contents')) {
                inTocRegion = false;
            }
            
            if (tocLineStart >= 0 && inTocRegion) {
                // Check if this line is a TOC entry
                if (line.trim() && !line.match(/^__(.+?)__$/)) {
                    const chapterMatch = line.match(/CH(\d+)/);
                    if (chapterMatch) {
                        const chapterKey = `CH${chapterMatch[1]}`;
                        if (chapterLocations.has(chapterKey)) {
                            const targetIndex = chapterLocations.get(chapterKey);
                            allTocItems.push({
                                text: line.trim(),
                                link: `#line-${targetIndex}`,
                                isChapter: true,
                                order: index
                            });
                        } else {
                            allTocItems.push({
                                text: line.trim(),
                                link: null,
                                isChapter: false,
                                order: index
                            });
                        }
                    } else if (line.trim() !== '') {
                        // Non-chapter TOC item, look for matching section
                        const matchingSection = lines.find((l, i) => {
                            return l.match(/^__(.+?)__$/) && 
                                   l.replace(/__/g, '').trim().toLowerCase().includes(line.trim().toLowerCase());
                        });
                        if (matchingSection) {
                            const sectionIndex = lines.indexOf(matchingSection);
                            allTocItems.push({
                                text: line.trim(),
                                link: `#line-${sectionIndex}`,
                                isChapter: false,
                                order: index
                            });
                        } else {
                            allTocItems.push({
                                text: line.trim(),
                                link: null,
                                isChapter: false,
                                order: index
                            });
                        }
                    }
                }
            }
        });
        
        // Sort by original order and render
        allTocItems.sort((a, b) => a.order - b.order);
        
        allTocItems.forEach(item => {
            if (item.link) {
                const icon = item.isChapter ? '📖' : '📄';
                html.push(`<a href="${item.link}" class="toc-link ${item.isChapter ? 'chapter' : 'section'}">
                    <span class="toc-item-icon">${icon}</span>
                    <span class="toc-item-text">${item.text}</span>
                </a>`);
            } else {
                const icon = item.isChapter ? '📖' : '📄';
                html.push(`<div class="toc-link disabled">
                    <span class="toc-item-icon">${icon}</span>
                    <span class="toc-item-text">${item.text}</span>
                </div>`);
            }
        });
        
        html.push('</div>');
        html.push('<hr style="margin: 2rem 0;">');
        
        // Process content with line anchors, skip original TOC
        let skipOriginalTOC = false;
        let originalTOCEnded = false;
        
        lines.forEach((line, index) => {
            // Skip the original Table of Contents section
            if (line.includes('Table of Contents')) {
                skipOriginalTOC = true;
                return; // Don't include this line
            }
            
            // End of original TOC detection
            if (skipOriginalTOC && !originalTOCEnded) {
                if (line.match(/^__(.+?)__$/) || 
                    (line.trim() === '' && lines[index + 1] && lines[index + 1].match(/^__(.+?)__$/))) {
                    skipOriginalTOC = false;
                    originalTOCEnded = true;
                } else {
                    return; // Skip this line (part of original TOC)
                }
            }
            
            // Process normal content
            if (line.match(/^__(.+?)__$/)) {
                html.push(`<h3 id="line-${index}" class="section-header">${line}</h3>`);
            } else {
                html.push(line);
            }
        });
        
        return html.join('\n');
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
        textContent.innerHTML = buildSimpleTOC(zineContent);
        
        // Add click handlers
        document.querySelectorAll('.toc-item[href]').forEach(link => {
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
    
    // Create and add back to top button - ALWAYS VISIBLE FOR TESTING
    console.log('Creating back to top button...');
    const backToTopBtn = document.createElement('button');
    backToTopBtn.innerHTML = '↑ Back to Top';
    backToTopBtn.id = 'back-to-top';
    
    // Apply styles directly to ensure visibility
    backToTopBtn.style.position = 'fixed';
    backToTopBtn.style.bottom = '30px';
    backToTopBtn.style.right = '30px';
    backToTopBtn.style.backgroundColor = '#2c3e50';
    backToTopBtn.style.color = 'white';
    backToTopBtn.style.border = 'none';
    backToTopBtn.style.padding = '15px 20px';
    backToTopBtn.style.borderRadius = '50px';
    backToTopBtn.style.cursor = 'pointer';
    backToTopBtn.style.fontSize = '14px';
    backToTopBtn.style.fontWeight = 'normal';
    backToTopBtn.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
    backToTopBtn.style.zIndex = '1000';
    backToTopBtn.style.fontFamily = 'Georgia, serif';
    backToTopBtn.style.display = 'none'; // Hidden by default
    backToTopBtn.style.transition = 'all 0.3s ease';
    
    document.body.appendChild(backToTopBtn);
    console.log('Back to top button added to body');
    
    // Test that button is in DOM
    setTimeout(() => {
        const testBtn = document.getElementById('back-to-top');
        console.log('Button in DOM:', testBtn ? 'YES' : 'NO');
        if (testBtn) {
            console.log('Button styles:', window.getComputedStyle(testBtn).display);
        }
    }, 1000);
    
    // Show/hide back to top button based on scroll
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 200) {
            backToTopBtn.style.display = 'block';
        } else {
            backToTopBtn.style.display = 'none';
        }
    });
    
    // Back to top button click handler
    backToTopBtn.addEventListener('click', function() {
        console.log('Back to top button clicked!');
        // Scroll to the very top of the document
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        // Also use window.scrollTo as backup
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    });
    
    // Hover effects
    backToTopBtn.addEventListener('mouseenter', function() {
        console.log('Button hover enter');
        this.style.backgroundColor = '#3498db';
        this.style.transform = 'translateY(-2px)';
    });
    
    backToTopBtn.addEventListener('mouseleave', function() {
        console.log('Button hover leave');
        this.style.backgroundColor = '#e74c3c';
        this.style.transform = 'translateY(0)';
    });
    
    // Load content when page loads
    loadContent();
});