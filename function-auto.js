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

  // DOCUMENT DIMENSIONS (Standard logic preserved)
  const formatDimensions = {
    a0: [4967, 7022], a1: [3508, 4967], a2: [2480, 3508], a3: [1754, 2480], a4: [1240, 1754],
    a5: [874, 1240], a6: [620, 874], a7: [437, 620], a8: [307, 437], a9: [219, 307],
    a10: [154, 219], letter: [1276, 1648], legal: [1276, 2102], credit_card: [319, 508]
  };

  const dimensions = customDimensions || formatDimensions[format] || formatDimensions['a4'];
  const finalDimensions = dimensions.map((dimension) => Math.round(dimension / zoom));

  // CSS FOR THE "MODAL" LOOK
  const customCSS = `
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #ffffff;
      flex-direction: column;
      text-align: center;
    }

    /* The Content to Print - Hidden offscreen so it renders but isn't visible */
    #content-to-print {
      position: absolute;
      top: 0;
      left: -9999px;
      width: ${dimensions[0]}px; /* Enforce width for correct rendering */
    }

    /* Status Text */
    h2 { margin: 10px 0 5px; font-size: 18px; color: #333; }
    p { margin: 0; font-size: 14px; color: #666; }

    /* Spinner Animation */
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
      
      <!-- Visual Feedback for User -->
      <div id="loading-ui">
        <div class="spinner"></div>
        <h2 id="status-title">Generating PDF...</h2>
        <p id="status-desc">Please wait while we prepare your file.</p>
      </div>

      <div id="success-ui" style="display:none;">
        <div class="success-icon">✅</div>
        <h2>Download Started!</h2>
        <p>You can close this window now.</p>
      </div>

      <!-- The Actual Content (Hidden) -->
      <div id="content-to-print">
        ${html}
      </div>

      <script>
        window.onload = function() {
          // 1. Setup Options
          var element = document.getElementById('content-to-print');
          var opt = {
            pagebreak: { mode: ['css'], before: ${JSON.stringify(breakBefore)}, after: ${JSON.stringify(breakAfter)}, avoid: ${JSON.stringify(breakAvoid)} },
            margin: ${margin},
            filename: ${JSON.stringify(fileName)},
            html2canvas: { useCORS: true, scale: ${quality} },
            jsPDF: { unit: 'px', orientation: '${orientation}', format: [${finalDimensions}], hotfixes: ['px_scaling'] }
          };

          // 2. Generate and Save automatically
          html2pdf().set(opt).from(element).toPdf().get('pdf').then(function(pdf) {
            // 3. Update UI on Success
            pdf.save(${JSON.stringify(fileName)});
            
            document.getElementById('loading-ui').style.display = 'none';
            document.getElementById('success-ui').style.display = 'block';
            document.querySelector('.success-icon').style.display = 'block';
            
          }).catch(function(error) {
            document.getElementById('status-title').innerText = "Error";
            document.getElementById('status-desc').innerText = "Something went wrong generation the PDF.";
            console.error(error);
          });
        };
      </script>
    </body>
    </html>
  `;

  return "data:text/html;charset=utf-8," + encodeURIComponent(originalHTML);
};
