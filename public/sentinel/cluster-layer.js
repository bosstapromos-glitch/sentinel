(function initializeSentinelClusterLayer() {
  "use strict";

  if (!window.SentinelClusterEngine || typeof THREE === "undefined") return;

  var clusterGroup = new THREE.Group();
  var clusterObjects = [];
  var lastGridSize = -1;
  var hoveredCluster = null;
  var clusterRaycaster = new THREE.Raycaster();
  var pointer = new THREE.Vector2();
  var severityColors = {
    LOW: "#55b894",
    MODERATE: "#6ea8dc",
    HIGH: "#e4b45c",
    CRITICAL: "#db645f",
  };

  globeGroup.add(clusterGroup);

  function disposeClusters() {
    clusterObjects.forEach(function (item) {
      clusterGroup.remove(item.sprite);
      if (item.sprite.material.map) item.sprite.material.map.dispose();
      item.sprite.material.dispose();
    });
    clusterObjects = [];
    hoveredCluster = null;
  }

  function drawClusterTexture(cluster) {
    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");
    var color = severityColors[cluster.severity] || severityColors.MODERATE;
    canvas.width = 128;
    canvas.height = 128;

    context.beginPath();
    context.arc(64, 64, 42, 0, Math.PI * 2);
    context.fillStyle = "rgba(6, 12, 19, 0.94)";
    context.fill();
    context.lineWidth = 5;
    context.strokeStyle = color;
    context.stroke();

    context.beginPath();
    context.arc(64, 64, 51, 0, Math.PI * 2);
    context.lineWidth = 2;
    context.strokeStyle = color + "66";
    context.stroke();

    context.fillStyle = "#f3f6f8";
    context.font = "700 38px JetBrains Mono, monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(String(cluster.count), 64, 64);

    var texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  function createClusterSprite(cluster) {
    var sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: drawClusterTexture(cluster),
      transparent: true,
      depthTest: true,
      depthWrite: false,
    }));
    sprite.position.copy(ll2v(cluster.latitude, cluster.longitude, GLOBE_R + 0.035));
    var size = Math.min(0.14, 0.09 + cluster.count * 0.01);
    sprite.scale.set(size, size, 1);
    sprite.renderOrder = 5;
    sprite.userData.clusterId = cluster.id;
    clusterGroup.add(sprite);
    return { sprite: sprite, cluster: cluster };
  }

  function restoreMarkerVisibility(visibleEvents) {
    var visibleIds = new Set(visibleEvents.map(function (event) { return event.id; }));
    markers.forEach(function (marker) {
      var visible = visibleIds.has(marker.event.id);
      marker.mesh.visible = visible;
      marker.ring.visible = visible;
      marker.spike.visible = visible;
      marker.clustered = false;
    });
  }

  function hideClusterMembers(clusters) {
    var clusteredIds = new Set();
    clusters.forEach(function (cluster) {
      cluster.members.forEach(function (event) { clusteredIds.add(event.id); });
    });
    markers.forEach(function (marker) {
      if (!clusteredIds.has(marker.event.id)) return;
      marker.mesh.visible = false;
      marker.ring.visible = false;
      marker.spike.visible = false;
      marker.clustered = true;
    });
  }

  function refreshClusters(force) {
    if (typeof allEvents === "undefined" || typeof passesFilter !== "function") return;
    var gridSize = window.SentinelClusterEngine.gridSizeForDistance(currentZoom);
    if (!force && gridSize === lastGridSize) return;
    lastGridSize = gridSize;

    var visibleEvents = allEvents.filter(passesFilter);
    var result = window.SentinelClusterEngine.clusterEvents(visibleEvents, currentZoom);
    restoreMarkerVisibility(visibleEvents);
    hideClusterMembers(result.clusters);
    disposeClusters();
    clusterObjects = result.clusters.map(createClusterSprite);

    window.dispatchEvent(new CustomEvent("sentinel:clusters-updated", {
      detail: {
        clusterCount: result.clusters.length,
        clusteredEventCount: result.clusters.reduce(function (total, cluster) { return total + cluster.count; }, 0),
        gridSize: result.gridSize,
      },
    }));
  }

  function updateFrontFacing() {
    var center = new THREE.Vector3();
    globeGroup.getWorldPosition(center);
    var cameraDirection = camera.position.clone().sub(center).normalize();
    clusterObjects.forEach(function (item) {
      var worldPosition = item.sprite.position.clone();
      globeGroup.localToWorld(worldPosition);
      var globeDirection = worldPosition.clone().sub(center).normalize();
      item.sprite.visible = globeDirection.dot(cameraDirection) > 0.08;
    });
  }

  function clusterAtPointer(clientX, clientY) {
    pointer.x = clientX / innerWidth * 2 - 1;
    pointer.y = -(clientY / innerHeight) * 2 + 1;
    clusterRaycaster.setFromCamera(pointer, camera);
    var hits = clusterRaycaster.intersectObjects(clusterObjects.map(function (item) { return item.sprite; }));
    if (!hits.length) return null;
    var clusterId = hits[0].object.userData.clusterId;
    return clusterObjects.find(function (item) { return item.cluster.id === clusterId; }) || null;
  }

  function showClusterTooltip(item, clientX, clientY) {
    var cluster = item.cluster;
    var names = cluster.members.slice(0, 2).map(function (event) {
      return event.v2 ? event.v2.shortTitle : event.headline;
    });
    document.getElementById("tt-type").textContent = cluster.severity + " AREA CLUSTER";
    document.getElementById("tt-type").style.color = severityColors[cluster.severity];
    document.getElementById("tt-headline").textContent = cluster.count + " incidents · " + names.join(" · ");
    var badge = document.getElementById("tt-badge");
    badge.textContent = "ZOOM TO SEPARATE";
    badge.style.background = "rgba(110,168,220,.12)";
    badge.style.color = "#8fc1ee";
    document.getElementById("tt-location").textContent = "";
    document.getElementById("tt-time").textContent = "";
    var tooltip = document.getElementById("tooltip");
    tooltip.style.display = "block";
    tooltip.style.left = Math.min(clientX + 16, innerWidth - 300) + "px";
    tooltip.style.top = Math.max(84, clientY - 10) + "px";
  }

  renderer.domElement.addEventListener("mousemove", function (event) {
    var item = clusterAtPointer(event.clientX, event.clientY);
    if (!item) {
      hoveredCluster = null;
      return;
    }
    hoveredCluster = item;
    renderer.domElement.style.cursor = "pointer";
    showClusterTooltip(item, event.clientX, event.clientY);
  });

  renderer.domElement.addEventListener("click", function (event) {
    if (dragDist > 8) return;
    var item = clusterAtPointer(event.clientX, event.clientY) || hoveredCluster;
    if (!item) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    hoveredMarker = null;
    hoveredCluster = null;
    flyTo(item.cluster.latitude, item.cluster.longitude, 2.08);
    showToast("Expanding " + item.cluster.count + "-incident cluster", "var(--ops-blue)");
  }, true);

  var baseUpdateVis = window.updateVis;
  window.updateVis = function updateVisibilityWithClusters() {
    baseUpdateVis();
    refreshClusters(true);
  };

  var baseTimelineUpdate = window.updateTLPosition;
  window.updateTLPosition = function updateTimelineWithClusters() {
    baseTimelineUpdate();
    refreshClusters(true);
  };

  window.addEventListener("sentinel:events-loaded", function () { refreshClusters(true); });
  window.addEventListener("sentinel:timeframe-changed", function () { refreshClusters(true); });

  function monitorCamera() {
    refreshClusters(false);
    updateFrontFacing();
    requestAnimationFrame(monitorCamera);
  }

  window.SentinelGlobeClustering = {
    refresh: function () { refreshClusters(true); },
    getState: function () {
      return {
        clusterCount: clusterObjects.length,
        gridSize: lastGridSize,
        clusters: clusterObjects.map(function (item) {
          return {
            id: item.cluster.id,
            count: item.cluster.count,
            memberIds: item.cluster.members.map(function (event) { return event.id; }),
          };
        }),
      };
    },
  };

  monitorCamera();
})();
