define(
[
	'Vector/Vector',
	'Vector/Line'
],
function (Vector, Line) {
	var lightningCanvas = document.getElementById('lightning'),
		lightningCtx = lightningCanvas.getContext('2d'),

		observerCanvas = document.getElementById('observer'),
		observerCtx = observerCanvas.getContext('2d'),

		waveCanvas = document.getElementById('wave'),
		waveCtx = waveCanvas.getContext('2d'),

		debugCanvas = document.getElementById('debug'),
		debugCtx = debugCanvas.getContext('2d'),

		audioCtx;

	var lightningBolt, observer,
		time, lastTime;

	var tone, volume;

	var debug = true;


	var createLightning = function () {
		var lightning = {},
			currentPoint,
			segment;

		lightning.origin = new Vector(400, 20, 0);
		lightning.paths = [];

		currentPoint = lightning.origin;
		while (currentPoint.j < 880) {
			segment = new Vector(
				Math.floor(Math.random()*140-70),
				Math.floor(Math.random()*80-20),
				0
			);

			currentPoint = currentPoint.add(segment);
			if (currentPoint.j > 900) {
				segment.j -= 900 - currentPoint.j;
				currentPoint.j = 900;
			}

			lightning.paths.push({
				origin: new Vector(currentPoint.i, currentPoint.j, currentPoint.k),
				direction: segment
			});
		}

		return lightning;
	};

	var drawLightning = function (lightning) {
		lightningCtx.save();

		lightningCtx.clearRect(0, 0, lightningCanvas.width, lightningCanvas.height);

		lightningCtx.strokeStyle = '#fff';
		lightningCtx.beginPath();
		lightningCtx.translate(lightning.origin.i, lightning.origin.j);
		lightningCtx.moveTo(0, 0);
		for (var i = 0; i < lightning.paths.length; i++) {
			lightningCtx.translate(lightning.paths[i].direction.i, lightning.paths[i].direction.j);
			lightningCtx.lineTo(0, 0);

		}
		lightningCtx.stroke();

		lightningCtx.restore();
	};

	var drawObserver = function (observer) {
		observerCtx.save();

		observerCtx.fillStyle = '#00f';
		observerCtx.beginPath();
		observerCtx.translate(observer.i, observer.j);
		observerCtx.arc(0, 0, 30, 0, Math.PI*2);
		observerCtx.fill();

		observerCtx.restore();
	};

	var timeToDistance = function (timestamp) {
		var speedOfSound = 0.1;

		return timestamp * speedOfSound;
	};

	var drawWaveFrame = function (distance) {
		waveCtx.save();

		waveCtx.clearRect(0, 0, 900, 900);

		waveCtx.strokeStyle = '#f00';
		waveCtx.beginPath();
		waveCtx.translate(observer.i, observer.j);
		waveCtx.arc(0, 0, distance, 0, Math.PI*2);
		waveCtx.stroke();

		waveCtx.restore();
	};

	var findClosestPoint = function (a, b, o) {
		var ab, oa, ob, oab,
			acMag, ac, c;

		ab = b.subtract(a);
		oa = a.subtract(o);
		ob = b.subtract(o);

		oab = Math.acos(ab.dot(oa)/(ab.magnitude()*oa.magnitude()));

		if (oab < Math.PI/2) {
			return false;
		}

		acMag = Math.abs(Math.cos(oab)*oa.magnitude());

		ac = ab.multiply(acMag/ab.magnitude());
		c = a.add(ac);

		if (ac.magnitude() > ab.magnitude() || c.subtract(b).magnitude() > ab.magnitude()) {
			return false;
		}

		if (debug) {
			debugCtx.save();

			debugCtx.strokeStyle = '#f00';
			debugCtx.beginPath();
			debugCtx.arc(a.i, a.j, 3, 0, Math.PI*2);
			debugCtx.stroke();

			debugCtx.strokeStyle = '#00f';
			debugCtx.beginPath();
			debugCtx.arc(b.i, b.j, 3, 0, Math.PI*2);
			debugCtx.stroke();

			debugCtx.strokeStyle = '#0f0';
			debugCtx.beginPath();
			debugCtx.arc(c.i, c.j, 3, 0, Math.PI*2);
			debugCtx.stroke();

			debugCtx.restore();
		}

		return c;
	};

	var findNumIntercepts = function (lightning, observer, distance) {
		var numIntercepts = 0;

		for (var i = 0; i < lightning.paths.length; i++) {
			var path = lightning.paths[i],
				a = lightning.paths[i].origin,
				b = a.subtract(lightning.paths[i].direction),

				c = findClosestPoint(a, b, observer),

				oa = a.subtract(observer),
				ob = b.subtract(observer),
				oc;

			observerCtx.save();

			if (c) {

				oc = c.subtract(observer);

				if ((oa.magnitude() > distance) != (oc.magnitude() > distance)) {
					numIntercepts++;
				}
				if ((ob.magnitude() > distance) != (oc.magnitude() > distance)) {
					numIntercepts++;
				}

			} else if ((oa.magnitude() > distance) != (ob.magnitude() > distance)) {
				numIntercepts++;
			}

			observerCtx.restore();
		}

		return numIntercepts;
	};

	var lightningStrike = function () {
		lightningBolt = createLightning();
		drawLightning(lightningBolt);
	};

	var doStep = function (timestamp) {
		if (time === 0) {
			lastTime = timestamp - 16;
		}
		time = timestamp - lastTime;

		var distance = timeToDistance(time);

		if (distance >= 900) {
			lastTime = timestamp;
			debugCtx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);
			lightningStrike();
		}

		var numIntercepts = findNumIntercepts(lightningBolt, observer, distance);

		drawWaveFrame(distance);


		volume.gain.value = numIntercepts;
		document.getElementById('count').innerHTML = numIntercepts;
		document.getElementById('distance').innerHTML = distance;


		window.requestAnimationFrame(doStep);
	};

	var initSound = function () {
		var AudioContext = window.AudioContext || window.webkitAudioContext;
		audioCtx = new AudioContext();

		tone = audioCtx.createOscillator();
		volume = audioCtx.createGain();

		tone.type = 'sine';
		tone.frequency.value = 200;
		tone.start();

		tone.connect(volume);

		volume.connect(audioCtx.destination);
	};

	var init = function () {
		observer = new Vector(700, 450, 0);
		drawObserver(observer);

		initSound();

		lightningStrike();

		time = lastTime = 0;
		window.requestAnimationFrame(doStep);

	};

	return {
		init: init
	};
});