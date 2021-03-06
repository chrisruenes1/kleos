const Drum = require('./drum');
const Util = require('./util');

const RATIOS = [2, 3, 4.16, 5.43, 6.79, 8.21]; //ratios for metallic overtones

const Cymbal = function(options = {}){
  this.playing = true;
  //child classes determine frequency and duration
  Drum.call(this, options);
};

Util.inherits(Cymbal, Drum);

Cymbal.prototype.attack = function(startTime, filterNodes){
  this.playing = true;
  this.onTime = this.currentTime(); //called by visualizer
  //begin by building the audio graph
  let bandpass = this.generateBiquadFilter({
    type:"bandpass",
    cutoffFreq: 10000
  });
  
  let highpass = this.generateBiquadFilter({
    type:"highpass",
    cutoffFreq: 7000
  });
  
  this.envelope = this.generateEnvelope();

  // //now generate the oscillators for various overtones of the hit
  this.oscillators = RATIOS.map((ratio) => {
    let oscillator = this.generateOscillator(this.frequency * ratio);
    oscillator.type="square";
    this.buildAudioGraph(filterNodes, oscillator, bandpass, highpass, this.envelope);
    let when = startTime > this.currentTime() ?
    startTime - this.currentTime() :
    0;
    
    oscillator.start(when);
    return oscillator;
  });
};

Cymbal.prototype.release = function(){
  let time = this.currentTime();
  this.envelope.gain.exponentialRampToValueAtTime(1, time + 0.02);
  this.envelope.gain.exponentialRampToValueAtTime(0.3, time + 0.03);
  this.envelope.gain.exponentialRampToValueAtTime(0.01, time + this.duration);
  this.oscillators.forEach((oscillator) => {
    oscillator.stop(time + this.duration);
    oscillator.onended = () => {
      this.playing = false;
      this.onTime = null;
      this.envelope.disconnect();
      this.silentEnvelope.disconnect();
    };
  });
};

module.exports = Cymbal;
