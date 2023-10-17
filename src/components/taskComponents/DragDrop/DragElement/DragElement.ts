import type { InteractEvent } from "@interactjs/types";

export type CSSIDSelector = string;

export interface DragElementProps {
  elementSelector: CSSIDSelector;
}

export const dragSetupCallBackHandler = (event: InteractEvent) => {
  const interaction = event.interaction;

  if (interaction.pointerIsDown && !interaction.interacting()) {
    const target = event.currentTarget;
    const shadowElement = <HTMLElement>event.currentTarget.cloneNode(true);
    // shadowElement.id = shadowElement.id + "-shadow";

    const targetBounding = target.getBoundingClientRect();

    // add dragging class
    shadowElement.classList.add("dragging");

    // translate the element
    shadowElement.style.transform = "translate(0px, 0px)";
    shadowElement.style.position = "absolute";
    shadowElement.style.top = targetBounding.top + window.scrollY + "px";
    shadowElement.style.left = targetBounding.left + window.scrollX + "px";
    shadowElement.setAttribute("data-x", "0");
    shadowElement.setAttribute("data-y", "0");

    // insert the shadowElement to the page
    document.body.appendChild(shadowElement);

    // start a drag interaction targeting the shadowElement
    interaction.start({ name: "drag" }, event.interactable, shadowElement);
  }
};

export const dragMoveCallBackHandler = (event: InteractEvent) => {
  event.preventDefault();

  const target = event.target;
  // keep the dragged position in the data-x/data-y attribute;
  // TODO: fix division hack for appropriate drag speed
  const x = (parseFloat(String(target.getAttribute("data-x"))) || 0) + event.dx / 3;
  const y = (parseFloat(String(target.getAttribute("data-y"))) || 0) + event.dy / 3;

  // translate the element
  target.style.transform = target.style.transform = "translate(" + x + "px, " + y + "px)";

  // update the posiion attributes
  target.setAttribute("data-x", String(x));
  target.setAttribute("data-y", String(y));
};

export const dragEndCallBackHandler = (event: InteractEvent) => {
  event.target.remove();
};
