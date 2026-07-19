let desktopContext;
export function getDesktopContext() {
    if (!desktopContext) {
        throw new Error("Desktop context has not been initialized.");
    }
    return desktopContext;
}
export function setDesktopContext(context) {
    desktopContext = context;
}
//# sourceMappingURL=context.js.map