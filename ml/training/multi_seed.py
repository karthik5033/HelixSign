"""
multi_seed.py — Run detector training with seeds [42, 100, 2026] and aggregate results.

This is a thin wrapper around train_detector.py --seeds that is provided for
compatibility with the reviewer's handoff instructions.  Prefer calling
train_detector.py --seeds 42 100 2026 directly for full control.
"""
import sys
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))


def main() -> None:
    import subprocess
    seeds = [42, 100, 2026]
    print(f"Running multi-seed training: seeds={seeds}")
    subprocess.run(
        [sys.executable, str(ROOT / "training" / "train_detector.py"),
         "--seeds"] + [str(s) for s in seeds],
        cwd=ROOT,
        check=True,
    )
    # Read the already-aggregated summary from train_detector.py output
    results_path = ROOT / "artifacts" / "eval_results.json"
    if results_path.exists():
        data = json.loads(results_path.read_text(encoding="utf-8"))
        agg = data.get("aggregate", {})
        print("\n=== Multi-seed Aggregate Results ===")
        for key, val in agg.items():
            if val.get("std") is not None:
                print(f"  {key:<25}: {val['mean']:.4f} ± {val['std']:.4f}  (n={val['n_seeds']})")
            else:
                print(f"  {key:<25}: {val['mean']:.4f}")

        # Write a separate multi_seed_summary.json for compatibility
        summary = {
            "seeds": data.get("seeds", seeds),
            "aggregate": agg,
            "per_seed": data.get("per_seed", []),
            "evaluation_note": data.get("evaluation_note", ""),
        }
        out = ROOT / "artifacts" / "multi_seed_summary.json"
        out.write_text(json.dumps(summary, indent=2), encoding="utf-8")
        print(f"\nMulti-seed summary written to {out}")


if __name__ == "__main__":
    main()
