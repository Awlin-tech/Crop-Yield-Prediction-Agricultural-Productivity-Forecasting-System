/**
 * SoilHorizonBar — the page's signature element: a thin strip of layered
 * bands echoing a soil core sample (topsoil / subsoil / bedrock), tying
 * the visual identity directly to the N-P-K soil readings the product
 * is built around.
 */
export default function SoilHorizonBar({ className = "" }: { className?: string }) {
  return (
    <div className={`flex h-2 w-full overflow-hidden ${className}`} aria-hidden="true">
      <div className="h-full flex-[3] bg-canopy" />
      <div className="h-full flex-[2] bg-horizonTop" />
      <div className="h-full flex-[2] bg-horizonMid" />
      <div className="h-full flex-[1] bg-horizonLow" />
    </div>
  );
}
