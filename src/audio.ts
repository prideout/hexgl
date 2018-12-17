// -------------------------------------------------------------------------------------------------
// The Audio class observes the properties on a Vehicle and plays sounds appropriately.
//
//   - constructor(vehicle: Vehicle)
//   - init()
//   - render()
//
// HexGL by Thibaut 'BKcore' Despoulain <http://bkcore.com>
// Rewritten by Philip Rideout <https://prideout.net>
// -------------------------------------------------------------------------------------------------

import * as Filament from "filament";
import Vehicle from "./vehicle";

const audioUrls = ["audio/boost.ogg", "audio/crash.ogg", "audio/wind.ogg"];

export default class Audio {
    private readonly sources: {
        [propName: string]: AudioBufferSourceNode;
    };
    private readonly states: {
        [propName: string]: boolean;
    };
    private readonly vehicle: Vehicle;

    private hasInteracted: boolean;
    private loadTasks: number;
    private ready: boolean;
    private context: AudioContext;

    constructor(vehicle: Vehicle) {
        this.vehicle = vehicle;
        this.ready = false;
        this.sources = {};
        this.states = {};

        // Chrome does not allow creation of an AudioContext until the user performs some sort of
        // interaction, such as a key press.
        this.hasInteracted = false;
        document.addEventListener("keydown", (event) => {
            if (!this.hasInteracted) {
                this.hasInteracted = true;
                this.load();
            }
            // Press 'M' to permanently mute the game.
            if (event.keyCode === 77) {
                this.context.suspend();
            }
        });

        // There are two things that must occur before loading the audio context: the user
        // should interact in some way, and all the OGG data must be available.
        this.loadTasks = 2;
    }

    public init() {
        Filament.fetch(audioUrls, this.load.bind(this));
    }

    public render() {
        if (!this.ready) {
            return;
        }
        if (this.vehicle.collisionState.left) {
            this.playOnce("crash");
        }
        if (this.vehicle.collisionState.right) {
            this.playOnce("crash");
        }
        if (this.vehicle.collisionState.front) {
            this.playOnce("crash");
        }
        if (this.vehicle.boosted) {
            // This particular sound has a longish segue at the beginning, which gives the
            // impression of latency, so we chop off the first half-second.
            this.playOnce("boost", 0.5);
        }
        if (this.vehicle.accelerating) {
            this.play("background");
        } else {
            this.stop("background");
        }
    }

    private playOnce(id, offsetInSeconds = 0) {
        const source = this.context.createBufferSource();
        source.buffer = this.sources[id].buffer;
        source.connect(this.context.destination);
        source.loop = false;
        source.start(0, offsetInSeconds);
    }

    private play(id) {
        if (!this.states[id]) {
            this.sources[id].connect(this.context.destination);
            this.states[id] = true;
        }
    }

    private stop(id) {
        if (this.states[id]) {
            this.sources[id].disconnect();
            this.states[id] = false;
        }
    }

    private load() {
        if (--this.loadTasks > 0) {
            return;
        }

        const audioData = {
            boost: Filament.assets[audioUrls[0]].buffer,
            crash: Filament.assets[audioUrls[1]].buffer,
            background: Filament.assets[audioUrls[2]].buffer,
        };

        const context = this.context = new AudioContext();

        let decodeTasks = Object.keys(audioData).length;
        const onDecode = (name: string, source: AudioBufferSourceNode) => {
            this.sources[name] = source;
            this.states[name] = false;
            if (--decodeTasks === 0) {
                this.ready = true;
                this.sources["background"].start();
            }
        };

        context.decodeAudioData(audioData["boost"], (buffer) => {
            const boost = context.createBufferSource();
            boost.buffer = buffer;
            boost.connect(context.destination);
            boost.loop = false;
            onDecode("boost", boost);
        });

        context.decodeAudioData(audioData["crash"], (buffer) => {
            const crash = context.createBufferSource();
            crash.buffer = buffer;
            crash.connect(context.destination);
            crash.loop = false;
            onDecode("crash", crash);
        });

        context.decodeAudioData(audioData["background"], (buffer) => {
            const background = context.createBufferSource();
            background.buffer = buffer;
            background.loop = true;
            onDecode("background", background);
        });
    }
}
