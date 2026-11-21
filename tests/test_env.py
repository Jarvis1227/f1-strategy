import importlib.util
import unittest


@unittest.skipUnless(importlib.util.find_spec("gymnasium"), "Install the gym extra to test adapter")
class EnvTests(unittest.TestCase):
    def test_gymnasium_contract(self):
        from gymnasium.utils.env_checker import check_env
        from f1_strategy.env import RaceEnv
        check_env(RaceEnv(), skip_render_check=True)

    def test_starting_tyres_and_complete_episode(self):
        from f1_strategy.env import RaceEnv
        env = RaceEnv()
        with self.assertRaises(RuntimeError):
            env.step(0)
        obs, _ = env.reset(seed=42, options={"starting_compound": "SOFT"})
        self.assertEqual(obs["cars"][0, 2], 0)
        for lap in range(20):
            obs, reward, terminated, truncated, info = env.step(3 if lap == 9 else 0)
            self.assertTrue(env.observation_space.contains(obs))
            self.assertEqual(terminated, lap == 19)
            self.assertFalse(truncated)
        self.assertGreaterEqual(reward, 0)
        with self.assertRaises(RuntimeError):
            env.step(0)
