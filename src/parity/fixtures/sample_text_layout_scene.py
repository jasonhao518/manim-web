from manim import *


class SampleTextLayoutScene(Scene):
    """Canonical text/layout style sample."""

    def construct(self):
        title = Text("Quadratic Identity", font_size=36, color=WHITE)
        title.shift(UP * 3.0)

        eq = Text("x^2 + 2x + 1 = (x+1)^2", font_size=34, color=BLUE)
        note = Text("Complete the square", font_size=26, color=GREEN)
        note.shift(DOWN * 0.9)

        block = VGroup(eq, note)
        box = SurroundingRectangle(block, color=YELLOW, buff=0.25)

        self.add(title, eq, note, box)
