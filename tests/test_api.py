import csv
import importlib.util
import io
import unittest


@unittest.skipUnless(importlib.util.find_spec("fastapi") and importlib.util.find_spec("httpx"), "Install the web extra")
class ApiTests(unittest.TestCase):
    def setUp(self):
        from fastapi.testclient import TestClient
        from f1_strategy.api import app, sessions
        sessions.clear()
        self.client = TestClient(app)

    def new(self, **kwargs):
        response = self.client.post("/api/races", json={"seed": 42, "starting_compound": "SOFT", **kwargs})
        self.assertEqual(response.status_code, 201)
        return response.json()

    def test_create_invalid_inputs_and_session_isolation(self):
        a, b = self.new(), self.new(starting_compound="HARD")
        self.assertNotEqual(a["race_id"], b["race_id"])
        self.assertEqual(a["total_laps"], 20)
        self.assertEqual(a["equivalent_laps"], 42)
        self.assertEqual(a["distance_per_lap"], 2.1)
        self.assertIn("tyre_status", a["coaching"])
        self.assertEqual(next(c for c in a["cars"] if c["car_id"] == "car_01")["compound"], "SOFT")
        for bad in ({"seed": True}, {"seed": -1}, {"seed": 2**40}, {"starting_compound": "WET"}, {"unknown": 1}):
            self.assertEqual(self.client.post("/api/races", json=bad).status_code, 422)
        self.client.post(f"/api/races/{a['race_id']}/turn", json={"expected_lap": 0})
        self.assertEqual(self.client.get(f"/api/races/{b['race_id']}").json()["completed_laps"], 0)

    def test_duplicate_turn_and_bad_actions_do_not_advance(self):
        data = self.new()
        url = f"/api/races/{data['race_id']}"
        self.assertEqual(self.client.post(url + "/turn", json={"expected_lap": 0, "compound": "WET"}).status_code, 422)
        response = self.client.post(url + "/turn", json={"expected_lap": 0})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.client.post(url + "/turn", json={"expected_lap": 0}).status_code, 409)
        restored = self.client.get(url).json()
        self.assertEqual(restored["completed_laps"], 1)
        self.assertEqual(len(restored["last_decision"]["effects"]), 10)
        self.assertIn("traffic_reason", restored["last_decision"]["effects"][0])
        self.assertEqual(self.client.get(url + "/decisions/1").json()["lap"], 1)
        self.assertEqual(self.client.get(url + "/decisions/2").status_code, 404)

    def test_full_race_results_traffic_summary_and_exports(self):
        data = self.new()
        url = f"/api/races/{data['race_id']}"
        for lap in range(20):
            response = self.client.post(url + "/turn", json={"expected_lap": lap, "compound": "HARD" if lap == 9 else None})
            self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["done"])
        self.assertEqual(len(data["summary"]), 10)
        player = next(car for car in data["classification"] if car["car_id"] == "car_01")
        self.assertEqual(player["status"], "FINISHED")
        for car in data["summary"]:
            self.assertAlmostEqual(car["time_change_s"], sum(car["component_changes_s"].values()))
            self.assertAlmostEqual(car["actual_traffic_s"], sum(row["traffic_loss_s"] for row in car["actual_traffic_laps"]))
        self.assertEqual(self.client.post(url + "/turn", json={"expected_lap": 20}).status_code, 409)
        response = self.client.get(url + "/export/laps")
        self.assertIn("attachment", response.headers["content-disposition"])
        self.assertEqual(len(list(csv.DictReader(io.StringIO(response.text)))), 200)
        result = self.client.get(url + "/export/results").json()
        from f1_strategy.config import load_config
        self.assertEqual(result["config"]["pit_loss_sc_s"], load_config().pit_loss_sc_s)
        self.assertTrue(result["complete"])
        self.assertEqual(len(self.client.get(url + "/export/decisions").json()), 20)

    def test_dsq_without_compound_change(self):
        data = self.new()
        url = f"/api/races/{data['race_id']}/turn"
        for lap in range(20):
            data = self.client.post(url, json={"expected_lap": lap}).json()
        self.assertEqual(next(car for car in data["classification"] if car["car_id"] == "car_01")["status"], "DSQ")

    def test_identical_seed_and_choices_are_reproducible(self):
        a, b = self.new(), self.new()
        for lap in range(4):
            action = {"expected_lap": lap, "compound": "HARD" if lap == 2 else None}
            first = self.client.post(f"/api/races/{a['race_id']}/turn", json=action).json()
            second = self.client.post(f"/api/races/{b['race_id']}/turn", json=action).json()
            self.assertEqual(first["cars"], second["cars"])
            self.assertEqual(first["last_decision"], second["last_decision"])

    def test_missing_expired_and_bounded_sessions(self):
        from f1_strategy.api import MAX_SESSIONS, SESSION_TTL_S, sessions
        self.assertEqual(self.client.get("/api/races/missing").status_code, 404)
        race = self.new()
        sessions[race["race_id"]].updated -= SESSION_TTL_S + 1
        self.assertEqual(self.client.get(f"/api/races/{race['race_id']}").status_code, 404)
        for _ in range(MAX_SESSIONS + 1):
            self.new()
        self.assertEqual(len(sessions), MAX_SESSIONS)

    def test_guided_metadata_and_intent_do_not_change_simulated_outcome(self):
        first = self.new(focus="tyres")
        second = self.new(focus="baseline")
        self.assertEqual(first["focus"], "tyres")
        self.assertEqual(len(first["coaching"]["forecasts"]), 3)
        self.assertEqual(first["coaching"]["horizon"], 10)
        url = f"/api/races/{first['race_id']}/turn"
        self.assertEqual(self.client.post(url, json={"expected_lap": 0, "intent": "win magically"}).status_code, 422)
        a = self.client.post(url, json={"expected_lap": 0, "compound": "HARD", "intent": "pace"}).json()
        b = self.client.post(f"/api/races/{second['race_id']}/turn", json={"expected_lap": 0, "compound": "HARD"}).json()
        self.assertEqual(a["cars"], b["cars"])
        self.assertEqual(a["last_decision"]["intent"], "pace")
        self.assertIn("recap", a["last_decision"])
        self.assertEqual(a["last_decision"]["recap"]["compound_before"], "SOFT")
