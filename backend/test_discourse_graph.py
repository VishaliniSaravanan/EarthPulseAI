import unittest

from discourse_graph import build_discourse_graph


class DiscourseGraphTests(unittest.TestCase):
    def test_emissions_increase_wording_is_matched_as_contradiction(self):
        claim = "We are carbon neutral and remain committed to this important environmental goal."

        for evidence in (
            "Emissions were up by 12% compared with last year, despite our ongoing efforts.",
            "Emissions have increased by 12% compared with last year, despite our ongoing efforts.",
            "Emissions rose 12% compared with last year, despite our ongoing efforts.",
        ):
            with self.subTest(evidence=evidence):
                result = build_discourse_graph(f"{claim} {evidence}", evidence)

                self.assertEqual(result["evidence_count"], 1)
                self.assertEqual(result["contradiction_count"], 1)
                self.assertEqual(result["contradictions"][0]["evidence"], evidence)

    def test_unquantified_emissions_increase_is_not_matched(self):
        text = (
            "We are carbon neutral and remain committed to this important environmental goal. "
            "Emissions were up compared with last year, despite our ongoing efforts."
        )

        result = build_discourse_graph(text, "unquantified")

        self.assertEqual(result["evidence_count"], 0)
        self.assertEqual(result["contradiction_count"], 0)


if __name__ == "__main__":
    unittest.main()
