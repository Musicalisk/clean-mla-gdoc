/*
 * cleanMLAGDoc.js v1.0.1
 * Copyright (c) 2026 Musicalisk <Musicalisk.travail@tuta.io>
 * Licensed under the GNU General Public License v3.0
 * Full license text: https://www.gnu.org
 */

(function() {
    // Configuration for external dependencies and assets
    const CONFIG = {
        jqueryUrl: "https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js",
        faviconUrl: "https://cdn.jsdelivr.net/npm/favicon.js@1.0.0/dist/favicon.min.js",
        iconFrames: [
            'https://img.icons8.com/?size=16&id=1395&format=png&color=FA5252',
            'https://img.icons8.com/?size=16&id=1395&format=png&color=20C997',
            'https://img.icons8.com/?size=16&id=1395&format=png&color=339AF0'
        ]
    };

    // Helper to load external scripts dynamically
    const loadScript = (url, callback) => {
        let script = document.createElement("script");
        script.src = url;
        script.onload = callback;
        document.head.appendChild(script);
    };

    // Main formatting logic
    const initializeCleanMLAG = () => {
        /** 
         * CSS INJECTION 
         * Defines the physical 8.5x11 inch page structure and the "DRAFT" watermark.
         */
        $('<style>').html(`
            @page { size: 8.5in 11in; margin: 0; }
            html { background: #d0d0d0 !important; width: 100% !important; }
            body { 
                visibility: hidden; 
                margin: 0 !important; 
                padding: 40px 0 !important; 
                display: flex !important; 
                flex-direction: column !important; 
                align-items: center !important; 
                width: 100% !important; 
                max-width: none !important; 
                background: transparent !important; 
                font-family: "Times New Roman", serif !important; 
                line-height: 2.0 !important; 
                color: #000 !important; 
            }
            .mla-page-container { 
                background: #fff !important; 
                box-shadow: 0 0 20px rgba(0,0,0,.2) !important; 
                width: 8.5in !important; 
                height: 11in !important; 
                margin: 0 auto 40px auto !important; 
                padding: 1in !important; 
                box-sizing: border-box !important; 
                position: relative; 
                overflow: hidden; 
                flex-shrink: 0; 
            }
            .watermark::before { 
                content: 'DRAFT' !important; 
                position: absolute !important; 
                top: 50% !important; 
                left: 50% !important; 
                transform: translate(-50%, -50%) rotate(-45deg) !important; 
                font-size: 150px !important; 
                color: rgba(0,0,0,0.12) !important; 
                z-index: 99 !important; 
                pointer-events: none !important; 
                white-space: nowrap !important; 
                display: block !important; 
            }
            .no-indent { text-indent: 0 !important; }
            p { text-indent: .5in !important; margin: 0 !important; }
            .header-wrapper { 
                position: absolute; 
                top: .5in; 
                right: 1in; 
                text-align: right !important; 
                text-indent: 0 !important; 
                width: 6.5in; 
                height: .5in; 
                line-height: .5in !important; 
                z-index: 10; 
            }
            .hanging-indent { text-indent: -.5in !important; padding-left: .5in !important; }
            .centered-title { text-align: center !important; text-indent: 0 !important; }
            @media print { 
                html { background: #fff !important; } 
                body { padding: 0 !important; visibility: visible !important; } 
                .mla-page-container { margin: 0 auto !important; box-shadow: none !important; page-break-after: always !important; } 
            }
        `).appendTo('head');

        setTimeout(() => {
            /** 
             * DRAFT & METADATA DETECTION 
             * Checks the header for the "| draft" string and extracts the assignment title.
             */
            const headerElement = $('.c1').first();
            const headerText = headerElement.text().trim();
            const isDraft = /\|\s*draft/i.test(headerText);
            const assignmentName = String(headerText.replace(/\|\s*draft.*/i, '').trim() || "Assignment");

            // Extract Name and Page Content
            let paragraphs = $('p').filter(function() {
                return $(this).text().trim().length > 0 && !$(this).hasClass('c1');
            });

            let firstLine = paragraphs.first().text().trim();
            let nameParts = firstLine.split(' ');
            let firstName = String(nameParts[0] || "First");
            let lastName = String(nameParts[nameParts.length - 1] || "Last");

            document.title = lastName + " " + firstName + " " + assignmentName;

            // Cleanup: remove raw elements and duplicate headers
            $('.c1').remove();
            $('*').filter(function() {
                return ($(this).css('text-align') === 'right' || $(this).css('position') === 'absolute') && $(this).text().includes(lastName);
            }).remove();

            let elementsToProcess = $('.doc-content > *,.c7 > *,body > *').not('script,style,.mla-page-container').get();
            $('body').children().not('script,style').remove();

            /** 
             * PAGE FACTORY 
             * Creates a new page and applies the "DRAFT" watermark if flagged.
             */
            const createPage = (pageNum) => {
                let page = $('<div class="mla-page-container"></div>');
                if (isDraft) page.addClass('watermark');
                page.append(`<div class="header-wrapper">${lastName} ${pageNum}</div>`);
                return page;
            };

            // Pagination state
            let currentPageNum = 1;
            let currentPage = createPage(currentPageNum);
            let currentHeight = 0;
            const maxHeight = 860; // Max vertical content height before page break
            let worksCitedStarted = false;
            let processedHeader = false;
            let processedTitle = false;
            let worksCitedItems = [];

            $('body').append(currentPage);

            /** 
             * DATE LOGIC 
             * Converts "MM/DD/YYYY" or "DD/MM/YYYY" styles to "DD Mon. YYYY".
             */
            const getMonthName = (n) => ["", "Jan.", "Feb.", "Mar.", "Apr.", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."][parseInt(n)] || "";
            const dateRegex = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/;

            /** 
             * RENDERING ENGINE 
             * Measures element height in a hidden container to determine if it fits on the current page.
             */
            const renderElement = (element) => {
                let tempWrapper = $('<div style="width:6.5in;position:absolute;visibility:hidden;line-height:2.0"></div>')
                    .append(element.clone())
                    .appendTo('body');
                let elementHeight = tempWrapper.outerHeight(true);
                tempWrapper.remove();

                if (currentHeight + elementHeight > maxHeight) {
                    currentPageNum++;
                    currentPage = createPage(currentPageNum);
                    $('body').append(currentPage);
                    currentHeight = 0;
                }
                currentPage.append(element);
                currentHeight += elementHeight;
            };

            // Content processing loop
            $(elementsToProcess).each(function() {
                let $el = $(this);
                let text = $el.text().trim();

                if (text.length === 0 && !$el.is('img,table')) return;

                // Detect start of Works Cited
                if (text.toLowerCase().includes("works cited") && !worksCitedStarted) {
                    worksCitedStarted = true;
                    currentPageNum++;
                    currentPage = createPage(currentPageNum);
                    $('body').append(currentPage);
                    currentHeight = 0;
                    $el.addClass('centered-title no-indent');
                    renderElement($el);
                    return;
                }

                if (!worksCitedStarted) {
                    // Logic for first-page MLA header
                    if (!processedHeader) {
                        $el.addClass('no-indent');
                        let match = text.match(dateRegex);
                        if (match) {
                            // match[1] = Day, match[2] = Month, match[3] = Year
                            $el.text(match[1] + " " + getMonthName(match[2]) + " " + match[3]);
                            processedHeader = true;
                        }
                    } else if (!processedTitle) {
                        $el.addClass('centered-title no-indent');
                        processedTitle = true;
                    } else {
                        let html = $el.html();
                        if (html.includes('&nbsp;')) $el.html(html.replace(/&nbsp;/g, ' '));
                    }
                    renderElement($el);
                } else {
                    // Gather entries for alphabetical sorting
                    worksCitedItems.push($el.addClass('hanging-indent no-indent'));
                }
            });

            /** 
             * WORKS CITED ALPHABETICAL SORT 
             * Sorts entries and renders them to the final pages.
             */
            if (worksCitedItems.length > 0) {
                worksCitedItems.sort((a, b) => a.text().trim().localeCompare(b.text().trim()))
                    .forEach(item => renderElement(item));
            }

            // Reveal document
            $('body').css('visibility', 'visible');

            // Optional Favicon Animation
            loadScript(CONFIG.faviconUrl, () => {
                if (window.favicon || window.favico) {
                    (window.favicon || window.favico).animate(CONFIG.iconFrames, 1750);
                }
            });
        }, 600);
    };

    // Entry point: ensure jQuery is loaded
    window.jQuery ? initializeCleanMLAG() : loadScript(CONFIG.jqueryUrl, initializeCleanMLAG);
})();
