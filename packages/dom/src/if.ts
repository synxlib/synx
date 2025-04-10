import { Reactive } from "@synx/frp";

type IfOptions =
    | { factory: () => Node; parent: HTMLElement, template?: never }
    | { template: HTMLTemplateElement; factory?: never };

export function nodeIf(condition: Reactive<boolean>, options: IfOptions) {
    const parent: Node = options.template ? options.template.parentNode ?? document.body : options.parent;
    const placeholder = document.createComment("if");
    let insertedNodes: Node[] = [];

    if (options.template) {
        // Replace template with placeholder
        parent.replaceChild(placeholder, options.template);
    } else {
        // Insert placeholder manually if using factory
        parent.appendChild(placeholder);
    }

    condition.subscribe((value) => {
        if (value) {
            if (insertedNodes.length === 0) {
                const nodes = options.template
                    ? Array.from(
                          options.template.content.cloneNode(true).childNodes,
                      )
                    : [options.factory!()];

                insertedNodes = nodes;
                for (const node of nodes) {
                    parent.insertBefore(node, placeholder);
                }
            }
        } else {
            for (const node of insertedNodes) node.parentElement?.removeChild(node);
            insertedNodes = [];
        }
    });
}
