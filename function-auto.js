window.function = function (html, fileName, format, zoom, orientation, margin, breakBefore, breakAfter, breakAvoid, fidelity, customDimensions) {
  // 1. FIDELITY MAPPING
  const fidelityMap = {
    low: 1,
    standard: 1.5,
    high: 2,
  };

  // 2. HELPER: SMART UNIT CONVERSION (MM to PX @ 300 DPI)
  // Handles: "100mm" (mm), "100" (default = mm), "100px" (pixels)
  const toPixels = (input) => {
    if (!input) return 0;
    const clean = String(input).trim().toLowerCase();
    
    // If explicitly pixels (e.g. "400px"), return value directly
    if (clean.endsWith('px')) {
      return parseFloat(clean);
    }

    // If explicit mm, calculate 300dpi pixel value
    if (clean.endsWith('mm')) {
      const mm = parseFloat(clean);
      return Math.round((mm * 300) / 25.4);
    }
    
    // DEFAULT: If no unit is specified (e.g. "100"), ASSUME MILLIMETERS
    const val = parseFloat(clean);
    return Math.round((val * 300) / 25.4);
  };

  // 3. DYNAMIC VALUES
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

  // 4. PARSE CUSTOM DIMENSIONS (The Robust Way)
  // This allows the user to type: "100x40" (treated as mm), "100mm x 40mm", etc.
  const isCustomInput = !!customDimensions?.value;
  let parsedCustomDims = null;

  if (isCustomInput) {
    // Replace 'x' or 'X' with comma to normalize separators
    const cleanInput = customDimensions.value.replace(/[xX]/g, ',');
    // Split by comma and convert each value
    parsedCustomDims = cleanInput.split(",").map(val => toPixels(val));
    
    // Safety check: if we didn't get 2 numbers, reset to null
    if (parsedCustomDims.length < 2 || isNaN(parsedCustomDims[0]) || isNaN(parsedCustomDims[1])) {
       parsedCustomDims = null;
    }
  }

  // 5. BASE DIMENSIONS
  const formatDimensions = {
    a0: [4967, 7022], a1: [3508, 4967], a2: [2480, 3508], a3: [1754, 2480], a4: [1240, 1754],
    a5: [874, 1240], a6: [620, 874], a7: [437, 620], a8: [307, 437], a9: [219, 307],
    a10: [154, 219], letter: [1276, 1648], legal: [1276, 2102], credit_card: [319, 508]
  };

  let dimensions = parsedCustomDims || formatDimensions[format.toLowerCase()] || formatDimensions['a4'];

  // 6. ORIENTATION LOGIC
  // We ensure the dimensions match the requested orientation.
  // Landscape = [Long, Short], Portrait = [Short, Long]
  if (orientation.toLowerCase() === 'landscape') {
    if (dimensions[0] < dimensions[1]) dimensions = [dimensions[1], dimensions[0]];
  } else {
    // Portrait
    if (dimensions[0] > dimensions[1]) dimensions = [dimensions[1], dimensions[0]];
  }

  // 7. PDF PAGE SIZE BUFFER (+2px for safety)
  const finalDimensions = dimensions.map((dimension) => Math.round(dimension / zoom) + 2);

  // 8. STRICT MODE LOGIC (Auto-detected)
  // If we parsed custom dimensions successfully, we assume "Label Mode" (Strict)
  const isLabelMode = !!parsedCustomDims;

  const heightRule = isLabelMode 
    ? `height: ${dimensions[1]}px; overflow: hidden;` 
    : `min-height: ${dimensions[1]}px; overflow: visible;`;

  const canvasHeightOption = isLabelMode ? `, height: ${dimensions[1]}` : '';

  // 9. CSS STYLES
  const customCSS = `
    * { box-sizing: border-box; }
    ::-webkit-scrollbar { width: 0px; height: 0px; display: none; }
    
    body {
      margin: 0; padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #f0f0f0; 
      overflow: hidden; 
      scrollbar-width: none;
    }

    #status-bar {
      position: fixed; top: 0; left: 0; width: 100%;
      background: #333; color: white; text-align: center;
      padding: 8px; font-size: 14px; z-index: 100;
    }

    #preview-container {
      display: flex; justify-content: center;
      padding-top: 60px; padding-bottom: 40px;
      width: 100%;
    }

    /* SMART CONTENT STYLING */
    #content-to-print {
      width: ${dimensions[0]}px;
      ${heightRule}
      background-color: #ffffff;
      margin: 0; padding: 0;
      box-shadow: none; 
    }

    #success-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: #ffffff; z-index: 9999; display: none;
      flex-direction: column; justify-content: center; align-items: center; text-align: center;
    }
    h2 { margin: 10px 0 5px; font-size: 20px; color: #333; }
    p { margin: 0; font-size: 14px; color: #666; }
    .success-icon { font-size: 50px; margin-bottom: 20px; }
  `;

  // 10. HTML STRUCTURE
  const originalHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.2/html2pdf.bundle.min.js"></script>
      <style>${customCSS}</style>
    </head>
    <body>
      <div id="status-bar">Generating PDF...</div>
      <div id="preview-container">
        <div id="content-to-print">${html}</div>
      </div>
      <div id="success-overlay">
        <div class="success-icon">✅</div>
        <h2>Download Started!</h2>
        <p>You can close this window now.</p>
      </div>

      <script>
        window.onload = function() {
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
                    windowWidth: ${dimensions[0]} + 100,
                    width: ${dimensions[0]}
                    ${canvasHeightOption}
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
                document.getElementById('success-overlay').style.display = 'flex';
                document.getElementById('status-bar').style.display = 'none';
            }).catch(function(error) {
                console.error(error);
                document.getElementById('status-bar').innerText = "Error";
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
