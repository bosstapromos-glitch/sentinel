// ══════════════════════════════════════════════════════════════════════
// SENTINEL MILITARY ANIMATIONS — Missiles, Jets, Warships, Explosions
// Loads AFTER globe.html — uses globals: THREE, globeGroup, GLOBE_R,
// ll2v, ET, allEvents, showToast, R
// ══════════════════════════════════════════════════════════════════════
(function initMilitary() {
  // Safety: wait for globe to be ready
  if (typeof THREE === 'undefined' || typeof globeGroup === 'undefined' || typeof ll2v === 'undefined') {
    setTimeout(initMilitary, 500);
    return;
  }

  console.log('SENTINEL Military Animations loaded');

  // ── GROUPS ──
  var milGroup = new THREE.Group();
  globeGroup.add(milGroup);
  var activeMissiles = [];
  var activeJets = [];
  var activeShips = [];

  // ── LAUNCH ORIGINS ──
  var ORIGINS = {
    UA: { lat: 55.76, lon: 37.62, label: 'Russia' },
    PS: { lat: 32.08, lon: 34.78, label: 'Israel' },
    LB: { lat: 32.08, lon: 34.78, label: 'Israel' },
    YE: { lat: 24.71, lon: 46.68, label: 'Saudi Arabia' },
    SY: { lat: 35.69, lon: 51.39, label: 'Iran' },
    IQ: { lat: 35.69, lon: 51.39, label: 'Iran' },
    SD: { lat: 15.2, lon: 30.0, label: 'Sudan Region' },
    SO: { lat: 2.1, lon: 45.0, label: 'Somalia Region' },
    AF: { lat: 33.5, lon: 68.0, label: 'Afghanistan Region' }
  };

  function getOrigin(evt) {
    if (evt.iran) return { lat: 35.69, lon: 51.39 };
    var o = ORIGINS[evt.cc];
    if (o) return { lat: o.lat, lon: o.lon };
    return { lat: evt.lat + (Math.random() - 0.5) * 12, lon: evt.lon + (Math.random() - 0.5) * 12 };
  }

  // ── MISSILE ARCS ──
  function launchMissile(evt) {
    var origin = getOrigin(evt);
    var startPos = ll2v(origin.lat, origin.lon, GLOBE_R + 0.012);
    var endPos = ll2v(evt.lat, evt.lon, GLOBE_R + 0.012);
    var mid = startPos.clone().add(endPos).multiplyScalar(0.5);
    var dist = startPos.distanceTo(endPos);
    mid.normalize().multiplyScalar(GLOBE_R + 0.012 + dist * 0.45);

    var curve = new THREE.QuadraticBezierCurve3(startPos, mid, endPos);
    var pts = curve.getPoints(80);
    var evtColor = ET[evt.type] ? ET[evt.type].color : '#EF4444';
    var c = new THREE.Color(evtColor);

    // Missile head - bright white
    var headMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.007, 8, 8), headMat);
    head.position.copy(startPos);
    milGroup.add(head);

    // Glow around head
    var glowMat = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.5 });
    var glow = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), glowMat);
    glow.position.copy(startPos);
    milGroup.add(glow);

    // Trail (drawn progressively)
    var trailMat = new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 0.7 });
    var trailGeo = new THREE.BufferGeometry().setFromPoints([startPos.clone(), startPos.clone()]);
    var trail = new THREE.Line(trailGeo, trailMat);
    milGroup.add(trail);

    activeMissiles.push({
      head: head, glow: glow, trail: trail, pts: pts,
      idx: 0, color: c, colorHex: evtColor, evt: evt, hit: false, dead: false
    });
  }

  // ── IMPACT EXPLOSION ──
  function createExplosion(pos, color) {
    // Flash
    var flashMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
    var flash = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 12), flashMat);
    flash.position.copy(pos);
    milGroup.add(flash);

    // Expanding shockwave ring
    var ringMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
    var ring = new THREE.Mesh(new THREE.RingGeometry(0.003, 0.008, 32), ringMat);
    ring.position.copy(pos);
    ring.lookAt(new THREE.Vector3(0, 0, 0));
    milGroup.add(ring);

    // Second ring (delayed)
    var ring2Mat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#FBBF24'), transparent: true, opacity: 0.7, side: THREE.DoubleSide });
    var ring2 = new THREE.Mesh(new THREE.RingGeometry(0.002, 0.006, 32), ring2Mat);
    ring2.position.copy(pos);
    ring2.lookAt(new THREE.Vector3(0, 0, 0));
    milGroup.add(ring2);

    // Debris particles
    var debrisCount = 8;
    var debris = [];
    for (var d = 0; d < debrisCount; d++) {
      var dm = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.8 });
      var dp = new THREE.Mesh(new THREE.SphereGeometry(0.003, 4, 4), dm);
      dp.position.copy(pos);
      var dir = pos.clone().normalize();
      var side = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      dp.userData.vel = side.multiplyScalar(0.002 + Math.random() * 0.003);
      milGroup.add(dp);
      debris.push(dp);
    }

    var age = 0;
    var iv = setInterval(function () {
      age += 0.035;
      // Flash
      var fs = 1 + age * 5;
      flash.scale.set(fs, fs, fs);
      flash.material.opacity = Math.max(0, 1 - age * 2.5);
      // Ring 1
      var rs = 1 + age * 12;
      ring.scale.set(rs, rs, rs);
      ring.material.opacity = Math.max(0, 0.9 - age * 1.8);
      // Ring 2 (delayed)
      if (age > 0.15) {
        var rs2 = 1 + (age - 0.15) * 10;
        ring2.scale.set(rs2, rs2, rs2);
        ring2.material.opacity = Math.max(0, 0.7 - (age - 0.15) * 2);
      }
      // Debris
      debris.forEach(function (dp) {
        dp.position.add(dp.userData.vel);
        dp.material.opacity = Math.max(0, 0.8 - age * 1.5);
        dp.userData.vel.multiplyScalar(0.96);
      });

      if (age > 1) {
        clearInterval(iv);
        milGroup.remove(flash); milGroup.remove(ring); milGroup.remove(ring2);
        flash.geometry.dispose(); flash.material.dispose();
        ring.geometry.dispose(); ring.material.dispose();
        ring2.geometry.dispose(); ring2.material.dispose();
        debris.forEach(function (dp) {
          milGroup.remove(dp); dp.geometry.dispose(); dp.material.dispose();
        });
      }
    }, 20);
  }

  // ── JETS / AIRCRAFT ──
  function createJet(evt) {
    var origin = getOrigin(evt);
    var startPos = ll2v(origin.lat, origin.lon, GLOBE_R + 0.025);
    var endPos = ll2v(evt.lat, evt.lon, GLOBE_R + 0.025);
    var mid = startPos.clone().add(endPos).multiplyScalar(0.5);
    var dist = startPos.distanceTo(endPos);
    mid.normalize().multiplyScalar(GLOBE_R + 0.025 + dist * 0.3);

    var curve = new THREE.QuadraticBezierCurve3(startPos, mid, endPos);
    var pts = curve.getPoints(120);

    // Jet body - small triangle shape using a cone
    var jetMat = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.9 });
    var jet = new THREE.Mesh(new THREE.ConeGeometry(0.004, 0.015, 4), jetMat);
    jet.position.copy(startPos);
    milGroup.add(jet);

    // Jet glow/engine trail
    var engineMat = new THREE.MeshBasicMaterial({ color: 0xF97316, transparent: true, opacity: 0.6 });
    var engine = new THREE.Mesh(new THREE.SphereGeometry(0.005, 6, 6), engineMat);
    engine.position.copy(startPos);
    milGroup.add(engine);

    // Contrail
    var contrailMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });
    var contrailGeo = new THREE.BufferGeometry().setFromPoints([startPos.clone(), startPos.clone()]);
    var contrail = new THREE.Line(contrailGeo, contrailMat);
    milGroup.add(contrail);

    activeJets.push({
      jet: jet, engine: engine, contrail: contrail, pts: pts,
      idx: 0, evt: evt, done: false
    });
  }

  // ── WARSHIPS ──
  function createWarship(lat, lon, cc) {
    var pos = ll2v(lat, lon, GLOBE_R + 0.008);

    // Ship body - small box
    var shipMat = new THREE.MeshBasicMaterial({ color: 0x8899aa, transparent: true, opacity: 0.8 });
    var ship = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.003, 0.005), shipMat);
    ship.position.copy(pos);
    ship.lookAt(new THREE.Vector3(0, 0, 0));
    milGroup.add(ship);

    // Ship radar pulse
    var radarMat = new THREE.MeshBasicMaterial({ color: 0x22D3EE, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
    var radar = new THREE.Mesh(new THREE.RingGeometry(0.008, 0.012, 16), radarMat);
    radar.position.copy(pos);
    radar.lookAt(new THREE.Vector3(0, 0, 0));
    milGroup.add(radar);

    // Ship label
    var cv = document.createElement('canvas');
    var cx = cv.getContext('2d');
    cv.width = 256; cv.height = 64;
    cx.font = '500 18px "JetBrains Mono", monospace';
    cx.fillStyle = 'rgba(34,211,238,0.7)';
    cx.textBaseline = 'middle';
    var labels = { US: 'USN CARRIER GROUP', RU: 'RU NAVAL GROUP', IR: 'IRGCN PATROL', CN: 'PLAN TASK FORCE', GB: 'RN TASK GROUP' };
    cx.fillText(labels[cc] || 'NAVAL VESSEL', 4, 32);
    var tex = new THREE.CanvasTexture(cv);
    tex.minFilter = THREE.LinearFilter;
    var label = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, sizeAttenuation: true }));
    label.position.copy(pos.clone().add(pos.clone().normalize().multiplyScalar(0.02)));
    label.scale.set(0.12, 0.03, 1);
    milGroup.add(label);

    activeShips.push({ ship: ship, radar: radar, label: label, phase: Math.random() * Math.PI * 2 });
  }

  // ── PLACE WARSHIPS IN KEY NAVAL AREAS ──
  function deployNavalForces() {
    // US carrier groups
    createWarship(26.5, 56.0, 'US');   // USS carrier in Strait of Hormuz
    createWarship(33.8, 33.0, 'US');   // USS carrier Eastern Med
    createWarship(14.0, 43.5, 'US');   // USS carrier Red Sea
    createWarship(35.5, 140.0, 'US');  // USS carrier Western Pacific

    // Russian navy
    createWarship(34.5, 35.2, 'RU');   // Russian fleet Syria/Tartus
    createWarship(44.5, 33.5, 'RU');   // Russian Black Sea Fleet

    // Iran IRGCN
    createWarship(27.0, 52.5, 'IR');   // IRGCN Persian Gulf
    createWarship(25.5, 57.5, 'IR');   // IRGCN Gulf of Oman

    // UK
    createWarship(12.5, 44.0, 'GB');   // RN Red Sea / Bab el-Mandeb
  }

  // ── ANIMATION LOOP ──
  var missileTimer = setInterval(function () {
    // Update missiles
    for (var i = activeMissiles.length - 1; i >= 0; i--) {
      var m = activeMissiles[i];
      if (m.dead) continue;
      m.idx += 1;

      if (m.idx >= m.pts.length) {
        if (!m.hit) {
          m.hit = true;
          createExplosion(m.pts[m.pts.length - 1], m.color);
          if (typeof showToast === 'function') {
            showToast('\uD83D\uDE80 STRIKE IMPACT: ' + m.evt.headline, m.colorHex);
          }
          // Cleanup after delay
          (function (mm, ii) {
            setTimeout(function () {
              mm.dead = true;
              milGroup.remove(mm.head); milGroup.remove(mm.glow); milGroup.remove(mm.trail);
              mm.head.geometry.dispose(); mm.head.material.dispose();
              mm.glow.geometry.dispose(); mm.glow.material.dispose();
              mm.trail.geometry.dispose(); mm.trail.material.dispose();
              activeMissiles.splice(activeMissiles.indexOf(mm), 1);
            }, 2000);
          })(m, i);
        }
        continue;
      }

      // Move head
      m.head.position.copy(m.pts[m.idx]);
      m.glow.position.copy(m.pts[m.idx]);
      m.glow.material.opacity = 0.3 + 0.2 * Math.sin(m.idx * 0.3);

      // Update trail
      var trailPts = m.pts.slice(Math.max(0, m.idx - 30), m.idx + 1);
      if (trailPts.length >= 2) {
        m.trail.geometry.dispose();
        m.trail.geometry = new THREE.BufferGeometry().setFromPoints(trailPts);
      }
      m.trail.material.opacity = 0.5 + 0.2 * Math.sin(m.idx * 0.2);
    }

    // Update jets
    for (var j = activeJets.length - 1; j >= 0; j--) {
      var jt = activeJets[j];
      if (jt.done) continue;
      jt.idx += 1;

      if (jt.idx >= jt.pts.length) {
        jt.done = true;
        milGroup.remove(jt.jet); milGroup.remove(jt.engine); milGroup.remove(jt.contrail);
        jt.jet.geometry.dispose(); jt.jet.material.dispose();
        jt.engine.geometry.dispose(); jt.engine.material.dispose();
        jt.contrail.geometry.dispose(); jt.contrail.material.dispose();
        activeJets.splice(j, 1);
        continue;
      }

      // Move jet
      jt.jet.position.copy(jt.pts[jt.idx]);
      jt.engine.position.copy(jt.pts[jt.idx]);
      jt.engine.material.opacity = 0.4 + 0.3 * Math.sin(jt.idx * 0.5);

      // Orient jet along path
      if (jt.idx < jt.pts.length - 1) {
        jt.jet.lookAt(jt.pts[jt.idx + 1]);
      }

      // Update contrail
      var cPts = jt.pts.slice(Math.max(0, jt.idx - 50), jt.idx + 1);
      if (cPts.length >= 2) {
        jt.contrail.geometry.dispose();
        jt.contrail.geometry = new THREE.BufferGeometry().setFromPoints(cPts);
      }
      jt.contrail.material.opacity = Math.max(0.05, 0.2 - jt.idx * 0.001);
    }

    // Pulse warship radars
    var time = Date.now() * 0.001;
    activeShips.forEach(function (s) {
      var pulse = 1 + 0.5 * Math.sin(time * 2 + s.phase);
      s.radar.scale.set(pulse, pulse, pulse);
      s.radar.material.opacity = 0.15 + 0.15 * Math.sin(time * 2 + s.phase);
    });

  }, 25);

  // ── AUTO-LAUNCH: missiles for strike events ──
  setInterval(function () {
    if (typeof allEvents === 'undefined' || !allEvents.length) return;
    var strikes = allEvents.filter(function (e) {
      return e.type === 'strike' || e.type === 'explosion_remote_violence';
    });
    if (strikes.length > 0) {
      var e = strikes[Math.floor(Math.random() * strikes.length)];
      launchMissile(e);
    }
  }, 12000);

  // ── AUTO-LAUNCH: jets for battle events ──
  setInterval(function () {
    if (typeof allEvents === 'undefined' || !allEvents.length) return;
    var battles = allEvents.filter(function (e) {
      return e.type === 'battle' || e.type === 'strike';
    });
    if (battles.length > 0) {
      var e = battles[Math.floor(Math.random() * battles.length)];
      createJet(e);
    }
  }, 18000);

  // ── INITIAL VOLLEY on load ──
  setTimeout(function () {
    if (typeof allEvents === 'undefined' || !allEvents.length) return;
    // Fire 3 missiles at strike locations
    var strikes = allEvents.filter(function (e) { return e.type === 'strike'; }).slice(0, 5);
    strikes.forEach(function (e, i) {
      setTimeout(function () { launchMissile(e); }, i * 3000);
    });
    // Launch 2 jets
    var battles = allEvents.filter(function (e) { return e.type === 'battle'; }).slice(0, 3);
    battles.forEach(function (e, i) {
      setTimeout(function () { createJet(e); }, 2000 + i * 4000);
    });
  }, 3000);

  // Deploy naval forces
  setTimeout(deployNavalForces, 2000);

  // ── EXPOSE for console testing ──
  window.launchMissile = launchMissile;
  window.createJet = createJet;
  window.createExplosion = function (lat, lon) {
    createExplosion(ll2v(lat, lon, GLOBE_R + 0.012), new THREE.Color('#EF4444'));
  };

})();
