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
            }
            if (inOriginalTOC && line.trim() === '') {
                inOriginalTOC = false;
            }
            
            // Collect TOC items
            if (inOriginalTOC && line.includes('CH')) {
                tocItems.push(line.trim());
            }
            
            // Find actual chapter headers
            if (line.match(/^__.*CH\d+.*__$/)) {
                const chapterNum = line.match(/CH(\d+)/);
                if (chapterNum) {
                    chapterLocations.set(`CH${chapterNum[1]}`, index);
                }
            }
        });
        
        // Build new TOC
        html.push('<div class="simple-toc">');
        html.push('<h2>Table of Contents</h2>');
        
        tocItems.forEach(item => {
            const chapterNum = item.match(/CH(\d+)/);
            if (chapterNum && chapterLocations.has(`CH${chapterNum[1]}`)) {
                const lineIndex = chapterLocations.get(`CH${chapterNum[1]}`);
                html.push(`<a href="#line-${lineIndex}" class="toc-item">${item}</a>`);
            } else {
                html.push(`<div class="toc-item">${item}</div>`);
            }
        });
        
        // Add other main sections
        lines.forEach((line, index) => {
            if (line.match(/^__(.+?)__$/) && !line.includes('CH') && !line.includes('Table of Contents')) {
                const sectionName = line.replace(/__/g, '').trim();
                html.push(`<a href="#line-${index}" class="toc-item">${sectionName}</a>`);
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
    backToTopBtn.style.backgroundColor = '#e74c3c'; // RED for visibility
    backToTopBtn.style.color = 'white';
    backToTopBtn.style.border = '3px solid #fff';
    backToTopBtn.style.padding = '15px 20px';
    backToTopBtn.style.borderRadius = '50px';
    backToTopBtn.style.cursor = 'pointer';
    backToTopBtn.style.fontSize = '16px';
    backToTopBtn.style.fontWeight = 'bold';
    backToTopBtn.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
    backToTopBtn.style.zIndex = '9999';
    backToTopBtn.style.fontFamily = 'Georgia, serif';
    backToTopBtn.style.display = 'block'; // ALWAYS VISIBLE FOR NOW
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
    
    // Show/hide back to top button based on scroll (DISABLED FOR TESTING)
    // window.addEventListener('scroll', function() {
    //     console.log('Scroll position:', window.pageYOffset);
    //     if (window.pageYOffset > 200) {
    //         backToTopBtn.style.display = 'block';
    //         console.log('Showing button');
    //     } else {
    //         backToTopBtn.style.display = 'none';
    //         console.log('Hiding button');
    //     }
    // });
    
    // Back to top button click handler
    backToTopBtn.addEventListener('click', function() {
        console.log('Back to top button clicked!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
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