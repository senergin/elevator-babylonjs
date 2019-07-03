# Demo

https://github.com/senergin/elevator-babylonjs

# Simple elevator simulation with Babylon.js

Built in an afternoon, I wanted to play with the idea and Babylon.js a bit.

## How to run

1. npm install .
2. npm run build . This should start a watch process.
3. Open index.html

## Rules of the elevator:

1. When idle, elevator will ascend to serve requests. Else it will descend.
2. When going in a direction, elevator will pick up all passangers going in the same direction.
3. Elevator will serve requests given inside the elevator.
4. Per simulation step, elevator can move between one floor to another, and decide whether to pick up (or drop) passengers.

## Controls

1. Center of the screen is 3D visualization of the elevator. Only there to look cool.
2. Left panel is the outside control of the elevator.
3. Right top panel is the inside control of the elevator.
4. Step: Will stop autoplay, and run the simulation one step.
5. Run: Will toggle autoplay, turned on by default. When autoplay is on, it will run simulation steps with a time delta.
6. Reset: Resets the simulation to its initial state.

## Things to look for in the code

1. All code is under src/index.ts.
2. Search for ELEVATOR_LOGIC to see how elevator decides directioning, and serving requests.
3. FLOOR_COUNT to change number of floors.
4. TICK_DELTA_MS to change the delta time of simulation steps.
