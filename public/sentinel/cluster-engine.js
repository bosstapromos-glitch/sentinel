(function exposeClusterEngine(root, factory) {
  var engine = factory();
  if (typeof module === "object" && module.exports) module.exports = engine;
  root.SentinelClusterEngine = engine;
})(typeof globalThis !== "undefined" ? globalThis : this, function createClusterEngine() {
  "use strict";

  var severityRank = { LOW: 1, MODERATE: 2, HIGH: 3, CRITICAL: 4 };

  function normalizeLongitude(longitude) {
    return ((Number(longitude) + 180) % 360 + 360) % 360 - 180;
  }

  function gridSizeForDistance(cameraDistance) {
    if (cameraDistance <= 2.25) return 0;
    if (cameraDistance <= 2.7) return 8;
    if (cameraDistance <= 3.25) return 20;
    if (cameraDistance <= 4.2) return 28;
    return 40;
  }

  function averageLongitude(events) {
    var sumSin = 0;
    var sumCos = 0;
    events.forEach(function (event) {
      var radians = normalizeLongitude(event.lon) * Math.PI / 180;
      sumSin += Math.sin(radians);
      sumCos += Math.cos(radians);
    });
    return normalizeLongitude(Math.atan2(sumSin, sumCos) * 180 / Math.PI);
  }

  function highestSeverity(events) {
    return events.reduce(function (highest, event) {
      var severity = event.v2 && event.v2.severity || "LOW";
      return (severityRank[severity] || 0) > (severityRank[highest] || 0) ? severity : highest;
    }, "LOW");
  }

  function clusterEvents(events, cameraDistance) {
    var gridSize = gridSizeForDistance(cameraDistance);
    if (!gridSize) {
      return {
        gridSize: 0,
        clusters: [],
        singles: events.slice(),
      };
    }

    var cells = new Map();
    events.forEach(function (event) {
      var latitude = Math.max(-90, Math.min(90, Number(event.lat)));
      var longitude = normalizeLongitude(event.lon);
      var latCell = Math.floor((latitude + 90) / gridSize);
      var lonCell = Math.floor((longitude + 180) / gridSize);
      var key = latCell + ":" + lonCell;
      if (!cells.has(key)) cells.set(key, []);
      cells.get(key).push(event);
    });

    var clusters = [];
    var singles = [];
    cells.forEach(function (members, key) {
      if (members.length < 2) {
        singles.push(members[0]);
        return;
      }
      var latitude = members.reduce(function (total, event) { return total + Number(event.lat); }, 0) / members.length;
      clusters.push({
        id: "cluster-" + key,
        latitude: latitude,
        longitude: averageLongitude(members),
        count: members.length,
        severity: highestSeverity(members),
        members: members.slice().sort(function (a, b) {
          return new Date(b.time).getTime() - new Date(a.time).getTime();
        }),
      });
    });

    return {
      gridSize: gridSize,
      clusters: clusters,
      singles: singles,
    };
  }

  return {
    clusterEvents: clusterEvents,
    gridSizeForDistance: gridSizeForDistance,
    normalizeLongitude: normalizeLongitude,
  };
});
