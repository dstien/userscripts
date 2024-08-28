// ==UserScript==
// @id           ingress-mission-ext
// @name         Ingress Mission Authoring Tool extensions
// @namespace    https://github.com/dstien/userscripts
// @downloadURL  https://github.com/dstien/userscripts/raw/main/ingress-mission-ext.user.js
// @updateURL    https://github.com/dstien/userscripts/raw/main/ingress-mission-ext.user.js
// @version      0.3
// @author       Daniel Stien <daniel@stien.org>
// @description  Add Intel and scanner links to portals in the Ingress Mission Authoring Tool
// @match        *://missions.ingress.com/*
// @grant        none
// @icon         data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Crect fill='%231b3c39' width='100' height='100'/%3E%3Cpath style='fill:%23148f8f;fill-opacity:.5;stroke:%2330fff4;stroke-width:3;stroke-linejoin:round' d='m50 22-8 38-17-16 10 25-11 1 15 8h11v0h11l15-8-11-1 10-25-17 16-8-38Z'/%3E%3C/svg%3E
// ==/UserScript==

const MissionToolExtensions = (function() {

    function log(...args) {
      console.log(`${GM_info.script.id}:`, ...args);
    }
  
    function injectPortalDetails() {
      const poiBody = document.querySelector('div.poi-body');
      if (!poiBody) {
        log('POI body not found');
        return;
      }
  
      const angularElement = angular.element(poiBody);
      if (!angularElement) {
        log('Angular element not found');
        return;
      }
  
      const scope = angularElement.scope();
      if (!scope) {
        log('Angular scope not found');
        return;
      }
  
      const poi = scope.selectedPOI;
      if (!poi || poi.type !== "PORTAL") {
        log('Selected POI is not a portal.');
        return;
      }
  
      // Check if extension data has already been injected for this portal
      // in order to avoid an infinite mutation loop.
      const ext = document.querySelector('#imat-ext');
      if (ext) {
        if (ext.dataset.portalGuid == poi.guid) {
          log('Details already injected for', poi.guid);
          return;
        }
        // Remove previous portal's details.
        ext.remove();
      }
  
      // Append portal details and links to portal preview pane.
      poiBody.insertAdjacentHTML('beforeend',`
        <div id="imat-ext" data-portal-guid="${poi.guid}">
          <div style="padding-top: 1em; font-size: x-small;">
            GUID: <tt>${poi.guid}</tt><br>
            Coordinates: ${poi.location.latitude},${poi.location.longitude}
          </div>
          <div style="padding-top: 1em; text-align: center;">
            <a href="https://intel.ingress.com/?pll=${poi.location.latitude},${poi.location.longitude}" class="button smaller" style="margin-right: 0.5em" target="intel">Intel</a>
            <a href="https://link.ingress.com/?link=https%3A%2F%2Fintel.ingress.com%2Fportal%2F${poi.guid}&apn=com.nianticproject.ingress&isi=576505181&ibi=com.google.ingress&ifl=https%3A%2F%2Fapps.apple.com%2Fapp%2Fingress%2Fid576505181&ofl=https%3A%2F%2Fintel.ingress.com%2Fintel%3Fpll%3D${poi.location.latitude}%2C${poi.location.longitude}" class="button smaller">Scanner</a>
          </div>
        </div>
      `);
  
      log('Details injected for', poi.guid);
    }
  
    // Observe for mutations affecting the portal details panel.
    function setupObserver() {
      log('Setting up observer');
  
      // The Mission Authoring Tool is an Angular application that removes and adds nodes.
      // Since every portal has a unique photo, detecting image URL changes appears to be
      // a robust way of determining whether a new portal has been selected for preview.
      const observer = new MutationObserver((mutations) => {
        for (let mutation of mutations) {
          if (mutation.target.matches('img.poi-photo')) {
            injectPortalDetails();
            return;
          }
        }
      });
  
      // Start observing the document body for changes. We can't narrow down to a specific
      // container element because the preview panes are removed and re-added rather than
      // being modified.
      observer.observe(document.body, {
        subtree: true,
        attributeFilter: ['src'],
      });
  
      // Run the injection once in case the portal details are already visible.
      injectPortalDetails();
    }
  
    // Public init method.
    return {
      init: function() {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', setupObserver);
        } else {
          setupObserver();
        }
      }
    };
  })();
  
  // Launch this user script.
  MissionToolExtensions.init();
  