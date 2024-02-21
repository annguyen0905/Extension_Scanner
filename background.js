// background.js

chrome.runtime.onInstalled.addListener(function() {
    console.log("Extension ID Reader installed!");
  });
  
  let port;
  
  // Event listener for messages from the popup
  chrome.runtime.onConnect.addListener(function(p) {
    console.assert(p.name === "popup");
  
    port = p;
  
    port.onDisconnect.addListener(function() {
      console.log("Port disconnected");
      port = null;
    });
  
    port.onMessage.addListener(function(request) {
      if (request.action === "scanExtensions") {
        console.log("Starting new scan...");
  
        chrome.management.getAll(function(extensions) {
          console.log('Got extensions:', extensions);
          const installedExtensionIds = extensions.map(extension => extension.id);
  
          // Fetch the GitHub list
          fetch('https://raw.githubusercontent.com/palant/malicious-extensions-list/main/list.txt')
            .then(response => response.text())
            .then(githubExtensionIds => {
              console.log('Got GitHub list:', githubExtensionIds);
              const commonIds = installedExtensionIds.filter(id => githubExtensionIds.includes(id));
  
              // Notify the popup with the result
              port.postMessage({ action: "updatePopup", result: { action: commonIds.length > 0 ? "showAlert" : "showSafe", commonIds } });
            })
            .catch(error => {
              console.error('Error fetching GitHub list:', error);
              // Notify the popup with the result (treat as safe in case of an error)
              port.postMessage({ action: "updatePopup", result: { action: "showSafe" } });
            });
        });
      }
    });
  });
  