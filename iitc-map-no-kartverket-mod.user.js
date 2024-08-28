// ==UserScript==
// @id           iitc-map-no-kartverket-mod
// @name         IITC Plugin: Kartverket Norway maps (modified)
// @namespace    https://github.com/dstien/userscripts
// @downloadURL  https://github.com/dstien/userscripts/raw/main/iitc-map-no-kartverket-mod.user.js
// @updateURL    https://github.com/dstien/userscripts/raw/main/iitc-map-no-kartverket-mod.user.js
// @category     Map tiles
// @version      0.0.1.20240816
// @author       Daniel Stien <daniel@stien.org>
// @description  Map tiles from Kartverket, the Norwegian Mapping Authority. Based on mainline IITC plugin with some QoL improvements.
// @match        *://intel.ingress.com/*
// @grant        none
// @icon         data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M79 0H21c-3 0-5 2-5 5v36c4-4 10-8 20-6 9 2 11 9 25 17 9 5 17 1 23-3V5c0-3-2-5-5-5Z' fill='%231a833b'/%3E%3Cpath d='m66 68-8-3c-5-3-9-8-19-13-8-4-16-1-23 3v40c0 3 2 5 5 5h58c3 0 5-2 5-5V62c-6 4-12 7-18 6z' fill='%231a589f'/%3E%3Cpath d='M61 52c-14-8-16-15-25-17-10-2-16 2-20 6v14c7-4 15-7 23-3 10 5 14 10 19 13l8 3c6 1 12-2 18-6V49c-6 4-14 8-23 3z' fill='%23fff'/%3E%3C/svg%3E
// ==/UserScript==

// Wrapper function that will be stringified and injected
// into the document. Because of this, normal closure rules
// do not apply here.
function wrapper(plugin_info) {
    // Make sure that window.plugin exists. IITC defines it as a no-op function,
    // and other plugins assume the same.
    if(typeof window.plugin !== 'function') window.plugin = function() {};
  
    // The entry point for this plugin.
    function setup() {
      L.TileLayer.Kartverket = L.TileLayer.extend({
  
        baseUrl: 'https://cache{s}.kartverket.no/v1/wmts/1.0.0/{layer}/default/webmercator/{z}/{y}/{x}.png',
        baseUrlLegacy: 'https://opencache{s}.statkart.no/gatekeeper/gk/gk.open_gmaps?layers={layer}&zoom={z}&x={x}&y={y}',
  
        options: {
          maxZoom: 21,
          maxNativeZoom: 18,
          attribution: '© <a href="https://kartverket.no">Kartverket</a>',
          subdomains: ['', '2', '3']
        },
  
        layers: {
          topo:             'Topographic',
          topograatone:     'Topographic Grayscale',
          toporaster:       'Topographic Raster',
  
          fjellskygge:      'Relief Shading',
          sjokartraster:    'Nautical Chart Raster',
          europa_forenklet: 'Europe Simplified',
        },
  
        isLegacy: {
          topo:             false,
          topograatone:     false,
          toporaster:       false,
  
          fjellskygge:      true,
          sjokartraster:    true,
          europa_forenklet: true,
        },
  
        initialize: function (layer, options) {
          let baseUrl = this.isLegacy[layer] ? this.baseUrlLegacy : this.baseUrl;
  
          L.TileLayer.prototype.initialize.call(this, baseUrl, options);
          this.options.layer = layer;
          this._name = 'Kartverket ' + (this.layers[layer] || layer);
        }
  
      });
  
      L.tileLayer.kartverket = function (layer, options) {
        return new L.TileLayer.Kartverket(layer, options);
      };
  
      L.tileLayer.kartverket.getLayers = function () {
        return L.extend({},L.TileLayer.Kartverket.prototype.layers);
      };
  
      var l, layer;
      for (layer in L.tileLayer.kartverket.getLayers()) {
        l = L.tileLayer.kartverket(layer);
        layerChooser.addBaseLayer(l, l._name);
      }
  
      console.log('Plugin ' + setup.info.script.name + ' (' + setup.info.pluginId + '-' + setup.info.script.version + ') loaded');
    }
  
    // Add an info property for IITC's plugin system
    setup.info = plugin_info;
  
    // Make sure window.bootPlugins exists and is an array
    if (!window.bootPlugins) window.bootPlugins = [];
    // Add our startup hook
    window.bootPlugins.push(setup);
    // If IITC has already booted, immediately run the 'setup' function
    if (window.iitcLoaded && typeof setup === 'function') setup();
  }
  
  // Create a script element to hold our content script
  var script = document.createElement('script');
  var info = {};
  
  // GM_info is defined by the assorted monkey-themed browser extensions
  // and holds information parsed from the script header.
  if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) {
    info = {
      buildName: GM_info.script.id,
      pluginId: GM_info.script.id,
      dateTimeVersion: GM_info.script.version.split('.').pop() + '000000',
      script: {
        version: GM_info.script.version.substring(0, GM_info.script.version.lastIndexOf('.')),
        name: GM_info.script.name,
        description: GM_info.script.description,
      },
      changelog: [
        {
          version: '0.0.1',
          changes: [
            'Based on mainline plugin basemap-kartverket-0.2.3.',
            'Topographic map tiles from new cache server.',
            'Nautical chart from deprecated cache server.',
            'Removed remaining deprecated maps.',
            'Allow zoom beyond tile limit.',
            'Common map name prefix for proper sorting in layer list.',
          ],
        },
      ],
    };
  }
  
  // Create a text node and our IIFE inside of it
  var textContent = document.createTextNode('('+ wrapper +')('+ JSON.stringify(info) +')');
  // Add some content to the script element
  script.appendChild(textContent);
  // Finally, inject it... wherever.
  (document.body || document.head || document.documentElement).appendChild(script);
  