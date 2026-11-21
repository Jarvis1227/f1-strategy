import argparse
import json
from pathlib import Path

from .config import load_config
from .simulator import RaceSimulator
from .strategies import baseline_actions
from .analysis import comparison_report
from .player import choose_start, play


def main():
    parser = argparse.ArgumentParser(description="Run an F1 Strategy demonstration race")
    parser.add_argument("--config", type=Path)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--output", type=Path)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--play", action="store_true", help="Drive car_01 with one decision per lap")
    mode.add_argument("--compare", nargs=2, type=Path, metavar=("BEFORE", "AFTER"), help="Explain two lap CSVs")
    parser.add_argument("--starting-compound", type=str.upper, choices=("SOFT", "MEDIUM", "HARD"))
    args = parser.parse_args()
    config = load_config(args.config)
    if args.compare:
        print(comparison_report(*args.compare, args.output or Path("comparison.md"), config.grid_gap_s))
        return
    output = args.output or Path("player_race.csv" if args.play else "race_log.csv")
    race = RaceSimulator(config)
    starts = ["MEDIUM" if i % 2 == 0 else "SOFT" for i in range(config.cars)]
    if args.play:
        start = args.starting_compound or choose_start()
        if start is None:
            print("No race started.")
            return
        starts[0] = start
    elif args.starting_compound:
        starts[0] = args.starting_compound
    race.reset(args.seed, starts)
    decisions = play(race) if args.play else []
    if not args.play:
        while not race.done:
            race.step(baseline_actions(race))
    race.write_csv(output)
    result = {"seed": args.seed, "simulation_version": 3, "track": config.track,
              "starting_compounds": starts,
              "completed_laps": race.lap, "total_laps": config.laps,
              "equivalent_laps": config.laps * config.distance_per_lap, "complete": race.done, "classification": race.classification()}
    output.with_suffix(".results.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    snapshot = {key: value for key, value in vars(config).items() if key != "tyres"}
    snapshot["tyres"] = {key: vars(value) for key, value in config.tyres.items()}
    output.with_suffix(".config.json").write_text(json.dumps(snapshot, indent=2), encoding="utf-8")
    if args.play:
        output.with_suffix(".decisions.json").write_text(json.dumps(decisions, indent=2), encoding="utf-8")
        baseline = RaceSimulator(config)
        baseline.reset(args.seed, starts)
        while baseline.lap < race.lap:
            baseline.step(baseline_actions(baseline))
        baseline_path = output.with_suffix(".baseline.csv")
        baseline.write_csv(baseline_path)
        if race.log:
            report_path = output.with_suffix(".comparison.md")
            comparison_report(baseline_path, output, report_path, config.grid_gap_s)
            print(f"\nPer-car comparison with baseline: {report_path}")
        print("Baseline uses the same starting tyres, seed, config and race length played.")
        print("Each decision's immediate alternative and per-car breakdown: " + str(output.with_suffix(".decisions.json")))
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
