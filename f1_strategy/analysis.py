"""Explain logged mechanisms; comparisons are conditional on the recorded runs."""
import csv
from pathlib import Path

COMPONENTS = ("base_time_s", "pace_delta_s", "tyre_delta_s", "fuel_effect_s",
              "noise_s", "traffic_loss_s", "pit_loss_s", "queue_loss_s",
              "time_floor_adjustment_s")


def traffic_reason(row, front_pitted=False):
    def yes(value):
        return value is True or str(value).lower() == "true"
    if float(row["traffic_loss_s"]) > 0:
        return "close following"
    if yes(row["safety_car"]):
        return "SC suspends traffic penalty"
    if yes(row["pitted"]):
        return "car pitting"
    if not row["front_car_id"]:
        return "leader"
    if front_pitted:
        return "car ahead pitting"
    return "gap outside traffic threshold"


def read_log(path):
    with Path(path).open(newline="", encoding="utf-8-sig") as stream:
        rows = list(csv.DictReader(stream))
    if not rows:
        raise ValueError("Cannot compare an empty lap log")
    return rows


def traffic_context(rows, grid_gap_s=0.35):
    """Legacy CSVs need front/gap reconstructed from the previous lap's order."""
    indexed = {(int(r["lap"]), r["car_id"]): r for r in rows}
    if len(indexed) != len(rows):
        raise ValueError("Duplicate car/lap rows")
    ids = sorted({r["car_id"] for r in rows})
    for lap in sorted({int(r["lap"]) for r in rows}):
        if lap == 1:
            elapsed = {car: i * grid_gap_s for i, car in enumerate(ids)}
        else:
            elapsed = {car: float(indexed[lap - 1, car]["elapsed_s"]) for car in ids}
        order = sorted(ids, key=lambda car: (elapsed[car], car))
        for i, car in enumerate(order):
            row = indexed[lap, car]
            if "front_car_id" not in row:
                row["front_car_id"] = order[i - 1] if i else ""
                row["gap_ahead_s"] = str(elapsed[car] - elapsed[order[i - 1]]) if i else ""
    return indexed


def comparison_report(before_path, after_path, output_path, grid_gap_s=0.35):
    before, after = read_log(before_path), read_log(after_path)
    a, b = traffic_context(before, grid_gap_s), traffic_context(after, grid_gap_s)
    if a.keys() != b.keys():
        raise ValueError("Logs must contain the same car/lap pairs")
    ids = sorted({r["car_id"] for r in before})
    last = max(lap for lap, _ in a)
    lines = ["# Race comparison", "", f"Before: `{Path(before_path).name}`; after: `{Path(after_path).name}`.",
        "Positive time differences mean slower. Positions below are on-track positions;",
        "check results JSON separately for compound-rule DSQs. Reports describe observed",
        "mechanisms, not proof that a decision is globally optimal.", "",
        "| Car | Position before → after | Total change (s) | Pit-cost change (s) | Traffic change (s) |",
        "| --- | --- | ---: | ---: | ---: |"]
    def total(index, car, key):
        return sum(float(row[key]) for (lap, cid), row in index.items() if cid == car)
    for car in ids:
        delta = float(b[last, car]["elapsed_s"]) - float(a[last, car]["elapsed_s"])
        pit = total(b, car, "pit_loss_s") - total(a, car, "pit_loss_s")
        traffic = total(b, car, "traffic_loss_s") - total(a, car, "traffic_loss_s")
        lines.append(f"| {car} | {a[last, car]['position']} → {b[last, car]['position']} | {delta:+.3f} | {pit:+.3f} | {traffic:+.3f} |")
    legacy = "noise_s" not in before[0] or "noise_s" not in after[0]
    if legacy:
        lines += ["", "Legacy logs: front cars/gaps reconstructed from previous lap times.",
            f"Lap 1 assumes grid spacing {grid_gap_s:g} s. Noise and queue components were",
            "not logged, so any remaining time difference cannot be separated using these files."]
    for car in ids:
        old = [r for (lap, cid), r in a.items() if cid == car and float(r["traffic_loss_s"]) > 0]
        new = [r for (lap, cid), r in b.items() if cid == car and float(r["traffic_loss_s"]) > 0]
        lines += ["", f"## {car}", "",
            f"Traffic: {len(old)} affected laps / {total(a, car, 'traffic_loss_s'):.2f} s → "
            f"{len(new)} affected laps / {total(b, car, 'traffic_loss_s'):.2f} s."]
        for label, index in (("Before", a), ("After", b)):
            stops = [f"L{lap} {r['compound']} ({r['pit_loss_s']} s, "
                     f"{'SC' if str(r['safety_car']).lower() == 'true' else 'green'})"
                     for (lap, cid), r in sorted(index.items())
                     if cid == car and str(r["pitted"]).lower() == "true"]
            lines.append(f"{label} stops: {', '.join(stops) or 'none'}.")
        if not legacy:
            parts = [f"{key}: {total(b, car, key) - total(a, car, key):+.3f} s" for key in COMPONENTS]
            lines += ["", "Component differences (after minus before): " + "; ".join(parts) + "."]
        changed = [lap for lap, cid in sorted(a) if cid == car and
                   (float(a[lap, car]["traffic_loss_s"]) > 0 or float(b[lap, car]["traffic_loss_s"]) > 0)]
        if changed:
            lines += ["", "Every affected lap is shown, including unchanged ones. A penalty applies",
                "only on green laps when neither car is pitting and the pre-lap gap is below the configured threshold.", "",
                "| Lap | Before: car ahead / gap / penalty / reason | After: car ahead / gap / penalty / reason |",
                "| --- | --- | --- |"]
            def describe(r, index):
                gap = r["gap_ahead_s"]
                gap_text = f"{float(gap):.6f} s" if gap not in (None, "") else "—"
                front = index.get((int(r['lap']), r['front_car_id']))
                pitting = front is not None and str(front['pitted']).lower() == 'true'
                return (f"{r['front_car_id'] or 'leader'} / {gap_text} / {float(r['traffic_loss_s']):.2f} s / "
                        + traffic_reason(r, pitting))
            for lap in changed:
                lines.append(f"| {lap} | {describe(a[lap, car], a)} | {describe(b[lap, car], b)} |")
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return output
