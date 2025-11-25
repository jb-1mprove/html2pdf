window.function = function (html, fileName, format, zoom, orientation, margin, breakBefore, breakAfter, breakAvoid, fidelity, customDimensions) {
  // FIDELITY MAPPING
  const fidelityMap = {
    low: 1,
    standard: 1.5,
    high: 2,
  };

  // DYNAMIC VALUES
  html = html.value ?? "No HTML set.";
  fileName = fileName.value ?? "download";
  format = format.value ?? "a4";
  zoom = zoom.value ?? "1";
  orientation = orientation.value ?? "portrait";
  margin = margin.value ?? "0";
  breakBefore = breakBefore.value ? breakBefore.value.split(",") : [];
  breakAfter = breakAfter.value ? breakAfter.value.split(",") : [];
  breakAvoid = breakAvoid.value ? breakAvoid.value.split(",") : [];
  quality = fidelityMap[fidelity.value] ?? 1.5;
  customDimensions = customDimensions.value ? customDimensions.value.split(",").map(Number) : null;

  // DOCUMENT DIMENSIONS
  const formatDimensions = {
    a0: [4967, 7022], a1: [3508, 4967], a2: [2480, 3508], a3: [1754, 2480], a4: [1240, 1754],
    a5: [874, 1240], a6: [620, 874], a7: [437, 620], a8: [307, 437], a9: [219, 307],
    a10: [154, 219], letter: [1276, 1648], legal: [1276, 2102], credit_card: [319, 508]
  };

  const dimensions = customDimensions || formatDimensions[format] || formatDimensions['a4'];
  const finalDimensions = dimensions.map((dimension) => Math.round(dimension / zoom));

  // CSS STYLES
  const customCSS = `
    body {
      margin: 0;
      padding: 0;
      font-family: sans-serif;
    }

    /* FIX: instead of left: -9999px, we put it at top:0 left:0 
       but give it z-index: -1 so it sits BEHIND the loader.
       We also enforce a white background so it's opaque.
    */
    #content-to-print {
      position: absolute;
      top: 0;
      left: 0;
      width: ${dimensions[0]}px; /* Enforce exact width */
      z-index: -1;
      background-color: #ffffff;
    }

    /* The Loading Overlay covers the entire screen */
    #loading-ui {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: #ffffff;
      z-index: 999; /* Sit on top of the content */
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
    }

    h2 { margin: 10px 0 5px; font-size: 18px; color: #333; }
    p { margin: 0; font-size: 14px; color: #666; }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 15px;
    }
    
    .success-icon {
      font-size: 40px;
      display: none;
      margin-bottom: 15px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  // HTML STRUCTURE
  const originalHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.2/html2pdf.bundle.min.js"></script>
      <style>${customCSS}</style>
    </head>
    <body>
      
      <!-- 1. The Cover Screen (User sees this) -->
      <div id="loading-ui">
        <div class="spinner"></div>
        <h2 id="status-title">Generating PDF...</h2>
        <p id="status-desc">Please wait while we prepare your file.</p>
        
        <!-- Success message hidden by default -->
        <div id="success-ui" style="display:none;">
          <div class="success-icon">✅</div>
          <h2>Download Started!</h2>
          <p>You can close this window now.</p>
        </div>
      </div>

      <!-- 2. The Content (Hidden behind the cover, but visible to PDF generator) -->
      <div id="content-to-print">
        ${html}
      </div>

      <script>
        window.onload = function() {
          // Small delay to ensure styles render before we capture
          setTimeout(function() {
              
            var element = document.getElementById('content-to-print');
            var opt = {
                pagebreak: { mode: ['css'], before: ${JSON.stringify(breakBefore)}, after: ${JSON.stringify(breakAfter)}, avoid: ${JSON.stringify(breakAvoid)} },
                margin: ${margin},
                filename: ${JSON.stringify(fileName)},
                html2canvas: { 
                    useCORS: true, 
                    scale: ${quality},
                    scrollY: 0,
                    scrollX: 0
                },
                jsPDF: { 
                    unit: 'px', 
                    orientation: '${orientation}', 
                    format: [${finalDimensions}], 
                    hotfixes: ['px_scaling'] 
                }
            };
    
            html2pdf().set(opt).from(element).toPdf().get('pdf').then(function(pdf) {
                pdf.save(${JSON.stringify(fileName)});
                
                // Hide spinner, show success
                document.querySelector('.spinner').style.display = 'none';
                document.getElementById('status-title').style.display = 'none';
                document.getElementById('status-desc').style.display = 'none';
                
                document.getElementById('success-ui').style.display = 'block';
                document.querySelector('.success-icon').style.display = 'block';
                
            }).catch(function(error) {
                console.error(error);
                document.getElementById('status-title').innerText = "Error";
                document.getElementById('status-desc').innerText = "Could not generate PDF.";
            });

          }, 500); // 500ms delay to prevent blank pages
        };
      </script>
    </body>
    </html>
  `;

  return "data:text/html;charset=utf-8," + encodeURIComponent(originalHTML);
};
