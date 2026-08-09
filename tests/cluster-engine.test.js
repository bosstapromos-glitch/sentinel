const test = require("node:test");
const assert = require("node:assert/strict");
const {
  clusterEvents,
  gridSizeForDistance,
  normalizeLongitude,
} = require("../public/sentinel/cluster-engine.js");

function event(id, lat, lon, severity = "MODERATE") {
  return {
    id,
    lat,
    lon,
    time: "2026-08-09T22:00:00.000Z",
    v2: { severity },
  };
}

test("disables clustering at incident-level zoom", () => {
  const events = [event("a", 51.95, 4.14), event("b", 52.49, 13.4)];
  const result = clusterEvents(events, 2.1);

  assert.equal(gridSizeForDistance(2.1), 0);
  assert.equal(result.clusters.length, 0);
  assert.deepEqual(result.singles, events);
});

test("clusters nearby incidents at global zoom", () => {
  const result = clusterEvents([
    event("rotterdam", 51.95, 4.14, "CRITICAL"),
    event("berlin", 52.49, 13.4, "HIGH"),
    event("singapore", 1.29, 103.85, "MODERATE"),
  ], 3.2);

  assert.equal(result.clusters.length, 1);
  assert.equal(result.clusters[0].count, 2);
  assert.equal(result.clusters[0].severity, "CRITICAL");
  assert.deepEqual(result.clusters[0].members.map((member) => member.id).sort(), ["berlin", "rotterdam"]);
  assert.equal(result.singles[0].id, "singapore");
});

test("averages longitudes correctly across the date line", () => {
  const result = clusterEvents([
    event("east", 5, 179),
    event("west", 5, -179),
  ], 5);

  assert.equal(result.clusters.length, 0, "grid cells intentionally remain separate across the wrapped boundary");
  assert.equal(normalizeLongitude(181), -179);
  assert.equal(normalizeLongitude(-181), 179);
});
