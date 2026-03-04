(function(){
  if(typeof THREE==='undefined'||typeof globeGroup==='undefined')return;

  const missileGroup=new THREE.Group();
  globeGroup.add(missileGroup);
  const active=[];

  function getOrigin(evt){
    if(evt.cc==='UA')return{lat:55.76,lon:37.62};
    if(evt.cc==='PS'||evt.cc==='LB')return{lat:32.08,lon:34.78};
    if(evt.cc==='YE')return{lat:24.71,lon:46.68};
    if(evt.cc==='SY'&&evt.iran)return{lat:35.69,lon:51.39};
    if(evt.cc==='IQ'&&evt.iran)return{lat:35.69,lon:51.39};
    return{lat:evt.lat+(Math.random()-0.5)*15,lon:evt.lon+(Math.random()-0.5)*15};
  }

  function launch(evt){
    var o=getOrigin(evt);
    var s=ll2v(o.lat,o.lon,GLOBE_R+0.012);
    var e=ll2v(evt.lat,evt.lon,GLOBE_R+0.012);
    var m=s.clone().add(e).multiplyScalar(0.5);
    var d=s.distanceTo(e);
    m.normalize().multiplyScalar(GLOBE_R+0.012+d*0.4);
    var curve=new THREE.QuadraticBezierCurve3(s,m,e);
    var pts=curve.getPoints(60);
    var c=new THREE.Color(ET[evt.type]?ET[evt.type].color:'#EF4444');

    var trailMat=new THREE.LineBasicMaterial({color:c,transparent:true,opacity:0.6});
    var trail=new THREE.Line(new THREE.BufferGeometry().setFromPoints([pts[0],pts[0]]),trailMat);
    missileGroup.add(trail);

    var headMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:1});
    var head=new THREE.Mesh(new THREE.SphereGeometry(0.006,8,8),headMat);
    head.position.copy(s);
    missileGroup.add(head);

    var glowMat=new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:0.5});
    var glow=new THREE.Mesh(new THREE.SphereGeometry(0.014,8,8),glowMat);
    glow.position.copy(s);
    missileGroup.add(glow);

    active.push({trail:trail,head:head,glow:glow,pts:pts,idx:0,c:c,evt:evt,hit:false});
  }

  function impact(pos,color){
    var rg=new THREE.RingGeometry(0.002,0.005,24);
    var rm=new THREE.MeshBasicMaterial({color:color,transparent:true,opacity:1,side:THREE.DoubleSide});
    var ring=new THREE.Mesh(rg,rm);
    ring.position.copy(pos);
    ring.lookAt(new THREE.Vector3(0,0,0));
    missileGroup.add(ring);

    var fm=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:1});
    var flash=new THREE.Mesh(new THREE.SphereGeometry(0.018,12,12),fm);
    flash.position.copy(pos);
    missileGroup.add(flash);

    var age=0;
    var iv=setInterval(function(){
      age+=0.04;
      var sc=1+age*10;
      ring.scale.set(sc,sc,sc);
      ring.material.opacity=Math.max(0,1-age*1.5);
      flash.scale.set(1+age*4,1+age*4,1+age*4);
      flash.material.opacity=Math.max(0,1-age*2.5);
      if(age>0.8){
        clearInterval(iv);
        missileGroup.remove(ring);
        missileGroup.remove(flash);
        rg.dispose();rm.dispose();
        flash.geometry.dispose();fm.dispose();
      }
    },16);
  }

  setInterval(function(){
    for(var i=active.length-1;i>=0;i--){
      var m=active[i];
      m.idx+=1;
      if(m.idx>=m.pts.length){
        if(!m.hit){
          m.hit=true;
          impact(m.pts[m.pts.length-1],m.c);
          if(typeof showToast==='function'){
            showToast('🚀 STRIKE: '+m.evt.headline,m.c.getStyle());
          }
          setTimeout(function(mm,ii){
            missileGroup.remove(mm.trail);
            missileGroup.remove(mm.head);
            missileGroup.remove(mm.glow);
            mm.trail.geometry.dispose();mm.trail.material.dispose();
            mm.head.geometry.dispose();mm.head.material.dispose();
            mm.glow.geometry.dispose();mm.glow.material.dispose();
            active.splice(ii,1);
          },1500,m,i);
        }
        continue;
      }
      m.head.position.copy(m.pts[m.idx]);
      m.glow.position.copy(m.pts[m.idx]);
      var drawn=m.pts.slice(0,m.idx+1);
      m.trail.geometry.dispose();
      m.trail.geometry=new THREE.BufferGeometry().setFromPoints(drawn);
    }
  },30);

  setInterval(function(){
    if(typeof allEvents==='undefined'||!allEvents.length)return;
    var strikes=allEvents.filter(function(e){
      return e.type==='strike'||e.type==='explosion_remote_violence';
    });
    if(strikes.length>0){
      var e=strikes[Math.floor(Math.random()*strikes.length)];
      launch(e);
    }
  },15000);

  setTimeout(function(){
    if(typeof allEvents==='undefined'||!allEvents.length)return;
    var strikes=allEvents.filter(function(e){return e.type==='strike';}).slice(0,3);
    strikes.forEach(function(e,i){
      setTimeout(function(){launch(e);},i*2500);
    });
  },4000);

  window.launchMissile=launch;
})();
