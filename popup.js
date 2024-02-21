// popup.js

document.addEventListener('DOMContentLoaded', function() {
  var scanButton = document.getElementById('scanButton');
  var warningMessage = document.getElementById('warningMessage');

  // Establish a connection to the background script
  var port = chrome.runtime.connect({ name: "popup" });

  // Event listener for updates from the background script
  port.onMessage.addListener(function(response) {
    console.log('Received update from background:', response);

    if (response.action === "updatePopup") {
      const result = response.result;

      if (result.action === "showAlert" && result.commonIds) {
        if (result.commonIds.length > 0) {
          const message = `Warning! The following extension IDs match with the malicious list:`;
          updateUI('complete', message, result.commonIds);
        } else {
          // If no common IDs, show a friendly message
          updateUI('complete', "Great news! Your installed extensions are all safe.", []);
        }
      } else if (result.action === "showSafe") {
        // Clear the warning message
        updateUI('complete', 'Scan complete. Your installed extensions are all safe.', []);
      }
    }
  });

  // Event listener for the Scan button
  scanButton.addEventListener('click', function() {
    // Notify the background script to initiate the scan
    port.postMessage({ action: "scanExtensions" });
  });

  // Function to update UI based on scan status
  function updateUI(status, message, matchedIds) {
    console.log('Update UI:', status, message);
    if (status === 'scanning') {
      // Disable the button to prevent multiple clicks during the scan
      scanButton.disabled = true;
      // Hide any existing warning message
      warningMessage.style.display = 'none';
    } else if (status === 'complete') {
      // Enable the button after the scan is done
      scanButton.disabled = false;
      // Display the warning message if provided
      if (message) {
        // Add a line break after the introductory message
        const formattedMessage = message + (matchedIds.length > 0 ? '\n' : '');

        // Split the extension IDs for better formatting
        const formattedIds = matchedIds.map(id => `- ${id}`).join('\n');
        warningMessage.innerHTML = `${formattedMessage}\n${formattedIds}`;

        // Highlight matched extension IDs
        if (matchedIds.length > 0) {
          matchedIds.forEach(matchedId => {
            const regex = new RegExp(matchedId, 'g');
            warningMessage.innerHTML = warningMessage.innerHTML.replace(regex, `<span style="color: red; font-weight: bold;">${matchedId}</span>`);
          });
        }

        warningMessage.style.display = 'block';
      } else {
        // Clear the warning message if no warning
        warningMessage.textContent = '';
        warningMessage.style.display = 'none';
      }
    }
  }
});
