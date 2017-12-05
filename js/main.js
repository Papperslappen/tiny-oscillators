var app = new PIXI.Application(1024,1024,{view:$("#oscillators")[0],backgroundColor:0x353230});
//document.body.appendChild(app.view);

var sprites = new PIXI.particles.ParticleContainer(10000, {
  scale: true,
  position: true,
  rotation: true,
  uvs: true,
  alpha: true
});
app.stage.addChild(sprites);

var ents = [];
var numEnts = app.renderer instanceof PIXI.WebGLRenderer ? 200 : 10;

// Standard Normal variate using Box-Muller transform.
function randn_bm() {
  var u = 0, v = 0;
  while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
  }

  for (var i = 0; i < numEnts; i++) {

    // create a new Sprite
    var dude = PIXI.Sprite.fromImage('img/dude1.png');
    dude.tint = Math.random() * 0xE8D4CD;
    dude.anchor.set(0.5);

    dude.scale.set(1.0);

    dude.x = Math.random() * app.renderer.width;
    dude.y = Math.random() * app.renderer.height;

    dude.offset = Math.random() * 100;
    dude.phase = Math.random()*Math.PI*2;
    dude.phaseMoment = randn_bm();
    ents.push(dude);
    sprites.addChild(dude);
  }

  var dudeBoundsPadding = 100;
  var dudeBounds = new PIXI.Rectangle(
    -dudeBoundsPadding,
    -dudeBoundsPadding,
    app.renderer.width + dudeBoundsPadding * 2,
    app.renderer.height + dudeBoundsPadding * 2
  );

  var equationScale = Math.min(dudeBounds.width,dudeBounds.height);

  var tick = 0;

  var paramScale = equationScale/4;
  var param = {
    A: paramScale * 1,
    B: paramScale * paramScale,
    J: paramScale*0.9,
    K: paramScale*(-0.1),
    sigma_sq : 0.01,
    mouseAttraction : paramScale*(-10),
    midAttraction : paramScale*0.1,
  };


  var prevmouse = {}
  var dmouse = {
    x:0,
    y:0
  }


  //Inspired by https://www.nature.com/articles/s41467-017-01190-3
  app.ticker.add(function() {
    var dt = 0.1; //set this dynamically maybe
    var mouse = app.renderer.plugins.interaction.mouse.global;

    var midx = 0
    var midy = 0

    for (var i = 0; i < ents.length; i++) {
      var dudei = ents[i];
      var dx = 0;
      var dy = 0;
      var dphase = 0;
      midx += dudei.x;
      midy += dudei.y;
      for (var j = 0; j < ents.length; j++){
        if(i != j){
          var dudej = ents[j];
          var distx = (dudej.x - dudei.x);
          var disty = (dudej.y - dudei.y);
          var distphase = dudej.phase - dudei.phase;
          var distSq = distx*distx + disty*disty;
          if(distSq == 0){
            distSq = 0.001
          }
          dx += (distx/Math.sqrt(distSq))*(param.A+param.J*(Math.cos(distphase))) - param.B*distx/distSq;
          dy += (disty/Math.sqrt(distSq))*(param.A+param.J*(Math.cos(distphase))) - param.B*disty/distSq;
          dphase += Math.sin(distphase);
        }
      }

      dx /= numEnts;
      dy /= numEnts;
      mousedistsq = (mouse.x - dudei.x)*(mouse.x - dudei.x) + (mouse.y - dudei.y)*(mouse.y - dudei.y) ;
      if(mousedistsq == 0){
        mousedistsq = 0.0001
      }
      dx += param.mouseAttraction*(mouse.x - dudei.x)/mousedistsq;
      dy += param.mouseAttraction*(mouse.y - dudei.y)/mousedistsq;
      dphase *= param.K/numEnts;
      dphase += param.sigma_sq * dudei.phaseMoment;
      dudei.x += dt*dx;
      dudei.y += dt*dy;
      dudei.phase += dt*dphase;
      dudei.rotation = dudei.phase;


      if (dudei.x < dudeBounds.x) {
        dudei.x += dudeBounds.width;
      }
      else if (dude.x > dudeBounds.x + dudeBounds.width) {
        dudei.x -= dudeBounds.width;
      }

      if (dude.y < dudeBounds.y) {
        dudei.y += dudeBounds.height;
      }
      else if (dude.y > dudeBounds.y + dudeBounds.height) {
        dudei.y -= dudeBounds.height;
      }
      if(dudei.phase < 0){
        dudei.phase += 2*Math.PI;
      }else if (dudei.phase > 2*Math.PI) {
        dudei.phase -= 2*Math.PI;
      }
    }

    //readjust center
    midx /= ents.length;
    midy /= ents.length;
    for (var i = 0; i < ents.length; i++) {
      ents[i].x += app.renderer.width/2 - midx;
      ents[i].y += app.renderer.height/2 - midy;
    }

    // increment the ticker
    tick += dt;
    param.J = paramScale*Math.sin(0.02*tick)
  });
