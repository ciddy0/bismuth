/**
 * this is pretty good i thinks, just for when there is no page
 *
 * TODO: add an icon or illustration for visual polish
 * TODO: add a "Create page" button that focuses the input
 * TODO: animate the empty state for smoother transitions
 * TODO: match theme colors dynamically (dark/light mode)
 */
export function EmptyState() {
  return (
    <div className="text-center mt-[100px] text-[#999]">
      <p>Select a page or create a new one</p>
    </div>
  );
}
