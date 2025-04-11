import * as E from "../../../src/event/event";
import * as R from "../../../src/reactive/reactive";
import { fromDOMEvent } from "../../../src/helpers";

function dynamicEventExample() {
    // Create the selector button event
    const selectorButton = document.getElementById("selector")!;
    const selectorEvent = fromDOMEvent(selectorButton, "click");

    // IDs of the potential target buttons
    const buttonIds = ["button-1", "button-2", "button-3"];

    // Create a reactive value that contains the currently selected button ID
    const selectedButtonIdReactive = E.stepper(E.map(selectorEvent, () => {
        // Select a random button ID
        const randomIndex = Math.floor(Math.random() * buttonIds.length);
        const selectedId = buttonIds[randomIndex];
        console.log(`Selected button: ${selectedId}`);
        return selectedId;
    }), "button-1");

    // Create a reactive value that holds the selected button element
    const selectedButtonReactive = R.map(selectedButtonIdReactive, (id) => {
        const element = document.getElementById(id)!;
        console.log("Selected button changed");
        // Highlight the selected buttonk
        buttonIds.forEach((btnId) => {
            const btn = document.getElementById(btnId)!;
            btn.classList.remove("selected");
        });
        element.classList.add("selected");
        return element;
    });

    const dynamicClickEvent = E.switchE(
        fromDOMEvent(R.get(selectedButtonReactive), "click"),
        E.map(selectorEvent, () =>
            fromDOMEvent(R.get(selectedButtonReactive), "click"),
        ),
    );

    // Count the clicks on the dynamically selected button
    const clickCountReactive = E.fold(
        dynamicClickEvent,
        0,
        (count, _) => count + 1,
    );

    // Display the click count
    R.subscribe(clickCountReactive, (count) => {
        console.log(`Click count: ${count}`);
        document.getElementById("click-count")!.textContent = count.toString();
    });

    // Also display which button is currently selected
    R.subscribe(selectedButtonIdReactive, (id) => {
        document.getElementById("selected-button-id")!.textContent = id;
    });

    // Return a cleanup function for the entire system
    return () => {
        E.cleanup(dynamicClickEvent);
        console.log("All event listeners and subscriptions cleaned up");
    };
}

// Call the function to set up the example
const cleanup = dynamicEventExample();

// Optional: Set up cleanup on page unload
window.addEventListener("beforeunload", cleanup);

