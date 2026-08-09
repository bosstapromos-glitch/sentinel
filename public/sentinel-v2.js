(function initializeSentinelV2() {
  "use strict";

  var timeframeHours = 24 * 30;
  var selectedFeedId = null;
  var pipelineIndex = 0;
  var categoryToLegacy = {
    CONFLICT: "battle",
    MILITARY: "strategic_development",
    TERRORISM: "terror_attack",
    MASS_VIOLENCE: "mass_shooting",
    PUBLIC_SAFETY: "strategic_development",
    PROTEST: "protest",
    CIVIL_UNREST: "protest",
    DISASTER: "strategic_development",
    WEATHER: "strategic_development",
    CYBER: "strategic_development",
    INTERNET_OUTAGE: "strategic_development",
    INFRASTRUCTURE: "strategic_development",
    CRITICAL_INFRASTRUCTURE: "strategic_development",
    AVIATION: "strategic_development",
    MARITIME: "strategic_development",
    TRANSPORTATION: "strategic_development",
    PUBLIC_HEALTH: "strategic_development",
    POLITICAL: "strategic_development"
  };
  var categoryColors = {
    CONFLICT: "#db645f",
    MILITARY: "#c98267",
    TERRORISM: "#b86e91",
    MASS_VIOLENCE: "#a884c7",
    PUBLIC_SAFETY: "#6ea8dc",
    PROTEST: "#718ccf",
    CIVIL_UNREST: "#718ccf",
    DISASTER: "#d68057",
    WEATHER: "#53a7c6",
    CYBER: "#9b82cb",
    INTERNET_OUTAGE: "#9b82cb",
    INFRASTRUCTURE: "#e4b45c",
    CRITICAL_INFRASTRUCTURE: "#e4b45c",
    AVIATION: "#66b5bc",
    MARITIME: "#4d92b8",
    TRANSPORTATION: "#83a2bb",
    PUBLIC_HEALTH: "#55b894",
    POLITICAL: "#9c93b6"
  };

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function severityColor(severity) {
    return severity === "CRITICAL" ? "#db645f" :
      severity === "HIGH" ? "#e4b45c" :
      severity === "MODERATE" ? "#6ea8dc" : "#55b894";
  }

  function formatLabel(value) {
    return String(value || "").replace(/_/g, " ");
  }

  function clockTime(value) {
    try {
      return new Date(value).toISOString().slice(11, 16);
    } catch (_) {
      return "--:--";
    }
  }

  function toLegacy(event) {
    var type = categoryToLegacy[event.category] || "strategic_development";
    var casualties = event.casualties || {};
    var killed = casualties.killed || { min: 0, max: 0 };
    var injured = casualties.injured || { min: 0, max: 0 };
    return {
      id: event.id,
      type: type,
      headline: event.title,
      verification: event.verificationStatus === "VERIFIED" ? "official_confirmed" :
        event.verificationStatus === "CORROBORATED" ? "corroborated" : "unverified",
      confidence: event.confidence.score / 100,
      lat: event.latitude,
      lon: event.longitude,
      locality: event.city || event.region || event.country,
      cc: event.countryCode,
      admin: event.jurisdiction,
      precision: "city",
      uncertainty_km: event.confidence.score > 85 ? 1 : 5,
      time: event.timestamp,
      updated: event.lastUpdated,
      killed: killed,
      injured: injured,
      iran: null,
      evidence: event.sources.map(function (source) {
        return { pub: source.name, tier: source.sourceType.toLowerCase() };
      }),
      lane: event.verificationStatus === "VERIFIED" || event.verificationStatus === "CORROBORATED" ? "verified" : "fast",
      v2: event
    };
  }

  function clearMarkers() {
    markers.forEach(function (marker) {
      [marker.mesh, marker.ring, marker.spike].forEach(function (object) {
        markerGroup.remove(object);
        if (object.geometry) object.geometry.dispose();
        if (object.material) object.material.dispose();
      });
    });
    markers.splice(0, markers.length);
  }

  function styleMarker(marker) {
    var event = marker.event.v2;
    if (!event) return;
    var color = new THREE.Color(categoryColors[event.category] || severityColor(event.severity));
    marker.mesh.material.color.copy(color);
    marker.ring.material.color.copy(color);
    marker.spike.material.color.copy(color);
    var severityScale = event.severity === "CRITICAL" ? 1.65 :
      event.severity === "HIGH" ? 1.35 :
      event.severity === "MODERATE" ? 1.1 : .82;
    marker.baseScale = severityScale;
    marker.ring.userData.pulseStrength = event.status === "RESOLVED" ? 0 : severityScale;
    if (event.status === "RESOLVED") {
      marker.mesh.material.opacity = .38;
      marker.ring.material.opacity = .04;
    }
  }

  async function loadV2Events() {
    try {
      var response = await fetch("/api/events", { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("Event provider returned " + response.status);
      var payload = await response.json();
      if (!Array.isArray(payload.events)) throw new Error("Invalid event provider response");
      clearMarkers();
      allEvents = payload.events.map(toLegacy);
      allEvents.forEach(function (event) {
        styleMarker(createMarker(event));
      });
      updateVis();
      renderOperationsFeed();
      updatePipeline("INGESTED", payload.total + " structured demo records");
    } catch (error) {
      console.error("SENTINEL V2 event load failed:", error);
      updatePipeline("DEGRADED", "Demo provider unavailable");
    }
  }

  function injectWorkspaceChrome() {
    var left = document.querySelector(".header-left");
    if (left) {
      var context = document.createElement("div");
      context.className = "workspace-context";
      context.innerHTML = "<span>ORG</span><strong>DEMO EOC</strong><span>/</span><strong>GLOBAL WATCH</strong><span class=\"classification-chip\">PUBLIC</span>";
      left.appendChild(context);

      var modes = document.createElement("div");
      modes.className = "mode-switcher";
      modes.innerHTML =
        "<button class=\"mode-button active\" data-mode=\"LIVE\">LIVE</button>" +
        "<button class=\"mode-button\" data-mode=\"OPERATIONS\">OPERATIONS</button>" +
        "<button class=\"mode-button\" disabled title=\"Intelligence workspace architecture prepared\">INTELLIGENCE</button>" +
        "<button class=\"mode-button\" disabled title=\"Watchlist architecture prepared\">WATCH</button>";
      left.appendChild(modes);
      modes.querySelectorAll(".mode-button:not([disabled])").forEach(function (button) {
        button.addEventListener("click", function () {
          modes.querySelectorAll(".mode-button").forEach(function (item) { item.classList.remove("active"); });
          button.classList.add("active");
          showToast(button.dataset.mode + " operational picture", "var(--ops-blue)");
        });
      });
    }

    var search = document.getElementById("search-input");
    if (search) search.placeholder = "Search incidents, places, jurisdictions…";
    var searchBar = document.getElementById("search-bar");
    if (searchBar) {
      var hint = document.createElement("span");
      hint.className = "command-hint";
      hint.textContent = "⌘ K";
      hint.style.cssText = "position:absolute;right:10px;top:10px";
      searchBar.appendChild(hint);
    }

    var headerButtons = document.querySelectorAll(".header-right .hdr-btn");
    if (headerButtons[2]) headerButtons[2].innerHTML = "◫ <span style=\"font-size:9px\">IMPACT</span>";
    if (headerButtons[3]) {
      headerButtons[3].innerHTML = "＋ <span style=\"font-size:9px\">INTAKE</span>";
      headerButtons[3].title = "Prototype intelligence intake";
    }
    var casualtyTitle = document.querySelector("#casualty-panel .sp-title");
    if (casualtyTitle) casualtyTitle.textContent = "◫ Simulated Impact Tracker";
    var tipTitle = document.querySelector(".tips-title");
    var tipSub = document.querySelector(".tips-sub");
    if (tipTitle) tipTitle.textContent = "Prototype Intelligence Intake";
    if (tipSub) tipSub.textContent = "Demo-only intake. Information is not transmitted or stored.";
  }

  function injectFilters() {
    var bar = document.getElementById("filter-bar");
    if (!bar) return;
    bar.innerHTML =
      "<button class=\"fbtn active\" data-filter=\"all\" onclick=\"setFilter('all')\">ALL</button>" +
      "<button class=\"fbtn\" data-filter=\"critical\" onclick=\"setFilter('critical')\">CRITICAL</button>" +
      "<button class=\"fbtn\" data-filter=\"disaster\" onclick=\"setFilter('disaster')\">DISASTER</button>" +
      "<button class=\"fbtn\" data-filter=\"cyber\" onclick=\"setFilter('cyber')\">CYBER</button>" +
      "<button class=\"fbtn\" data-filter=\"infrastructure\" onclick=\"setFilter('infrastructure')\">INFRASTRUCTURE</button>" +
      "<button class=\"fbtn\" data-filter=\"verified\" onclick=\"setFilter('verified')\">VERIFIED</button>" +
      "<button class=\"fbtn\" id=\"heatmap-btn\" onclick=\"toggleHeatmap()\">DENSITY</button>" +
      "<button class=\"fbtn\" id=\"timeline-btn\" onclick=\"toggleTimeline()\">REPLAY</button>" +
      "<button class=\"fbtn\" id=\"camera-btn\" onclick=\"toggleCameras()\">CAMERAS</button>";
  }

  window.passesFilter = function passesV2Filter(event) {
    var v2 = event.v2;
    if (!v2) return currentFilter === "all";
    if (Date.now() - new Date(v2.timestamp).getTime() > timeframeHours * 3_600_000) return false;
    if (currentFilter === "all") return true;
    if (currentFilter === "critical") return v2.severity === "CRITICAL";
    if (currentFilter === "verified") return v2.verificationStatus === "VERIFIED" || v2.verificationStatus === "CORROBORATED";
    if (currentFilter === "disaster") return v2.category === "DISASTER" || v2.category === "WEATHER";
    if (currentFilter === "cyber") return v2.category === "CYBER" || v2.category === "INTERNET_OUTAGE";
    if (currentFilter === "infrastructure") return v2.category === "INFRASTRUCTURE" || v2.category === "CRITICAL_INFRASTRUCTURE" || v2.category === "TRANSPORTATION";
    return true;
  };

  window.setFilter = function setV2Filter(filter) {
    currentFilter = filter;
    document.querySelectorAll(".fbtn[data-filter]").forEach(function (button) {
      button.classList.toggle("active", button.dataset.filter === filter);
    });
    updateVis();
    renderOperationsFeed();
  };

  window.updateVis = function updateV2Visibility() {
    var visible = 0;
    var verified = 0;
    var critical = 0;
    markers.forEach(function (marker) {
      var isVisible = passesFilter(marker.event);
      marker.mesh.visible = isVisible;
      marker.ring.visible = isVisible;
      marker.spike.visible = isVisible;
      if (isVisible) visible++;
      if (marker.event.v2 && ["VERIFIED", "CORROBORATED"].includes(marker.event.v2.verificationStatus)) verified++;
      if (marker.event.v2 && marker.event.v2.severity === "CRITICAL") critical++;
    });
    document.getElementById("stat-total").textContent = String(allEvents.length);
    document.getElementById("stat-visible").textContent = String(visible);
    document.getElementById("stat-verified").textContent = String(verified);
    var lastLabel = document.querySelector("#stats .stat-item:last-child .stat-label");
    if (lastLabel) lastLabel.textContent = "CRITICAL";
    document.getElementById("stat-iran").textContent = String(critical);
    if (showHeatmap) renderHeatmap();
  };

  function injectFeed() {
    var feed = document.createElement("aside");
    feed.id = "operations-feed";
    feed.setAttribute("aria-label", "Active operations feed");
    feed.innerHTML =
      "<div class=\"feed-header\"><div><div class=\"feed-title\">ACTIVE OPERATIONS</div><div class=\"feed-subtitle\">PRIORITIZED BY SEVERITY · CONFIDENCE</div></div>" +
      "<button class=\"feed-collapse\" aria-label=\"Collapse feed\">›</button></div><div class=\"feed-list\"></div>";
    document.getElementById("app").appendChild(feed);
    feed.querySelector(".feed-collapse").addEventListener("click", function () {
      feed.classList.toggle("collapsed");
      this.textContent = feed.classList.contains("collapsed") ? "‹" : "›";
    });
  }

  function eventSort(a, b) {
    var rank = { CRITICAL: 4, HIGH: 3, MODERATE: 2, LOW: 1 };
    return (rank[b.v2.severity] - rank[a.v2.severity]) ||
      (new Date(b.time).getTime() - new Date(a.time).getTime());
  }

  function renderOperationsFeed() {
    var list = document.querySelector(".feed-list");
    if (!list) return;
    var visible = allEvents.filter(passesFilter).sort(eventSort);
    if (!visible.length) {
      list.innerHTML = "<div class=\"empty-state\" style=\"padding:20px\">No incidents match the current operational view.</div>";
      return;
    }
    list.innerHTML = visible.map(function (event) {
      var v2 = event.v2;
      return "<button class=\"feed-item " + (selectedFeedId === event.id ? "selected" : "") + "\" data-event-id=\"" + escapeHtml(event.id) + "\">" +
        "<span class=\"feed-kicker\"><span class=\"feed-severity\" style=\"color:" + severityColor(v2.severity) + "\">" + escapeHtml(v2.severity) + "</span>" +
        "<span class=\"feed-country\">" + escapeHtml(v2.countryCode) + "</span><span class=\"feed-time\">" + escapeHtml(timeAgo(v2.timestamp).toUpperCase()) + "</span></span>" +
        "<span class=\"feed-headline\">" + escapeHtml(v2.shortTitle) + "</span>" +
        "<span class=\"feed-meta\"><span class=\"feed-confidence\">" + v2.confidence.score + "% CONFIDENCE</span><span>" + escapeHtml(v2.verificationStatus) + "</span><span class=\"feed-demo\">SIMULATED</span></span></button>";
    }).join("");
    list.querySelectorAll(".feed-item").forEach(function (button) {
      button.addEventListener("click", function () { selectIncident(button.dataset.eventId); });
    });
  }

  window.selectIncident = function selectIncident(id) {
    var marker = markers.find(function (candidate) { return candidate.event.id === id; });
    if (!marker) return;
    selectedFeedId = id;
    selectedEvent = marker.event;
    hoveredMarker = marker;
    epTab = 0;
    flyTo(marker.event.lat, marker.event.lon, 2.05);
    openEventPanel();
    renderOperationsFeed();
  };

  function dossierHero(event) {
    var v2 = event.v2;
    return "<div class=\"dossier-hero\">" +
      "<div class=\"dossier-eyebrow\">INCIDENT " + escapeHtml(v2.id.toUpperCase()) + " · " + escapeHtml(v2.classificationLevel) + "</div>" +
      "<h1 class=\"dossier-title\">" + escapeHtml(v2.title.replace(/^SIMULATED — /, "")) + "</h1>" +
      "<div class=\"dossier-location\">" + escapeHtml([v2.city, v2.country, v2.jurisdiction].filter(Boolean).join(" · ")) + "</div>" +
      "<div class=\"dossier-badges\"><span class=\"status-chip " + v2.severity.toLowerCase() + "\">" + escapeHtml(v2.severity) + "</span>" +
      "<span class=\"status-chip\">" + escapeHtml(v2.priority.replace(/_/g, " ")) + "</span><span class=\"status-chip confidence\">" + v2.confidence.score + "% CONFIDENCE</span>" +
      "<span class=\"status-chip\">" + escapeHtml(v2.status) + "</span><span class=\"status-chip demo\">SIMULATED</span></div></div>";
  }

  function listBlock(title, className, values, emptyText) {
    return "<section class=\"dossier-block\"><div class=\"block-title " + className + "\">" + escapeHtml(title) + "</div>" +
      (values && values.length ? "<ul class=\"intel-list\">" + values.map(function (value) { return "<li>" + escapeHtml(value) + "</li>"; }).join("") + "</ul>" :
        "<div class=\"empty-state\">" + escapeHtml(emptyText || "None recorded") + "</div>") + "</section>";
  }

  function renderOverview(event) {
    var v2 = event.v2;
    var confidence = v2.confidence;
    var html = dossierHero(event) + "<div class=\"dossier-content\">";
    html += "<section class=\"dossier-block\"><div class=\"block-title\">Operational summary</div><div class=\"block-copy\">" + escapeHtml(v2.summary) + "</div></section>";
    html += listBlock("Confirmed facts", "fact", v2.confirmedFacts, "No facts have met the verification threshold.");
    html += listBlock("Reported claims", "claim", v2.reportedClaims, "No unverified claims currently displayed.");
    html += listBlock("Analyst assessment", "assessment", v2.analystAssessment, "No analyst assessment entered.");
    html += listBlock("Current unknowns", "unknown", v2.unknowns, "No material unknowns recorded.");
    html += "<section class=\"dossier-block confidence-card\"><div class=\"confidence-top\"><div><div class=\"confidence-score\">" + confidence.score + "%</div><div class=\"confidence-label\">" + escapeHtml(confidence.label) + " CONFIDENCE</div></div>" +
      "<div class=\"confidence-method\">" + escapeHtml(confidence.methodology) + "</div></div><div class=\"confidence-track\"><div style=\"width:" + confidence.score + "%\"></div></div>" +
      "<div class=\"factor-grid\"><div><div class=\"factor-label\">Supporting factors</div>" + confidence.positiveFactors.map(function (factor) { return "<div class=\"factor positive\">" + escapeHtml(factor) + "</div>"; }).join("") +
      "</div><div><div class=\"factor-label\">Limitations</div>" + confidence.limitingFactors.map(function (factor) { return "<div class=\"factor limiting\">" + escapeHtml(factor) + "</div>"; }).join("") + "</div></div></section>";
    if (v2.conflictingReports.length) {
      html += "<section class=\"dossier-block\"><div class=\"block-title disputed\">Conflicting reports</div>" +
        v2.conflictingReports.map(function (report) {
          return "<div class=\"conflict-card\"><div class=\"source-name\">" + escapeHtml(report.subject) + "</div>" +
            report.claims.map(function (claim) { return "<div class=\"source-claim\"><strong>" + escapeHtml(claim.informationType.replace(/_/g, " ")) + ":</strong> " + escapeHtml(claim.value) + "</div>"; }).join("") +
            "<div class=\"decision-reason\"><strong>SENTINEL assessment:</strong> " + escapeHtml(report.assessment) + "</div></div>";
        }).join("") + "</section>";
    }
    html += "</div>";
    return html;
  }

  function renderSourcesTab(event) {
    var v2 = event.v2;
    return dossierHero(event) + "<div class=\"dossier-content\"><section class=\"dossier-block\"><div class=\"block-title fact\">Source provenance</div>" +
      v2.sources.map(function (source) {
        return "<div class=\"source-card\"><div class=\"source-top\"><div class=\"source-name\">" + escapeHtml(source.name) + "</div><div class=\"source-rating\">" + escapeHtml(source.reliability) + " RELIABILITY</div></div>" +
          "<div class=\"source-meta\">" + escapeHtml(formatLabel(source.sourceType)) + " · " + escapeHtml(clockTime(source.timestamp)) + "Z · " + source.confidence + "% SOURCE CONFIDENCE</div>" +
          "<div class=\"source-claim\">" + escapeHtml(source.claim) + "</div><span class=\"provenance-label\">REFERENCE " + escapeHtml(source.reference || "INTERNAL") + "</span></div>";
      }).join("") + "</section><section class=\"dossier-block\"><div class=\"block-title\">Evidence register</div>" +
      v2.evidence.map(function (evidence) {
        return "<div class=\"source-card\"><div class=\"source-name\">" + escapeHtml(evidence.title) + "</div><div class=\"source-meta\">" + escapeHtml(evidence.type) + " · " + escapeHtml(evidence.verificationStatus) + " · " + escapeHtml(evidence.accessLevel) + "</div><div class=\"source-claim\">" + escapeHtml(evidence.notes || "") + "</div></div>";
      }).join("") + "</section></div>";
  }

  function renderTimelineTab(event) {
    var v2 = event.v2;
    return dossierHero(event) + "<div class=\"dossier-content\"><section class=\"dossier-block\"><div class=\"block-title\">Incident timeline</div>" +
      v2.timeline.map(function (entry) {
        var change = entry.confidenceChange ? " · CONFIDENCE " + entry.confidenceChange.from + "→" + entry.confidenceChange.to + "%" : "";
        return "<div class=\"timeline-entry\"><div class=\"timeline-time\">" + escapeHtml(clockTime(entry.timestamp)) + "Z</div><div class=\"timeline-description\">" + escapeHtml(entry.description) + "</div>" +
          "<div class=\"card-meta\">" + escapeHtml(formatLabel(entry.informationType)) + " · " + escapeHtml(entry.verificationStatus) + escapeHtml(change) + "</div></div>";
      }).join("") + "</section></div>";
  }

  function renderActionsTab(event) {
    var v2 = event.v2;
    return dossierHero(event) + "<div class=\"dossier-content\"><section class=\"dossier-block\"><div class=\"block-title\">Incident tasking</div>" +
      v2.tasks.map(function (task) {
        return "<div class=\"task-card\"><div class=\"task-top\"><div><div class=\"task-name\">" + escapeHtml(task.title) + "</div><div class=\"card-meta\">" + escapeHtml(task.team || "UNASSIGNED") + " · " + escapeHtml(task.priority.replace(/_/g, " ")) + "</div></div>" +
          "<button class=\"task-status " + task.status.toLowerCase() + "\" data-task-id=\"" + escapeHtml(task.id) + "\">" + escapeHtml(task.status.replace(/_/g, " ")) + "</button></div></div>";
      }).join("") + "</section><section class=\"dossier-block\"><div class=\"block-title fact\">Operational actions</div>" +
      v2.operationalActions.map(function (action) {
        return "<div class=\"action-card\"><div class=\"task-name\"><span class=\"action-icon\">✓</span>" + escapeHtml(action.action) + "</div><div class=\"card-meta\">" + escapeHtml(action.initiatedBy) + " · " + escapeHtml(action.organization) + " · " + escapeHtml(clockTime(action.timestamp)) + "Z</div></div>";
      }).join("") + "</section><section class=\"dossier-block\"><div class=\"block-title assessment\">Decision log</div>" +
      v2.decisionLog.map(function (decision) {
        return "<div class=\"decision-card\"><div class=\"task-name\">" + escapeHtml(decision.decision) + "</div><div class=\"card-meta\">" + escapeHtml(clockTime(decision.timestamp)) + "Z · AUTHORIZED BY " + escapeHtml(decision.authorizedBy) + "</div><div class=\"decision-reason\">" + escapeHtml(decision.reason) + "</div></div>";
      }).join("") + "</section></div>";
  }

  window.openEventPanel = function openV2EventPanel() {
    var panel = document.getElementById("event-panel");
    panel.classList.add("open");
    var tabs = panel.querySelector(".sp-tabs");
    tabs.innerHTML =
      "<div class=\"sp-tab active\" onclick=\"switchEPTab(0)\">OVERVIEW</div>" +
      "<div class=\"sp-tab\" onclick=\"switchEPTab(1)\">SOURCES</div>" +
      "<div class=\"sp-tab\" onclick=\"switchEPTab(2)\">TIMELINE</div>" +
      "<div class=\"sp-tab\" onclick=\"switchEPTab(3)\">ACTIONS</div>";
    renderEP();
  };

  window.switchEPTab = function switchV2Tab(tab) {
    epTab = tab;
    document.querySelectorAll("#event-panel .sp-tab").forEach(function (item, index) {
      item.classList.toggle("active", index === tab);
    });
    renderEP();
  };

  window.renderEP = function renderV2Dossier() {
    if (!selectedEvent || !selectedEvent.v2) return;
    var v2 = selectedEvent.v2;
    var title = document.getElementById("ep-type");
    title.textContent = v2.category.replace(/_/g, " ") + " · " + v2.verificationStatus;
    title.style.color = categoryColors[v2.category] || "var(--ops-blue)";
    var body = document.getElementById("ep-body");
    body.innerHTML = epTab === 0 ? renderOverview(selectedEvent) :
      epTab === 1 ? renderSourcesTab(selectedEvent) :
      epTab === 2 ? renderTimelineTab(selectedEvent) : renderActionsTab(selectedEvent);
    body.querySelectorAll(".task-status").forEach(function (button) {
      button.addEventListener("click", function () {
        var task = v2.tasks.find(function (candidate) { return candidate.id === button.dataset.taskId; });
        if (!task) return;
        var states = ["OPEN", "IN_PROGRESS", "BLOCKED", "COMPLETE"];
        task.status = states[(states.indexOf(task.status) + 1) % states.length];
        renderEP();
        showToast("Task status updated · demo session only", "var(--ops-green)");
      });
    });
  };

  function injectTimeMachine() {
    var machine = document.createElement("nav");
    machine.id = "time-machine";
    machine.setAttribute("aria-label", "Global time window");
    machine.innerHTML = "<span class=\"time-live\">LIVE</span>" +
      [["1H", 1], ["6H", 6], ["24H", 24], ["3D", 72], ["7D", 168], ["30D", 720]].map(function (entry) {
        return "<button class=\"time-option " + (entry[0] === "30D" ? "active" : "") + "\" data-hours=\"" + entry[1] + "\">" + entry[0] + "</button>";
      }).join("") + "<button class=\"time-option\" id=\"historical-replay\">HISTORICAL</button>";
    document.getElementById("app").appendChild(machine);
    machine.querySelectorAll("[data-hours]").forEach(function (button) {
      button.addEventListener("click", function () {
        timeframeHours = Number(button.dataset.hours);
        machine.querySelectorAll(".time-option").forEach(function (item) { item.classList.remove("active"); });
        button.classList.add("active");
        updateVis();
        renderOperationsFeed();
      });
    });
    document.getElementById("historical-replay").addEventListener("click", function () {
      toggleTimeline();
      showToast("Historical replay controls opened", "var(--ops-blue)");
    });
  }

  function enhanceSearch() {
    var input = document.getElementById("search-input");
    var results = document.getElementById("search-results");
    input.addEventListener("input", function () {
      var query = input.value.trim().toLowerCase();
      if (query.length < 2) return;
      var matches = allEvents.filter(function (event) {
        var v2 = event.v2;
        return v2 && [v2.title, v2.shortTitle, v2.city, v2.country, v2.jurisdiction, v2.id].join(" ").toLowerCase().includes(query);
      }).slice(0, 6);
      if (!matches.length) return;
      results.innerHTML = matches.map(function (event) {
        return "<div class=\"search-item\" data-event-result=\"" + escapeHtml(event.id) + "\"><span>" + escapeHtml(event.v2.shortTitle) + "</span><span class=\"search-cc\">INCIDENT · " + escapeHtml(event.v2.countryCode) + "</span></div>";
      }).join("");
      results.style.display = "block";
      results.querySelectorAll("[data-event-result]").forEach(function (item) {
        item.addEventListener("mousedown", function (mouseEvent) {
          mouseEvent.preventDefault();
          input.value = item.querySelector("span").textContent;
          results.style.display = "none";
          selectIncident(item.dataset.eventResult);
        });
      });
    });
    document.addEventListener("keydown", function (event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k" || (event.key === "/" && document.activeElement !== input)) {
        event.preventDefault();
        input.focus();
        input.select();
      }
      if (event.key === "Escape") {
        input.blur();
        results.style.display = "none";
      }
    });
  }

  function updatePipeline(state, detail) {
    var tag = document.querySelector(".ticker-tag");
    var text = document.getElementById("ticker-text");
    if (tag) tag.textContent = "INCOMING INTELLIGENCE";
    if (text) text.innerHTML = "<span class=\"pipeline-status\">" + escapeHtml(state) + "</span> <span class=\"pipeline-count\">" + escapeHtml(detail) + "</span>";
  }

  function startPipeline() {
    var states = [
      ["DETECTED", "New synthetic signal received"],
      ["INGESTED", "Normalizing provider record"],
      ["ANALYZING", "Reviewing 3 simulated indicators"],
      ["CORROBORATING", "Comparing independent sources"],
      ["VERIFIED", "Demo incident assessment updated"]
    ];
    updatePipeline(states[0][0], states[0][1]);
    setInterval(function () {
      pipelineIndex = (pipelineIndex + 1) % states.length;
      updatePipeline(states[pipelineIndex][0], states[pipelineIndex][1]);
    }, 5500);
  }

  window.submitTip = function submitPrototypeTip() {
    closeTipsModal();
    showToast("Prototype only · submission was not transmitted", "var(--ops-amber)");
  };

  window.exportReport = function exportV2Report() {
    var visibleEvents = allEvents.filter(passesFilter);
    var lines = [
      "SENTINEL V2 DEMONSTRATION SITUATION REPORT",
      "SIMULATED DATA — NOT FOR OPERATIONAL USE",
      new Date().toISOString(),
      "",
      "OPERATIONAL PICTURE",
      visibleEvents.length + " simulated incidents in current view",
      ""
    ];
    visibleEvents.forEach(function (event) {
      var v2 = event.v2;
      lines.push(
        v2.id + " | " + v2.severity + " | " + v2.verificationStatus,
        v2.shortTitle + " — " + v2.city + ", " + v2.country,
        "Confidence: " + v2.confidence.score + "% — " + v2.confidence.methodology,
        "Summary: " + v2.summary,
        ""
      );
    });
    var blob = new Blob([lines.join("\n")], { type: "text/plain" });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "SENTINEL-V2-DEMO-SITREP.txt";
    anchor.click();
    URL.revokeObjectURL(url);
    showToast("Simulated SITREP exported", "var(--ops-blue)");
  };

  window.renderSources = function renderV2Sources() {
    var sources = [];
    allEvents.forEach(function (event) {
      if (event.v2) sources = sources.concat(event.v2.sources);
    });
    document.getElementById("sources-body").innerHTML =
      "<div class=\"section-lbl\">Source reliability and provenance</div><div style=\"font-size:11px;color:var(--text-dim);margin-bottom:14px\">Reliability is contextual and never substitutes for claim-level verification.</div>" +
      sources.map(function (source) {
        return "<div class=\"src-row\"><div class=\"src-dot\" style=\"background:var(--ops-green)\"></div><div class=\"src-name\">" + escapeHtml(source.name) +
          "<div style=\"font-size:9px;color:var(--text-faint);font-family:var(--mono)\">" + escapeHtml(formatLabel(source.sourceType)) + "</div></div><div class=\"src-meta\">" +
          escapeHtml(source.reliability) + "<br>" + source.confidence + "% · SIMULATED</div></div>";
      }).join("");
  };

  function relabelStaticUi() {
    var tooltipHint = document.querySelector(".tt-hint");
    if (tooltipHint) tooltipHint.textContent = "Select to open operational dossier";
    var globeTitle = document.querySelector(".logo-sub");
    if (globeTitle) globeTitle.firstChild.textContent = "Common Operating Picture";
    var legendTitle = document.querySelector(".legend-title");
    if (legendTitle) legendTitle.textContent = "Operational categories";
    var footer = document.querySelector("#bottom-right .br-box:last-child .br-text");
    if (footer) footer.textContent = "DEMO DATA · SIMULATED";
    var reportButton = document.querySelector('[title="Export Report"] span');
    if (reportButton) reportButton.textContent = "SITREP";
  }

  injectWorkspaceChrome();
  injectFilters();
  injectFeed();
  injectTimeMachine();
  enhanceSearch();
  relabelStaticUi();
  startPipeline();
  loadV2Events();
})();
