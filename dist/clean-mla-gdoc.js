/*
 * clean-mla-gdoc.js v1.1.0
 * Copyright (c) 2026 Musicalisk <Musicalisk.travail@tuta.io>
 * Licensed under the GNU General Public License v3.0
 * Full license text: https://www.gnu.org
 */

(function() {
    // Configuration for external dependencies and the Google Docs CSS signature
    const L = {
        jqueryUrl: "https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js",
        faviconUrl: "https://cdn.jsdelivr.net/npm/favicon.js@1.0.0/dist/favicon.min.js",
        iconFrames: [
            'https://img.icons8.com/?size=16&id=1395&format=png&color=FA5252',
            'https://img.icons8.com/?size=16&id=1395&format=png&color=20C997',
            'https://img.icons8.com/?size=16&id=1395&format=png&color=339AF0'
        ],
        signatureCSS: "padding-top:0pt;text-indent:36pt;padding-bottom:0pt;line-height:2.0;orphans:2;widows:2;text-align:right"
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
             * HEADER DETECTION VIA CSS SIGNATURE 
             */
            let dH = '';
            const targetSigClean = L.signatureCSS.replace(/\s+/g, '');

            $('style').each(function() {
                const cssText = $(this).text().replace(/\s+/g, '');
                // Find the class (e.g. .c5) matching the orphans/widows/text-align:right signature
                const match = cssText.match(new RegExp(`\\.([^\\{]+)\\{[^\\}]*${targetSigClean.replace(/;/g, '[^\\}]*;')}`));
                if (match && match[1]) {
                    dH = match[1];
                    return false; 
                }
            });

            // Use detected class or fallback to .c1
            const sel = dH ? `.${dH}` : '.c1';
            const h = $(sel).first(), ht = h.text().trim();
            const isD = /\|\s*draft/i.test(ht);
            const an = String(ht.replace(/\|\s*draft.*/i, '').trim() || "Assignment");

            // Extract Name and metadata (exclude the detected header paragraph)
            let pgs = $('p').filter(function() {
                return $(this).text().trim().length > 0 && !$(this).hasClass(dH);
            });

            let sLine = pgs.first().text().trim(), 
                nParts = sLine.split(' '), 
                fName = String(nParts[0] || "First"), 
                lName = String(nParts[nParts.length - 1] || "Last");

            document.title = lName + " " + fName + " " + an;

            // Cleanup raw header elements
            $(sel).remove();
            $('*').filter(function() {
                return ($(this).css('text-align') === 'right' || $(this).css('position') === 'absolute') && $(this).text().includes(lName);
            }).remove();

            let e = $('.doc-content > *,.c7 > *,body > *').not('script,style,.mla-page-container').get();
            $('body').children().not('script,style').remove();

            const pMaker = (v) => {
                let g = $('<div class="mla-page-container"></div>');
                if (isD) g.addClass('watermark');
                g.append(`<div class="header-wrapper">${lName} ${v}</div>`);
                return g
            };

            let c = 1, u = pMaker(c), y = 0, x = 860, z = false, ph = false, pt = false, ci = [];
            $('body').append(u);

            const gm = (n) => ["", "Jan.", "Feb.", "Mar.", "Apr.", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."][parseInt(n)] || "",
                dr = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/,
                re = (o) => {
                    let k = $('<div style="width:6.5in;position:absolute;visibility:hidden;line-height:2.0"></div>').append(o.clone()).appendTo('body'),
                        q = k.outerHeight(true);
                    k.remove();
                    if (y + q > x) {
                        c++; u = pMaker(c); $('body').append(u); y = 0
                    }
                    u.append(o); y += q
                };

            $(e).each(function() {
                let o = $(this), v = o.text().trim();
                if (v.length === 0 && !o.is('img,table')) return;
                
                if (v.toLowerCase().includes("works cited") && !z) {
                    z = true; c++; u = pMaker(c); $('body').append(u); y = 0;
                    o.addClass('centered-title no-indent'); re(o); return
                }

                if (!z) {
                    if (!ph) {
                        let m = v.match(dr);
                        if (m) { o.text(m[1] + " " + gm(m[2]) + " " + m[3]); ph = true }
                        o.addClass('no-indent')
                    } else if (!pt) {
                        o.addClass('centered-title no-indent'); pt = true
                    } else {
                        let h = o.html();
                        if (h.includes('&nbsp;')) o.html(h.replace(/&nbsp;/g, ' '))
                    }
                    re(o)
                } else {
                    ci.push(o.addClass('hanging-indent no-indent'))
                }
            });

            if (ci.length > 0) {
                ci.sort((a, b) => a.text().trim().localeCompare(b.text().trim())).forEach(i => re(i))
            }

            $('body').css('visibility', 'visible');
            
            // Execute Favicon animation
            loadScript(L.faviconUrl, () => {
                if (window.favicon || window.favico) (window.favicon || window.favico).animate(L.iconFrames, 1750);
            });
        }, 600);
    };

    // Entry point
    window.jQuery ? initializeCleanMLAG() : loadScript(L.jqueryUrl, initializeCleanMLAG);
})();
