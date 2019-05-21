import { Animation, EasingFunction, Engine, HemisphericLight, Mesh, MeshBuilder, Scene, SineEase, TargetCamera, Vector3 } from "babylonjs";
import { AdvancedDynamicTexture, Button, Rectangle, TextBlock } from "babylonjs-gui";

// Engine elements
const _canvas: HTMLCanvasElement = document.getElementById("renderCanvas") as HTMLCanvasElement;
const _engine: Engine = new Engine(_canvas, true);
let _uiTexture: AdvancedDynamicTexture = null;

// Constants
const UI_WIDTH: number = _canvas.width;
const UI_HEIGHT: number = _canvas.height;
const FLOOR_COUNT: number = 10;
const TICK_DELTA_MS: number = 1000;
const CAMERA_DISTANCE: number = 3;
const SCENE_HEIGHT: number = 2;

// UI elements
const _labels: Rectangle[] = new Array<Rectangle>(FLOOR_COUNT);
const _upButtons: Button[] = new Array<Button>(FLOOR_COUNT);
const _downButtons: Button[] = new Array<Button>(FLOOR_COUNT);
const _goButtons: Button[] = new Array<Button>(FLOOR_COUNT);
let _autoPlayButton: Button = null;

// Visualization elements
let _elevatorBox: Mesh = null;
let _elevatorAnimation: Animation = null;
let _currentTime = 0;
let _nextTickTime = TICK_DELTA_MS;
let _autoPlay: boolean = true;

// ELEVATOR_LOGIC
let _curFloor: number = 1;
let _curDirection: number = 0;
const _upRequests: boolean[] = new Array<boolean>(FLOOR_COUNT);
const _downRequests: boolean[] = new Array<boolean>(FLOOR_COUNT);

// Function to update requests and direction.
function updateState(): void
{
    // Reset request if you are going in the same direction with the request
    // It won't clear requests just because it visited the floor.
    if (_curDirection >= 0) {
        _upRequests[_curFloor - 1] = false;
    }
    if (_curDirection <= 0) {
        _downRequests[_curFloor - 1] = false;
    }

    // Up or still. Still will try to climb up by default.
    if (_curDirection >= 0) {
        // See if you can climb further
        _curDirection = 0;
        for (let i: number = _curFloor; _curDirection == 0 && i < FLOOR_COUNT; ++i) {
            if (_upRequests[i] || _downRequests[i]) {
                _curDirection = 1;
            }
        }
        // If not, it will either come to halt or descend
        if (_curDirection == 0) {
            for (let i: number = _curFloor - 2; _curDirection == 0 && i >= 0; --i) {
                if (_upRequests[i] || _downRequests[i]) {
                    _curDirection = -1;
                }
            }
        }
    } else {
        // See if you can descend further
        _curDirection = 0;
        for (let i: number = _curFloor - 2; _curDirection == 0 && i >= 0; --i) {
            if (_upRequests[i] || _downRequests[i]) {
                _curDirection = -1;
            }
        }
        // If not, it will either come to halt or ascend
        if (_curDirection == 0) {
            for (let i: number = _curFloor; _curDirection == 0 && i < FLOOR_COUNT; ++i) {
                if (_upRequests[i] || _downRequests[i]) {
                    _curDirection = 1;
                }
            }
        }
    }

    // Reset requests with this new direction now
    if (_curDirection >= 0) {
        _upRequests[_curFloor - 1] = false;
    }
    if (_curDirection <= 0) {
        _downRequests[_curFloor - 1] = false;
    }

    clearUI(_curFloor);
}

// Common function to register a request
function registerRequest(floor: number, direction: number)
{
    if (direction > 0) {
        _upRequests[floor - 1] = true;
    } else if (direction < 0) {
        _downRequests[floor - 1] = true;
    }
}

// Step function of the simulation
function tick(): void
{
    // Move the elevator if a direction is set.
    if (_curDirection != 0) {
        const oldFloor: number = _curFloor;
        _curFloor = Math.min(Math.max(_curFloor + _curDirection, 0), FLOOR_COUNT);
        moveElevator(oldFloor, _curFloor);
    }

    clearUI(_curFloor);
    updateState();
}

// End of ELEVATOR_LOGIC

// Set the scene
const _scene: Scene = createScene();
moveElevator(_curFloor, _curFloor);

// Run the engine
_engine.runRenderLoop(() => {
    if (_autoPlay) {
        _currentTime += _engine.getDeltaTime();
        while (_currentTime > _nextTickTime) {
            tick();
            _nextTickTime += TICK_DELTA_MS;
        }
    }
    _scene.render();
});

// Utility
function getFloorPosition(floor: number): Vector3
{
    const floorH: number = SCENE_HEIGHT / FLOOR_COUNT;
    return new Vector3(0, floor * floorH, 0);
}

// Updates the visuals when elevator floor changes
function moveElevator(oldFloor: number, newFloor: number): void
{
    clearUI(oldFloor);
    clearUI(newFloor);

    var animKeys = [];
    animKeys.push({ frame: 0, value: getFloorPosition(oldFloor) });
    animKeys.push({ frame: 30, value: getFloorPosition(newFloor) });
    _elevatorAnimation.setKeys(animKeys);
    _scene.beginAnimation(_elevatorBox, 0, 30, false);
}

// Update request UI. Autoplay is self managing
function clearUI(floor: number): void
{
    _labels[floor - 1].background = _curFloor == floor ? "blue" : "grey";
    if (floor != FLOOR_COUNT && _upButtons[floor - 1].background == "yellow" && !_upRequests[floor - 1]) {
        _upButtons[floor - 1].background = "green";
    }
    if (floor != 1 && _downButtons[floor - 1].background == "yellow" && !_downRequests[floor - 1]) {
        _downButtons[floor - 1].background =  "green";
    }
    if (_goButtons[floor - 1].background == "yellow" && _curFloor == floor) {
        _goButtons[floor - 1].background = "green";
    }
}

function onUpButton(floor: number): void
{
    if (_curFloor != floor) {
        registerRequest(floor, 1);
        _upButtons[floor - 1].background = "yellow";
    }
}

function onDownButton(floor: number): void
{
    if (_curFloor != floor) {
        registerRequest(floor, -1);
        _downButtons[floor - 1].background = "yellow";
    }
}

function onGoButton(floor: number): void
{
    if (_curFloor != floor) {
        registerRequest(floor, floor - _curFloor);
        _goButtons[floor - 1].background = "yellow"
    }
}

function onMove(): void
{
    if (_autoPlay) {
        setAutoplay(false);
    }
    tick();
}

function setAutoplay(value: boolean): void
{
    _autoPlay = value;
    _autoPlayButton.background = _autoPlay ? "blue" : "green";
    _currentTime = 0;
    _nextTickTime = TICK_DELTA_MS;
}

function reset(): void
{
    _autoPlay = true;
    _currentTime = 0;
    _nextTickTime = TICK_DELTA_MS;
    _curFloor = 1;
    _curDirection = 0;
    for (let i: number = 0; i < FLOOR_COUNT; ++i) {
        _upRequests[i] = false;
        _downRequests[i] = false;
        clearUI(i + 1);
    }
    moveElevator(_curFloor, _curFloor);
}

function createScene(): Scene {
    const scene: Scene = new Scene(_engine);

    const camera: TargetCamera = new TargetCamera("Camera", new Vector3(CAMERA_DISTANCE, SCENE_HEIGHT, CAMERA_DISTANCE), scene);
    camera.attachControl(_canvas, true); 
    camera.setTarget(new Vector3(0, SCENE_HEIGHT / 2, 0));

    const light1: HemisphericLight = new HemisphericLight("light1", camera.position, scene);

    for (let i: number= 0; i < FLOOR_COUNT; ++i) {
        const floor: number = FLOOR_COUNT - i;
        const floorBox: Mesh = MeshBuilder.CreateBox("floor_" + floor, {width: 2, height: 0.005, depth: 0.01}, scene);
        floorBox.position = getFloorPosition(floor);
    }

    _elevatorBox = MeshBuilder.CreateBox("elevator", {width: 0.1, height: 0.1, depth: 0.1}, scene);
    _elevatorBox.position = getFloorPosition(1);

    _elevatorAnimation = new Animation("elevatorAnimation", "position", 30, Animation.ANIMATIONTYPE_VECTOR3, 0 /* loopMode */, false /* enableBlending */);
    var easingFunction = new SineEase();
    easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
    _elevatorAnimation.setEasingFunction(easingFunction);
    _elevatorBox.animations.push(_elevatorAnimation);

    createUI();

    return scene;
}

function createUI(): void {

    _uiTexture = AdvancedDynamicTexture.CreateFullscreenUI("ui1");
    _uiTexture.idealWidth = UI_WIDTH;
    _uiTexture.idealHeight = UI_HEIGHT;

    // Floor labels and call buttons
    {
        const panelTopRatio: number = 0.15;
        const panelHToUIRatio: number = 0.8;
        const buttonHToPanelRatio: number = 0.5;
        const firstTop: number = UI_HEIGHT * (panelTopRatio - 0.5);
        const panelH: number = panelHToUIRatio * UI_HEIGHT;
        const buttonPH: number = panelH / FLOOR_COUNT;
        const bHeight: number = buttonPH * buttonHToPanelRatio;

        const panelLeftRatio: number = 0.1;
        const panelWToUIRatio: number = 0.15;
        const buttonWToPanelRatio: number = 0.8;
        const firstLeft: number = UI_WIDTH * (panelLeftRatio - 0.5);
        const panelW: number = panelWToUIRatio * UI_WIDTH;
        // Filling 3 elements in the same row
        const bWidth: number = panelW * 0.33 * buttonWToPanelRatio;

        for (let i = 0; i < FLOOR_COUNT; ++i) {
            const floor: number = FLOOR_COUNT - i;

            // Floor labels
            const label = new Rectangle("label_" + floor);
            label.left = firstLeft;
            label.top = firstTop + (buttonPH * i);
            label.width = bWidth + "px";
            label.height = bHeight + "px";
            label.background = "grey"
            const labelText = new TextBlock();
            labelText.text = "Floor " + floor;
            labelText.color = "white";
            label.addControl(labelText);  
            _uiTexture.addControl(label);

            _labels[FLOOR_COUNT - 1 - i] = label;

            // Up call buttons
            if (i != 0) {
                const button = Button.CreateSimpleButton("up_" + floor, "Up");
                button.left = firstLeft + (panelW / 3);
                button.top = firstTop + (buttonPH * i);
                button.width = bWidth + "px";
                button.height = bHeight + "px";
                button.color = "white";
                button.background = "green";
                button.onPointerClickObservable.add(() => onUpButton(floor));
                _uiTexture.addControl(button);
                _upButtons[floor - 1] = button;
            }

            // Down call buttons
            if (i != FLOOR_COUNT - 1) {
                const button = Button.CreateSimpleButton("down_" + floor, "Down");
                button.left = firstLeft + (2 * (panelW / 3));
                button.top = firstTop + (buttonPH * i);
                button.width = bWidth + "px";
                button.height = bHeight + "px";
                button.color = "white";
                button.background = "green";
                button.onPointerClickObservable.add(() => onDownButton(floor));
                _uiTexture.addControl(button);
                _downButtons[floor - 1] = button;
            }
        }
    }

    // Go buttons and tick
    {
        const columnCount: number = 3;
        const rowCount: number = Math.ceil(FLOOR_COUNT / columnCount);
        const panelTopRatio: number = 0.15;
        const panelHToUIRatio: number = 0.4;
        const buttonHToPanelRatio: number = 0.8;
        const firstTop: number = UI_HEIGHT * (panelTopRatio - 0.5);
        const panelH: number = panelHToUIRatio * UI_HEIGHT;
        const buttonPH: number = panelH / rowCount;
        const bHeight: number = buttonPH * buttonHToPanelRatio;

        const panelRightRatio: number = 0.1;
        const panelWToUIRatio: number = 0.15;
        const buttonWToPanelRatio: number = 0.8;
        const firstLeft: number = UI_WIDTH * (0.5 - panelRightRatio - panelWToUIRatio);
        const panelW: number = panelWToUIRatio * UI_WIDTH;
        const bWidth: number = panelW * (1 / columnCount) * buttonWToPanelRatio;

        for (let i = 0; i < FLOOR_COUNT; ++i) {
            const floor: number = FLOOR_COUNT - i;
            const row: number = Math.floor(i / columnCount);
            const col: number = Math.floor(i % columnCount);
            const button = Button.CreateSimpleButton("go_" + floor, floor.toString());
            button.left = firstLeft + (col * (panelW / columnCount));
            button.top = firstTop + (buttonPH * row);
            button.width = bWidth + "px";
            button.height = bHeight + "px";
            button.color = "white";
            button.background = "green";
            button.onPointerClickObservable.add(() => onGoButton(floor));
            _uiTexture.addControl(button);
            _goButtons[floor - 1] = button;
        }

        {
            const button = Button.CreateSimpleButton("step", "Step");
            button.left = firstLeft;
            button.top = firstTop + panelH + bHeight;
            button.width = bWidth + "px";
            button.height = bHeight + "px";
            button.color = "white";
            button.background = "green";
            button.onPointerClickObservable.add(() => onMove());
            _uiTexture.addControl(button);
        }

        {
            const button = Button.CreateSimpleButton("autoplay", "Run");
            button.left = firstLeft + 1.1 * bWidth;
            button.top = firstTop + panelH + bHeight;
            button.width = bWidth + "px";
            button.height = bHeight + "px";
            button.color = "white";
            button.background = "green";
            button.onPointerClickObservable.add(() => setAutoplay(!_autoPlay));
            _uiTexture.addControl(button);
            _autoPlayButton = button;
            setAutoplay(_autoPlay);
        }

        {
            const button = Button.CreateSimpleButton("reset", "Reset");
            button.left = firstLeft + 2.2 * bWidth;
            button.top = firstTop + panelH + bHeight;
            button.width = bWidth + "px";
            button.height = bHeight + "px";
            button.color = "white";
            button.background = "green";
            button.onPointerClickObservable.add(() => reset());
            _uiTexture.addControl(button);
        }
    }
}