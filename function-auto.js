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
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #f0f0f0; /* Light gray background for contrast */
    }

    /* STATUS BAR: Small notification at the top so user knows it's working.
       It is outside #content-to-print, so it won't be in the PDF.
    */
    #status-bar {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      background: #333;
      color: white;
      text-align: center;
      padding: 8px;
      font-size: 14px;
      z-index: 100;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    /* CONTENT: Visible and centered.
       This ensures the PDF engine can capture it perfectly.
    */
    #content-to-print {
      width: ${dimensions[0]}px;
      background-color: #ffffff;
      margin: 40px auto; /* Center it and give space for status bar */
      box-shadow: 0 4px 15px rgba(0,0,0,0.1); /* Drop shadow to look like a paper */
    }

    /* SUCCESS OVERLAY: Hidden initially.
       Appears ONLY after the download starts.
    */
    #success-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: #ffffff;
      z-index: 9999;
      display: none; /* Hidden by default */
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
    }

    h2 { margin: 10px 0 5px; font-size: 20px; color: #333; }
    p { margin: 0; font-size: 14px; color: #666; }
    
    .success-icon {
      font-size: 50px;
      margin-bottom: 20px;
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
      
      <!-- 1. Small Status Bar (User sees this briefly) -->
      <div id="status-bar">Generating PDF...</div>

      <!-- 2. The Content (Visible on screen so it captures correctly) -->
      <div id="content-to-print">
        ${html}
      </div>

      <!-- 3. Success Overlay (Appears at the end) -->
      <div id="success-overlay">
        <div class="success-icon">✓</div>
        <h2>Download gestart!</h2>
        <p>Je kunt dit venster nu sluiten.</p>
      </div>

      <script>
        window.onload = function() {
          // Wait 800ms to let images/fonts render on screen
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
                    windowWidth: ${dimensions[0]} + 100, // Ensure capture width
                    width: ${dimensions[0]}
                },
                jsPDF: { 
                    unit: 'px', 
                    orientation: '${orientation}', 
                    format: [${finalDimensions}], 
                    hotfixes: ['px_scaling'] 
                }
            };
    
            // Generate PDF
            html2pdf().set(opt).from(element).toPdf().get('pdf').then(function(pdf) {
                // Save File
                pdf.save(${JSON.stringify(fileName)});
                
                // Show Success Overlay
                document.getElementById('success-overlay').style.display = 'flex';
                // Hide status bar
                document.getElementById('status-bar').style.display = 'none';
                
            }).catch(function(error) {
                console.error(error);
                document.getElementById('status-bar').innerText = "Error generating PDF";
                document.getElementById('status-bar').style.backgroundColor = "red";
            });

          }, 800); 
        };
      </script>
    </body>
    </html>
  `;

  return "data:text/html;charset=utf-8," + encodeURIComponent(originalHTML);
};
