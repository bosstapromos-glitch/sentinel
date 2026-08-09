(function exposeSentinelGlobeAdapter() {
  "use strict";

  function assertCoordinate(value, minimum, maximum, label) {
    var numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < minimum || numeric > maximum) {
      throw new RangeError(label + " must be between " + minimum + " and " + maximum);
    }
    return numeric;
  }

  function eventSnapshot(event) {
    if (!event || !event.v2) return null;
    return {
      id: event.v2.id,
      title: event.v2.title,
      category: event.v2.category,
      severity: event.v2.severity,
      status: event.v2.status,
      verificationStatus: event.v2.verificationStatus,
      confidenceScore: event.v2.confidence.score,
      latitude: event.lat,
      longitude: event.lon,
    };
  }

  function subscribe(eventName, handler) {
    if (typeof handler !== "function") throw new TypeError("Subscription handler must be a function");
    window.addEventListener(eventName, handler);
    return function unsubscribe() { window.removeEventListener(eventName, handler); };
  }

  window.SentinelGlobe = Object.freeze({
    flyToCoordinates: function (latitude, longitude, zoom) {
      var lat = assertCoordinate(latitude, -90, 90, "Latitude");
      var lon = assertCoordinate(longitude, -180, 180, "Longitude");
      var distance = zoom == null ? 2.2 : Math.max(1.8, Math.min(6, Number(zoom)));
      flyTo(lat, lon, distance);
    },

    selectIncident: function (incidentId) {
      if (typeof incidentId !== "string" || !incidentId) return false;
      var exists = allEvents.some(function (event) { return event.id === incidentId; });
      if (!exists) return false;
      selectIncident(incidentId);
      return true;
    },

    setOperationalFilter: function (filter) {
      var button = document.querySelector('[data-filter="' + CSS.escape(String(filter)) + '"]');
      if (!button) return false;
      setFilter(String(filter));
      return true;
    },

    setTimeframeHours: function (hours) {
      var button = document.querySelector('[data-hours="' + Number(hours) + '"]');
      if (!button) return false;
      button.click();
      return true;
    },

    refreshClusters: function () {
      if (window.SentinelGlobeClustering) window.SentinelGlobeClustering.refresh();
    },

    getState: function () {
      var activeTimeframe = document.querySelector(".time-option.active[data-hours]");
      return {
        dataMode: "SIMULATED",
        filter: currentFilter,
        timeframeHours: activeTimeframe ? Number(activeTimeframe.dataset.hours) : null,
        cameraDistance: currentZoom,
        selectedIncident: eventSnapshot(selectedEvent),
        visibleIncidents: allEvents.filter(passesFilter).map(eventSnapshot),
        clustering: window.SentinelGlobeClustering ? window.SentinelGlobeClustering.getState() : null,
      };
    },

    onIncidentSelected: function (handler) {
      return subscribe("sentinel:incident-selected", handler);
    },

    onClustersUpdated: function (handler) {
      return subscribe("sentinel:clusters-updated", handler);
    },
  });

  if (window.parent && window.parent !== window) {
    try {
      window.parent.SentinelGlobe = window.SentinelGlobe;
      window.parent.SentinelGlobeClustering = window.SentinelGlobeClustering;
    } catch {
      // Cross-origin hosts must use postMessage; the current Next.js host is same-origin.
    }
  }

  window.dispatchEvent(new CustomEvent("sentinel:globe-ready"));
})();
